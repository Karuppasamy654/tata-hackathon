'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { DrivingData, generateDrivingData, DANGEROUS_SCENARIOS } from '@/lib/simulation';
import { NearMissAlert, detectNearMiss } from '@/lib/nearMissDetector';
import { DriverProfile, HistoryEntry, updateHistory, calculateDriverProfile } from '@/lib/driverProfile';
import { EmotionState, detectDriverEmotion } from '@/lib/emotionDetector';
import { calculateRiskScore } from '@/lib/riskEngine';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskResult {
  score: number;
  level: RiskLevel;
  factors: string[];
  color: string;
}

const TICK_INTERVAL        = 600;   // ms
const MAX_ALERTS           = 20;
const ALERT_LIFETIME       = 10000; // 10s
const MAX_TELEMETRY_HIST   = 20;    // frames for emotion
const EMERGENCY_THRESHOLD  = 82;    // risk score threshold
const EMERGENCY_TICKS      = 3;     // consecutive high-risk ticks to trigger emergency
const REPLAY_CAPTURE_SIZE  = 15;    // frames to keep for near-miss replay

function computeAccidentProbability(riskScores: number[]): number {
  if (riskScores.length < 2) return 0;
  const recent = riskScores.slice(-6);
  // Exponential weighted average — latest score weighs most
  let weightedSum = 0, weightTotal = 0;
  recent.forEach((s, i) => {
    const w = i + 1;
    weightedSum += s * w;
    weightTotal += w;
  });
  const baseProb = weightedSum / weightTotal;
  // Add trend bonus if risk is rapidly worsening
  const trend =
    recent.length >= 3
      ? recent[recent.length - 1] - recent[recent.length - 3]
      : 0;
  return Math.min(100, Math.max(0, Math.round(baseProb + trend * 0.8)));
}

export function useSimulation() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentData, setCurrentData] = useState<DrivingData>({
    speed: 0, acceleration: 0, brakeIntensity: 0,
    distanceToVehicle: 50, steeringAngle: 0, timestamp: Date.now(),
  });
  const [riskResult, setRiskResult] = useState<RiskResult>({
    score: 0, level: 'low', factors: [], color: '#00ff88',
  });
  const [alerts, setAlerts]               = useState<NearMissAlert[]>([]);
  const [history, setHistory]             = useState<HistoryEntry[]>([]);
  const [driverProfile, setDriverProfile] = useState<DriverProfile>({
    overallScore: 100, safePercentage: 100, riskyPercentage: 0,
    trend: 'stable', totalAlerts: 0, avgSpeed: 0, maxRiskScore: 0,
  });
  const [emotionState, setEmotionState] = useState<EmotionState>({
    emotion: 'focused', label: 'FOCUSED', icon: '😎', color: '#00d4ff',
    reason: 'Awaiting data...', alertLevel: 'none',
  });
  const [accidentProbability, setAccidentProbability] = useState(0);
  const [timeToImpact, setTimeToImpact]               = useState<number | undefined>(undefined);
  const [isEmergency, setIsEmergency]                 = useState(false);
  const [replayEvents, setReplayEvents]               = useState<DrivingData[]>([]);
  const [showReplay, setShowReplay]                   = useState(false);

  // ──── Refs (persist without re-render) ────
  const tickRef                = useRef(0);
  const intervalRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevDataRef            = useRef<DrivingData | undefined>(undefined);
  const totalAlertsRef         = useRef(0);
  const replayIndexRef         = useRef(-1);
  const telemetryHistoryRef    = useRef<DrivingData[]>([]);
  const recentRiskScoresRef    = useRef<number[]>([]);
  const consecutiveHighRiskRef = useRef(0);
  const incidentFramesRef      = useRef<DrivingData[]>([]);
  const emergencyTimeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss stale alerts
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setAlerts(prev => prev.filter(a => now - a.timestamp < ALERT_LIFETIME));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const processTick = useCallback(async () => {
    tickRef.current++;

    // ── Generate / replay telemetry ──
    let data: DrivingData;
    if (replayIndexRef.current >= 0) {
      if (replayIndexRef.current < DANGEROUS_SCENARIOS.length) {
        data = { ...DANGEROUS_SCENARIOS[replayIndexRef.current], timestamp: Date.now() };
        replayIndexRef.current++;
      } else {
        replayIndexRef.current = -1;
        data = generateDrivingData(tickRef.current, prevDataRef.current);
      }
    } else {
      data = generateDrivingData(tickRef.current, prevDataRef.current);
    }

    prevDataRef.current = data;
    setCurrentData(data);

    // ── Rolling telemetry history (for emotion) ──
    telemetryHistoryRef.current = [
      ...telemetryHistoryRef.current, data,
    ].slice(-MAX_TELEMETRY_HIST);

    // ── Rolling incident frame buffer (for replay) ──
    incidentFramesRef.current = [
      ...incidentFramesRef.current, data,
    ].slice(-REPLAY_CAPTURE_SIZE);

    // ── Driver emotion ──
    const emotion = detectDriverEmotion(telemetryHistoryRef.current);
    setEmotionState(emotion);

    // ── Risk prediction (backend ML → client fallback) ──
    let risk: RiskResult = { score: 0, level: 'low', factors: [], color: '#00ff88' };
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/predict-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetry: telemetryHistoryRef.current.map(d => ({
            speed: d.speed,
            acceleration: d.acceleration,
            brake_intensity: d.brakeIntensity,
            distance_to_vehicle: d.distanceToVehicle,
            steering_angle: d.steeringAngle,
          })),
          emotion: emotion.emotion,
        }),
      });
      if (res.ok) {
        const pred = await res.json();
        let level: RiskLevel = 'low';
        let color = '#00ff88';
        if (pred.risk_class === 'danger')  { level = 'high';   color = '#ff3366'; }
        else if (pred.risk_class === 'warning') { level = 'medium'; color = '#ffd600'; }
        risk = { score: Math.round(pred.risk_score), level, factors: pred.factors, color };
        
        // Use backend accident prediction and emergency triggers
        setAccidentProbability(pred.accident_probability);
        setTimeToImpact(pred.time_to_impact);
        
        if (pred.intervention) {
          setIsEmergency(true);
          setReplayEvents([...incidentFramesRef.current]);
          if (emergencyTimeoutRef.current) clearTimeout(emergencyTimeoutRef.current);
          emergencyTimeoutRef.current = setTimeout(() => setIsEmergency(false), 8000);
        }
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Client-side fallback
      const cr = calculateRiskScore(data);
      risk = { score: cr.score, level: cr.level, factors: cr.factors, color: cr.color };
      
      recentRiskScoresRef.current = [...recentRiskScoresRef.current, risk.score].slice(-10);
      setAccidentProbability(computeAccidentProbability(recentRiskScoresRef.current));
      setTimeToImpact(undefined);
      
      // Fallback emergency detection
      if (risk.score >= EMERGENCY_THRESHOLD) {
        consecutiveHighRiskRef.current++;
        if (consecutiveHighRiskRef.current >= EMERGENCY_TICKS) {
          setIsEmergency(true);
          setReplayEvents([...incidentFramesRef.current]);
          if (emergencyTimeoutRef.current) clearTimeout(emergencyTimeoutRef.current);
          emergencyTimeoutRef.current = setTimeout(() => setIsEmergency(false), 8000);
        }
      } else {
        consecutiveHighRiskRef.current = 0;
      }
    }

    setRiskResult(risk);

    // ── History & driver profile ──
    setHistory(prev => {
      const updated = updateHistory(prev, risk.score, data.speed);
      setDriverProfile(calculateDriverProfile(updated, totalAlertsRef.current));
      return updated;
    });

    // ── Near-miss alerts ──
    const newAlerts = detectNearMiss(data);
    if (newAlerts.length > 0) {
      totalAlertsRef.current += newAlerts.length;
      setAlerts(prev => [...newAlerts, ...prev].slice(0, MAX_ALERTS));
    }
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setIsRunning(true);
    intervalRef.current = setInterval(processTick, TICK_INTERVAL);
  }, [processTick]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const reset = useCallback(() => {
    stop();
    tickRef.current = 0;
    prevDataRef.current = undefined;
    totalAlertsRef.current = 0;
    replayIndexRef.current = -1;
    telemetryHistoryRef.current = [];
    recentRiskScoresRef.current = [];
    consecutiveHighRiskRef.current = 0;
    incidentFramesRef.current = [];
    if (emergencyTimeoutRef.current) clearTimeout(emergencyTimeoutRef.current);
    setCurrentData({ speed: 0, acceleration: 0, brakeIntensity: 0, distanceToVehicle: 50, steeringAngle: 0, timestamp: Date.now() });
    setRiskResult({ score: 0, level: 'low', factors: [], color: '#00ff88' });
    setAlerts([]);
    setHistory([]);
    setDriverProfile({ overallScore: 100, safePercentage: 100, riskyPercentage: 0, trend: 'stable', totalAlerts: 0, avgSpeed: 0, maxRiskScore: 0 });
    setEmotionState({ emotion: 'focused', label: 'FOCUSED', icon: '😎', color: '#00d4ff', reason: 'Awaiting data...', alertLevel: 'none' });
    setAccidentProbability(0);
    setTimeToImpact(undefined);
    setIsEmergency(false);
    setReplayEvents([]);
    setShowReplay(false);
  }, [stop]);

  const replayScenario = useCallback(() => {
    replayIndexRef.current = 0;
    if (!isRunning) start();
  }, [isRunning, start]);

  const clearAlerts      = useCallback(() => setAlerts([]), []);
  const dismissEmergency = useCallback(() => {
    setIsEmergency(false);
    if (emergencyTimeoutRef.current) clearTimeout(emergencyTimeoutRef.current);
  }, []);
  const openReplay  = useCallback(() => setShowReplay(true), []);
  const closeReplay = useCallback(() => setShowReplay(false), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (emergencyTimeoutRef.current) clearTimeout(emergencyTimeoutRef.current);
    };
  }, []);

  return {
    isRunning, currentData, riskResult, alerts, history, driverProfile,
    emotionState, accidentProbability, timeToImpact, isEmergency, replayEvents, showReplay,
    start, stop, reset, replayScenario, clearAlerts,
    dismissEmergency, openReplay, closeReplay,
  };
}

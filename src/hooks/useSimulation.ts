'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { DrivingData, generateDrivingData, DANGEROUS_SCENARIOS } from '@/lib/simulation';
import { NearMissAlert, detectNearMiss } from '@/lib/nearMissDetector';
import { DriverProfile, HistoryEntry, updateHistory, calculateDriverProfile } from '@/lib/driverProfile';
import { calculateRiskScore, RiskResult } from '@/lib/riskEngine';
import { FaceState } from '@/hooks/useFaceDetection';

const TICK_INTERVAL        = 600;   // ms
const MAX_ALERTS           = 20;
const ALERT_LIFETIME       = 10000; // 10s
const EMERGENCY_THRESHOLD  = 82;    // risk score threshold
const EMERGENCY_TICKS      = 3;     // consecutive high-risk ticks to trigger emergency

export function useSimulation(faceState: FaceState) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentData, setCurrentData] = useState<DrivingData>({
    speed: 0, acceleration: 0, brakeIntensity: 0,
    distanceToVehicle: 50, steeringAngle: 0, timestamp: Date.now(),
  });
  const [riskResult, setRiskResult] = useState<RiskResult>({
    score: 0, level: 'NONE', factors: [], color: '#00ff88', explanation: 'Awaiting data...', voiceMessage: ''
  });
  const [alerts, setAlerts]               = useState<NearMissAlert[]>([]);
  const [history, setHistory]             = useState<HistoryEntry[]>([]);
  const [driverProfile, setDriverProfile] = useState<DriverProfile>({
    overallScore: 100, safePercentage: 100, riskyPercentage: 0,
    trend: 'stable', totalAlerts: 0, avgSpeed: 0, maxRiskScore: 0,
  });
  const [isEmergency, setIsEmergency] = useState(false);

  // ──── Refs (persist without re-render) ────
  const tickRef                = useRef(0);
  const intervalRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevDataRef            = useRef<DrivingData | undefined>(undefined);
  const totalAlertsRef         = useRef(0);
  const replayIndexRef         = useRef(-1);
  const consecutiveHighRiskRef = useRef(0);
  const emergencyTimeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss stale alerts
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setAlerts(prev => prev.filter(a => now - a.timestamp < ALERT_LIFETIME));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const processTick = useCallback(() => {
    tickRef.current++;

    // ── Generate telemetry ──
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

    // ── Risk prediction ──
    const risk = calculateRiskScore(data, faceState);
    setRiskResult(risk);

    if (risk.score >= EMERGENCY_THRESHOLD || risk.level === 'CRITICAL') {
      consecutiveHighRiskRef.current++;
      if (consecutiveHighRiskRef.current >= EMERGENCY_TICKS) {
        setIsEmergency(true);
        if (emergencyTimeoutRef.current) clearTimeout(emergencyTimeoutRef.current);
        emergencyTimeoutRef.current = setTimeout(() => setIsEmergency(false), 8000);
      }
    } else {
      consecutiveHighRiskRef.current = 0;
    }

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
  }, [faceState]);

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
    consecutiveHighRiskRef.current = 0;
    if (emergencyTimeoutRef.current) clearTimeout(emergencyTimeoutRef.current);
    setCurrentData({ speed: 0, acceleration: 0, brakeIntensity: 0, distanceToVehicle: 50, steeringAngle: 0, timestamp: Date.now() });
    setRiskResult({ score: 0, level: 'NONE', factors: [], color: '#00ff88', explanation: 'Awaiting data...' });
    setAlerts([]);
    setHistory([]);
    setDriverProfile({ overallScore: 100, safePercentage: 100, riskyPercentage: 0, trend: 'stable', totalAlerts: 0, avgSpeed: 0, maxRiskScore: 0 });
    setIsEmergency(false);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (emergencyTimeoutRef.current) clearTimeout(emergencyTimeoutRef.current);
    };
  }, []);

  // Sync processTick with interval when faceState changes
  useEffect(() => {
    if (isRunning) {
      stop();
      start();
    }
  }, [faceState, isRunning, start, stop]);

  return {
    isRunning, currentData, riskResult, alerts, history, driverProfile, isEmergency,
    start, stop, reset, replayScenario, clearAlerts, dismissEmergency,
  };
}

// AI Risk Prediction Engine (Rule-based + ML inspired)
import { DrivingData } from './simulation';
import { FaceState } from '@/hooks/useFaceDetection';
import { AlertPriority } from '@/hooks/useVoiceAssistant';

export interface RiskResult {
  score: number; // 0-100
  level: AlertPriority | 'NONE';
  factors: string[];
  color: string;
  explanation: string;
  voiceMessage?: string;
}

// Sigmoid-like function to cap risk score smoothly
function sigmoid(x: number): number {
  return 100 / (1 + Math.exp(-0.06 * (x - 50)));
}

export function calculateRiskScore(data: DrivingData, faceState: FaceState): RiskResult {
  let rawScore = 0;
  const factors: string[] = [];
  let explanation = "Normal driving behavior.";
  let voiceMessage = "";

  // 1. Evaluate Face State (High Priority)
  if (faceState === 'SLEEPY') {
    rawScore += 50;
    factors.push('Sleepiness detected');
  } else if (faceState === 'DISTRACTED') {
    rawScore += 30;
    factors.push('Distracted driving');
  } else if (faceState === 'FATIGUED') {
    rawScore += 20;
    factors.push('Driver fatigue');
  }

  // 2. Evaluate Driving Data
  if (data.speed > 120) {
    rawScore += 30;
    factors.push('Extreme speed');
  } else if (data.speed > 80) {
    rawScore += 15;
  }

  if (data.brakeIntensity > 0.8) {
    rawScore += 25;
    factors.push('Emergency braking');
  }

  if (data.distanceToVehicle < 10) {
    rawScore += 30;
    factors.push('Critical distance');
  } else if (data.distanceToVehicle < 20) {
    rawScore += 15;
    factors.push('Close distance');
  }

  const absSteer = Math.abs(data.steeringAngle);
  if (absSteer > 40) {
    rawScore += 15;
    factors.push('Extreme steering');
  }

  // 3. AI Compound Rules (The "Smart" part)
  if (faceState === 'SLEEPY' && absSteer > 20) {
    rawScore += 40;
    explanation = "Sleepy + steering unstable";
    voiceMessage = "Stop the vehicle immediately. You are falling asleep.";
  } else if (faceState === 'DISTRACTED' && absSteer > 15) {
    rawScore += 25;
    explanation = "Distracted while turning";
    voiceMessage = "Focus on the road.";
  } else if (data.speed > 80 && data.distanceToVehicle < 15) {
    rawScore += 25;
    explanation = "High speed + low distance";
    voiceMessage = "Brake immediately! Vehicle ahead is too close.";
  } else if (faceState === 'DISTRACTED' && data.speed > 60) {
    rawScore += 20;
    explanation = "High speed combined with distraction";
    voiceMessage = "Please keep your eyes on the road.";
  } else if (faceState === 'FATIGUED') {
    explanation = "Driver fatigue detected";
    if (Math.random() < 0.05) voiceMessage = "You seem tired, please take a break soon.";
  } else if (factors.length > 0) {
    explanation = factors.join(' and ');
  }

  // Apply sigmoid to smooth the score
  const score = Math.round(sigmoid(rawScore));

  // Determine risk level & visual/audio mapping
  let level: AlertPriority | 'NONE' = 'NONE';
  let color = '#00ff88';

  if (score >= 85 || explanation.includes("Sleepy + steering unstable")) {
    level = 'CRITICAL';
    color = '#ff0000';
    if (!voiceMessage) voiceMessage = "Danger detected. Stop the vehicle.";
  } else if (score >= 65) {
    level = 'HIGH';
    color = '#ff3366';
    if (!voiceMessage) voiceMessage = "Warning! Please drive carefully.";
  } else if (score >= 40) {
    level = 'MEDIUM';
    color = '#ff9900';
  } else if (score >= 20) {
    level = 'LOW';
    color = '#ffd600';
  }

  return { score, level, factors, color, explanation, voiceMessage };
}

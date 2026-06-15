// AI Risk Prediction Engine (rule-based mock)
import { DrivingData } from './simulation';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskResult {
  score: number; // 0-100
  level: RiskLevel;
  factors: string[];
  color: string;
}

// Sigmoid-like function to cap risk score smoothly
function sigmoid(x: number): number {
  return 100 / (1 + Math.exp(-0.06 * (x - 50)));
}

export function calculateRiskScore(data: DrivingData): RiskResult {
  let rawScore = 0;
  const factors: string[] = [];

  // Speed factor (0-30 points)
  if (data.speed > 120) {
    rawScore += 30;
    factors.push('Extreme speed');
  } else if (data.speed > 100) {
    rawScore += 22;
    factors.push('Very high speed');
  } else if (data.speed > 80) {
    rawScore += 12;
    factors.push('High speed');
  } else if (data.speed > 60) {
    rawScore += 5;
  }

  // Brake intensity factor (0-25 points)
  if (data.brakeIntensity > 0.8) {
    rawScore += 25;
    factors.push('Emergency braking');
  } else if (data.brakeIntensity > 0.5) {
    rawScore += 15;
    factors.push('Hard braking');
  } else if (data.brakeIntensity > 0.3) {
    rawScore += 8;
    factors.push('Moderate braking');
  }

  // Distance to vehicle factor (0-30 points)
  if (data.distanceToVehicle < 5) {
    rawScore += 30;
    factors.push('Critical distance');
  } else if (data.distanceToVehicle < 10) {
    rawScore += 22;
    factors.push('Very close distance');
  } else if (data.distanceToVehicle < 20) {
    rawScore += 12;
    factors.push('Close distance');
  } else if (data.distanceToVehicle < 30) {
    rawScore += 5;
  }

  // Acceleration factor (0-15 points)
  const absAccel = Math.abs(data.acceleration);
  if (absAccel > 7) {
    rawScore += 15;
    factors.push('Severe acceleration change');
  } else if (absAccel > 4) {
    rawScore += 10;
    factors.push('Sudden acceleration');
  } else if (absAccel > 2) {
    rawScore += 4;
  }

  // Steering angle factor (0-15 points)
  const absSteer = Math.abs(data.steeringAngle);
  if (absSteer > 40) {
    rawScore += 15;
    factors.push('Extreme steering');
  } else if (absSteer > 25) {
    rawScore += 10;
    factors.push('Sharp turn');
  } else if (absSteer > 15) {
    rawScore += 5;
  }

  // Compound danger multipliers
  if (data.speed > 80 && data.distanceToVehicle < 15) {
    rawScore += 15;
    if (!factors.includes('Tailgating at speed')) factors.push('Tailgating at speed');
  }
  if (data.speed > 80 && data.brakeIntensity > 0.6) {
    rawScore += 12;
    if (!factors.includes('High-speed braking')) factors.push('High-speed braking');
  }

  // Apply sigmoid to smooth the score
  const score = Math.round(sigmoid(rawScore));

  // Determine risk level
  let level: RiskLevel;
  let color: string;
  if (score >= 70) {
    level = 'high';
    color = '#ff3366';
  } else if (score >= 40) {
    level = 'medium';
    color = '#ffd600';
  } else {
    level = 'low';
    color = '#00ff88';
  }

  return { score, level, factors, color };
}

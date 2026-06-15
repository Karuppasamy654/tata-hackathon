// Driver Emotion Detection Engine (Simulated via telemetry patterns)
import { DrivingData } from './simulation';

export type DriverEmotion = 'focused' | 'distracted' | 'sleepy' | 'angry';

export interface EmotionState {
  emotion: DriverEmotion;
  label: string;
  icon: string;
  color: string;
  reason: string;
  alertLevel: 'none' | 'warning' | 'critical';
}

const EMOTION_CONFIGS: Record<
  DriverEmotion,
  Pick<EmotionState, 'emotion' | 'label' | 'icon' | 'color'>
> = {
  focused:    { emotion: 'focused',    label: 'FOCUSED',     icon: '😎', color: '#00d4ff' },
  distracted: { emotion: 'distracted', label: 'DISTRACTED',  icon: '📱', color: '#ffd600' },
  sleepy:     { emotion: 'sleepy',     label: 'DROWSY',      icon: '😴', color: '#a855f7' },
  angry:      { emotion: 'angry',      label: 'AGGRESSIVE',  icon: '😡', color: '#ff3366' },
};

function variance(vals: number[]): number {
  if (vals.length < 2) return 0;
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  return vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
}

/**
 * Detect driver emotional state from a rolling window of telemetry frames.
 * Called every tick with the last N frames.
 */
export function detectDriverEmotion(telemetryHistory: DrivingData[]): EmotionState {
  if (telemetryHistory.length < 5) {
    return {
      ...EMOTION_CONFIGS.focused,
      reason: 'Calibrating sensors...',
      alertLevel: 'none',
    };
  }

  const recent     = telemetryHistory.slice(-10);
  const speeds     = recent.map(d => d.speed);
  const steerings  = recent.map(d => d.steeringAngle);
  const brakes     = recent.map(d => d.brakeIntensity);
  const accels     = recent.map(d => d.acceleration);

  const speedVar    = variance(speeds);
  const steeringVar = variance(steerings);
  const avgBrake    = brakes.reduce((s, v) => s + v, 0) / brakes.length;
  const accelSpikes = accels.filter(a => Math.abs(a) > 4).length;
  const avgSpeed    = speeds.reduce((s, v) => s + v, 0) / speeds.length;

  // ANGRY: frequent harsh braking or multiple hard acceleration spikes
  if (accelSpikes >= 3 || avgBrake > 0.45) {
    return {
      ...EMOTION_CONFIGS.angry,
      reason: `${accelSpikes} harsh input${accelSpikes !== 1 ? 's' : ''} detected`,
      alertLevel: 'warning',
    };
  }

  // DISTRACTED: erratic steering at moderate+ speed
  if (steeringVar > 90 && avgSpeed > 40) {
    return {
      ...EMOTION_CONFIGS.distracted,
      reason: 'Erratic steering pattern detected',
      alertLevel: 'warning',
    };
  }

  // SLEEPY: monotonously low speed variance at sustained speed
  if (speedVar < 12 && avgSpeed > 50) {
    const isCritical = avgSpeed > 80;
    return {
      ...EMOTION_CONFIGS.sleepy,
      reason: isCritical
        ? 'Drowsy at high speed — DANGER!'
        : 'Monotonous driving pattern',
      alertLevel: isCritical ? 'critical' : 'warning',
    };
  }

  return {
    ...EMOTION_CONFIGS.focused,
    reason: 'Normal driving behavior',
    alertLevel: 'none',
  };
}

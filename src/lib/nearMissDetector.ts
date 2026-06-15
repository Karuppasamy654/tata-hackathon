// Near-Miss Detection Engine
import { DrivingData } from './simulation';

export type AlertSeverity = 'warning' | 'danger' | 'critical';

export interface NearMissAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: number;
  icon: string;
}

let alertIdCounter = 0;

function createAlert(severity: AlertSeverity, title: string, message: string, icon: string): NearMissAlert {
  return {
    id: `alert-${++alertIdCounter}-${Date.now()}`,
    severity,
    title,
    message,
    timestamp: Date.now(),
    icon,
  };
}

export function detectNearMiss(data: DrivingData, prevData?: DrivingData): NearMissAlert[] {
  const alerts: NearMissAlert[] = [];

  // 1. Emergency Braking at High Speed
  if (data.brakeIntensity > 0.7 && data.speed > 80) {
    alerts.push(
      createAlert(
        'critical',
        'Emergency Braking',
        `Sudden braking at ${data.speed.toFixed(0)} km/h with ${(data.brakeIntensity * 100).toFixed(0)}% intensity`,
        '🛑'
      )
    );
  }

  // 2. Collision Risk - very close distance at speed
  if (data.distanceToVehicle < 5 && data.speed > 60) {
    alerts.push(
      createAlert(
        'critical',
        'Collision Risk',
        `Only ${data.distanceToVehicle.toFixed(1)}m to vehicle ahead at ${data.speed.toFixed(0)} km/h`,
        '💥'
      )
    );
  }

  // 3. Loss of Control - extreme steering at speed
  if (Math.abs(data.steeringAngle) > 40 && data.speed > 70) {
    alerts.push(
      createAlert(
        'danger',
        'Loss of Control',
        `Extreme steering angle of ${Math.abs(data.steeringAngle).toFixed(0)}° at ${data.speed.toFixed(0)} km/h`,
        '🔄'
      )
    );
  }

  // 4. Rapid Deceleration
  if (data.acceleration < -6) {
    alerts.push(
      createAlert(
        'danger',
        'Rapid Deceleration',
        `Deceleration of ${Math.abs(data.acceleration).toFixed(1)} m/s² detected`,
        '⚡'
      )
    );
  }

  // 5. Tailgating Warning
  if (data.distanceToVehicle < 10 && data.speed > 80 && alerts.length === 0) {
    alerts.push(
      createAlert(
        'warning',
        'Tailgating',
        `Following at ${data.distanceToVehicle.toFixed(1)}m at ${data.speed.toFixed(0)} km/h — increase distance`,
        '⚠️'
      )
    );
  }

  // 6. Excessive Speed
  if (data.speed > 130 && alerts.length === 0) {
    alerts.push(
      createAlert(
        'warning',
        'Excessive Speed',
        `Traveling at ${data.speed.toFixed(0)} km/h — well above safe limits`,
        '🏎️'
      )
    );
  }

  return alerts;
}

// Real-time driving data simulation engine
export interface DrivingData {
  speed: number; // km/h (0-180)
  acceleration: number; // m/s² (-10 to 10)
  brakeIntensity: number; // 0-1 (0 = no brake, 1 = full emergency brake)
  distanceToVehicle: number; // meters (1-100)
  steeringAngle: number; // degrees (-90 to 90)
  timestamp: number;
}

export interface SimulationState {
  isRunning: boolean;
  tick: number;
  scenario: 'normal' | 'aggressive' | 'dangerous';
}

// Base driving parameters
const BASE_SPEED = 60;
const SPEED_VARIANCE = 25;
const BASE_DISTANCE = 40;
const DISTANCE_VARIANCE = 20;

// Dangerous event probability per tick
const DANGEROUS_EVENT_CHANCE = 0.04;
const AGGRESSIVE_EVENT_CHANCE = 0.08;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothNoise(tick: number, frequency: number = 0.1): number {
  // Simple smooth noise using sine combination
  return (
    Math.sin(tick * frequency) * 0.5 +
    Math.sin(tick * frequency * 2.3 + 1.7) * 0.3 +
    Math.sin(tick * frequency * 0.7 + 3.1) * 0.2
  );
}

export function generateDrivingData(tick: number, prevData?: DrivingData): DrivingData {
  const now = Date.now();

  // Smooth base values using noise
  const speedNoise = smoothNoise(tick, 0.08);
  const distNoise = smoothNoise(tick, 0.06);
  const steerNoise = smoothNoise(tick, 0.12);

  let speed = BASE_SPEED + speedNoise * SPEED_VARIANCE + (Math.random() - 0.5) * 10;
  let distanceToVehicle = BASE_DISTANCE + distNoise * DISTANCE_VARIANCE + (Math.random() - 0.5) * 8;
  let steeringAngle = steerNoise * 15 + (Math.random() - 0.5) * 5;
  let brakeIntensity = Math.max(0, (Math.random() - 0.7) * 0.4);
  let acceleration = (Math.random() - 0.5) * 3;

  // Inject dangerous events randomly
  const eventRoll = Math.random();

  if (eventRoll < DANGEROUS_EVENT_CHANCE) {
    // DANGEROUS: sudden brake at high speed with close vehicle
    speed = 100 + Math.random() * 60;
    brakeIntensity = 0.8 + Math.random() * 0.2;
    distanceToVehicle = 3 + Math.random() * 7;
    acceleration = -6 - Math.random() * 4;
    steeringAngle = (Math.random() - 0.5) * 60;
  } else if (eventRoll < DANGEROUS_EVENT_CHANCE + AGGRESSIVE_EVENT_CHANCE) {
    // AGGRESSIVE: moderately risky behavior
    speed = 85 + Math.random() * 35;
    brakeIntensity = 0.4 + Math.random() * 0.3;
    distanceToVehicle = 10 + Math.random() * 15;
    acceleration = -3 - Math.random() * 3;
    steeringAngle = (Math.random() - 0.5) * 35;
  }

  // Smooth transition from previous data if available
  if (prevData) {
    speed = prevData.speed * 0.6 + speed * 0.4;
    distanceToVehicle = prevData.distanceToVehicle * 0.5 + distanceToVehicle * 0.5;
    steeringAngle = prevData.steeringAngle * 0.5 + steeringAngle * 0.5;
    brakeIntensity = prevData.brakeIntensity * 0.3 + brakeIntensity * 0.7;
    acceleration = prevData.acceleration * 0.4 + acceleration * 0.6;
  }

  return {
    speed: clamp(Math.round(speed * 10) / 10, 0, 180),
    acceleration: clamp(Math.round(acceleration * 100) / 100, -10, 10),
    brakeIntensity: clamp(Math.round(brakeIntensity * 100) / 100, 0, 1),
    distanceToVehicle: clamp(Math.round(distanceToVehicle * 10) / 10, 1, 100),
    steeringAngle: clamp(Math.round(steeringAngle * 10) / 10, -90, 90),
    timestamp: now,
  };
}

// Pre-built dangerous scenarios for "Replay" feature
export const DANGEROUS_SCENARIOS: DrivingData[] = [
  { speed: 65, acceleration: 1.2, brakeIntensity: 0, distanceToVehicle: 45, steeringAngle: 2, timestamp: 0 },
  { speed: 78, acceleration: 3.5, brakeIntensity: 0, distanceToVehicle: 35, steeringAngle: 5, timestamp: 0 },
  { speed: 95, acceleration: 4.2, brakeIntensity: 0.1, distanceToVehicle: 25, steeringAngle: 8, timestamp: 0 },
  { speed: 115, acceleration: 2.8, brakeIntensity: 0.05, distanceToVehicle: 18, steeringAngle: -3, timestamp: 0 },
  { speed: 130, acceleration: 1.5, brakeIntensity: 0, distanceToVehicle: 12, steeringAngle: -10, timestamp: 0 },
  { speed: 140, acceleration: 0.5, brakeIntensity: 0, distanceToVehicle: 8, steeringAngle: -15, timestamp: 0 },
  { speed: 135, acceleration: -2.0, brakeIntensity: 0.3, distanceToVehicle: 6, steeringAngle: -25, timestamp: 0 },
  { speed: 120, acceleration: -5.5, brakeIntensity: 0.7, distanceToVehicle: 4, steeringAngle: -35, timestamp: 0 },
  { speed: 95, acceleration: -8.0, brakeIntensity: 0.95, distanceToVehicle: 3, steeringAngle: 40, timestamp: 0 },
  { speed: 60, acceleration: -6.0, brakeIntensity: 0.85, distanceToVehicle: 5, steeringAngle: 20, timestamp: 0 },
  { speed: 40, acceleration: -3.0, brakeIntensity: 0.5, distanceToVehicle: 10, steeringAngle: 10, timestamp: 0 },
  { speed: 55, acceleration: 1.0, brakeIntensity: 0.1, distanceToVehicle: 20, steeringAngle: 3, timestamp: 0 },
  { speed: 60, acceleration: 0.5, brakeIntensity: 0, distanceToVehicle: 35, steeringAngle: 0, timestamp: 0 },
];

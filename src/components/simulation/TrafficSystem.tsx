import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from './SimulationCore';

interface TrafficSystemProps {
  gameState: React.MutableRefObject<GameState>;
}

interface AICar {
  id: number;
  x: number;
  z: number;
  speed: number;
  color: string;
}

const LANES = [-10, -5, 0, 5, 10];
const CAR_COLORS = ['#ff3366', '#33ccff', '#ffcc00', '#ffffff', '#aa00ff'];

export default function TrafficSystem({ gameState }: TrafficSystemProps) {
  const carsRef = useRef<AICar[]>([
    { id: 1, x: LANES[2], z: -50, speed: 60, color: CAR_COLORS[0] },
    { id: 2, x: LANES[0], z: -100, speed: 70, color: CAR_COLORS[1] },
    { id: 3, x: LANES[4], z: -150, speed: 50, color: CAR_COLORS[2] },
  ]);

  const [renderCars, setRenderCars] = useState<AICar[]>(carsRef.current);
  const nextId = useRef(4);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (gameState.current.isCrashed) return;
    
    timeRef.current += delta;
    const playerSpeed = gameState.current.speed;
    const playerX = gameState.current.playerX;
    const CAR_WIDTH = 1.8;
    const CAR_LENGTH = 4.5;

    let hasCrash = false;

    // Update positions and handle respawn / collisions
    carsRef.current.forEach(car => {
      const relativeSpeed = playerSpeed - car.speed;
      car.z += (relativeSpeed / 3.6) * delta;

      // Despawn / Respawn if passed
      if (car.z > 20) {
        car.z = -150 - Math.random() * 50;
        car.x = LANES[Math.floor(Math.random() * LANES.length)];
        car.speed = 40 + Math.random() * 40;
      }

      // Collision Detection (Simple AABB)
      // Player is at Z=0.
      if (Math.abs(car.z) < CAR_LENGTH && Math.abs(car.x - playerX) < CAR_WIDTH) {
        hasCrash = true;
      }
    });

    if (hasCrash) {
      gameState.current.isCrashed = true;
    }

    // Occasionally change lanes
    if (timeRef.current > 2) {
      timeRef.current = 0;
      carsRef.current.forEach(car => {
        if (Math.random() > 0.8) {
          const currentLaneIdx = LANES.indexOf(car.x);
          if (currentLaneIdx >= 0) {
            const dir = Math.random() > 0.5 ? 1 : -1;
            const newLaneIdx = Math.max(0, Math.min(LANES.length - 1, currentLaneIdx + dir));
            car.x = LANES[newLaneIdx];
          }
        }
      });
    }

    // Force re-render to update positions (since we mutated refs for performance)
    // Actually, in R3F mutating refs directly and updating mesh positions is better
    // but here we map state to react elements. For 10 cars, useState is fine.
    setRenderCars([...carsRef.current]);
  });

  return (
    <group>
      {renderCars.map(car => (
        <group key={car.id} position={[car.x, 0, car.z]}>
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.8, 4.5]} />
            <meshStandardMaterial color={car.color} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.1, -0.2]} castShadow>
            <boxGeometry args={[1.4, 0.6, 2.2]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

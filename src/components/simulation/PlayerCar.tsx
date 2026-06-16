import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from './SimulationCore';
import { DrivingData } from '@/lib/simulation';

interface PlayerCarProps {
  gameState: React.MutableRefObject<GameState>;
  updateInteractiveData: (data: DrivingData) => void;
}

const MAX_SPEED = 140; // km/h
const ACCEL = 30;
const BRAKE = 60;
const FRICTION = 10;
const STEER_SPEED = 15; // lateral units per second at max steering
const ROAD_BOUNDS = 12; // units from center

export default function PlayerCar({ gameState, updateInteractiveData }: PlayerCarProps) {
  const carRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const lastTelemetryRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'ArrowUp') keys.current.w = true;
      if (e.key === 'a' || e.key === 'ArrowLeft') keys.current.a = true;
      if (e.key === 's' || e.key === 'ArrowDown') keys.current.s = true;
      if (e.key === 'd' || e.key === 'ArrowRight') keys.current.d = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'ArrowUp') keys.current.w = false;
      if (e.key === 'a' || e.key === 'ArrowLeft') keys.current.a = false;
      if (e.key === 's' || e.key === 'ArrowDown') keys.current.s = false;
      if (e.key === 'd' || e.key === 'ArrowRight') keys.current.d = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    const s = gameState.current;
    if (s.isCrashed) {
      s.speed = THREE.MathUtils.lerp(s.speed, 0, delta * 5); // slow down quickly
    } else {
      // Acceleration / Braking
      let prevSpeed = s.speed;
      if (keys.current.w) s.speed += ACCEL * delta;
      else if (keys.current.s) s.speed -= BRAKE * delta;
      else s.speed -= FRICTION * delta;

      s.speed = Math.max(0, Math.min(MAX_SPEED, s.speed));
      
      const isBraking = keys.current.s && s.speed > 0;
      const acceleration = (s.speed - prevSpeed) / delta;
      const brakeIntensity = isBraking ? Math.min(1, s.speed / 40) : 0;

      // Steering
      if (keys.current.a) s.steering = THREE.MathUtils.lerp(s.steering, -1, delta * 5);
      else if (keys.current.d) s.steering = THREE.MathUtils.lerp(s.steering, 1, delta * 5);
      else s.steering = THREE.MathUtils.lerp(s.steering, 0, delta * 5);

      if (carRef.current) {
        // Move laterally based on steering and speed (can't steer if not moving)
        const speedFactor = s.speed / MAX_SPEED;
        carRef.current.position.x += s.steering * STEER_SPEED * speedFactor * delta;
        carRef.current.position.x = Math.max(-ROAD_BOUNDS, Math.min(ROAD_BOUNDS, carRef.current.position.x));
        s.playerX = carRef.current.position.x; // Update GameState for collision

        // Car rotation
        carRef.current.rotation.y = -s.steering * 0.2;
        carRef.current.rotation.z = s.steering * 0.05; // body roll

        // Third person camera follow
        const idealCamPos = new THREE.Vector3(
          carRef.current.position.x * 0.5, // slightly look towards where car is
          4, // height
          carRef.current.position.z + 10 // distance behind
        );
        camera.position.lerp(idealCamPos, delta * 5);
        camera.lookAt(
          carRef.current.position.x, 
          carRef.current.position.y + 1, 
          carRef.current.position.z - 20
        );

        // Telemetry Update
        const now = Date.now();
        if (now - lastTelemetryRef.current > 100) {
          lastTelemetryRef.current = now;
          // Calculate an estimated distance to next object? We don't have direct access here easily,
          // but TrafficSystem handles collision and distance calculation. We'll pass dummy distance here, 
          // or we can just omit distance from here and let TrafficSystem update it if we want.
          // For now, emit player stats.
          updateInteractiveData({
            speed: s.speed,
            acceleration,
            brakeIntensity,
            distanceToVehicle: 50, // This should ideally be calculated by TrafficSystem
            steeringAngle: s.steering * 15,
            timestamp: now
          });
        }
      }
      
      // Update score based on speed and safe driving (pseudo-logic)
      if (s.speed > 0) {
        s.score += (s.speed / 100) * delta * 10;
      }
    }
  });

  return (
    <group ref={carRef} position={[0, 0, 0]}>
      {/* Stylized Realistic Car */}
      
      {/* Main Body */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.8, 4.5]} />
        <meshStandardMaterial color="#ff0044" roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Cabin / Roof */}
      <mesh position={[0, 1.1, -0.2]} castShadow>
        <boxGeometry args={[1.4, 0.6, 2.2]} />
        <meshStandardMaterial color="#111" roughness={0.1} metalness={0.9} transparent opacity={0.8} />
      </mesh>
      
      {/* Headlights */}
      <mesh position={[-0.7, 0.6, -2.26]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.7, 0.6, -2.26]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Taillights */}
      <mesh position={[-0.7, 0.6, 2.26]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshBasicMaterial color={gameState.current.speed > 0 && keys.current.s ? '#ff0000' : '#880000'} />
      </mesh>
      <mesh position={[0.7, 0.6, 2.26]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshBasicMaterial color={gameState.current.speed > 0 && keys.current.s ? '#ff0000' : '#880000'} />
      </mesh>

      {/* Wheels */}
      {[-0.95, 0.95].map((x, i) => 
        [-1.4, 1.4].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
            <meshStandardMaterial color="#222" roughness={0.9} />
          </mesh>
        ))
      )}
    </group>
  );
}

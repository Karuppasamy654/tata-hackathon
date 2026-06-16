import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from './SimulationCore';

interface HighwayProps {
  gameState: React.MutableRefObject<GameState>;
}

export default function Highway({ gameState }: HighwayProps) {
  const roadRef = useRef<THREE.Mesh>(null);
  const linesRef = useRef<THREE.Group>(null);

  // We will animate the road markings to simulate speed.
  // The player car stays at z=0, and the world moves towards them.
  useFrame((state, delta) => {
    if (gameState.current.isCrashed) return;

    // Convert speed (km/h) to units per second. Let's say 1 unit = 1 meter.
    // 100 km/h = 27.7 m/s.
    const speedMs = gameState.current.speed / 3.6;
    const moveDist = speedMs * delta;

    gameState.current.distance += moveDist;

    // Move road lines
    if (linesRef.current) {
      linesRef.current.position.z += moveDist;
      // Loop the lines back
      if (linesRef.current.position.z > 20) {
        linesRef.current.position.z -= 20;
      }
    }
  });

  return (
    <group>
      {/* Main Asphalt Road */}
      <mesh ref={roadRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -50]}>
        <planeGeometry args={[30, 300]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>

      {/* Grass / Environment surrounding road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -50]}>
        <planeGeometry args={[200, 300]} />
        <meshStandardMaterial color="#05100a" roughness={1} />
      </mesh>

      {/* Road Markings */}
      <group ref={linesRef}>
        {Array.from({ length: 20 }).map((_, i) => (
          <group key={i} position={[0, 0.01, -i * 10]}>
            {/* Center broken lines */}
            <mesh position={[-5, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.5, 5]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[5, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.5, 5]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Solid side lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-14, 0.01, -50]}>
        <planeGeometry args={[0.5, 300]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.01, -50]}>
        <planeGeometry args={[0.5, 300]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>
    </group>
  );
}

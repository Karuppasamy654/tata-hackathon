'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';

import Highway from './Highway';
import PlayerCar from './PlayerCar';
import TrafficSystem from './TrafficSystem';
import SimulationUI from './SimulationUI';
import WebcamOverlay from './WebcamOverlay';
import { DrivingData } from '@/lib/simulation';

// Force TS re-parse
export interface SimulationCoreProps {
  updateInteractiveData: (data: DrivingData) => void;
}

// Global context/state for the game can be passed down as props or refs.
// To keep it performant, we'll use a ref to store mutable game state and pass it to children.
export type GameState = {
  speed: number;       // Current player speed (km/h)
  targetSpeed: number; // For smooth acceleration
  steering: number;    // -1 to 1
  distance: number;    // Total distance traveled
  score: number;       // Arbitrary score based on distance and safe driving
  isCrashed: boolean;
  playerX: number;     // For collision detection
};

export default function SimulationCore({ updateInteractiveData }: SimulationCoreProps) {
  const gameStateRef = useRef<GameState>({
    speed: 0,
    targetSpeed: 0,
    steering: 0,
    distance: 0,
    score: 0,
    isCrashed: false,
    playerX: 0,
  });

  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [speedDisplay, setSpeedDisplay] = useState(0);
  
  // HUD Update Loop (runs at 10Hz to save React renders)
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeedDisplay(Math.round(gameStateRef.current.speed));
      setScoreDisplay(Math.round(gameStateRef.current.score));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Canvas shadows>
        {/* Environment Setup */}
        <color attach="background" args={['#000814']} />
        <fog attach="fog" args={['#000814', 20, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        
        {/* Optional realistic sky/lighting */}
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
        
        <Suspense fallback={null}>
          <Highway gameState={gameStateRef} />
          <PlayerCar 
            gameState={gameStateRef} 
            updateInteractiveData={updateInteractiveData} 
          />
          <TrafficSystem gameState={gameStateRef} />
        </Suspense>

      </Canvas>

      {/* 2D HTML Overlays */}
      <SimulationUI speed={speedDisplay} score={scoreDisplay} distance={Math.round(gameStateRef.current.distance)} />
      <WebcamOverlay />
    </>
  );
}

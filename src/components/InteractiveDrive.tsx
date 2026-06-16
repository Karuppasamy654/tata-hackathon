'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface DrivingData {
  speed: number;
  acceleration: number;
  brakeIntensity: number;
  distanceToVehicle: number;
  steeringAngle: number;
  timestamp: number;
}

interface InteractiveDriveProps {
  updateInteractiveData: (data: DrivingData) => void;
  isEmergency: boolean;
}

const MAX_SPEED = 120; // km/h
const ACCEL_RATE = 15; // km/h per second
const BRAKE_RATE = 40; // km/h per second
const FRICTION = 5; // km/h per second

export default function InteractiveDrive({ updateInteractiveData, isEmergency }: InteractiveDriveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game state stored in refs to avoid re-renders during loop
  const state = useRef({
    playerSpeed: 0,
    playerX: 0, // -1 to 1 (left to right)
    aiSpeed: 60,
    aiDistance: 50, // meters ahead
    aiTargetSpeed: 60,
    keys: { up: false, down: false, left: false, right: false },
    lastTime: 0,
    roadOffset: 0,
    lastTelemetryTime: 0,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w': state.current.keys.up = true; break;
        case 'ArrowDown':
        case 's': state.current.keys.down = true; break;
        case 'ArrowLeft':
        case 'a': state.current.keys.left = true; break;
        case 'ArrowRight':
        case 'd': state.current.keys.right = true; break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w': state.current.keys.up = false; break;
        case 'ArrowDown':
        case 's': state.current.keys.down = false; break;
        case 'ArrowLeft':
        case 'a': state.current.keys.left = false; break;
        case 'ArrowRight':
        case 'd': state.current.keys.right = false; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Emergency override effect
  useEffect(() => {
    if (isEmergency) {
      // Force brakes on in state
      state.current.keys.down = true;
      state.current.keys.up = false;
    }
  }, [isEmergency]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // AI Behavior loop
    const aiInterval = setInterval(() => {
      const s = state.current;
      // Randomly change AI speed
      const rand = Math.random();
      if (rand < 0.1) {
        s.aiTargetSpeed = 20; // Sudden brake
      } else if (rand < 0.3) {
        s.aiTargetSpeed = Math.max(0, s.playerSpeed - 10); // Tease
      } else if (rand < 0.6) {
        s.aiTargetSpeed = 60;
      } else {
        s.aiTargetSpeed = 80;
      }
    }, 3000);

    let animationFrameId: number;

    const loop = (time: number) => {
      if (!state.current.lastTime) state.current.lastTime = time;
      const dt = (time - state.current.lastTime) / 1000; // seconds
      state.current.lastTime = time;
      const s = state.current;

      // Force emergency braking override
      if (isEmergency) {
        s.keys.up = false;
        s.keys.down = true; // Auto-brake
      }

      // Player physics
      let prevSpeed = s.playerSpeed;
      if (s.keys.up) {
        s.playerSpeed += ACCEL_RATE * dt;
      } else if (s.keys.down) {
        s.playerSpeed -= BRAKE_RATE * dt;
      } else {
        s.playerSpeed -= FRICTION * dt;
      }
      s.playerSpeed = Math.max(0, Math.min(MAX_SPEED, s.playerSpeed));

      const acceleration = (s.playerSpeed - prevSpeed) / dt;
      const brakeIntensity = s.keys.down ? Math.min(1, s.playerSpeed / 40) : 0;

      // Steering
      let steeringAngle = 0;
      if (s.keys.left) {
        s.playerX -= 1 * dt;
        steeringAngle = -15;
      }
      if (s.keys.right) {
        s.playerX += 1 * dt;
        steeringAngle = 15;
      }
      s.playerX = Math.max(-1, Math.min(1, s.playerX));

      // AI Physics
      if (s.aiSpeed < s.aiTargetSpeed) s.aiSpeed += 10 * dt;
      if (s.aiSpeed > s.aiTargetSpeed) s.aiSpeed -= 20 * dt;

      // Distance update
      // relative speed in km/h -> m/s is div by 3.6
      const relSpeed = (s.aiSpeed - s.playerSpeed) / 3.6; 
      s.aiDistance += relSpeed * dt;
      
      // Keep AI from running away too far or crashing through us
      if (s.aiDistance > 150) {
        s.aiDistance = 150;
        s.aiTargetSpeed = s.playerSpeed; // Match speed to stay in view
      }
      if (s.aiDistance < 2) s.aiDistance = 2; // Collision floor

      // Road animation
      s.roadOffset += (s.playerSpeed / 3.6) * dt * 10;
      if (s.roadOffset > 100) s.roadOffset -= 100;

      // Rendering
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Road
      ctx.fillStyle = '#111827'; // slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Lane markings
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      const centerX = canvas.width / 2;
      for (let i = -1; i < 20; i++) {
        const y = (i * 100) - s.roadOffset + (canvas.height / 2);
        ctx.fillRect(centerX - 4, y, 8, 40);
        ctx.fillRect(centerX - 150 - 4, y, 4, 40);
        ctx.fillRect(centerX + 150 - 4, y, 4, 40);
      }

      // Draw AI Car
      const aiY = canvas.height - 100 - (s.aiDistance * 4); // Scale distance to pixels
      ctx.fillStyle = '#ff3366';
      ctx.shadowColor = '#ff3366';
      ctx.shadowBlur = 15;
      ctx.fillRect(centerX - 20, aiY, 40, 70);
      // Brake lights
      if (s.aiSpeed > s.aiTargetSpeed) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(centerX - 18, aiY + 65, 10, 5);
        ctx.fillRect(centerX + 8, aiY + 65, 10, 5);
      }
      ctx.shadowBlur = 0;

      // Draw Player Car
      const playerPixX = centerX + (s.playerX * 100) - 20;
      ctx.fillStyle = '#00d4ff';
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 20;
      ctx.fillRect(playerPixX, canvas.height - 120, 40, 70);
      // Player brake lights
      if (s.keys.down) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(playerPixX + 2, canvas.height - 55, 10, 5);
        ctx.fillRect(playerPixX + 28, canvas.height - 55, 10, 5);
      }
      ctx.shadowBlur = 0;

      // Emit Telemetry
      if (time - s.lastTelemetryTime > 100) { // Every 100ms
        s.lastTelemetryTime = time;
        updateInteractiveData({
          speed: s.playerSpeed,
          acceleration,
          brakeIntensity,
          distanceToVehicle: s.aiDistance,
          steeringAngle,
          timestamp: Date.now()
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      clearInterval(aiInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, [updateInteractiveData, isEmergency]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={800} 
        className="w-full h-full object-cover"
      />
      
      {/* HUD Instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 px-6 py-3 rounded-full backdrop-blur border border-slate-700/50 flex gap-4 text-sm font-mono text-cyan-400">
        <span>[W/↑] Accelerate</span>
        <span>[S/↓] Brake</span>
        <span>[A/D] Steer</span>
      </div>

      {/* Speedometer overlay */}
      <div className="absolute bottom-6 right-6 text-right">
        <div className="text-4xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {Math.round(state.current.playerSpeed)}
        </div>
        <div className="text-cyan-500 font-bold tracking-widest text-xs">KM/H</div>
      </div>
    </div>
  );
}

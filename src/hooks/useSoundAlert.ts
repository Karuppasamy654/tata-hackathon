'use client';

import { useRef, useCallback } from 'react';

export function useSoundAlert() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastPlayRef = useRef(0);

  const playAlert = useCallback((severity: 'warning' | 'danger' | 'critical') => {
    const now = Date.now();
    // Throttle: min 2 seconds between sounds
    if (now - lastPlayRef.current < 2000) return;
    lastPlayRef.current = now;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Different tones for different severities
      switch (severity) {
        case 'critical':
          oscillator.frequency.setValueAtTime(880, ctx.currentTime);
          oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.4);
          break;
        case 'danger':
          oscillator.frequency.setValueAtTime(660, ctx.currentTime);
          oscillator.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
        case 'warning':
          oscillator.frequency.setValueAtTime(520, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
      }
    } catch {
      // Audio not available, silently ignore
    }
  }, []);

  return { playAlert };
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { DrivingData } from '@/lib/simulation';

interface NearMissReplayProps {
  isOpen: boolean;
  events: DrivingData[];
  onClose: () => void;
}

type FramePhase = {
  label: string;
  timeLabel: string;
  severity: 'safe' | 'warn' | 'danger' | 'critical';
  color: string;
  icon: string;
  riskProxy: number;
};

function classifyFrame(data: DrivingData, idx: number, total: number): FramePhase {
  const secondsBefore = Math.round((total - 1 - idx) * 0.6);
  const timeLabel = secondsBefore === 0 ? 't = 0s' : `t - ${secondsBefore}s`;
  const riskProxy = Math.min(
    100,
    (data.speed / 180) * 30 +
    data.brakeIntensity * 25 +
    Math.max(0, (30 - data.distanceToVehicle) / 30) * 30 +
    (Math.abs(data.steeringAngle) / 90) * 10
  );

  if (riskProxy >= 60) return { label: 'Near Crash',   timeLabel, severity: 'critical', color: '#ff3366', icon: '💥', riskProxy };
  if (riskProxy >= 45) return { label: 'Hard Braking', timeLabel, severity: 'danger',   color: '#ff8800', icon: '🛑', riskProxy };
  if (riskProxy >= 30) return { label: 'Tailgating',   timeLabel, severity: 'warn',     color: '#ffd600', icon: '⚠️', riskProxy };
  if (riskProxy >= 18) return { label: 'Speeding',     timeLabel, severity: 'warn',     color: '#ffa500', icon: '🏎️', riskProxy };
  return               { label: 'Normal',        timeLabel, severity: 'safe',     color: '#00ff88', icon: '✅', riskProxy };
}

export default function NearMissReplay({ isOpen, events, onClose }: NearMissReplayProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (isOpen) { setActiveIdx(0); setIsPlaying(true); }
  }, [isOpen]);

  useEffect(() => {
    if (!isPlaying || !isOpen || events.length === 0) return;
    const id = setInterval(() => {
      setActiveIdx(prev => {
        if (prev >= events.length - 1) { setIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, 1100);
    return () => clearInterval(id);
  }, [isPlaying, isOpen, events.length]);

  const frames = events.map((ev, i) => ({
    data: ev,
    phase: classifyFrame(ev, i, events.length),
  }));

  const current = frames[activeIdx];
  const progress = events.length <= 1 ? 0 : activeIdx / (events.length - 1);

  const PHASES = ['Normal', 'Speeding', 'Tailgating', 'Braking', 'Near Crash'];
  const PHASE_COLORS = ['#00ff88', '#ffa500', '#ffd600', '#ff8800', '#ff3366'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="replay-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="replay-modal"
            initial={{ scale: 0.82, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.82, y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 24 }}
          >
            {/* Header */}
            <div className="replay-header">
              <div>
                <h2 className="replay-title">🎥 Near-Miss Incident Replay</h2>
                <p className="replay-subtitle">
                  {events.length} frames captured · Last recorded incident
                </p>
              </div>
              <button className="replay-close" onClick={onClose} aria-label="Close replay">
                <X size={20} />
              </button>
            </div>

            {/* Current frame highlight */}
            {current && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIdx}
                  className="replay-current-frame"
                  style={{
                    borderColor: `${current.phase.color}44`,
                    background:  `${current.phase.color}0c`,
                  }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="replay-frame-top">
                    <span className="replay-frame-emoji">{current.phase.icon}</span>
                    <div className="replay-frame-meta">
                      <div className="replay-frame-phase" style={{ color: current.phase.color }}>
                        {current.phase.label}
                      </div>
                      <div className="replay-frame-time">{current.phase.timeLabel}</div>
                    </div>
                    <div className="replay-frame-stats">
                      <span>🚀 {current.data.speed.toFixed(0)} km/h</span>
                      <span>📏 {current.data.distanceToVehicle.toFixed(1)} m</span>
                      <span>🛑 {(current.data.brakeIntensity * 100).toFixed(0)}%</span>
                      <span>↺ {current.data.steeringAngle.toFixed(0)}°</span>
                    </div>
                  </div>

                  {/* Mini risk bar */}
                  <div className="replay-risk-bar-track">
                    <motion.div
                      className="replay-risk-bar-fill"
                      animate={{ width: `${current.phase.riskProxy}%`, backgroundColor: current.phase.color }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Timeline scrubber */}
            <div className="replay-timeline">
              <div className="replay-timeline-track">
                {/* Fill bar */}
                <div className="replay-timeline-fill" style={{ width: `${progress * 100}%` }} />

                {/* Frame dots */}
                {frames.map((f, i) => (
                  <button
                    key={i}
                    className="replay-timeline-dot"
                    aria-label={`Frame ${i + 1}`}
                    onClick={() => { setActiveIdx(i); setIsPlaying(false); }}
                    style={{
                      left:            `${(i / Math.max(events.length - 1, 1)) * 100}%`,
                      backgroundColor: f.phase.color,
                      opacity:         i <= activeIdx ? 1 : 0.28,
                      transform:       `translate(-50%, -50%) scale(${i === activeIdx ? 1.6 : 1})`,
                      boxShadow:       i === activeIdx ? `0 0 8px ${f.phase.color}` : 'none',
                    }}
                  />
                ))}
              </div>

              {/* Phase name labels */}
              <div className="replay-phase-labels">
                {PHASES.map((label, i) => {
                  const threshold = Math.floor((i / PHASES.length) * events.length);
                  const active = activeIdx >= threshold;
                  return (
                    <span
                      key={label}
                      className="replay-phase-label"
                      style={{ color: active ? PHASE_COLORS[i] : '#3a4255' }}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Playback controls */}
            <div className="replay-controls">
              <button
                className="replay-ctrl-btn"
                onClick={() => { setActiveIdx(Math.max(0, activeIdx - 1)); setIsPlaying(false); }}
                disabled={activeIdx === 0}
                aria-label="Previous frame"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                className="replay-ctrl-btn replay-ctrl-play"
                onClick={() => setIsPlaying(p => !p)}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <button
                className="replay-ctrl-btn"
                onClick={() => { setActiveIdx(Math.min(events.length - 1, activeIdx + 1)); setIsPlaying(false); }}
                disabled={activeIdx === events.length - 1}
                aria-label="Next frame"
              >
                <ChevronRight size={18} />
              </button>

              <span className="replay-frame-counter">
                {activeIdx + 1} / {events.length}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

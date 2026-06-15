'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface EmergencyOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export default function EmergencyOverlay({ isVisible, onDismiss }: EmergencyOverlayProps) {
  const [canDismiss, setCanDismiss] = useState(false);
  const [countdown, setCountdown]   = useState(5);
  const [hazardLeft, setHazardLeft] = useState(true);

  useEffect(() => {
    if (!isVisible) {
      setCanDismiss(false);
      setCountdown(5);
      return;
    }
    setCanDismiss(false);
    setCountdown(5);

    // Alternating hazard lights
    const hazardId = setInterval(() => setHazardLeft(h => !h), 480);
    // Allow dismiss after 5 s
    const dismissId = setTimeout(() => setCanDismiss(true), 5000);
    // Countdown ticker
    const countId = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);

    return () => {
      clearInterval(hazardId);
      clearTimeout(dismissId);
      clearInterval(countId);
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="emergency-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Hazard stripes — alternate left/right */}
          <motion.div
            className="hazard-panel hazard-left"
            animate={{
              opacity: hazardLeft ? 0.85 : 0.12,
              backgroundColor: hazardLeft ? '#ff8c00' : '#ff2200',
            }}
            transition={{ duration: 0.08 }}
          />
          <motion.div
            className="hazard-panel hazard-right"
            animate={{
              opacity: hazardLeft ? 0.12 : 0.85,
              backgroundColor: hazardLeft ? '#ff2200' : '#ff8c00',
            }}
            transition={{ duration: 0.08 }}
          />

          {/* Scan-line overlay */}
          <div className="emergency-scanlines" />

          {/* Main content */}
          <div className="emergency-content">
            <motion.div
              className="emergency-icon-wrap"
              animate={{ scale: [1, 1.12, 1], rotate: [-3, 3, -3, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              ⚠️
            </motion.div>

            <motion.h1
              className="emergency-title"
              animate={{
                textShadow: [
                  '0 0 20px #ff3366, 0 0 40px #ff3366',
                  '0 0 60px #ff3366, 0 0 100px #ff3366',
                  '0 0 20px #ff3366, 0 0 40px #ff3366',
                ],
              }}
              transition={{ duration: 0.7, repeat: Infinity }}
            >
              SYSTEM TAKING CONTROL
            </motion.h1>

            <div className="emergency-subtitle">
              CRITICAL RISK THRESHOLD EXCEEDED — AUTONOMOUS INTERVENTION ACTIVE
            </div>

            {/* Action items */}
            <div className="emergency-actions">
              <div className="emergency-action-item">
                <span className="emergency-action-icon">🛑</span>
                <div style={{ flex: 1 }}>
                  <div className="emergency-action-label">AUTO-BRAKING INITIATED</div>
                  <div className="emergency-action-bar">
                    <motion.div
                      className="emergency-action-bar-fill"
                      animate={{ width: ['0%', '100%'] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </div>
              </div>

              <div className="emergency-action-item">
                <span className="emergency-action-icon">🚨</span>
                <div className="emergency-action-label">HAZARD LIGHTS ACTIVATED</div>
              </div>

              <motion.div
                className="emergency-action-item"
                animate={{ opacity: [1, 0.45, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                <span className="emergency-action-icon">📡</span>
                <div className="emergency-action-label">
                  EMERGENCY ALERT SENT TO FLEET COORDINATOR
                </div>
              </motion.div>
            </div>

            {/* Dismiss / countdown */}
            {canDismiss ? (
              <motion.button
                className="emergency-dismiss-btn"
                onClick={onDismiss}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,51,102,0.25)' }}
                whileTap={{ scale: 0.95 }}
              >
                RESUME MANUAL CONTROL
              </motion.button>
            ) : (
              <div className="emergency-countdown">
                Manual control resumes in{' '}
                <motion.span
                  key={countdown}
                  initial={{ scale: 1.4, color: '#ff3366' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  transition={{ duration: 0.3 }}
                >
                  {countdown}
                </motion.span>
                s
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

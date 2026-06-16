'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AccidentProbabilityProps {
  probability: number; // 0–100
  timeToImpact?: number;
}

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 600;
    const start = display;
    const diff = value - start;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display}</>;
}

export default function AccidentProbability({ probability, timeToImpact }: AccidentProbabilityProps) {
  const isCritical = probability >= 70;
  const isWarning  = probability >= 40;
  const color      = isCritical ? '#ff3366' : isWarning ? '#ffd600' : '#00ff88';

  return (
    <div className="accident-prob-panel">
      <h3 className="panel-title">
        <span className="panel-title-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
        Collision Probability
      </h3>

      <div className="accident-prob-body">
        {/* Outer pulse ring — critical only */}
        {isCritical && (
          <motion.div
            className="accident-prob-ring"
            style={{ borderColor: `${color}55` }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
          />
        )}

        {/* Central number */}
        <motion.div
          className="accident-prob-number"
          animate={{
            color,
            textShadow: isCritical
              ? [`0 0 24px ${color}`, `0 0 48px ${color}`, `0 0 24px ${color}`]
              : `0 0 20px ${color}66`,
          }}
          transition={{
            color: { duration: 0.4 },
            textShadow: { duration: 0.7, repeat: isCritical ? Infinity : 0 },
          }}
        >
          <AnimatedCounter value={probability} />
          <span className="accident-prob-pct">%</span>
        </motion.div>

        {/* Status label */}
        <motion.div className="accident-prob-label" animate={{ color }} transition={{ duration: 0.4 }}>
          {isCritical ? 'CRITICAL RISK' : isWarning ? 'ELEVATED RISK' : 'LOW RISK'}
        </motion.div>

        {/* Time to impact */}
        {timeToImpact !== undefined && timeToImpact < 10 && (
          <motion.div 
            className="accident-prob-tti"
            animate={{ 
              color, 
              opacity: isCritical ? [1, 0.4, 1] : 1,
              scale: isCritical ? [1, 1.05, 1] : 1
            }}
            transition={{ repeat: isCritical ? Infinity : 0, duration: 0.5 }}
            style={{ 
              marginTop: '12px', 
              fontSize: '1.1rem', 
              fontWeight: 700, 
              letterSpacing: '1px',
              fontFamily: 'Orbitron, sans-serif'
            }}
          >
            Impact in: {timeToImpact.toFixed(1)}s
          </motion.div>
        )}

        {/* Progress bar */}
        <div className="accident-prob-bar-track">
          <motion.div
            className="accident-prob-bar-fill"
            animate={{ width: `${probability}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Red flash overlay on critical */}
        <AnimatePresence>
          {isCritical && (
            <motion.div
              className="accident-prob-flash"
              key="flash"
              style={{ backgroundColor: color }}
              animate={{ opacity: [0, 0.08, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

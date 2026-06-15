'use client';

import { motion } from 'framer-motion';
import { RiskLevel } from '@/hooks/useSimulation';
import { useEffect, useState } from 'react';

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
  color: string;
  factors: string[];
}

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'LOW RISK',
  medium: 'MEDIUM RISK',
  high: 'HIGH RISK',
};

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 400;
    const start = display;
    const diff = value - start;
    const startTime = performance.now();

    function animate(time: number) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display}</>;
}

export default function RiskMeter({ score, level, color, factors }: RiskMeterProps) {
  const radius = 120;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const filledLength = (score / 100) * arcLength;
  const dashOffset = arcLength - filledLength;

  const startAngle = 135;
  const isHigh = level === 'high';

  return (
    <div className="risk-meter-container">
      {isHigh && (
        <motion.div
          className="risk-meter-glow"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: `radial-gradient(circle, ${color}33 0%, transparent 70%)` }}
        />
      )}

      <div className="risk-meter-svg-wrap">
        <svg
          width={radius * 2 + stroke * 2}
          height={radius * 2 + stroke * 2}
          viewBox={`0 0 ${radius * 2 + stroke * 2} ${radius * 2 + stroke * 2}`}
          className="risk-meter-svg"
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <motion.stop offset="0%" animate={{ stopColor: color }} transition={{ duration: 0.8 }} />
              <motion.stop
                offset="100%"
                animate={{ stopColor: level === 'high' ? '#ff0044' : level === 'medium' ? '#ff8800' : '#00d4ff' }}
                transition={{ duration: 0.8 }}
              />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(${startAngle} ${radius + stroke} ${radius + stroke})`}
          />

          {/* Tick marks */}
          {Array.from({ length: 27 }).map((_, i) => {
            const angle = startAngle + (i / 26) * 270;
            const rad = (angle * Math.PI) / 180;
            const isMajor = i % 5 === 0;
            const innerR = radius - (isMajor ? 18 : 12);
            const outerR = radius - 6;
            const cx = radius + stroke;
            const cy = radius + stroke;
            return (
              <line
                key={i}
                x1={+(cx + innerR * Math.cos(rad)).toFixed(2)}
                y1={+(cy + innerR * Math.sin(rad)).toFixed(2)}
                x2={+(cx + outerR * Math.cos(rad)).toFixed(2)}
                y2={+(cy + outerR * Math.sin(rad)).toFixed(2)}
                stroke={i <= (score / 100) * 26 ? color : 'rgba(255,255,255,0.1)'}
                strokeWidth={isMajor ? 2 : 1}
                opacity={isMajor ? 0.8 : 0.4}
              />
            );
          })}

          {/* Filled arc */}
          <motion.circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="url(#riskGradient)"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            filter="url(#glow)"
            transform={`rotate(${startAngle} ${radius + stroke} ${radius + stroke})`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="risk-meter-center">
          <motion.div className="risk-meter-score" animate={{ color }} transition={{ duration: 0.5 }}>
            <AnimatedNumber value={score} />
          </motion.div>
          <motion.div
            className="risk-meter-label"
            animate={{ color, scale: isHigh ? [1, 1.05, 1] : 1 }}
            transition={{ color: { duration: 0.5 }, scale: { duration: 0.8, repeat: isHigh ? Infinity : 0 } }}
          >
            {RISK_LABELS[level]}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

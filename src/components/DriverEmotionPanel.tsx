'use client';

import { motion, AnimatePresence, TargetAndTransition, Transition } from 'framer-motion';
import { EmotionState, DriverEmotion } from '@/lib/emotionDetector';

interface DriverEmotionPanelProps {
  emotionState: EmotionState;
}

const EMOTION_STYLES: Record<DriverEmotion, { bg: string; border: string }> = {
  focused:    { bg: 'rgba(0,212,255,0.07)',   border: 'rgba(0,212,255,0.25)' },
  distracted: { bg: 'rgba(255,214,0,0.07)',   border: 'rgba(255,214,0,0.25)' },
  sleepy:     { bg: 'rgba(168,85,247,0.07)',  border: 'rgba(168,85,247,0.25)' },
  angry:      { bg: 'rgba(255,51,102,0.07)',  border: 'rgba(255,51,102,0.25)' },
};

function EmotionIcon({ emotion, icon, color }: { emotion: DriverEmotion; icon: string; color: string }) {
  const animations: Record<DriverEmotion, { animate: TargetAndTransition; transition: Transition }> = {
    focused: {
      animate: { scale: [1, 1.06, 1] },
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    },
    distracted: {
      animate: { x: [-3, 3, -3, 3, 0], rotate: [-4, 4, -4, 0] },
      transition: { duration: 0.55, repeat: Infinity, ease: 'easeInOut' },
    },
    sleepy: {
      animate: { opacity: [1, 0.25, 1], y: [0, 3, 0] },
      transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
    },
    angry: {
      animate: { x: [-4, 4, -4, 4, 0], scale: [1, 1.1, 1] },
      transition: { duration: 0.35, repeat: Infinity },
    },
  };

  const { animate, transition } = animations[emotion];

  return (
    <motion.div
      style={{
        fontSize: 52,
        lineHeight: 1,
        display: 'inline-block',
        filter: `drop-shadow(0 0 14px ${color})`,
      }}
      animate={animate}
      transition={transition}
    >
      {icon}
    </motion.div>
  );
}

export default function DriverEmotionPanel({ emotionState }: DriverEmotionPanelProps) {
  const { emotion, label, icon, color, reason, alertLevel } = emotionState;
  const style = EMOTION_STYLES[emotion];

  return (
    <div className="driver-emotion-panel">
      <h3 className="panel-title">
        <span className="panel-title-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
        Driver State
      </h3>

      <AnimatePresence mode="wait">
        <motion.div
          key={emotion}
          className="emotion-card"
          style={{ background: style.bg, borderColor: style.border }}
          initial={{ opacity: 0, scale: 0.88, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: -10 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Glow backdrop */}
          <div
            className="emotion-glow"
            style={{ background: `radial-gradient(ellipse at center, ${color}1a 0%, transparent 70%)` }}
          />

          <div className="emotion-icon-wrap">
            <EmotionIcon emotion={emotion} icon={icon} color={color} />
          </div>

          <motion.div className="emotion-label" animate={{ color }} transition={{ duration: 0.4 }}>
            {label}
          </motion.div>

          <p className="emotion-reason">{reason}</p>

          {alertLevel !== 'none' && (
            <motion.div
              className="emotion-alert-badge"
              style={{
                backgroundColor: alertLevel === 'critical' ? 'rgba(255,51,102,0.15)' : 'rgba(255,214,0,0.12)',
                borderColor:     alertLevel === 'critical' ? 'rgba(255,51,102,0.4)'  : 'rgba(255,214,0,0.3)',
                color:           alertLevel === 'critical' ? '#ff3366'               : '#ffd600',
              }}
              animate={{ opacity: [1, 0.55, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}
            >
              {alertLevel === 'critical' ? '⚠️ CRITICAL ALERT' : '⚠️ WARNING'}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

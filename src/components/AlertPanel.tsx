'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { NearMissAlert } from '@/lib/nearMissDetector';
import { X } from 'lucide-react';

interface AlertPanelProps {
  alerts: NearMissAlert[];
  onClear: () => void;
}

const SEVERITY_STYLES = {
  warning: {
    border: '#ffd60044',
    bg: '#ffd60008',
    badge: '#ffd600',
    label: 'WARNING',
  },
  danger: {
    border: '#ff880044',
    bg: '#ff880008',
    badge: '#ff8800',
    label: 'DANGER',
  },
  critical: {
    border: '#ff336644',
    bg: '#ff336608',
    badge: '#ff3366',
    label: 'CRITICAL',
  },
};

export default function AlertPanel({ alerts, onClear }: AlertPanelProps) {
  return (
    <div className="alert-panel">
      <div className="panel-title-row">
        <h3 className="panel-title">
          <span className="panel-title-dot panel-title-dot--red" />
          Alerts
          {alerts.length > 0 && (
            <motion.span
              className="alert-count-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={alerts.length}
            >
              {alerts.length}
            </motion.span>
          )}
        </h3>
        {alerts.length > 0 && (
          <button className="alert-clear-btn" onClick={onClear}>
            Clear All
          </button>
        )}
      </div>

      <div className="alert-list">
        <AnimatePresence mode="popLayout">
          {alerts.length === 0 ? (
            <motion.div
              key="empty"
              className="alert-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="alert-empty-icon">✓</div>
              <p>No active alerts</p>
              <span>All systems nominal</span>
            </motion.div>
          ) : (
            alerts.map((alert) => {
              const style = SEVERITY_STYLES[alert.severity];
              return (
                <motion.div
                  key={alert.id}
                  className="alert-card"
                  style={{
                    borderColor: style.border,
                    backgroundColor: style.bg,
                  }}
                  initial={{ opacity: 0, x: 80, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    ...(alert.severity === 'critical'
                      ? { boxShadow: [`0 0 0px ${style.badge}00`, `0 0 20px ${style.badge}33`, `0 0 0px ${style.badge}00`] }
                      : {}),
                  }}
                  exit={{ opacity: 0, x: 80, scale: 0.8 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    ...(alert.severity === 'critical'
                      ? { boxShadow: { duration: 1.5, repeat: Infinity } }
                      : {}),
                  }}
                  layout
                >
                  <div className="alert-card-header">
                    <span className="alert-icon">{alert.icon}</span>
                    <div className="alert-card-info">
                      <div className="alert-card-title-row">
                        <span className="alert-card-title">{alert.title}</span>
                        <span
                          className="alert-severity-badge"
                          style={{ backgroundColor: `${style.badge}22`, color: style.badge }}
                        >
                          {style.label}
                        </span>
                      </div>
                      <p className="alert-card-message">{alert.message}</p>
                    </div>
                  </div>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

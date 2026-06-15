'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RiskResult } from '@/hooks/useSimulation';

interface AIExplanationPanelProps {
  riskResult: RiskResult;
  accidentProbability: number;
}

// Map natural-language factor labels to approximate point contributions
function factorWeight(label: string): number {
  const l = label.toLowerCase();
  if (l.includes('collision') || l.includes('near crash'))  return 40;
  if (l.includes('emergency'))                              return 35;
  if (l.includes('tailgating'))                            return 30;
  if (l.includes('critical'))                              return 28;
  if (l.includes('extreme'))                               return 26;
  if (l.includes('very high') || l.includes('very close')) return 22;
  if (l.includes('high-speed') || l.includes('high speed'))return 20;
  if (l.includes('high'))                                  return 16;
  if (l.includes('hard') || l.includes('rapid'))           return 15;
  if (l.includes('sudden') || l.includes('close dist'))    return 12;
  if (l.includes('sharp') || l.includes('turn'))           return 10;
  if (l.includes('moderate'))                              return  8;
  return 7;
}

export default function AIExplanationPanel({ riskResult, accidentProbability }: AIExplanationPanelProps) {
  const { score, factors, color } = riskResult;
  const confidence = Math.round(Math.max(58, 96 - accidentProbability * 0.15));

  const topFactors = factors.slice(0, 5).map(f => ({
    label: f,
    weight: factorWeight(f),
  }));

  const maxWeight = topFactors.length > 0 ? Math.max(...topFactors.map(f => f.weight)) : 1;

  return (
    <div className="ai-explanation-panel">
      <div className="panel-title-row">
        <h3 className="panel-title">
          <span className="panel-title-dot panel-title-dot--cyan" />
          AI Explanation
        </h3>
        <span className="ai-score-badge" style={{ color, borderColor: `${color}44`, background: `${color}12` }}>
          Score {score}
        </span>
      </div>

      <p className="ai-explanation-lead">Risk increased due to:</p>

      <div className="ai-factors-list">
        <AnimatePresence mode="popLayout">
          {topFactors.length === 0 ? (
            <motion.div
              key="no-factors"
              className="ai-no-factors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span style={{ color: '#00ff88', fontSize: 18 }}>✓</span>
              <span>No risk factors detected</span>
            </motion.div>
          ) : (
            topFactors.map((f, i) => (
              <motion.div
                key={f.label}
                className="ai-factor-item"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                layout
              >
                <div className="ai-factor-header">
                  <span className="ai-factor-label">{f.label}</span>
                  <motion.span
                    className="ai-factor-pts"
                    animate={{ color }}
                    transition={{ duration: 0.4 }}
                  >
                    +{f.weight}
                  </motion.span>
                </div>
                <div className="ai-factor-bar-track">
                  <motion.div
                    className="ai-factor-bar-fill"
                    animate={{
                      width: `${(f.weight / maxWeight) * 100}%`,
                      backgroundColor: color,
                      boxShadow: `0 0 6px ${color}88`,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Model confidence row */}
      <div className="ai-confidence">
        <span className="ai-confidence-label">Model Confidence</span>
        <div className="ai-confidence-bar-track">
          <motion.div
            className="ai-confidence-bar-fill"
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <span className="ai-confidence-value">{confidence}%</span>
      </div>
    </div>
  );
}

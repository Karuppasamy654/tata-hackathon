'use client';

import { motion } from 'framer-motion';
import { DrivingData } from '@/lib/simulation';
import { Gauge, Ruler, CircleStop, RotateCcw, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface DrivingMetricsProps {
  data: DrivingData;
}

function AnimatedValue({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff  = value - start;
    const startTime = performance.now();
    const duration  = 350;

    function step(now: number) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const next = start + diff * eased;
      setDisplay(next);
      if (progress < 1) requestAnimationFrame(step);
      else prevRef.current = value;
    }
    requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display.toFixed(decimals)}</>;
}

function getDangerLevel(metric: string, value: number): 'safe' | 'warn' | 'danger' {
  switch (metric) {
    case 'speed':
      if (value > 120) return 'danger';
      if (value > 80)  return 'warn';
      return 'safe';
    case 'distance':
      if (value < 10)  return 'danger';
      if (value < 20)  return 'warn';
      return 'safe';
    case 'brake':
      if (value > 70)  return 'danger';
      if (value > 40)  return 'warn';
      return 'safe';
    case 'steering':
      if (Math.abs(value) > 35) return 'danger';
      if (Math.abs(value) > 20) return 'warn';
      return 'safe';
    case 'accel':
      if (Math.abs(value) > 6) return 'danger';
      if (Math.abs(value) > 3) return 'warn';
      return 'safe';
    default:
      return 'safe';
  }
}

const LEVEL_COLORS = { safe: '#00ff88', warn: '#ffd600', danger: '#ff3366' };

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  metric: string;
  decimals?: number;
  maxValue: number;
  displayAbs?: boolean;
}

function MetricCard({ icon, label, value, unit, metric, decimals = 1, maxValue, displayAbs = false }: MetricCardProps) {
  const level    = getDangerLevel(metric, value);
  const color    = LEVEL_COLORS[level];
  const display  = displayAbs ? Math.abs(value) : value;
  const progress = Math.min(Math.abs(value) / maxValue, 1);

  return (
    <motion.div
      className="metric-card"
      animate={{
        borderColor: `${color}33`,
        boxShadow: level === 'danger' ? `0 0 18px ${color}1a` : 'none',
      }}
      transition={{ duration: 0.4 }}
    >
      <div className="metric-header">
        <motion.div className="metric-icon" animate={{ color }} transition={{ duration: 0.3 }}>
          {icon}
        </motion.div>
        <span className="metric-label">{label}</span>
      </div>

      <div className="metric-value-row">
        <motion.span className="metric-value" animate={{ color }} transition={{ duration: 0.3 }}>
          <AnimatedValue value={display} decimals={decimals} />
        </motion.span>
        <span className="metric-unit">{unit}</span>
      </div>

      <div className="metric-bar-track">
        <motion.div
          className="metric-bar-fill"
          animate={{ width: `${progress * 100}%`, backgroundColor: color }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

export default function DrivingMetrics({ data }: DrivingMetricsProps) {
  return (
    <div className="driving-metrics">
      <h3 className="panel-title">
        <span className="panel-title-dot" />
        Live Telemetry
      </h3>

      <div className="metrics-grid">
        <MetricCard
          icon={<Gauge size={20} />}
          label="Speed"
          value={data.speed}
          unit="km/h"
          metric="speed"
          decimals={0}
          maxValue={180}
        />
        <MetricCard
          icon={<Ruler size={20} />}
          label="Distance"
          value={data.distanceToVehicle}
          unit="m"
          metric="distance"
          decimals={1}
          maxValue={100}
        />
        <MetricCard
          icon={<CircleStop size={20} />}
          label="Brake"
          value={data.brakeIntensity * 100}
          unit="%"
          metric="brake"
          decimals={0}
          maxValue={100}
        />
        <MetricCard
          icon={<RotateCcw size={20} />}
          label="Steering"
          value={data.steeringAngle}
          unit="°"
          metric="steering"
          decimals={1}
          maxValue={90}
        />
        <MetricCard
          icon={<Zap size={20} />}
          label="Acceleration"
          value={data.acceleration}
          unit="m/s²"
          metric="accel"
          decimals={1}
          maxValue={10}
          displayAbs={false}
        />
      </div>
    </div>
  );
}

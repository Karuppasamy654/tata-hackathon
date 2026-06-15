'use client';

import { motion } from 'framer-motion';
import { DriverProfile } from '@/lib/driverProfile';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Gauge, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DriverScoreProps {
  profile: DriverProfile;
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 500;
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

  return <>{display}{suffix}</>;
}

const TREND_CONFIG = {
  improving: { icon: TrendingUp, color: '#00ff88', label: 'Improving' },
  stable: { icon: Minus, color: '#00d4ff', label: 'Stable' },
  deteriorating: { icon: TrendingDown, color: '#ff3366', label: 'Deteriorating' },
};

export default function DriverScore({ profile }: DriverScoreProps) {
  const pieData = [
    { name: 'Safe', value: profile.safePercentage },
    { name: 'Risky', value: profile.riskyPercentage },
  ];
  const COLORS = ['#00ff88', '#ff3366'];

  const scoreColor = profile.overallScore >= 70 ? '#00ff88' : profile.overallScore >= 40 ? '#ffd600' : '#ff3366';
  const TrendIcon = TREND_CONFIG[profile.trend].icon;
  const trendColor = TREND_CONFIG[profile.trend].color;

  return (
    <div className="driver-score">
      <h3 className="panel-title">
        <span className="panel-title-dot panel-title-dot--green" />
        Driver Profile
      </h3>

      <div className="driver-score-content">
        {/* Left: Score + Pie */}
        <div className="driver-score-left">
          <div className="driver-score-main">
            <motion.div
              className="driver-score-number"
              animate={{ color: scoreColor }}
              transition={{ duration: 0.5 }}
            >
              <AnimatedNumber value={profile.overallScore} />
            </motion.div>
            <span className="driver-score-label">Safety Score</span>
          </div>

          <div className="driver-pie-chart">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={42}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={600}
                  animationEasing="ease-out"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} opacity={0.85} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              <div className="pie-legend-item">
                <span className="pie-dot" style={{ backgroundColor: COLORS[0] }} />
                <span>Safe {profile.safePercentage}%</span>
              </div>
              <div className="pie-legend-item">
                <span className="pie-dot" style={{ backgroundColor: COLORS[1] }} />
                <span>Risky {profile.riskyPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="driver-score-stats">
          <div className="stat-item">
            <div className="stat-icon-wrap" style={{ color: trendColor }}>
              <TrendIcon size={16} />
            </div>
            <div>
              <span className="stat-value" style={{ color: trendColor }}>{TREND_CONFIG[profile.trend].label}</span>
              <span className="stat-label">Trend</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-wrap" style={{ color: '#ff8800' }}>
              <AlertTriangle size={16} />
            </div>
            <div>
              <span className="stat-value"><AnimatedNumber value={profile.totalAlerts} /></span>
              <span className="stat-label">Total Alerts</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-wrap" style={{ color: '#00d4ff' }}>
              <Gauge size={16} />
            </div>
            <div>
              <span className="stat-value"><AnimatedNumber value={profile.avgSpeed} suffix=" km/h" /></span>
              <span className="stat-label">Avg Speed</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-wrap" style={{ color: '#ff3366' }}>
              <Activity size={16} />
            </div>
            <div>
              <span className="stat-value"><AnimatedNumber value={profile.maxRiskScore} /></span>
              <span className="stat-label">Peak Risk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

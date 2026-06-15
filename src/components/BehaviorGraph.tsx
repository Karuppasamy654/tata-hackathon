'use client';

import { HistoryEntry } from '@/lib/driverProfile';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

interface BehaviorGraphProps {
  history: HistoryEntry[];
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { speed: number } }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const risk = payload[0].value;
  const speed = payload[0].payload.speed;
  const color = risk >= 70 ? '#ff3366' : risk >= 40 ? '#ffd600' : '#00ff88';

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-row">
        <span>Risk Score</span>
        <span style={{ color, fontWeight: 700 }}>{risk}</span>
      </div>
      <div className="chart-tooltip-row">
        <span>Speed</span>
        <span>{speed} km/h</span>
      </div>
    </div>
  );
}

export default function BehaviorGraph({ history }: BehaviorGraphProps) {
  const data = history.slice(-60).map((entry, index) => ({
    index,
    time: formatTime(entry.timestamp),
    riskScore: entry.riskScore,
    speed: entry.speed,
  }));

  return (
    <div className="behavior-graph">
      <h3 className="panel-title">
        <span className="panel-title-dot panel-title-dot--cyan" />
        Risk Score Timeline
      </h3>

      <div className="graph-container">
        {data.length < 3 ? (
          <div className="graph-placeholder">
            <div className="graph-placeholder-pulse" />
            <p>Collecting data...</p>
            <span>Graph will appear after a few seconds</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="riskAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="50%" stopColor="#ffd600" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ff3366" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#334155"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                stroke="#334155"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#ff336644" strokeDasharray="4 4" />
              <ReferenceLine y={40} stroke="#ffd60044" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="riskScore"
                stroke="#00d4ff"
                strokeWidth={2}
                fill="url(#riskAreaGradient)"
                dot={false}
                animationDuration={300}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

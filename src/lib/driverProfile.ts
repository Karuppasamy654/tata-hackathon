// Driver Profile & Scoring Engine

export interface DriverProfile {
  overallScore: number; // 0-100 (higher = safer)
  safePercentage: number;
  riskyPercentage: number;
  trend: 'improving' | 'stable' | 'deteriorating';
  totalAlerts: number;
  avgSpeed: number;
  maxRiskScore: number;
}

export interface HistoryEntry {
  timestamp: number;
  riskScore: number;
  speed: number;
}

const MAX_HISTORY = 120; // Keep last 120 data points

export function updateHistory(
  history: HistoryEntry[],
  riskScore: number,
  speed: number
): HistoryEntry[] {
  const updated = [
    ...history,
    { timestamp: Date.now(), riskScore, speed },
  ];

  if (updated.length > MAX_HISTORY) {
    return updated.slice(updated.length - MAX_HISTORY);
  }
  return updated;
}

export function calculateDriverProfile(
  history: HistoryEntry[],
  totalAlerts: number
): DriverProfile {
  if (history.length === 0) {
    return {
      overallScore: 100,
      safePercentage: 100,
      riskyPercentage: 0,
      trend: 'stable',
      totalAlerts: 0,
      avgSpeed: 0,
      maxRiskScore: 0,
    };
  }

  // Calculate weighted average (recent data weighs more)
  let weightedSum = 0;
  let weightTotal = 0;
  let safeCount = 0;
  let riskyCount = 0;
  let speedSum = 0;
  let maxRisk = 0;

  history.forEach((entry, index) => {
    const weight = 1 + (index / history.length) * 2; // 1x to 3x weight
    weightedSum += entry.riskScore * weight;
    weightTotal += weight;
    speedSum += entry.speed;
    maxRisk = Math.max(maxRisk, entry.riskScore);

    if (entry.riskScore < 40) {
      safeCount++;
    } else {
      riskyCount++;
    }
  });

  const avgRisk = weightedSum / weightTotal;
  const overallScore = Math.round(Math.max(0, Math.min(100, 100 - avgRisk)));
  const total = safeCount + riskyCount;
  const safePercentage = Math.round((safeCount / total) * 100);
  const riskyPercentage = 100 - safePercentage;

  // Calculate trend from last 20 vs previous 20 entries
  let trend: 'improving' | 'stable' | 'deteriorating' = 'stable';
  if (history.length >= 20) {
    const recentSlice = history.slice(-10);
    const olderSlice = history.slice(-20, -10);
    const recentAvg = recentSlice.reduce((s, e) => s + e.riskScore, 0) / recentSlice.length;
    const olderAvg = olderSlice.reduce((s, e) => s + e.riskScore, 0) / olderSlice.length;
    const diff = recentAvg - olderAvg;

    if (diff < -5) trend = 'improving';
    else if (diff > 5) trend = 'deteriorating';
  }

  return {
    overallScore,
    safePercentage,
    riskyPercentage,
    trend,
    totalAlerts,
    avgSpeed: Math.round(speedSum / history.length),
    maxRiskScore: Math.round(maxRisk),
  };
}

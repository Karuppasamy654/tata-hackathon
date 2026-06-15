'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ParticleBackground from '@/components/ParticleBackground';

interface LeaderboardUser {
  id: number;
  name: string;
  safety_score: number;
  driving_sessions: number;
}

function getBadges(score: number, sessions: number) {
  const badges: { icon: string; label: string; color: string }[] = [];
  if (score >= 99)  badges.push({ icon: '⚡', label: 'Zero Alerts',   color: '#00d4ff' });
  if (score >= 85)  badges.push({ icon: '🏅', label: 'Safe Driver',   color: '#00ff88' });
  if (sessions > 30) badges.push({ icon: '🔥', label: 'Streak Master', color: '#ff8800' });
  return badges;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? '#00ff88' : score >= 50 ? '#ffd600' : '#ff3366';
  return (
    <div className="lb-score-bar-track">
      <motion.div
        className="lb-score-bar-fill"
        initial={{ width: 0 }}
        animate={{ width: `${score}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}88` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

const RANK_STYLES = [
  'bg-gradient-to-r from-yellow-500/15 to-yellow-600/8 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.15)]',
  'bg-gradient-to-r from-slate-300/12 to-slate-400/6 border-slate-400/35',
  'bg-gradient-to-r from-amber-600/12 to-amber-700/6 border-amber-600/35',
];

function getRankIcon(i: number) {
  if (i === 0) return <Trophy className="text-yellow-400" size={24} />;
  if (i === 1) return <Medal  className="text-slate-300"  size={24} />;
  if (i === 2) return <Award  className="text-amber-600"  size={24} />;
  return <span className="text-slate-500 font-bold font-mono w-6 text-center text-sm">{i + 1}</span>;
}

export default function LeaderboardPage() {
  const [users, setUsers]     = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/leaderboard`);
        if (res.ok) setUsers(await res.json());
      } catch (e) {
        console.error('Failed to fetch leaderboard', e);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#060810] text-white p-8 relative overflow-hidden">
      <ParticleBackground />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,212,255,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <button
          onClick={() => router.push('/')}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors text-sm"
        >
          <ArrowLeft size={18} /> Back to Hub
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <h1
            className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 mb-3"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            GLOBAL LEADERBOARD
          </h1>
          <p className="text-slate-400 tracking-widest uppercase text-xs">Top Ranked Pilots by Safety Score</p>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-5 text-xs">
            {[
              { icon: '⚡', label: 'Zero Alerts (100)', color: '#00d4ff' },
              { icon: '🏅', label: 'Safe Driver (≥85)',  color: '#00ff88' },
              { icon: '🔥', label: 'Streak Master (30+ sessions)', color: '#ff8800' },
            ].map(b => (
              <span key={b.label} className="flex items-center gap-1.5 text-slate-400">
                {b.icon} <span style={{ color: b.color }}>{b.label}</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center p-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user, i) => {
              const badges = getBadges(user.safety_score, user.driving_sessions);
              const rowStyle = i < 3 ? RANK_STYLES[i] : 'bg-[#0a0e1a]/70 border-slate-800/80 hover:border-cyan-500/20';
              const scoreColor = user.safety_score >= 80 ? '#00ff88' : user.safety_score >= 50 ? '#ffd600' : '#ff3366';

              return (
                <motion.div
                  key={user.id}
                  className={`lb-row ${rowStyle}`}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.45, type: 'spring', stiffness: 200 }}
                >
                  {/* Rank icon */}
                  <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
                    {getRankIcon(i)}
                  </div>

                  {/* Name + sessions + badges + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h3 className="font-bold text-white text-base leading-none">{user.name}</h3>
                      {badges.map(b => (
                        <span
                          key={b.label}
                          className="lb-badge"
                          style={{ color: b.color, borderColor: `${b.color}44`, background: `${b.color}12` }}
                        >
                          {b.icon} {b.label}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{user.driving_sessions} sessions logged</p>
                    <ScoreBar score={user.safety_score} />
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div
                      className="text-2xl font-black leading-none"
                      style={{ fontFamily: 'Orbitron, sans-serif', color: scoreColor, textShadow: `0 0 12px ${scoreColor}66` }}
                    >
                      {user.safety_score.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Score</div>
                  </div>
                </motion.div>
              );
            })}

            {users.length === 0 && (
              <div className="text-center p-16 text-slate-500 border border-slate-800 rounded-xl bg-[#0a0e1a]">
                No pilots registered yet. Be the first!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

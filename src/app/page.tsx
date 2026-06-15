'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ParticleBackground from '@/components/ParticleBackground';
import { ShieldAlert, Zap, Activity, Brain, Eye, AlertOctagon, ChevronRight, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: <Brain size={28} />,
    color: '#00d4ff',
    title: 'AI Risk Scoring',
    desc: 'Random Forest ML models compute a real-time 0–100 risk score from 6 telemetry channels every 600ms.',
  },
  {
    icon: <Eye size={28} />,
    color: '#a855f7',
    title: 'Driver Emotion AI',
    desc: 'Detects Focused, Distracted, Drowsy, or Aggressive states from telemetry pattern analysis.',
  },
  {
    icon: <AlertOctagon size={28} />,
    color: '#ff3366',
    title: 'Near-Miss Detection',
    desc: 'Identifies 6 critical event types including tailgating, emergency braking, and loss of control.',
  },
];

const STEPS = [
  { num: '01', title: 'Collect Telemetry', desc: 'Speed, braking, distance, steering, acceleration — streamed in real-time.' },
  { num: '02', title: 'ML Risk Analysis', desc: 'Two Random Forest models compute risk score and classify: SAFE / WARNING / DANGER.' },
  { num: '03', title: 'Smart Intervention', desc: 'Alerts, driver emotion warnings, and autonomous emergency response when critical.' },
];

const STATS = [
  { value: '< 600ms', label: 'Prediction Latency' },
  { value: '94%',     label: 'Model Accuracy' },
  { value: '6',       label: 'Alert Types' },
  { value: '10k',     label: 'Training Samples' },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-[#060810] text-white overflow-x-hidden">
      <ParticleBackground />

      {/* Radial glow overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(0,212,255,0.12)_0%,transparent_65%)] pointer-events-none" />

      {/* ───────── HERO ───────── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-6 flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-cyan-500/15 flex items-center justify-center border border-cyan-500/40 shadow-[0_0_24px_rgba(0,212,255,0.4)]">
            <ShieldAlert className="text-cyan-400" size={30} />
          </div>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl font-black mb-6 tracking-tight"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400">
            AI That Prevents
          </span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-400 to-orange-400">
            Accidents Before
          </span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-blue-500">
            They Happen.
          </span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          Real-time ML risk scoring, driver emotion detection, near-miss prediction,
          and autonomous emergency intervention — all in one intelligent system.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <button
            onClick={() => router.push('/auth')}
            className="group relative px-9 py-4 overflow-hidden rounded-xl font-bold text-lg tracking-wider flex items-center gap-3"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
            <span className="relative flex items-center gap-2">
              <Zap size={20} />
              START DRIVING
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          <button
            onClick={() => router.push('/leaderboard')}
            className="px-9 py-4 rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/8 transition-all font-bold text-lg tracking-wider flex items-center gap-2"
          >
            <Activity size={20} />
            LEADERBOARD
          </button>
        </motion.div>
      </section>

      {/* ───────── STATS TICKER ───────── */}
      <section className="relative z-10 py-10 border-y border-slate-800/60 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              className="text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
            >
              <div
                className="text-3xl font-black mb-1"
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {s.value}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-widest">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── FEATURES ───────── */}
      <section className="relative z-10 py-24 px-4 max-w-6xl mx-auto">
        <motion.h2
          className="text-center text-3xl font-bold mb-16 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          CORE CAPABILITIES
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="feature-card"
              style={{ borderColor: `${f.color}22` }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              whileHover={{ scale: 1.03, borderColor: `${f.color}55` }}
            >
              <div
                className="feature-card-icon"
                style={{
                  background: `${f.color}18`,
                  border: `1px solid ${f.color}33`,
                  color: f.color,
                  boxShadow: `0 0 16px ${f.color}22`,
                }}
              >
                {f.icon}
              </div>
              <h3 className="feature-card-title" style={{ color: f.color }}>
                {f.title}
              </h3>
              <p className="feature-card-desc">{f.desc}</p>
              <div className="feature-card-arrow" style={{ color: f.color }}>
                Learn more <ChevronRight size={14} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section className="relative z-10 py-20 px-4 max-w-4xl mx-auto">
        <motion.h2
          className="text-center text-3xl font-bold mb-16 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          HOW IT WORKS
        </motion.h2>

        <div className="flex flex-col gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className="how-it-works-step"
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className="how-it-works-num">{step.num}</div>
              <div>
                <h3 className="how-it-works-title">{step.title}</h3>
                <p className="how-it-works-desc">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── FOOTER CTA ───────── */}
      <section className="relative z-10 py-20 text-center px-4">
        <motion.div
          className="inline-block mb-6 text-slate-600 text-sm tracking-widest uppercase"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Powered by Next.js · FastAPI · Random Forest ML
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <button
            onClick={() => router.push('/auth')}
            className="group relative px-12 py-5 overflow-hidden rounded-2xl font-black text-xl tracking-wider"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-60 blur-xl transition-all duration-500" />
            <span className="relative flex items-center gap-3 justify-center">
              <Zap size={22} />
              START SIMULATION
            </span>
          </button>
        </motion.div>
      </section>
    </div>
  );
}

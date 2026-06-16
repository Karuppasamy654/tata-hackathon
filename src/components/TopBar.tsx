'use client';

import { motion } from 'framer-motion';
import {
  Play, Pause, RotateCcw, FileDown, Film,
  Sun, Moon, Volume2, VolumeX, LogOut, User as UserIcon, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';

interface TopBarProps {
  isRunning: boolean;
  isDark: boolean;
  isMuted: boolean;
  isEmergency?: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onReplay: () => void;
  onExport: () => void;
  onToggleTheme: () => void;
  onToggleMute: () => void;
  mode: 'auto' | 'interactive';
  onToggleMode: () => void;
}

export default function TopBar({
  isRunning, isDark, isMuted, isEmergency = false, mode,
  onStart, onStop, onReset, onReplay, onExport,
  onToggleTheme, onToggleMute, onToggleMode,
}: TopBarProps) {
  const { user, logout } = useAuth();

  return (
    <motion.header
      className="top-bar"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* LEFT — logo */}
      <div className="top-bar-left">
        <div className="logo-group">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="12" stroke="url(#logoGrad)" strokeWidth="2" />
              <circle cx="14" cy="14" r="6"  stroke="url(#logoGrad)" strokeWidth="1.5" opacity="0.6" />
              <circle cx="14" cy="14" r="2"  fill="#00d4ff" />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="#00d4ff" />
                  <stop offset="1" stopColor="#00ff88" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="logo-text">
            <h1 className="logo-title">Near-Miss Predictor</h1>
            <span className="logo-subtitle">AI-Powered Risk Analytics</span>
          </div>
        </div>
      </div>

      {/* CENTER — controls + emergency badge */}
      <div className="top-bar-center">
        {/* Emergency indicator */}
        {isEmergency && (
          <motion.div
            className="emergency-topbar-badge"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.45, repeat: Infinity }}
          >
            <AlertTriangle size={14} />
            EMERGENCY
          </motion.div>
        )}

        <div className="control-group">
          <motion.button
            className={`ctrl-btn ${isRunning ? 'ctrl-btn--active' : 'ctrl-btn--start'}`}
            onClick={isRunning ? onStop : onStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
            <span>{isRunning ? 'Pause' : 'Start'}</span>
          </motion.button>

          <motion.button
            className="ctrl-btn"
            onClick={onReset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </motion.button>

          <motion.button
            className={`ctrl-btn ${mode === 'interactive' ? 'ctrl-btn--accent' : ''}`}
            onClick={onToggleMode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Toggle Interactive Game Mode"
            style={{ padding: '0 16px' }}
          >
            <span>{mode === 'interactive' ? '🎮 Game Mode' : '🤖 Auto Mode'}</span>
          </motion.button>

          <motion.button
            className="ctrl-btn ctrl-btn--accent"
            onClick={onReplay}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="View last near-miss incident replay"
          >
            <Film size={16} />
            <span>Replay</span>
          </motion.button>

          <motion.button
            className="ctrl-btn"
            onClick={onExport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileDown size={16} />
            <span>Export</span>
          </motion.button>
        </div>
      </div>

      {/* RIGHT — user + icon buttons + status */}
      <div className="top-bar-right flex items-center gap-4">
        {user && (
          <div className="hidden md:flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
            <UserIcon size={14} className="text-cyan-400" />
            <span className="text-sm text-slate-300 font-medium">{user.name}</span>
          </div>
        )}

        <motion.button
          className="icon-btn"
          onClick={onToggleMute}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </motion.button>

        <motion.button
          className="icon-btn"
          onClick={onToggleTheme}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          <motion.div animate={{ rotate: isDark ? 0 : 180 }} transition={{ duration: 0.4 }}>
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
          </motion.div>
        </motion.button>

        <motion.button
          className="icon-btn hover:text-red-400 hover:bg-red-400/10"
          onClick={logout}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Logout"
        >
          <LogOut size={18} />
        </motion.button>

        <div className="status-indicator ml-2">
          <motion.span
            className="status-dot"
            animate={{
              backgroundColor: isEmergency ? '#ff3366' : isRunning ? '#00ff88' : '#64748b',
              boxShadow: isEmergency
                ? ['0 0 8px #ff3366', '0 0 16px #ff3366', '0 0 8px #ff3366']
                : isRunning ? '0 0 8px #00ff88' : 'none',
            }}
            transition={{ duration: 0.5, repeat: isEmergency ? Infinity : 0 }}
          />
          <span className="status-text">
            {isEmergency ? 'EMERGENCY' : isRunning ? 'LIVE' : 'IDLE'}
          </span>
        </div>
      </div>
    </motion.header>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSimulation } from '@/hooks/useSimulation';
import { useSoundAlert } from '@/hooks/useSoundAlert';
import { exportReport } from '@/lib/exportReport';
import { useAuth } from '@/lib/authContext';
import ParticleBackground from '@/components/ParticleBackground';
import TopBar from '@/components/TopBar';
import DrivingMetrics from '@/components/DrivingMetrics';
import RiskMeter from '@/components/RiskMeter';
import AlertPanel from '@/components/AlertPanel';
import BehaviorGraph from '@/components/BehaviorGraph';
import DriverScore from '@/components/DriverScore';
import DriverEmotionPanel from '@/components/DriverEmotionPanel';
import AccidentProbability from '@/components/AccidentProbability';
import EmergencyOverlay from '@/components/EmergencyOverlay';
import NearMissReplay from '@/components/NearMissReplay';
import AIExplanationPanel from '@/components/AIExplanationPanel';

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const {
    isRunning, currentData, riskResult, alerts, history, driverProfile,
    emotionState, accidentProbability, isEmergency, replayEvents, showReplay,
    start, stop, reset, replayScenario, clearAlerts,
    dismissEmergency, openReplay, closeReplay,
  } = useSimulation();

  const { playAlert } = useSoundAlert();
  const [isDark, setIsDark]       = useState(true);
  const [isMuted, setIsMuted]     = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const prevAlertCountRef         = useRef(0);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      // Hide welcome banner 4 seconds after user is loaded
      const timer = setTimeout(() => setShowWelcome(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    if (!isMuted && alerts.length > prevAlertCountRef.current) {
      const newest = alerts[0];
      if (newest) playAlert(newest.severity);
    }
    prevAlertCountRef.current = alerts.length;
  }, [alerts, isMuted, playAlert]);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('light', !next);
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  const handleExport = async () => {
    await exportReport(driverProfile, history);
  };

  // When emergency is dismissed, also show the replay
  const handleEmergencyDismiss = () => {
    dismissEmergency();
    if (replayEvents.length > 0) openReplay();
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#060810] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <>
      <ParticleBackground />

      {/* Global overlays */}
      <EmergencyOverlay isVisible={isEmergency} onDismiss={handleEmergencyDismiss} />
      <NearMissReplay isOpen={showReplay} events={replayEvents} onClose={closeReplay} />

      {/* Welcome Banner */}
      <AnimatePresence>
        {showWelcome && user && (
          <motion.div
            key="welcome-banner"
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: '90px',
              left: '50%',
              background: 'rgba(0, 212, 255, 0.12)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              backdropFilter: 'blur(12px)',
              padding: '12px 28px',
              borderRadius: '30px',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 500,
              zIndex: 100,
              boxShadow: '0 4px 30px rgba(0, 212, 255, 0.2), inset 0 0 20px rgba(0, 212, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>👋</span>
            Welcome back, <span style={{ color: '#00d4ff', fontWeight: 700, textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>{user.name}</span>!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="dashboard">
        <TopBar
          isRunning={isRunning}
          isDark={isDark}
          isMuted={isMuted}
          isEmergency={isEmergency}
          onStart={start}
          onStop={stop}
          onReset={reset}
          onReplay={replayEvents.length > 0 ? openReplay : replayScenario}
          onExport={handleExport}
          onToggleTheme={toggleTheme}
          onToggleMute={() => setIsMuted(m => !m)}
        />

        <div className="dashboard-grid">
          {/* ── LEFT COLUMN: Telemetry + Emotion ── */}
          <div className="dash-col">
            <motion.div
              className="glass-card"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <DrivingMetrics data={currentData} />
            </motion.div>

            <motion.div
              className="glass-card"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <DriverEmotionPanel emotionState={emotionState} />
            </motion.div>
          </div>

          {/* ── CENTER COLUMN: Risk Meter + Accident Prob + AI ── */}
          <div className="dash-col">
            <motion.div
              className="glass-card center-risk-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <RiskMeter
                score={riskResult.score}
                level={riskResult.level}
                color={riskResult.color}
                factors={riskResult.factors}
              />
            </motion.div>

            <motion.div
              className="glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <AccidentProbability probability={accidentProbability} />
            </motion.div>

            <motion.div
              className="glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <AIExplanationPanel
                riskResult={riskResult}
                accidentProbability={accidentProbability}
              />
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Alerts (full height) ── */}
          <motion.div
            className="glass-card dash-right-col"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <AlertPanel alerts={alerts} onClear={clearAlerts} />
          </motion.div>

          {/* ── BOTTOM ROW ── */}
          <motion.div
            className="glass-card"
            style={{ gridColumn: 'span 2' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <BehaviorGraph history={history} />
          </motion.div>

          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <DriverScore profile={driverProfile} />
          </motion.div>
        </div>
      </div>
    </>
  );
}

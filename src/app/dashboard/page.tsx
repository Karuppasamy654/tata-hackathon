'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSimulation } from '@/hooks/useSimulation';
import { useAuth } from '@/lib/authContext';
import { exportReport } from '@/lib/exportReport';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

import ParticleBackground from '@/components/ParticleBackground';
import TopBar from '@/components/TopBar';
import DrivingMetrics from '@/components/DrivingMetrics';
import RiskMeter from '@/components/RiskMeter';
import AlertPanel from '@/components/AlertPanel';
import BehaviorGraph from '@/components/BehaviorGraph';
import DriverScore from '@/components/DriverScore';
import EmergencyOverlay from '@/components/EmergencyOverlay';

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Face Detection (Driver State)
  const videoRef = useRef<HTMLVideoElement>(null);
  const { faceState } = useFaceDetection(videoRef);

  // Simulation & Telemetry
  const {
    isRunning, currentData, riskResult, alerts, history, driverProfile, isEmergency,
    start, stop, reset, clearAlerts, dismissEmergency
  } = useSimulation(faceState);

  // Voice Assistant
  const { speak } = useVoiceAssistant();

  const [isDark, setIsDark] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Connect Webcam
  useEffect(() => {
    async function startVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    }
    startVideo();
  }, []);

  // Speak alerts
  useEffect(() => {
    if (!isMuted && riskResult.voiceMessage) {
      speak(riskResult.voiceMessage, riskResult.level as import('@/hooks/useVoiceAssistant').AlertPriority);
    }
  }, [riskResult.voiceMessage, riskResult.level, isMuted, speak]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => setShowWelcome(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [user]);

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

  // Determine top banner color based on Face State
  const stateColors = {
    FOCUSED: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    DISTRACTED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    SLEEPY: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    FATIGUED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    CALIBRATING: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <>
      <ParticleBackground />
      <EmergencyOverlay isVisible={isEmergency} onDismiss={dismissEmergency} />

      <AnimatePresence>
        {showWelcome && user && (
          <motion.div
            key="welcome-banner"
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-50 flex items-center gap-2 px-6 py-3 bg-cyan-900/40 border border-cyan-500/30 rounded-full backdrop-blur-md text-white font-medium shadow-lg"
          >
            <span className="text-xl">👋</span>
            Welcome back, <span className="text-cyan-400 font-bold">{user.name}</span>!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="dashboard flex flex-col h-screen overflow-hidden">
        <TopBar
          isRunning={isRunning}
          isDark={isDark}
          isMuted={isMuted}
          isEmergency={isEmergency}
          mode="auto"
          onToggleMode={() => {}}
          onStart={start}
          onStop={stop}
          onReset={reset}
          onReplay={() => {}}
          onExport={handleExport}
          onToggleTheme={toggleTheme}
          onToggleMute={() => setIsMuted(m => !m)}
        />

        {/* Global State Banner */}
        <div className="w-full flex justify-center py-2 z-10">
          <div className={`px-6 py-2 rounded-full border backdrop-blur-sm font-mono text-sm tracking-widest font-semibold flex items-center gap-3 ${stateColors[faceState]}`}>
            <div className={`w-2 h-2 rounded-full animate-pulse bg-current`} />
            DRIVER STATE: {faceState}
          </div>
        </div>

        <div className="dashboard-grid overflow-y-auto px-6 pb-6 gap-6" style={{ gridTemplateColumns: '300px 1fr 350px' }}>
          
          {/* ── LEFT COLUMN: Webcam & Telemetry ── */}
          <div className="flex flex-col gap-6">
            <motion.div
              className="glass-card overflow-hidden flex flex-col p-0"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="p-4 border-b border-white/5 bg-white/5">
                <h3 className="text-sm font-semibold text-white/80">AI CO-PILOT VISION</h3>
              </div>
              <div className="relative w-full aspect-video bg-black">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                {/* Overlay Scanning Effect */}
                <div className="absolute inset-0 pointer-events-none border-2 border-cyan-500/20">
                  <div className="w-full h-1 bg-cyan-500/50 absolute top-0 animate-scan" style={{ boxShadow: '0 0 10px #00d4ff' }} />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="glass-card"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <DrivingMetrics data={currentData} />
            </motion.div>
          </div>

          {/* ── CENTER COLUMN: Risk Meter & Graph ── */}
          <div className="flex flex-col gap-6">
            <motion.div
              className="glass-card center-risk-card flex-1 flex flex-col justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <RiskMeter
                score={riskResult.score}
                level={riskResult.level as import('@/hooks/useVoiceAssistant').AlertPriority | 'NONE'}
                color={riskResult.color}
                factors={riskResult.factors}
              />
            </motion.div>

            <motion.div
              className="glass-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <BehaviorGraph history={history} />
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Explanations & Alerts ── */}
          <div className="flex flex-col gap-6">
            <motion.div
              className="glass-card bg-slate-900/80 backdrop-blur-md border border-white/10"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
               <div className="flex items-center gap-2 mb-4">
                  <span className="text-cyan-400">🧠</span>
                  <h3 className="font-semibold text-white">AI Analysis</h3>
               </div>
               <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                 <p className="text-lg text-white/90 leading-relaxed font-light">
                   {riskResult.explanation || "Monitoring systems nominal."}
                 </p>
               </div>
               {riskResult.voiceMessage && (
                 <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                   <p className="text-sm text-cyan-300 font-mono italic">&quot;{riskResult.voiceMessage}&quot;</p>
                 </div>
               )}
            </motion.div>

            <motion.div
              className="glass-card dash-right-col flex-1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <AlertPanel alerts={alerts} onClear={clearAlerts} />
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
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 1; }
          50% { top: 100%; opacity: 0.2; }
          100% { top: 0%; opacity: 1; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}} />
    </>
  );
}

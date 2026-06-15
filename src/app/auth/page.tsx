'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { ShieldAlert, Mail, Lock, User as UserIcon } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';

export default function AuthPage() {
  const [isLogin, setIsLogin]   = useState(true);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = isLogin ? 'http://localhost:8000/auth/login' : 'http://localhost:8000/auth/register';
      const body = isLogin ? { email, password } : { name, email, password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        login(data.access_token);
        setTimeout(() => router.push('/dashboard'), 500);
      } else {
        setError(data.detail || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060810] flex overflow-hidden relative">
      <ParticleBackground />

      {/* Left side - Visuals */}
      <motion.div 
        className="hidden lg:flex w-1/2 relative items-center justify-center border-r border-slate-800"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.1)_0%,rgba(0,0,0,0)_60%)]" />
        
        {/* Animated shield cluster */}
        <div className="z-10 flex flex-col items-center text-center p-12">
          <motion.div
            animate={{ rotateY: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 rounded-full bg-cyan-500/10 flex items-center justify-center border-2 border-cyan-500/50 shadow-[0_0_40px_rgba(0,212,255,0.4)] mb-8"
          >
            <ShieldAlert className="text-cyan-400" size={48} />
          </motion.div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            System Access
          </h1>
          <p className="text-slate-400 max-w-md text-lg leading-relaxed">
            Authenticate to access the real-time AI driving analytics and telemetry dashboard.
          </p>

          {/* Floating stats cards */}
          <div className="mt-16 grid grid-cols-2 gap-4 w-full max-w-sm">
            <motion.div className="glass-card text-left p-4" animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
              <div className="text-cyan-400 font-bold mb-1">Encrypted</div>
              <div className="text-slate-400 text-xs">End-to-end secure</div>
            </motion.div>
            <motion.div className="glass-card text-left p-4" animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity }}>
              <div className="text-cyan-400 font-bold mb-1">Zero Trust</div>
              <div className="text-slate-400 text-xs">Continuous verification</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div 
          className="w-full max-w-md"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <div className="glass-card p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
            
            <h2 className="text-3xl font-black text-white mb-8 text-center tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {isLogin ? 'INITIALIZE LINK' : 'REGISTER PROFILE'}
            </h2>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-6 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="relative overflow-hidden"
                  >
                    <UserIcon className="absolute left-4 top-3.5 text-cyan-500" size={18} />
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                      required={!isLogin}
                      placeholder=" "
                      className="auth-input peer"
                    />
                    <label htmlFor="name" className="auth-label">Pilot Name</label>
                    {focusedInput === 'name' && <div className="auth-input-glow" />}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-cyan-500" size={18} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  placeholder=" "
                  className="auth-input peer"
                />
                <label htmlFor="email" className="auth-label">Email Address</label>
                {focusedInput === 'email' && <div className="auth-input-glow" />}
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-cyan-500" size={18} />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  placeholder=" "
                  className="auth-input peer"
                />
                <label htmlFor="password" className="auth-label">Password</label>
                {focusedInput === 'password' && <div className="auth-input-glow" />}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-4 mt-6 rounded-xl font-black tracking-widest text-lg overflow-hidden flex items-center justify-center"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 blur-md transition-all duration-300" />
                <span className="relative text-white drop-shadow-md">
                  {loading ? (
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto"
                    />
                  ) : (
                    isLogin ? 'ACCESS SYSTEM' : 'CREATE PROFILE'
                  )}
                </span>
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-400">
              {isLogin ? "Don't have a profile?" : "Already registered?"}{' '}
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
              >
                {isLogin ? 'Register now' : 'Login here'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

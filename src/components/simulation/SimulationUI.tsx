import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface SimulationUIProps {
  speed: number;
  score: number;
  distance: number;
}

export default function SimulationUI({ speed, score, distance }: SimulationUIProps) {
  const router = useRouter();

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Controls Help */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 px-6 py-3 rounded-full backdrop-blur border border-slate-700/50 flex gap-4 text-sm font-mono text-cyan-400">
        <span>[W/↑] Accelerate</span>
        <span>[S/↓] Brake</span>
        <span>[A/D/←/→] Steer</span>
      </div>

      {/* Speedometer */}
      <div className="absolute bottom-8 right-8 text-right bg-slate-900/60 p-6 rounded-2xl backdrop-blur-md border border-slate-700/50">
        <div className="text-5xl font-black text-white tracking-tighter" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {speed}
        </div>
        <div className="text-cyan-500 font-bold tracking-widest text-sm mt-1">KM/H</div>
      </div>

      {/* Top Left Stats */}
      <div className="absolute top-6 left-6 bg-slate-900/60 p-4 rounded-xl backdrop-blur-md border border-slate-700/50 flex flex-col gap-2 min-w-[200px]">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-xs font-bold tracking-wider">SCORE</span>
          <span className="text-emerald-400 font-mono text-lg">{score}</span>
        </div>
        <div className="h-px bg-slate-700/50 w-full" />
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-xs font-bold tracking-wider">DISTANCE</span>
          <span className="text-cyan-400 font-mono text-lg">{distance}m</span>
        </div>
      </div>

      {/* Exit Button */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto">
        <motion.button
          onClick={() => router.push('/dashboard')}
          className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-100 px-6 py-2 rounded-full font-bold tracking-wide transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Exit Simulation
        </motion.button>
      </div>
    </div>
  );
}

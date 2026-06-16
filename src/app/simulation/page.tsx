'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSimulation } from '@/hooks/useSimulation';
import { useAuth } from '@/lib/authContext';

import { DrivingData } from '@/lib/simulation';

// Lazy load the 3D simulation to avoid SSR issues and heavy initial bundles
const SimulationCore = dynamic<{ updateInteractiveData: (data: DrivingData) => void }>(
  () => import('@/components/simulation/SimulationCore'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-cyan-400 font-mono">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
        Loading 3D Environment...
      </div>
    ),
  }
);

export default function SimulationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { updateInteractiveData } = useSimulation();

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-cyan-400">
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative select-none">
      <SimulationCore updateInteractiveData={updateInteractiveData} />
    </div>
  );
}

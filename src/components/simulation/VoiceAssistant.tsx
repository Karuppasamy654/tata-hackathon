'use client';

import { useEffect, useState } from 'react';

export default function VoiceAssistant() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Placeholder logic for voice assistant initialization
    setIsActive(true);
  }, []);

  return (
    <div className="absolute top-4 right-4 z-50 bg-black/50 p-2 rounded-full border border-blue-500/50 backdrop-blur-sm flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`} />
      <span className="text-white text-xs font-mono">Voice Assistant</span>
    </div>
  );
}

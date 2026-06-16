'use client';

import { useCallback, useRef } from 'react';

export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export function useVoiceAssistant() {
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' ? window.speechSynthesis : null
  );
  
  const speak = useCallback((message: string, priority: AlertPriority) => {
    if (!synthRef.current) return;

    // Optional: Only speak if not already speaking or if it's a critical alert
    if (synthRef.current.speaking && priority !== 'CRITICAL') {
      return;
    }

    if (priority === 'CRITICAL') {
      synthRef.current.cancel(); // Interrupt current speech for critical alerts
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1.0;
    utterance.pitch = priority === 'CRITICAL' || priority === 'HIGH' ? 1.2 : 1.0;
    utterance.volume = priority === 'CRITICAL' ? 1.0 : 0.8;
    
    // Attempt to use a clear English voice if available
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en-') && v.name.includes('Google')) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    synthRef.current.speak(utterance);
  }, []);

  return { speak };
}

import { useEffect, useRef, useState } from 'react';

export default function WebcamOverlay() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Camera access denied or unavailable.');
      }
    }
    setupCamera();

    return () => {
      // Cleanup stream when unmounting
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="absolute top-6 right-6 w-48 h-36 bg-slate-900 border-2 border-cyan-500 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(0,212,255,0.3)] z-50">
      {error ? (
        <div className="w-full h-full flex items-center justify-center text-xs text-red-400 p-4 text-center">
          {error}
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
      )}
      <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-cyan-400 font-mono tracking-wider">
        ● LIVE FEED
      </div>
    </div>
  );
}

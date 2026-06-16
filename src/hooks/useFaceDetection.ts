'use client';

import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export type FaceState = 'FOCUSED' | 'DISTRACTED' | 'SLEEPY' | 'FATIGUED' | 'CALIBRATING';

function getDistance(p1: faceapi.Point, p2: faceapi.Point) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function calculateEAR(eye: faceapi.Point[]) {
  // Eye points: 0=left, 1=top-left, 2=top-right, 3=right, 4=bottom-right, 5=bottom-left
  const vertical1 = getDistance(eye[1], eye[5]);
  const vertical2 = getDistance(eye[2], eye[4]);
  const horizontal = getDistance(eye[0], eye[3]);
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

export function useFaceDetection(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [faceState, setFaceState] = useState<FaceState>('CALIBRATING');
  const [modelError, setModelError] = useState<string | null>(null);
  const isLoaded = useRef(false);
  const frameId = useRef<number>(0);
  const consecutiveSleepyFrames = useRef(0);
  const consecutiveDistractedFrames = useRef(0);

  useEffect(() => {
    let active = true;

    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        console.log('Face API Models loaded successfully!');
        if (active) isLoaded.current = true;
      } catch (err: any) {
        console.error('Error loading face-api models:', err);
        if (active) {
          setModelError(err.message || String(err));
          setFaceState('CALIBRATING');
        }
      }
    }

    loadModels();

    return () => {
      active = false;
      if (frameId.current) cancelAnimationFrame(frameId.current);
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    let lastRun = 0;
    const DETECTION_INTERVAL = 500; // run every 500ms to save CPU

    const detect = async () => {
      if (!isLoaded.current || !video || video.paused || video.ended || video.readyState < 2) {
        frameId.current = requestAnimationFrame(detect);
        return;
      }

      const now = performance.now();
      if (now - lastRun >= DETECTION_INTERVAL) {
        lastRun = now;

        try {
          const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
            .withFaceLandmarks()
            .withFaceExpressions();

          if (detection) {
            const landmarks = detection.landmarks;
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();
            const nose = landmarks.getNose();
            const jawOutline = landmarks.getJawOutline();

            // 1. Calculate EAR for sleepiness
            const leftEAR = calculateEAR(leftEye);
            const rightEAR = calculateEAR(rightEye);
            const avgEAR = (leftEAR + rightEAR) / 2;

            // 2. Calculate Head Pose for distraction (left/right turning)
            const leftJaw = jawOutline[0];
            const rightJaw = jawOutline[16];
            const noseTip = nose[3]; // Bottom of the nose

            const distLeft = getDistance(leftJaw, noseTip);
            const distRight = getDistance(rightJaw, noseTip);
            const poseRatio = distLeft / (distRight + 0.001);

            // 3. Expressions for fatigue
            const expressions = detection.expressions;
            const isFatigued = expressions.sad > 0.5 || expressions.angry > 0.5;

            // Evaluate state
            if (avgEAR < 0.22) {
              consecutiveSleepyFrames.current++;
            } else {
              consecutiveSleepyFrames.current = 0;
            }

            if (poseRatio < 0.4 || poseRatio > 2.5) {
              consecutiveDistractedFrames.current++;
            } else {
              consecutiveDistractedFrames.current = 0;
            }

            // Determine final state based on priority
            if (consecutiveSleepyFrames.current > 1) {
              setFaceState('SLEEPY');
            } else if (consecutiveDistractedFrames.current > 1) {
              setFaceState('DISTRACTED');
            } else if (isFatigued) {
              setFaceState('FATIGUED');
            } else {
              setFaceState('FOCUSED');
            }
          } else {
            // No face detected
            consecutiveDistractedFrames.current++;
            if (consecutiveDistractedFrames.current > 2) {
              setFaceState('DISTRACTED');
            }
          }
        } catch (err) {
          console.warn('Face detection error:', err);
        }
      }

      frameId.current = requestAnimationFrame(detect);
    };

    video.addEventListener('play', () => {
      frameId.current = requestAnimationFrame(detect);
    });

  }, [videoRef]);

  return { faceState, modelError };
}

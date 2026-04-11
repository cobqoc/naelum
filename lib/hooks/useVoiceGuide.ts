'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

type VoiceSpeed = 'slow' | 'normal' | 'fast';

const SPEED_RATES: Record<VoiceSpeed, number> = {
  slow: 0.7,
  normal: 1.0,
  fast: 1.3,
};

export function useVoiceGuide() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speed, setSpeed] = useState<VoiceSpeed>('normal');
  const [isSupported] = useState(() =>
    typeof window !== 'undefined' && 'speechSynthesis' in window
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !isEnabled) return;

    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = SPEED_RATES[speed];
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a Korean voice
    const voices = window.speechSynthesis.getVoices();
    const koreanVoice = voices.find(v => v.lang.startsWith('ko'));
    if (koreanVoice) {
      utterance.voice = koreanVoice;
      utterance.lang = 'ko-KR';
    } else {
      utterance.lang = 'ko-KR';
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, isEnabled, speed, stop]);

  const speakStep = useCallback((stepNumber: number, instruction: string, tip?: string) => {
    let text = `${stepNumber}단계. ${instruction}`;
    if (tip) {
      text += ` 팁: ${tip}`;
    }
    speak(text);
  }, [speak]);

  const toggle = useCallback(() => {
    if (!isEnabled) {
      setIsEnabled(true);
    } else {
      stop();
      setIsEnabled(false);
    }
  }, [isEnabled, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isEnabled,
    isSpeaking,
    isSupported,
    speed,
    setSpeed,
    toggle,
    speak,
    speakStep,
    stop,
  };
}

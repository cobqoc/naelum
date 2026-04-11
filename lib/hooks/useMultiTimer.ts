'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface Timer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  stepNumber?: number;
}

export function useMultiTimer() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const playTimerSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      [0, 300, 600].forEach(delay => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start(audioCtx.currentTime + delay / 1000);
        oscillator.stop(audioCtx.currentTime + delay / 1000 + 0.15);
      });
    } catch {
      // AudioContext not supported
    }
  }, []);

  const startTimer = useCallback((minutes: number, label: string, stepNumber?: number) => {
    const id = `timer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const totalSeconds = minutes * 60;

    const newTimer: Timer = {
      id,
      label,
      totalSeconds,
      remainingSeconds: totalSeconds,
      isActive: true,
      isPaused: false,
      stepNumber,
    };

    setTimers(prev => [...prev, newTimer]);

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }

    return id;
  }, []);

  // Run timer intervals
  useEffect(() => {
    timers.forEach(timer => {
      if (timer.isActive && !timer.isPaused && !intervalsRef.current.has(timer.id)) {
        const interval = setInterval(() => {
          setTimers(prev => prev.map(t => {
            if (t.id !== timer.id) return t;
            if (t.remainingSeconds <= 1) {
              // Timer complete
              clearInterval(intervalsRef.current.get(timer.id)!);
              intervalsRef.current.delete(timer.id);
              playTimerSound();
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(`${t.label} 완료!`, { body: '타이머가 완료되었습니다.' });
              }
              return { ...t, remainingSeconds: 0, isActive: false };
            }
            return { ...t, remainingSeconds: t.remainingSeconds - 1 };
          }));
        }, 1000);
        intervalsRef.current.set(timer.id, interval);
      }
    });

    // Clean up intervals for paused/stopped timers
    intervalsRef.current.forEach((interval, id) => {
      const timer = timers.find(t => t.id === id);
      if (!timer || !timer.isActive || timer.isPaused) {
        clearInterval(interval);
        intervalsRef.current.delete(id);
      }
    });
  }, [timers, playTimerSound]);

  const pauseTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(t =>
      t.id === id ? { ...t, isPaused: true } : t
    ));
  }, []);

  const resumeTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(t =>
      t.id === id ? { ...t, isPaused: false } : t
    ));
  }, []);

  const togglePause = useCallback((id: string) => {
    setTimers(prev => prev.map(t =>
      t.id === id ? { ...t, isPaused: !t.isPaused } : t
    ));
  }, []);

  const stopTimer = useCallback((id: string) => {
    const interval = intervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      intervalsRef.current.delete(id);
    }
    setTimers(prev => prev.filter(t => t.id !== id));
  }, []);

  const removeCompleted = useCallback(() => {
    setTimers(prev => prev.filter(t => t.isActive));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const intervals = intervalsRef.current;
    return () => {
      intervals.forEach(interval => clearInterval(interval));
      intervals.clear();
    };
  }, []);

  const activeTimers = timers.filter(t => t.isActive);
  const completedTimers = timers.filter(t => !t.isActive);

  return {
    timers,
    activeTimers,
    completedTimers,
    startTimer,
    pauseTimer,
    resumeTimer,
    togglePause,
    stopTimer,
    removeCompleted,
  };
}

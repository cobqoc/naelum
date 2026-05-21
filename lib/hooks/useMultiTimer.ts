'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface TimerCheckpoint {
  /** 경과 시간(초) — 이 시점에 도달하면 알림 발화 */
  atSeconds: number;
  label: string;
  fired: boolean;
}

export interface Timer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  stepNumber?: number;
  /** 중간 체크포인트 알림 — 총 시간 도달 전 단계별 알림 (없으면 빈 배열) */
  checkpoints: TimerCheckpoint[];
  /** 방금 발화돼 아직 사용자가 안 닫은 체크포인트 라벨 (배너 표시용). 없으면 null */
  checkpointAlert: string | null;
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

  const startTimer = useCallback((
    minutes: number,
    label: string,
    stepNumber?: number,
    checkpointInput?: { atMinutes: number; label: string }[],
  ) => {
    const id = `timer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const totalSeconds = minutes * 60;

    // 체크포인트 — 경과초로 환산, 범위(0 < t < 총시간) 밖은 버리고 오름차순 정렬
    const checkpoints: TimerCheckpoint[] = (checkpointInput ?? [])
      .map(c => ({ atSeconds: Math.round(c.atMinutes * 60), label: c.label, fired: false }))
      .filter(c => c.atSeconds > 0 && c.atSeconds < totalSeconds)
      .sort((a, b) => a.atSeconds - b.atSeconds);

    const newTimer: Timer = {
      id,
      label,
      totalSeconds,
      remainingSeconds: totalSeconds,
      isActive: true,
      isPaused: false,
      stepNumber,
      checkpoints,
      checkpointAlert: null,
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
            const newRemaining = t.remainingSeconds - 1;
            // 중간 체크포인트 발화 검사 — 경과 시간이 체크포인트 시점에 도달하면 알림
            const elapsed = t.totalSeconds - newRemaining;
            const due = t.checkpoints.find(cp => !cp.fired && elapsed >= cp.atSeconds);
            if (due) {
              playTimerSound();
              return {
                ...t,
                remainingSeconds: newRemaining,
                checkpoints: t.checkpoints.map(cp => cp === due ? { ...cp, fired: true } : cp),
                checkpointAlert: due.label,
              };
            }
            return { ...t, remainingSeconds: newRemaining };
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

  // 발화된 체크포인트 알림 배너 닫기 ("확인")
  const clearCheckpointAlert = useCallback((id: string) => {
    setTimers(prev => prev.map(t =>
      t.id === id ? { ...t, checkpointAlert: null } : t
    ));
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
    clearCheckpointAlert,
  };
}

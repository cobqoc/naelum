'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';

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
  /** 종료 예정 시각(epoch ms). 일시정지·완료 시 null — 그땐 remainingSeconds 가 진실 */
  endsAt: number | null;
  /** 중간 체크포인트 알림 — 총 시간 도달 전 단계별 알림 (없으면 빈 배열) */
  checkpoints: TimerCheckpoint[];
  /** 방금 발화돼 아직 사용자가 안 닫은 체크포인트 라벨 (배너 표시용). 없으면 null */
  checkpointAlert: string | null;
}

/**
 * 타이머 상태를 wall-clock(now)으로 재계산 — 순수 함수.
 *
 * 남은 시간을 1초씩 깎지 않고 `endsAt - now`로 매번 계산한다. 그래서
 * 백그라운드에서 setInterval 이 throttle/정지되어도, 다시 틱이 돌거나
 * 탭이 보일 때 한 번에 정확한 값으로 복구된다.
 * 비활성·일시정지·endsAt 없음 → 그대로 반환.
 */
export function computeTimerState(t: Timer, now: number): {
  timer: Timer;
  justCompleted: boolean;
  justFiredCheckpoint: boolean;
} {
  if (!t.isActive || t.isPaused || t.endsAt == null) {
    return { timer: t, justCompleted: false, justFiredCheckpoint: false };
  }

  const remaining = Math.max(0, Math.round((t.endsAt - now) / 1000));

  if (remaining <= 0) {
    return {
      timer: { ...t, remainingSeconds: 0, isActive: false, endsAt: null },
      justCompleted: true,
      justFiredCheckpoint: false,
    };
  }

  // 경과가 넘어선 미발화 체크포인트 — 백그라운드 동안 여러 개를 건너뛰었을 수 있음
  const elapsed = t.totalSeconds - remaining;
  const due = t.checkpoints.filter(cp => !cp.fired && elapsed >= cp.atSeconds);
  if (due.length > 0) {
    const firedAt = new Set(due.map(d => d.atSeconds));
    return {
      timer: {
        ...t,
        remainingSeconds: remaining,
        checkpoints: t.checkpoints.map(cp => firedAt.has(cp.atSeconds) ? { ...cp, fired: true } : cp),
        // 여러 개 건너뛰었으면 가장 최근(마지막) 체크포인트를 알림
        checkpointAlert: due[due.length - 1].label,
      },
      justCompleted: false,
      justFiredCheckpoint: true,
    };
  }

  return { timer: { ...t, remainingSeconds: remaining }, justCompleted: false, justFiredCheckpoint: false };
}

/**
 * 일시정지 — 남은 시간을 wall-clock(now)으로 확정하고 endsAt 을 비운다. 순수 함수.
 * 2026-10-04 [PHR-08] togglePause 와 8줄 복붙이던 미사용 pauseTimer/resumeTimer 를 이 두 함수로 한 벌화.
 */
export function pausedTimer(t: Timer, now: number): Timer {
  const remaining = t.endsAt != null
    ? Math.max(0, Math.round((t.endsAt - now) / 1000))
    : t.remainingSeconds;
  return { ...t, isPaused: true, endsAt: null, remainingSeconds: remaining };
}

/** 재개 — 남은 시간으로 새 종료 예정 시각(epoch ms)을 잡는다. 순수 함수. */
export function resumedTimer(t: Timer, now: number): Timer {
  return { ...t, isPaused: false, endsAt: now + t.remainingSeconds * 1000 };
}

export function useMultiTimer() {
  const { t: i18n } = useI18n();
  const [timers, setTimers] = useState<Timer[]>([]);
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const playTimerSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillators = [0, 300, 600].map(delay => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start(audioCtx.currentTime + delay / 1000);
        oscillator.stop(audioCtx.currentTime + delay / 1000 + 0.15);
        return oscillator;
      });
      // 2026-10-04 [PHR-08] 마지막 비프가 끝나면 컨텍스트를 닫는다 — 알림마다 새로 만들고 닫지 않아 긴 조리 세션에서
      // 누적되던 것 해제. 소리(3회 비프)·생성 시점은 그대로(공유 컨텍스트 재사용은 iOS 자동재생 정책상 동작이 달라질 수 있어 안 함).
      oscillators[oscillators.length - 1].onended = () => {
        try {
          audioCtx.close().catch(() => {});
        } catch {
          // close 미지원(구형 webkit) — 무시
        }
      };
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
      endsAt: Date.now() + totalSeconds * 1000,
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

  // 타이머 1초 틱 — endsAt 기준 재계산(throttle 돼도 복귀 시 정확)
  useEffect(() => {
    timers.forEach(timer => {
      if (timer.isActive && !timer.isPaused && !intervalsRef.current.has(timer.id)) {
        const interval = setInterval(() => {
          setTimers(prev => prev.map(t => {
            if (t.id !== timer.id) return t;
            const { timer: next, justCompleted, justFiredCheckpoint } = computeTimerState(t, Date.now());
            if (justCompleted) {
              clearInterval(intervalsRef.current.get(timer.id)!);
              intervalsRef.current.delete(timer.id);
              playTimerSound();
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(i18n.cookMode.notifyTimerDone.replace('{label}', t.label), { body: i18n.cookMode.notifyTimerDoneBody });
              }
            } else if (justFiredCheckpoint) {
              playTimerSound();
            }
            return next;
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
  }, [timers, playTimerSound, i18n]);

  // 탭이 다시 보이면 wall-clock 으로 즉시 재계산 — 백그라운드 throttle 보정
  useEffect(() => {
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setTimers(prev => prev.map(t => {
        const { timer: next, justCompleted, justFiredCheckpoint } = computeTimerState(t, Date.now());
        if (justCompleted || justFiredCheckpoint) playTimerSound();
        return next;
      }));
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [playTimerSound]);

  const togglePause = useCallback((id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id !== id || !t.isActive) return t;
      return t.isPaused ? resumedTimer(t, Date.now()) : pausedTimer(t, Date.now());
    }));
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
    togglePause,
    stopTimer,
    removeCompleted,
    clearCheckpointAlert,
  };
}

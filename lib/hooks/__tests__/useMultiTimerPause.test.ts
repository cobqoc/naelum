import { describe, it, expect } from 'vitest';
import { pausedTimer, resumedTimer, computeTimerState, type Timer } from '@/lib/hooks/useMultiTimer';

// 2026-10-04 [PHR-08] togglePause 가 쓰는 순수 함수 — 옛 인라인 식(togglePause 본문)과 결과가 같아야 한다.

function timer(over: Partial<Timer> = {}): Timer {
  return {
    id: 't1', label: '단계 1', totalSeconds: 600, remainingSeconds: 600, isActive: true, isPaused: false,
    endsAt: null, checkpoints: [], checkpointAlert: null, ...over,
  };
}

// 옛 togglePause 본문 그대로 (now 주입)
function legacyToggle(t: Timer, now: number): Timer {
  if (t.isPaused) {
    return { ...t, isPaused: false, endsAt: now + t.remainingSeconds * 1000 };
  }
  const remaining = t.endsAt != null
    ? Math.max(0, Math.round((t.endsAt - now) / 1000))
    : t.remainingSeconds;
  return { ...t, isPaused: true, endsAt: null, remainingSeconds: remaining };
}

describe('pausedTimer / resumedTimer — 옛 togglePause 식과 동일', () => {
  const now = 1_700_000_000_000;
  const cases: Timer[] = [
    timer({ endsAt: now + 300_000 }),                 // 5분 남음
    timer({ endsAt: now + 1_499 }),                   // 반올림 경계 (1초)
    timer({ endsAt: now + 1_500 }),                   // 반올림 경계 (2초)
    timer({ endsAt: now - 5_000 }),                   // 이미 지남 → 0
    timer({ endsAt: null, remainingSeconds: 42 }),    // endsAt 없음 → remainingSeconds 유지
    timer({ isPaused: true, endsAt: null, remainingSeconds: 250 }),
    timer({ isPaused: true, endsAt: null, remainingSeconds: 0 }),
    timer({ endsAt: now + 90_000, checkpoints: [{ atSeconds: 120, label: '뒤집기', fired: true }], checkpointAlert: '뒤집기' }),
  ];

  it.each(cases.map((c, i) => [i, c] as const))('케이스 %i', (_i, t) => {
    const next = t.isPaused ? resumedTimer(t, now) : pausedTimer(t, now);
    expect(next).toEqual(legacyToggle(t, now));
  });

  it('입력 타이머를 변경하지 않음(순수)', () => {
    const t = timer({ endsAt: now + 10_000 });
    const snapshot = structuredClone(t);
    pausedTimer(t, now);
    resumedTimer({ ...t, isPaused: true }, now);
    expect(t).toEqual(snapshot);
  });

  it('일시정지 → 재개 왕복 후 computeTimerState 가 같은 남은 시간을 계산', () => {
    const t = timer({ endsAt: now + 200_000 });
    const paused = pausedTimer(t, now);
    expect(paused.remainingSeconds).toBe(200);
    const resumed = resumedTimer(paused, now + 60_000); // 1분 쉬었다 재개
    expect(resumed.endsAt).toBe(now + 60_000 + 200_000);
    expect(computeTimerState(resumed, now + 60_000).timer.remainingSeconds).toBe(200);
  });
});

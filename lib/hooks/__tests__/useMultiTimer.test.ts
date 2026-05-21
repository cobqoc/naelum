import { describe, it, expect } from 'vitest';
import { computeTimerState, type Timer } from '@/lib/hooks/useMultiTimer';

// 타이머 timestamp 보정(2026-05-22)의 핵심 — endsAt 기준 재계산 회귀 가드.
// setInterval 이 백그라운드에서 throttle/정지돼도 복귀 시 정확해야 한다.

const baseTimer = (over: Partial<Timer> = {}): Timer => ({
  id: 't1',
  label: '테스트',
  totalSeconds: 600,
  remainingSeconds: 600,
  isActive: true,
  isPaused: false,
  endsAt: null,
  checkpoints: [],
  checkpointAlert: null,
  ...over,
});

describe('computeTimerState — endsAt 기준 재계산', () => {
  it('endsAt 으로 남은 시간 계산', () => {
    const now = 1_000_000;
    const { timer, justCompleted } = computeTimerState(baseTimer({ endsAt: now + 300_000 }), now);
    expect(timer.remainingSeconds).toBe(300);
    expect(justCompleted).toBe(false);
  });

  it('endsAt 이 지났으면 완료 (백그라운드로 건너뛰어도)', () => {
    const now = 1_000_000;
    const { timer, justCompleted } = computeTimerState(baseTimer({ endsAt: now - 10_000 }), now);
    expect(justCompleted).toBe(true);
    expect(timer.isActive).toBe(false);
    expect(timer.remainingSeconds).toBe(0);
    expect(timer.endsAt).toBe(null);
  });

  it('일시정지·비활성 타이머는 그대로', () => {
    const paused = baseTimer({ isPaused: true, endsAt: null, remainingSeconds: 250 });
    expect(computeTimerState(paused, 1_000_000).timer.remainingSeconds).toBe(250);
    const done = baseTimer({ isActive: false, endsAt: null });
    expect(computeTimerState(done, 1_000_000).justCompleted).toBe(false);
  });
});

describe('computeTimerState — 체크포인트', () => {
  it('경과가 체크포인트 시점 도달 → 발화', () => {
    const now = 1_000_000;
    // total 600, remaining 300 → elapsed 300. checkpoint 120 도달
    const t = baseTimer({
      totalSeconds: 600,
      endsAt: now + 300_000,
      checkpoints: [{ atSeconds: 120, label: '뒤집기', fired: false }],
    });
    const { timer, justFiredCheckpoint } = computeTimerState(t, now);
    expect(justFiredCheckpoint).toBe(true);
    expect(timer.checkpointAlert).toBe('뒤집기');
    expect(timer.checkpoints[0].fired).toBe(true);
  });

  it('백그라운드로 체크포인트 여러 개 건너뛰면 모두 fired, 알림은 마지막', () => {
    const now = 1_000_000;
    // total 600, remaining 60 → elapsed 540. checkpoints 120·300 둘 다 넘김
    const t = baseTimer({
      totalSeconds: 600,
      endsAt: now + 60_000,
      checkpoints: [
        { atSeconds: 120, label: '1차', fired: false },
        { atSeconds: 300, label: '2차', fired: false },
      ],
    });
    const { timer, justFiredCheckpoint } = computeTimerState(t, now);
    expect(justFiredCheckpoint).toBe(true);
    expect(timer.checkpoints.every(c => c.fired)).toBe(true);
    expect(timer.checkpointAlert).toBe('2차');
  });

  it('이미 발화된 체크포인트는 다시 발화 안 함', () => {
    const now = 1_000_000;
    const t = baseTimer({
      totalSeconds: 600,
      endsAt: now + 300_000,
      checkpoints: [{ atSeconds: 120, label: '뒤집기', fired: true }],
    });
    expect(computeTimerState(t, now).justFiredCheckpoint).toBe(false);
  });
});

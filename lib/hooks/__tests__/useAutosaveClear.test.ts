import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scheduleAutosave, clearAutosave, loadAutosave } from '@/lib/hooks/useAutosave';

// 2026-10-04 [PHR-19] clearAutosave 가 같은 키의 대기 중 debounce 저장을 취소 — 게시 직후 스냅샷 부활 경쟁 회귀 고정.

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
}

let storage: MemStorage;
beforeEach(() => {
  vi.useFakeTimers();
  storage = new MemStorage();
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('window', globalThis);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('scheduleAutosave / clearAutosave', () => {
  it('정상 경로: debounce 후 저장 + onSaved(savedAt)', () => {
    const onSaved = vi.fn();
    scheduleAutosave('k1', { title: '김치찌개' }, 1500, onSaved);
    vi.advanceTimersByTime(1499);
    expect(storage.getItem('k1')).toBeNull();
    vi.advanceTimersByTime(1);
    expect(loadAutosave<{ title: string }>('k1')?.data).toEqual({ title: '김치찌개' });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('버그 경로: 대기 중 clearAutosave → 이후 저장 발화 안 함(스냅샷 부활 없음)', () => {
    const onSaved = vi.fn();
    scheduleAutosave('k2', { title: '방금 게시' }, 1500, onSaved);
    vi.advanceTimersByTime(500);
    clearAutosave('k2');
    vi.advanceTimersByTime(5000);
    expect(storage.getItem('k2')).toBeNull();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('다른 키의 clear 는 대기 저장을 취소하지 않음', () => {
    scheduleAutosave('k3', { a: 1 }, 1000);
    clearAutosave('other');
    vi.advanceTimersByTime(1000);
    expect(loadAutosave<{ a: number }>('k3')?.data).toEqual({ a: 1 });
  });

  it('대기 저장이 없으면 clear 는 기존처럼 저장본만 삭제', () => {
    scheduleAutosave('k4', { a: 1 }, 100);
    vi.advanceTimersByTime(100);
    expect(storage.getItem('k4')).not.toBeNull();
    clearAutosave('k4');
    expect(storage.getItem('k4')).toBeNull();
    // 이미 발화한 타이머는 레지스트리에서 빠져 있어 이후 같은 키 예약이 정상 동작
    scheduleAutosave('k4', { a: 2 }, 100);
    vi.advanceTimersByTime(100);
    expect(loadAutosave<{ a: number }>('k4')?.data).toEqual({ a: 2 });
  });
});

'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 폼 자동저장 hook — localStorage 기반.
 *
 * 사용자가 입력 중인 폼 상태를 debounce 후 localStorage에 스냅샷.
 * 크래시·새로고침·탭닫기 후에도 복원 가능. 게시·임시저장 성공 시 clear() 호출 필수.
 *
 * @param key  localStorage 키 (페이지·유저 단위로 unique)
 * @param data 직렬화할 폼 상태 (변경 시 자동 저장 트리거)
 * @param options
 *   - debounceMs: 마지막 변경 후 저장까지 대기 (기본 1500ms)
 *   - enabled: false면 저장 안 함 (예: 외부 데이터 로드 중)
 */
interface UseAutosaveOptions {
  debounceMs?: number;
  enabled?: boolean;
}

// 2026-10-04 [PHR-19] 키별로 대기 중인 debounce 저장 타이머. clearAutosave(key) 가 함께 취소한다 —
// 게시 직후(clear → router.push 로 아직 마운트 상태) 대기 중이던 저장이 clear *뒤에* 발화해 방금 게시한 폼을
// 다시 저장, 다음 진입 때 "복원" 배너가 되살아나(→ 중복 게시 위험) 하던 경쟁 차단. 대기 저장이 없으면 동작 동일.
const pendingSaveTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * debounceMs 뒤 localStorage 에 `{ data, savedAt }` 스냅샷 저장을 예약한다(useAutosave 내부용 — 테스트 위해 export).
 * 저장 성공 시 onSaved(savedAt). 같은 키로 clearAutosave 가 먼저 불리면 저장하지 않는다.
 */
export function scheduleAutosave<T>(
  key: string,
  data: T,
  debounceMs: number,
  onSaved?: (savedAt: number) => void,
): ReturnType<typeof setTimeout> {
  const timer = setTimeout(() => {
    if (pendingSaveTimers.get(key) === timer) pendingSaveTimers.delete(key);
    try {
      const snapshot = { data, savedAt: Date.now() };
      localStorage.setItem(key, JSON.stringify(snapshot));
      onSaved?.(snapshot.savedAt);
    } catch {
      // localStorage 가득 차거나 거부 — 조용히 실패 (작성은 계속 가능)
    }
  }, debounceMs);
  pendingSaveTimers.set(key, timer);
  return timer;
}

export function useAutosave<T>(
  key: string,
  data: T,
  options: UseAutosaveOptions = {}
): { savedAt: number | null } {
  const { debounceMs = 1500, enabled = true } = options;
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const timer = scheduleAutosave(key, data, debounceMs, setSavedAt);
    timeoutRef.current = timer;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (pendingSaveTimers.get(key) === timer) pendingSaveTimers.delete(key);
    };
  }, [key, data, debounceMs, enabled]);

  return { savedAt };
}

/** localStorage에서 저장된 스냅샷 로드 (없으면 null) */
export function loadAutosave<T>(key: string, maxAgeMs?: number): { data: T; savedAt: number } | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; savedAt: number };
    if (maxAgeMs && Date.now() - parsed.savedAt > maxAgeMs) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** 저장된 스냅샷 삭제 (게시·임시저장 성공 시 호출) — 같은 키의 대기 중 debounce 저장도 취소([PHR-19]) */
export function clearAutosave(key: string) {
  const pending = pendingSaveTimers.get(key);
  if (pending) {
    clearTimeout(pending);
    pendingSaveTimers.delete(key);
  }
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}


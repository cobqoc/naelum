'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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
    timeoutRef.current = setTimeout(() => {
      try {
        const snapshot = { data, savedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(snapshot));
        setSavedAt(snapshot.savedAt);
      } catch {
        // localStorage 가득 차거나 거부 — 조용히 실패 (작성은 계속 가능)
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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

/** 저장된 스냅샷 삭제 (게시·임시저장 성공 시 호출) */
export function clearAutosave(key: string) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

/** useCallback wrapper for clearAutosave */
export function useClearAutosave(key: string) {
  return useCallback(() => clearAutosave(key), [key]);
}

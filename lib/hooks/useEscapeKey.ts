'use client';

import { useEffect } from 'react';

/**
 * ESC 키 입력 시 콜백 실행.
 * `enabled=false`이면 리스너 자체를 등록하지 않음 (모달 닫힘 상태에서 불필요한 핸들러 제거).
 * 안쪽 요소(자동완성 드롭다운 등)가 그 Esc 를 이미 처리했다고 `preventDefault()` 로 표시했으면 무시한다 —
 * 드롭다운만 닫으려던 Esc 에 바깥 모달까지 닫혀 담아둔 재료가 유실되던 문제(ICL-33, 2026-10-04).
 */
export function useEscapeKey(callback: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) callback();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callback, enabled]);
}

'use client';

import { useEffect } from 'react';

/**
 * ESC 키 입력 시 콜백 실행.
 * `enabled=false`이면 리스너 자체를 등록하지 않음 (모달 닫힘 상태에서 불필요한 핸들러 제거).
 */
export function useEscapeKey(callback: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') callback();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callback, enabled]);
}

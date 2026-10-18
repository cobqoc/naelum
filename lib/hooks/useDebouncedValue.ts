'use client';

import { useEffect, useState } from 'react';

/** 값이 `delayMs` 동안 바뀌지 않으면 그 값을 돌려준다 — 검색 입력처럼 키마다 요청하지 않게 (2026-10-19 감사 ADM-09). */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

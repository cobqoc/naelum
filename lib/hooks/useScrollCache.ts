'use client';

import { useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  scrollY: number;
  timestamp: number;
}

export function useScrollCache<T>(key: string, ttlMs = 5 * 60 * 1000) {
  const save = useCallback(
    (data: T, scrollY: number) => {
      if (typeof window === 'undefined') return;
      try {
        sessionStorage.setItem(key, JSON.stringify({ data, scrollY, timestamp: Date.now() }));
      } catch {}
    },
    [key]
  );

  const load = useCallback((): CacheEntry<T> | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.timestamp > ttlMs) {
        sessionStorage.removeItem(key);
        return null;
      }
      return entry;
    } catch {
      return null;
    }
  }, [key, ttlMs]);

  const clear = useCallback(() => {
    if (typeof window === 'undefined') return;
    try { sessionStorage.removeItem(key); } catch {}
  }, [key]);

  return { save, load, clear };
}

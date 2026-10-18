'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { toImperial } from '@/lib/units/imperial';

export type UnitSystem = 'metric' | 'imperial';

const STORAGE_KEY = 'naelum_unit_system';

// 저장값은 마운트 후에만 읽는다 — 서버 스냅샷은 항상 'metric'. 예전엔 useState 초기화에서 localStorage 를 읽어
// Imperial 을 고른 사용자의 첫 클라 렌더가 SSR HTML 과 달라 하이드레이션 불일치가 났다(2026-10-19 감사 ICL-27).
// 쿠키·사이트 데이터 차단 브라우저는 localStorage 접근이 SecurityError — 항상 try.
const listeners = new Set<() => void>();
let cached: UnitSystem | null = null;

function read(): UnitSystem {
  if (cached) return cached;
  try {
    cached = localStorage.getItem(STORAGE_KEY) === 'imperial' ? 'imperial' : 'metric';
  } catch {
    cached = 'metric';
  }
  return cached;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function write(next: UnitSystem) {
  cached = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // 저장 불가 환경(차단·용량 초과) — 전환은 이 탭에서만 유지
  }
  listeners.forEach(l => l());
}

export function useUnitConversion() {
  const system = useSyncExternalStore(subscribe, read, () => 'metric' as UnitSystem);

  const toggleSystem = useCallback(() => {
    write(read() === 'metric' ? 'imperial' : 'metric');
  }, []);

  const convertIngredient = useCallback((
    quantity: string,
    unit: string,
  ): { quantity: string; unit: string; isConverted: boolean } => {
    if (system === 'metric') return { quantity, unit, isConverted: false };
    return toImperial(quantity, unit);
  }, [system]);

  return {
    system,
    toggleSystem,
    isImperial: system === 'imperial',
    convertIngredient,
  };
}

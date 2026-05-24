'use client';

import { useState, useEffect } from 'react';
import type { FridgeItem } from './types';
import { RECOMMENDATIONS_FETCH_DEBOUNCE_MS, RECOMMENDATIONS_LIMIT } from './constants';

/**
 * 매칭 카운트 + 만료 임박 추천 fetch 상태 — HomeClient 분해 (2026-05-25).
 *
 * 두 종류 추천 fetch 를 한 hook 에 모음 (서로 *별개* 도메인 — race·async 안 만남):
 *  - `matchingCount` / `resolvedMode`: 전체 items 기준 매칭 (홈 RecommendationPill 표시)
 *  - `expiringRecipeMatch`: 만료 임박 재료 전용 매칭 (FridgeAllSheet 'expiring' pill 표시)
 *
 * race 가드:
 *  - 두 effect 모두 `cancelled` 플래그로 stale 응답 차단
 *  - 매칭 카운트는 500ms debounce — items 연속 변경 시 마지막만 fetch
 *  - 만료 매칭은 시트 'expiring' 모드 진입 시점에만 fetch (불필요 호출 차단)
 */
export interface UseFridgeRecommendationsParams {
  items: FridgeItem[];
  expiringItems: FridgeItem[];
  expiringCount: number;
  allSheetMode: 'all' | 'expiring' | null;
  isAuthenticated: boolean;
}

export interface UseFridgeRecommendationsResult {
  matchingCount: number | null;
  resolvedMode: 'ready' | 'almost' | 'all' | null;
  expiringRecipeMatch: { count: number | null; mode: 'ready' | 'almost' | 'all' | null } | null;
}

export function useFridgeRecommendations({
  items,
  expiringItems,
  expiringCount,
  allSheetMode,
  isAuthenticated,
}: UseFridgeRecommendationsParams): UseFridgeRecommendationsResult {
  const [matchingCount, setMatchingCount] = useState<number | null>(null);
  const [resolvedMode, setResolvedMode] = useState<'ready' | 'almost' | 'all' | null>(null);
  const [expiringRecipeMatch, setExpiringRecipeMatch] =
    useState<UseFridgeRecommendationsResult['expiringRecipeMatch']>(null);

  // 매칭 레시피 fetch — mode=auto 로 서버가 best mode 자동 선택.
  // 응답의 mode 필드로 버블 라벨 결정 (🔥 바로 가능 / 🛒 거의 가능 / 📋 추천).
  // 500ms debounce — items 가 연속 변경되면 (예: 재료 여러 개 빠르게 추가) 마지막 변경만 fetch.
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      const base = `/api/recommendations?type=ingredients&limit=${RECOMMENDATIONS_LIMIT}&mode=auto`;
      const url = isAuthenticated
        ? base
        : `${base}&ingredients=${encodeURIComponent(items.map(i => i.ingredient_name).join(','))}`;
      fetch(url)
        .then(r => (r.ok ? r.json() : { recommendations: [], mode: null }))
        .then(data => {
          if (cancelled) return;
          setMatchingCount(Array.isArray(data.recommendations) ? data.recommendations.length : 0);
          setResolvedMode(data.mode ?? null);
        })
        .catch(() => {
          if (!cancelled) {
            setMatchingCount(0);
            setResolvedMode(null);
          }
        });
    }, RECOMMENDATIONS_FETCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isAuthenticated, items]);

  // 임박 재료 전용 매칭 fetch — 시트 열릴 때만 fetch (불필요한 호출 방지).
  // 임박 재료 변경 시 invalidate. 시트 닫혀있어도 임박 카운트 변하면 다음 오픈 시 새로 fetch.
  // 로딩/0개 케이스에서 effect body 내 setState 발생 — 비동기 fetch 결과를 React 상태와
  // 연동해야 하는 외부 동기화이므로 합법.
  useEffect(() => {
    if (allSheetMode !== 'expiring') return;
    if (expiringCount === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mode 전환과 결합된 외부 동기화
      setExpiringRecipeMatch({ count: 0, mode: null });
      return;
    }
    let cancelled = false;
    // 새 fetch 시작 시 stale 결과 무효화 (UI 로딩 표시 필수)
    setExpiringRecipeMatch({ count: null, mode: null });
    const names = expiringItems.map(i => i.ingredient_name).join(',');
    const url = `/api/recommendations?type=ingredients&limit=${RECOMMENDATIONS_LIMIT}&mode=auto&ingredients=${encodeURIComponent(names)}`;
    fetch(url)
      .then(r => (r.ok ? r.json() : { recommendations: [], mode: null }))
      .then(data => {
        if (cancelled) return;
        setExpiringRecipeMatch({
          count: Array.isArray(data.recommendations) ? data.recommendations.length : 0,
          mode: data.mode ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setExpiringRecipeMatch({ count: 0, mode: null });
      });
    return () => {
      cancelled = true;
    };
  }, [allSheetMode, expiringCount, expiringItems]);

  return { matchingCount, resolvedMode, expiringRecipeMatch };
}

'use client';

import { useState, useEffect } from 'react';
import { POPULAR_ITEM_NAMES } from './popularItems';

export interface PopularIngredient {
  name: string;
  category: string;
  emoji: string | null;
}

// Module-level cache — shared across all hook instances, survives component remounts.
let cache: PopularIngredient[] | null = null;
let fetchPromise: Promise<PopularIngredient[]> | null = null;

async function fetchPopularIngredients(): Promise<PopularIngredient[]> {
  if (cache) return cache;
  if (!fetchPromise) {
    const names = POPULAR_ITEM_NAMES.join(',');
    fetchPromise = fetch(
      `/api/ingredients/browse?names=${encodeURIComponent(names)}&limit=${POPULAR_ITEM_NAMES.length}`
    )
      .then(r => r.json())
      .then(data => {
        const map = new Map<string, PopularIngredient>();
        for (const ing of (data.ingredients ?? [])) {
          map.set(ing.name, {
            name: ing.name,
            category: ing.category ?? 'other',
            emoji: ing.emoji ?? null,
          });
        }
        cache = POPULAR_ITEM_NAMES
          .filter(name => map.has(name))
          .map(name => map.get(name)!);
        return cache;
      })
      .catch(() => {
        fetchPromise = null;
        return [];
      });
  }
  return fetchPromise;
}

/**
 * @param enabled false 면 fetch 하지 않는다 — 데이터를 렌더할 수 없는 호출처용(perf 2026-09-27).
 *   ShoppingCartDropdown 은 비로그인이면 CartLoginPrompt 만 렌더하는데 BottomNav 가 모든 방문자에게
 *   마운트하므로, 비로그인 첫 방문마다 쓰이지 않는 /api/ingredients/browse 요청이 나가고 있었다.
 *   모듈 캐시·in-flight 공유는 그대로라 로그인 후 첫 enabled 에서 1회 fetch.
 */
export function usePopularIngredients(enabled = true): PopularIngredient[] {
  const [items, setItems] = useState<PopularIngredient[]>(() => cache ?? []);

  useEffect(() => {
    if (!enabled) return;
    fetchPopularIngredients().then(result => setItems(result));
  }, [enabled]);

  return items;
}

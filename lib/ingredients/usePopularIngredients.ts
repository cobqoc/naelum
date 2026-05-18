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

export function usePopularIngredients(): PopularIngredient[] {
  const [items, setItems] = useState<PopularIngredient[]>(() => cache ?? []);

  useEffect(() => {
    fetchPopularIngredients().then(result => setItems(result));
  }, []);

  return items;
}

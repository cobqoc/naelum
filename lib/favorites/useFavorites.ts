'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';

export interface FavoriteItem {
  ingredient_name: string;
  category: string | null;
  is_starred: boolean;
  add_count: number;
  last_added_at: string;
}

// 사용자 즐겨찾기·자주 사용 재료 hook
// - GET /api/favorites로 로드 (서버 정렬: starred → add_count → last_added_at)
// - toggleStar로 ⭐ 토글 (optimistic update, 실패 시 reload로 복원)
// - 비로그인은 빈 배열 반환 (caller가 fallback 처리)
export function useFavorites(limit = 50) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/favorites?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    if (authLoading) return;
    reload();
  }, [authLoading, reload]);

  const toggleStar = useCallback(
    async (name: string, category: string | null, currentStarred: boolean) => {
      if (!user) return;
      const next = !currentStarred;
      // optimistic
      setItems(prev => {
        const idx = prev.findIndex(p => p.ingredient_name === name);
        if (idx >= 0) {
          const copy = prev.slice();
          copy[idx] = { ...copy[idx], is_starred: next };
          // 정렬 갱신 (starred → add_count → last_added_at)
          return copy.sort((a, b) => {
            if (a.is_starred !== b.is_starred) return a.is_starred ? -1 : 1;
            if (a.add_count !== b.add_count) return b.add_count - a.add_count;
            return new Date(b.last_added_at).getTime() - new Date(a.last_added_at).getTime();
          });
        }
        return [
          {
            ingredient_name: name,
            category,
            is_starred: next,
            add_count: 0,
            last_added_at: new Date().toISOString(),
          },
          ...prev,
        ];
      });
      try {
        const res = await fetch('/api/favorites', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredient_name: name, is_starred: next, category }),
        });
        if (!res.ok) await reload();
      } catch {
        await reload();
      }
    },
    [user, reload]
  );

  return { items, loading, reload, toggleStar };
}

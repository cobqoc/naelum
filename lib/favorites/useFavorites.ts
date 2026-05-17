'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';

export interface FavoriteItem {
  ingredient_name: string;
  category: string | null;
  score: number;
  last_added_at: string;
  emoji: string | null;
}

// 사용자 자주 쓰는 재료 hook (Stage 2)
// - GET /api/favorites 로드 (score = recent_30day × 2 + total 정렬)
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

  return { items, loading, reload };
}

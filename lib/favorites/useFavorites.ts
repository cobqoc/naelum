'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { loadFavorites, type FavoriteItem } from './loadFavorites';

export type { FavoriteItem };

// 사용자 자주 쓰는 재료 hook (Stage 2)
// - GET /api/favorites 로드 (score = recent_30day × 2 + total 정렬)
// - 비로그인은 빈 배열 반환 (caller가 fallback 처리)
// - 동시 인스턴스(Header·BottomNav 의 ShoppingCartDropdown)는 loadFavorites 가 한 요청을 공유 (perf 2026-09-27).
//   reload 시점·상태 전이·에러 시 items 유지는 이전과 동일.
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
      const result = await loadFavorites(user.id, limit);
      if (result) setItems(result);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    if (authLoading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트·조건 변경 시 서버 데이터 로드(로딩 표시 포함) — 외부 시스템 동기화
    reload();
  }, [authLoading, reload]);

  return { items, loading, reload };
}

'use client';

// 로그인된 사용자의 첫 진입 시 localStorage의 자주 사용 재료를 DB로 일괄 이전.
// 한 번 성공하면 더는 실행 안 됨(localStorage flag). UI 없음.
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { syncRecentIngredientsToFavorites } from '@/lib/utils/recentIngredients';

export default function FavoritesSyncBoot() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    syncRecentIngredientsToFavorites().catch(() => {});
  }, [user, loading]);

  return null;
}

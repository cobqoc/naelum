import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 레시피 카드 공용 조각 — 라우트마다 복붙돼 있던 것의 단일 출처. (2026-10-04 API1-39, 행위보존)
 */

/** 전체 레시피 목록(browse)·이번 주 인기(trending) 카드 컬럼 — 두 라우트의 바이트 동일 문자열. */
export const RECIPE_LIST_CARD_COLS =
  'id, title, thumbnail_url, prep_time_minutes, cook_time_minutes, difficulty_level, average_rating, views_count, author:profiles!recipes_author_id_fkey(username), created_at';

/** to-one 임베드(author 등)가 배열로 올 때 첫 원소로 — 원본 `Array.isArray(x) ? x[0] : x` 그대로. */
export function firstOfEmbed<T>(value: T | T[]): T {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * 사용자가 *완료한* 레시피 id 집합("만들어봤어요" 배지) — browse·search·recommendations·users/[username]/recipes 의
 * 같은 쿼리 4벌(`cooking_sessions.select('recipe_id').eq('user_id').in('recipe_id', ids).not('completed_at','is',null)`).
 * 원본처럼 조회 오류는 빈 집합(배지 미표시)으로.
 */
export async function fetchCookedRecipeIds(
  supabase: SupabaseClient,
  userId: string,
  recipeIds: string[],
): Promise<Set<string>> {
  const { data } = await supabase
    .from('cooking_sessions')
    .select('recipe_id')
    .eq('user_id', userId)
    .in('recipe_id', recipeIds)
    .not('completed_at', 'is', null);
  return new Set((data as { recipe_id: string }[] | null)?.map(s => s.recipe_id) || []);
}

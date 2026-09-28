import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { flattenMasterJoin } from './flattenMasterJoin';

/** user_ingredients 기본 컬럼 — GET/POST /api/user-ingredients 와 홈 SSR 의 단일 출처. */
export const USER_INGREDIENT_COLS =
  'id,user_id,ingredient_name,quantity,unit,category,expiry_date,' +
  'storage_location,purchase_date,notes,expiry_alert,created_at';

/**
 * 냉장고 전체 + 도감 메타(emoji·shelf_life_days) 조인·평탄화. 정렬 expiry_date asc nullslast(KMP 와 동일).
 * GET /api/user-ingredients?withMaster=1 과 app/[lang]/page.tsx SSR 이 공유 → 두 경로의 행 shape 이 갈라질 수 없다.
 * (perf 2026-09-28: SSR 이 조인 없이 보내고 클라가 곧바로 같은 조회를 다시 하던 것을 첫 화면부터 완성본으로)
 */
export async function selectUserIngredientsWithMaster(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('user_ingredients')
    .select(`${USER_INGREDIENT_COLS},ingredients_master!ingredient_id(emoji, shelf_life_days)`)
    .eq('user_id', userId)
    .order('expiry_date', { ascending: true, nullsFirst: false });
  if (error) return { items: null, error };
  return { items: flattenMasterJoin(data ?? []), error: null };
}

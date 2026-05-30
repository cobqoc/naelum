/**
 * V2 그래프·알레르겐 fetch helper — DB 조회 캡슐화.
 *
 * 매칭 함수는 *순수*. fetch 책임을 분리해서 caching·테스트가 깔끔하다.
 */

import type { RelationGraph } from './matchV2';

/**
 * Supabase 클라이언트 타입을 깊은 추론 없이 받기 위한 minimal interface.
 * 실제 SupabaseClient 의 generic chain 이 너무 깊어 type instantiation 폭증 발생 →
 * any 로 받아 내부에서 narrow 한다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

/**
 * 레시피 재료들의 incoming 관계만 fetch.
 *  - 모든 관계 가져오면 그래프 폭증 — to_id 기준 *필요한 것만* lookup
 *  - 양방향 substitute 는 trigger 로 reverse row 가 이미 존재 → 한 방향만 검사해도 OK
 */
export async function fetchRelationsForRecipe(
  recipeIngredientIds: string[],
  supabase: AnySupabase,
): Promise<RelationGraph> {
  const validIds = recipeIngredientIds.filter(Boolean);
  if (validIds.length === 0) return { incoming: new Map() };

  const { data, error } = await supabase
    .from('ingredient_relations')
    .select('from_id, to_id, kind')
    .in('to_id', validIds);

  if (error || !data) return { incoming: new Map() };

  const incoming = new Map<string, Array<{ from_id: string; kind: 'substitute' | 'preparable_to' }>>();
  for (const raw of data as Array<{ from_id: string; to_id: string; kind: 'substitute' | 'preparable_to' }>) {
    if (!incoming.has(raw.to_id)) incoming.set(raw.to_id, []);
    incoming.get(raw.to_id)!.push({ from_id: raw.from_id, kind: raw.kind });
  }
  return { incoming };
}

/**
 * 사용자 보유 재료 중 *변형*(base_ingredient_id 보유)을 base별로 묶음.
 * 변형 매칭(삼겹살 보유 → "돼지고기" 필요 충족)용 입력.
 * 반환: Map<base_id, 사용자 보유 변형 id>. 한 base에 변형 여럿이면 첫 번째.
 * base_id 데이터 없으면 빈 Map → matchV2 변형 분기 자연 비활성(degrade).
 */
export async function fetchUserVariantBases(
  userIngredientIds: string[],
  supabase: AnySupabase,
): Promise<Map<string, string>> {
  const validIds = userIngredientIds.filter(Boolean);
  if (validIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('ingredients_master')
    .select('id, base_ingredient_id')
    .in('id', validIds)
    .not('base_ingredient_id', 'is', null);

  if (error || !data) return new Map();

  const map = new Map<string, string>();
  for (const raw of data as Array<{ id: string; base_ingredient_id: string }>) {
    if (!map.has(raw.base_ingredient_id)) map.set(raw.base_ingredient_id, raw.id);
  }
  return map;
}

/**
 * 레시피 재료들의 allergens 컬럼 fetch.
 * 알레르기 차단 판정에 사용.
 */
export async function fetchAllergensForRecipe(
  recipeIngredientIds: string[],
  supabase: AnySupabase,
): Promise<Map<string, string[]>> {
  const validIds = recipeIngredientIds.filter(Boolean);
  if (validIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('ingredients_master')
    .select('id, allergens')
    .in('id', validIds);

  if (error || !data) return new Map();

  const result = new Map<string, string[]>();
  for (const raw of data as Array<{ id: string; allergens: string[] | null }>) {
    result.set(raw.id, raw.allergens ?? []);
  }
  return result;
}

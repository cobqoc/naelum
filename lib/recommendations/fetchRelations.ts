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

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 재료명 배열 → Map<originalName, id> — *결정적 매칭만*. 추측(접두사 분리·단어 쪼개기) 0.
 *
 * 우선순위 (모두 결정적 — fuzzy 아님):
 *  1. 정확 이름 일치 (승인 마스터 `name`)
 *  2. **큐레이션된 별칭** 일치 (마스터 `aliases` 배열 — 사람이 등록한 동의어. 예: 통마늘→마늘, 후춧가루→후추)
 *  3. **공백 무시** 정확 일치 (예: "다진 마늘" → "다진마늘")
 *
 * `resolveIngredientIds`(normalizeIngredientName 접두사 분리·단어 fallback 포함)와 달리 추측을
 * 하지 않는다 — 위 3개는 전부 명시적/결정적. 위에 안 걸리는 변형·신규는 Map 에서 빠져 호출처에서
 * null 로 남는다 → 어드민 "번호 연결" 큐로 흘러감.
 * (2026-05-29 비대칭 resolution fix → 2026-05-31 별칭·공백 존중 추가)
 */
export async function resolveExactIngredientIds(
  names: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<Map<string, string>> {
  if (names.every(n => !n.trim())) return new Map();

  // 승인 마스터 전체(수십 개 규모) 로드 — 별칭·공백무시 해석은 IN 쿼리로 안 되므로 in-memory.
  const { data } = await supabase
    .from('ingredients_master')
    .select('id, name, aliases')
    .eq('status', 'approved');

  const collapse = (s: string) => s.replace(/\s+/g, '');
  const byName = new Map<string, string>();        // 정확 이름
  const byAlias = new Map<string, string>();       // 큐레이션 별칭 (소문자)
  const byCollapsed = new Map<string, string>();   // 공백 제거 이름
  for (const r of (data ?? []) as { id: string; name: string; aliases: string[] | null }[]) {
    if (!byName.has(r.name)) byName.set(r.name, r.id);
    const c = collapse(r.name);
    if (c && !byCollapsed.has(c)) byCollapsed.set(c, r.id);
    for (const a of r.aliases ?? []) {
      const key = a.trim().toLowerCase();
      if (key && !byAlias.has(key)) byAlias.set(key, r.id);
    }
  }

  const result = new Map<string, string>();
  for (const name of names) {
    const t = name.trim();
    if (!t) continue;
    const id = byName.get(t) ?? byAlias.get(t.toLowerCase()) ?? byCollapsed.get(collapse(t));
    if (id) result.set(name, id);
  }
  return result;
}

/**
 * 단일 재료명 → id (결정적). `resolveExactIngredientIds` 의 1개짜리 래퍼.
 * 냉장고 쓰기 경로를 레시피와 동일한 결정적 해석으로 통일하기 위한 용도
 * (2026-05-31 — fuzzy `resolveIngredientId` 대체. 비대칭 resolution 제거).
 */
export async function resolveExactIngredientId(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<string | null> {
  const map = await resolveExactIngredientIds([name], supabase);
  return map.get(name) ?? null;
}

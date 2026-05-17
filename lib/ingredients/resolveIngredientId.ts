import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 재료명 → ingredients_master.id 조회
 *
 * 1순위: 정확한 이름 일치 ("간장" → 간장 ID)
 * 2순위: 공백 분리 단어 중 가장 긴 것 일치
 *        ("엄마표 간장" → "간장" → 간장 ID)
 *
 * 단어는 2자 이상만 후보로 사용 (조사·접속사 제외)
 */
export async function resolveIngredientId(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const words = trimmed.split(/\s+/).filter(w => w.length >= 2);
  const candidates = [...new Set([trimmed, ...words])];

  const { data } = await supabase
    .from('ingredients_master')
    .select('id, name')
    .in('name', candidates);

  if (!data || data.length === 0) return null;

  const exact = data.find((r: { name: string }) => r.name === trimmed);
  if (exact) return (exact as { id: string }).id;

  // 가장 긴 단어 일치 우선 (구체적인 재료명 선호)
  const sorted = [...data].sort(
    (a: { name: string }, b: { name: string }) => b.name.length - a.name.length
  );
  return (sorted[0] as { id: string }).id;
}

/**
 * 재료명 배열 → Map<originalName, id> 일괄 조회 (add-to-ingredients 등 batch 경로용)
 *
 * 단일 DB 왕복으로 전체 처리: 전체 이름 + 단어 분리 후보를 한번에 IN 쿼리
 */
export async function resolveIngredientIds(
  names: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<Map<string, string>> {
  if (names.length === 0) return new Map();

  // 이름별 후보 단어 목록 구성
  const candidatesOf = new Map<string, string[]>();
  const allCandidates = new Set<string>();

  for (const name of names) {
    const trimmed = name.trim();
    const words = trimmed.split(/\s+/).filter(w => w.length >= 2);
    const list = [...new Set([trimmed, ...words])];
    candidatesOf.set(name, list);
    list.forEach(c => allCandidates.add(c));
  }

  const { data } = await supabase
    .from('ingredients_master')
    .select('id, name')
    .in('name', [...allCandidates]);

  const masterMap = new Map<string, string>(
    (data ?? []).map((r: { id: string; name: string }) => [r.name, r.id])
  );

  const result = new Map<string, string>();

  for (const name of names) {
    const candidates = candidatesOf.get(name) ?? [name.trim()];

    // 정확한 이름 우선
    if (masterMap.has(candidates[0])) {
      result.set(name, masterMap.get(candidates[0])!);
      continue;
    }

    // 가장 긴 단어 일치 (정확 이름 제외)
    const wordMatches = candidates.slice(1).filter(c => masterMap.has(c));
    if (wordMatches.length > 0) {
      wordMatches.sort((a, b) => b.length - a.length);
      result.set(name, masterMap.get(wordMatches[0])!);
    }
  }

  return result;
}

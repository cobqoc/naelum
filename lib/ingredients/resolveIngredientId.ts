import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeIngredientName } from './normalizeIngredientName';

/**
 * 재료명 → ingredients_master.id 조회
 *
 * 1순위: 정확한 이름 일치 ("간장" → 간장 ID)
 * 2순위: 정규화 이름 일치 ("다진마늘" → "마늘" → 마늘 ID)
 * 3순위: 공백 분리 단어 중 가장 긴 것 일치
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

  const normalized = normalizeIngredientName(trimmed);
  const words = trimmed.split(/\s+/).filter(w => w.length >= 2);
  const normalizedWords = normalized.split(/\s+/).filter(w => w.length >= 2);
  const candidates = [...new Set([trimmed, normalized, ...words, ...normalizedWords])];

  const { data } = await supabase
    .from('ingredients_master')
    .select('id, name')
    .in('name', candidates);

  if (!data || data.length === 0) return null;

  // 정확 일치 → 정규화 이름 일치 → 가장 긴 단어 일치
  const exact = data.find((r: { name: string }) => r.name === trimmed);
  if (exact) return (exact as { id: string }).id;

  const normalizedExact = data.find((r: { name: string }) => r.name === normalized);
  if (normalizedExact) return (normalizedExact as { id: string }).id;

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
    const normalized = normalizeIngredientName(trimmed);
    const words = trimmed.split(/\s+/).filter(w => w.length >= 2);
    const normalizedWords = normalized.split(/\s+/).filter(w => w.length >= 2);
    const list = [...new Set([trimmed, normalized, ...words, ...normalizedWords])];
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
    const trimmed = name.trim();
    const normalized = normalizeIngredientName(trimmed);
    const candidates = candidatesOf.get(name) ?? [trimmed];

    // 정확 이름 → 정규화 이름 → 가장 긴 단어 일치
    if (masterMap.has(trimmed)) {
      result.set(name, masterMap.get(trimmed)!);
      continue;
    }
    if (masterMap.has(normalized)) {
      result.set(name, masterMap.get(normalized)!);
      continue;
    }

    const wordMatches = candidates.slice(2).filter(c => masterMap.has(c));
    if (wordMatches.length > 0) {
      wordMatches.sort((a, b) => b.length - a.length);
      result.set(name, masterMap.get(wordMatches[0])!);
    }
  }

  return result;
}

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

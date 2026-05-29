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
 * 재료명 배열 → Map<originalName, id> — *이름 정확일치 (승인된 마스터) 만*. 추측 0.
 *
 * `resolveIngredientIds`(정규화·단어분리 fallback 포함)와 달리 fuzzy 매칭을 *전혀* 하지 않는다.
 * 레시피 저장 시 안전 자동 번호 부여용 — 정확히 같은 이름만 붙이고, 나머지(별칭·변형·신규)는
 * Map 에서 빠져 호출처에서 null 로 남는다 → 어드민 "번호 연결" 큐로 흘러감.
 * (2026-05-29 비대칭 resolution fix — 냉장고는 자동인데 레시피는 안 하던 문제)
 */
export async function resolveExactIngredientIds(
  names: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<Map<string, string>> {
  const lookup = [...new Set(names.map(n => n.trim()).filter(Boolean))];
  if (lookup.length === 0) return new Map();

  const { data } = await supabase
    .from('ingredients_master')
    .select('id, name')
    .eq('status', 'approved')
    .in('name', lookup);

  const byName = new Map<string, string>(
    (data ?? []).map((r: { id: string; name: string }) => [r.name, r.id])
  );

  const result = new Map<string, string>();
  for (const name of names) {
    const id = byName.get(name.trim());
    if (id) result.set(name, id);
  }
  return result;
}

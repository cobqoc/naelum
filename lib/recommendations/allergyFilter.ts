/**
 * 알레르기 필터 — 음식 안전 critical.
 *
 * 매칭 원칙:
 * - false positive (안전 레시피 잘못 제외) >> false negative (위험 레시피 통과)
 *   → 알레르기는 *보수적*으로. 의심되면 제외.
 * - normalize + ALLERGEN_SYNONYMS 양방향 lookup + substring 양방향 매칭
 * - 1글자 핵심 알레르겐 허용 (밀·콩·게·굴·잣 등) — 음식 안전 우선
 *
 * **2026-05-29 변경**: ALIASES 의존 → 알레르기 전용 매핑 분리 (`./allergens`).
 * 매칭 정직성 정책으로 ALIASES 가 자주 정리되는데, 그 변경이 알레르기 안전을
 * 우연히 깨뜨릴 위험 차단. 두 의도(동의어 의미 vs 안전)를 한 데이터에 묶지 않음.
 *
 * 호출 위치: app/api/recommendations/route.ts
 * 회귀 가드: lib/recommendations/__tests__/allergyFilter.test.ts
 */

import { ALLERGEN_SYNONYMS } from './allergens';
import { normalizeIngredientName } from '@/lib/ingredients/normalizeIngredientName';

/**
 * 사용자 알레르기 이름 N개 → 매칭에 쓸 정규화 토큰 Set.
 *
 * 각 알레르기마다:
 * 1. normalize (조리 접두사 제거·별칭 통일)
 * 2. ALLERGEN_SYNONYMS forward lookup (예: '땅콩' → ['피넛', 'peanut', '땅콩버터' ...])
 * 3. ALLERGEN_SYNONYMS reverse lookup (예: 'peanut' 입력 시 '땅콩' 키 찾고 그 전체 값 가져옴)
 *
 * 빈 문자열만 차단. 1글자 핵심 알레르겐(밀·콩·게·굴·잣) 보존.
 */
export function collectAllergyTokens(allergyNames: string[]): Set<string> {
  const tokens = new Set<string>();

  const add = (raw: string) => {
    const normalized = normalizeIngredientName(raw.trim().toLowerCase());
    if (normalized) tokens.add(normalized);
  };

  for (const raw of allergyNames) {
    if (!raw) continue;
    const normalized = normalizeIngredientName(raw.trim().toLowerCase());
    if (!normalized) continue;
    tokens.add(normalized);

    // Forward lookup: ALLERGEN_SYNONYMS[normalized] 와 ALLERGEN_SYNONYMS[raw_lower]
    const forwardA = ALLERGEN_SYNONYMS[normalized];
    if (forwardA) for (const alias of forwardA) add(alias);
    const rawLower = raw.trim().toLowerCase();
    if (rawLower !== normalized) {
      const forwardB = ALLERGEN_SYNONYMS[rawLower];
      if (forwardB) for (const alias of forwardB) add(alias);
    }

    // Reverse lookup: 매핑 값 중 normalized 가 있으면 그 키 + 키의 모든 값 추가
    for (const [key, values] of Object.entries(ALLERGEN_SYNONYMS)) {
      const normalizedValues = values.map(v => v.toLowerCase());
      if (normalizedValues.includes(normalized) || normalizedValues.includes(rawLower)) {
        add(key);
        for (const v of values) add(v);
      }
    }
  }

  return tokens;
}

/**
 * 레시피가 사용자 알레르기에 걸리는지 판단.
 *
 * 매칭 알고리즘:
 * - 각 재료를 normalize
 * - 토큰 중 하나라도 (재료 ⊃ 토큰) 또는 (토큰 ⊃ 재료) 면 차단
 * - exact match 우선 + substring 양방향 — 음식 안전 보수적
 *
 * @returns true = 차단(레시피 제외), false = 안전(추천 가능)
 */
export function isRecipeBlockedByAllergies(
  recipeIngredientNames: string[],
  allergyTokens: Set<string>
): boolean {
  if (allergyTokens.size === 0) return false;
  const tokens = Array.from(allergyTokens);

  for (const raw of recipeIngredientNames) {
    if (!raw) continue;
    const ri = normalizeIngredientName(raw.trim().toLowerCase());
    if (!ri) continue;

    for (const token of tokens) {
      if (ri === token) return true;
      // 양방향 substring — false positive 우호 (음식 안전)
      if (ri.includes(token) || token.includes(ri)) return true;
    }
  }

  return false;
}

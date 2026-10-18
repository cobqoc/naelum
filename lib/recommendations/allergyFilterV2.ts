import { ALLERGEN_KEY_SET, suggestAllergens } from '@/lib/constants/allergens';

/**
 * V2 알레르기 필터 — DB allergens 컬럼 직접 lookup (2026-05-29).
 *
 * 옛 시스템과의 차이:
 *  - substring 매칭 *완전 제거* — false positive 0
 *    (옛: 사용자 '땅콩' 알레르기 → '땅콩버터' 토큰 → 일반 '버터' 재료 차단되던 버그)
 *  - 정규화·동의어 lookup 코드 없음
 *  - 매칭은 `ingredients_master.allergens` 컬럼의 *명시된 알레르겐* 과 사용자 입력 비교
 *
 * 정확도: 100% (재료 마스터의 allergens 가 정확하면).
 * 안전성: 안전 critical path — 재료 마스터에 allergens 미명시면 false negative 위험
 *        → 사용자 신규 추가 흐름에 알레르겐 자동 추정 + 어드민 검수 필수.
 *
 * 사용자 알레르기 입력 표준화:
 *  - 식약처 22품목 한국어 표준 키워드만 사용 (체크박스 UI 권장)
 *  - 자유 입력 시 정규화 (lowercase + trim)
 *  - alias 매핑(땅콩↔peanut)은 사용자 등록 시점에 *표준 키워드로 통일*
 */

/**
 * 한 레시피가 사용자 알레르기에 걸리는가.
 *
 * @param recipeAllergensMap 레시피 재료별 allergens 컬럼 값 (Map<ingredient_id, string[]>)
 * @param userAllergens 사용자 등록 알레르기 (식약처 표준 키워드)
 * @returns true = 차단, false = 안전
 */
export function isRecipeBlockedV2(
  recipeAllergensMap: Map<string, string[]>,
  userAllergens: string[],
): boolean {
  if (userAllergens.length === 0) return false;
  if (recipeAllergensMap.size === 0) return false;

  const userSet = new Set(
    userAllergens.map(a => a.trim().toLowerCase()).filter(Boolean),
  );
  if (userSet.size === 0) return false;

  for (const allergens of recipeAllergensMap.values()) {
    for (const allergen of allergens) {
      if (userSet.has(allergen.trim().toLowerCase())) return true;
    }
  }
  return false;
}

/**
 * 사용자 알레르기 입력 정규화 — trim + lowercase + 빈 값 제거.
 * 추후 alias 매핑(땅콩↔peanut)을 사용자 등록 시점에 적용해 *표준 키워드*만 저장.
 */
export function normalizeUserAllergens(raw: string[]): string[] {
  return Array.from(
    new Set(
      raw
        .map(a => (a ?? '').trim().toLowerCase())
        .filter(a => a.length > 0),
    ),
  );
}

/**
 * 사용자 알레르기 토큰을 식약처 표준 키로 확장 (2026-10-19 감사 PAU-67, 안전 critical).
 *
 * 설정·온보딩 알레르기 입력은 자유 입력이라 "계란"·"소고기"·"egg" 처럼 저장되는데, 재료 마스터 allergens 는
 * 표준 키('난류'·'쇠고기'…)라 exact 비교로는 걸리지 않았다(달걀 알레르기 사용자에게 달걀 요리 추천).
 * 원래 토큰은 그대로 두고, 표준 키가 아닌 토큰에만 suggestAllergens 별칭표로 표준 키를 더한다
 * — 이미 표준 키인 '땅콩' 이 부분 문자열 '콩' 때문에 '대두' 까지 막는 과차단을 피한다.
 * 저장 데이터 이관 없이 기존 사용자도 보호된다. 과차단(예: '버터' → '우유')은 안전 방향이라 허용.
 */
export function expandUserAllergens(raw: string[]): string[] {
  const base = normalizeUserAllergens(raw);
  const out = new Set(base);
  for (const token of base) {
    if (ALLERGEN_KEY_SET.has(token)) continue;
    for (const key of suggestAllergens(token)) out.add(key);
  }
  return Array.from(out);
}

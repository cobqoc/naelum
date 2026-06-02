/**
 * RecipeCard 냉장고 매칭 배지 판정 — 순수 함수.
 *
 * **방어 핵심 (2026-06-03 버그의 구조적 뿌리 제거):**
 * 옛 RecipeCard 는 `recipe.missingIngredientNames.length`(부재 → `?? []` → 0)로 판정해서
 * *매칭 데이터가 불완전하면 "바로 가능"(초록)* 으로 떨어졌다 — "모름"을 "다 있음"으로 추정하는
 * 가장 위험한 기본값. 그래서 추천 API 가 이름 배열을 안 실었을 때 모든 카드가 초록이 됐다.
 *
 * 이 함수는 **명시 `missingCount`(매칭 레이어가 계산한 숫자)만 신뢰**하고, 데이터가 불완전하면
 * `null`(배지 없음)을 돌려 "모름 → 초록" 을 *구조적으로 불가능* 하게 만든다. 미래에 어떤 호출처가
 * matchRate 만 넘기고 카운트를 빠뜨려도 초록 오판이 재발하지 않는다.
 */

export interface FridgeBadgeInput {
  /** 매칭 시도 여부 신호. undefined = 매칭 미부착(일반 둘러보기 카드). */
  matchRate?: number;
  /** 부족 재료 수 — 배지의 단일 카운트 출처. 숫자 아니면 데이터 불완전으로 간주. */
  missingCount?: number;
  /** 필수 재료 수(옵션·기본재료 제외). 0 이하면 판정 불가. */
  totalIngredients?: number;
}

export interface FridgeBadge {
  /** 0 = 바로 가능. 그 외 = 부족 개수. */
  missingCount: number;
  /** 0개 부족 = 바로 가능. */
  isReady: boolean;
}

/**
 * @param rowMode 'full' = 항상(추천) · 'positive' = 바로 가능할 때만(전체·검색, "빨간 벽" 방지)
 * @returns 배지 표시 정보, 또는 null(배지 없음 — 매칭 미부착/불완전/positive 비충족)
 */
export function getFridgeBadge(
  recipe: FridgeBadgeInput,
  rowMode: 'full' | 'positive',
): FridgeBadge | null {
  // 매칭 미부착(일반 둘러보기 카드) → 배지 없음.
  if (recipe.matchRate === undefined) return null;

  // 데이터 불완전 → "바로 가능" 으로 추정 금지. missingCount 는 명시 숫자만 신뢰.
  const { missingCount, totalIngredients } = recipe;
  if (
    typeof missingCount !== 'number' ||
    typeof totalIngredients !== 'number' ||
    totalIngredients <= 0
  ) {
    return null;
  }

  const isReady = missingCount === 0;
  // positive: 바로 가능할 때만 노출.
  if (rowMode === 'positive' && !isReady) return null;

  return { missingCount, isReady };
}

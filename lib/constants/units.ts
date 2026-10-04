/**
 * 재료 단위 목록(단일 출처) — 단위 select 의 옵션. 값은 DB(user_ingredients.unit·recipe_ingredients.unit)에
 * 한글 그대로 저장되는 값이라 번역 대상이 아니다(표시는 t.quickAdd.unitLabels 경유).
 * '선택' 은 미선택 센티넬(저장 시 null — lib/ingredients/unitSentinel).
 *
 * 냉장고 재료 폼(DetailFields)과 레시피 폼(lib/constants/recipe UNITS = 이것 + '기타')에 같은 17개가
 * 따로 복붙돼 있던 것을 하나로(ICL-39, 2026-10-04 — 값·순서 동일, 테스트로 고정).
 */
export const INGREDIENT_UNITS = [
  '선택', 'g', 'kg', 'ml', 'L', '개', '큰술', '작은술',
  '컵', '줌', '꼬집', '조각', '장', '포기', '대', '모', '마리',
] as const;

/**
 * 레시피 폼 영양 정보 입력 검증 — 순수 함수(vitest).
 *
 * 2026-10-04 [PHR-D1 (b)-2] new/edit NutritionFields 에 각각 있던 validateNutritionInput 을 한 벌로.
 * 유일한 차이(상한)는 `limits` 로 보존 — ARCHITECTURE.md 에 기록된 new/edit 분기("영양 검증 상한"):
 *  - new: limits = { int: 5000, decimal: 500 } → 칼로리·나트륨(int) 정수 & < 5000, 영양소(decimal) < 500g
 *  - edit: limits 생략 → int 는 정수 여부만, decimal 은 상한 없음
 * 공통: 빈 값 허용(선택사항), NaN·음수 거부.
 */
export interface NutritionLimits {
  int: number;
  decimal: number;
}

/** recipes/new 의 상한 (칼로리·나트륨 < 5000, 영양소 < 500g) */
export const NEW_RECIPE_NUTRITION_LIMITS: NutritionLimits = { int: 5000, decimal: 500 };

export function validateNutritionInput(
  value: string,
  type: 'int' | 'decimal',
  limits?: NutritionLimits,
): boolean {
  if (value === '') return true; // 빈 값 허용 (선택사항)

  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return false;

  if (type === 'int') {
    return Number.isInteger(num) && (!limits || num < limits.int);
  }
  return !limits || num < limits.decimal;
}

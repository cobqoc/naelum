import { describe, it, expect } from 'vitest';
import { validateNutritionInput, NEW_RECIPE_NUTRITION_LIMITS } from '@/lib/recipes/nutritionInput';

// 2026-10-04 [PHR-D1 (b)-2] new/edit 영양 입력 검증 통합 — 옛 두 함수와 전 입력 동일.

// 옛 recipes/new NutritionFields.validateNutritionInput 본문 그대로
function legacyNew(value: string, type: 'int' | 'decimal'): boolean {
  if (value === '') return true;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return false;
  if (type === 'int') {
    return Number.isInteger(num) && num < 5000;
  } else {
    return num < 500;
  }
}
// 옛 recipes/[id]/edit NutritionFields.validateNutritionInput 본문 그대로
function legacyEdit(value: string, type: 'int' | 'decimal'): boolean {
  if (value === '') return true;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return false;
  if (type === 'int') {
    return Number.isInteger(num);
  }
  return true;
}

const inputs = [
  '', '0', '1', '350', '4999', '5000', '5001', '99999', '0.5', '12.5', '499.9', '500', '500.1', '1000',
  '-1', '-0.5', 'abc', '1e3', '1e4', '3.0', '  7', '7abc', '.5', 'NaN', 'Infinity', '-0',
];

describe('validateNutritionInput', () => {
  it.each(inputs)('new(limits)·edit(무상한) 모두 옛 함수와 동일: %s', (v) => {
    for (const type of ['int', 'decimal'] as const) {
      expect(validateNutritionInput(v, type, NEW_RECIPE_NUTRITION_LIMITS)).toBe(legacyNew(v, type));
      expect(validateNutritionInput(v, type)).toBe(legacyEdit(v, type));
    }
  });
});

import { describe, it, expect } from 'vitest';
import { isRecipeBlockedV2, normalizeUserAllergens } from '../allergyFilterV2';

// V2 알레르기 — DB allergens 컬럼 직접 lookup. substring 매칭·동의어 확장 *전부 제거*.
// 본질: 재료 마스터에 명시된 allergens 만 신뢰. 사용자 신규 입력 흐름에 자동 추정 + 어드민 검수.

describe('isRecipeBlockedV2', () => {
  it('알레르기 없으면 통과', () => {
    expect(isRecipeBlockedV2(new Map(), [])).toBe(false);
    expect(isRecipeBlockedV2(new Map([['x', ['땅콩']]]), [])).toBe(false);
  });

  it('재료 마스터에 알레르겐 명시 + 사용자 알레르기 매칭 → 차단', () => {
    const recipeMap = new Map<string, string[]>([
      ['ing-peanut-butter', ['땅콩', '대두']],
    ]);
    expect(isRecipeBlockedV2(recipeMap, ['땅콩'])).toBe(true);
    expect(isRecipeBlockedV2(recipeMap, ['대두'])).toBe(true);
  });

  it('재료 마스터 allergens 빈 배열이면 통과', () => {
    const recipeMap = new Map<string, string[]>([['ing-onion', []]]);
    expect(isRecipeBlockedV2(recipeMap, ['땅콩'])).toBe(false);
  });

  it('일반 버터 (allergens=["우유"]) + 사용자 "땅콩" 알레르기 → 통과 (옛 substring 거짓 차단 제거)', () => {
    const recipeMap = new Map<string, string[]>([['ing-butter', ['우유']]]);
    expect(isRecipeBlockedV2(recipeMap, ['땅콩'])).toBe(false);
  });

  it('대소문자 무시 (정규화)', () => {
    const recipeMap = new Map<string, string[]>([['ing-peanut', ['Peanut']]]);
    expect(isRecipeBlockedV2(recipeMap, ['PEANUT'])).toBe(true);
  });

  it('여러 재료 중 하나라도 매칭되면 차단', () => {
    const recipeMap = new Map<string, string[]>([
      ['ing-onion', []],
      ['ing-eggs', ['달걀']],
      ['ing-flour', ['밀']],
    ]);
    expect(isRecipeBlockedV2(recipeMap, ['달걀'])).toBe(true);
  });
});

describe('normalizeUserAllergens', () => {
  it('trim + lowercase + 빈 값 제거 + 중복 제거', () => {
    expect(normalizeUserAllergens([' 땅콩 ', '땅콩', 'PEANUT', '', '  '])).toEqual(['땅콩', 'peanut']);
  });

  it('빈 입력 → 빈 배열', () => {
    expect(normalizeUserAllergens([])).toEqual([]);
  });
});

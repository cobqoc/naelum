import { describe, it, expect } from 'vitest';
import { collectAllergyTokens, isRecipeBlockedByAllergies } from '../allergyFilter';

describe('collectAllergyTokens', () => {
  it('빈 입력 → 빈 Set', () => {
    expect(collectAllergyTokens([])).toEqual(new Set());
    expect(collectAllergyTokens([''])).toEqual(new Set());
  });

  it('1글자 핵심 알레르겐 허용 (밀·콩·게·굴·잣)', () => {
    expect(collectAllergyTokens(['밀']).has('밀')).toBe(true);
    expect(collectAllergyTokens(['콩']).has('콩')).toBe(true);
    expect(collectAllergyTokens(['게']).has('게')).toBe(true);
  });

  it('땅콩 → forward lookup 으로 peanut·피넛 포함', () => {
    const tokens = collectAllergyTokens(['땅콩']);
    expect(tokens.has('땅콩')).toBe(true);
    expect(tokens.has('peanut')).toBe(true);
    expect(tokens.has('피넛')).toBe(true);
  });

  it('peanut (영문) → reverse lookup 으로 땅콩 포함', () => {
    const tokens = collectAllergyTokens(['peanut']);
    expect(tokens.has('peanut')).toBe(true);
    expect(tokens.has('땅콩')).toBe(true);
    expect(tokens.has('피넛')).toBe(true);
  });

  it('새우 → 영문 shrimp/prawn + 새우살 모두 포함', () => {
    const tokens = collectAllergyTokens(['새우']);
    expect(tokens.has('새우')).toBe(true);
    expect(tokens.has('shrimp')).toBe(true);
    expect(tokens.has('prawn')).toBe(true);
    expect(tokens.has('새우살')).toBe(true);
  });

  it('shrimp → reverse lookup 으로 새우 포함', () => {
    const tokens = collectAllergyTokens(['shrimp']);
    expect(tokens.has('shrimp')).toBe(true);
    expect(tokens.has('새우')).toBe(true);
  });

  it('우유 → 영문 milk + 밀크 + 우유팩 모두 포함', () => {
    const tokens = collectAllergyTokens(['우유']);
    expect(tokens.has('우유')).toBe(true);
    expect(tokens.has('milk')).toBe(true);
    expect(tokens.has('밀크')).toBe(true);
  });

  it('계란 → 영문 egg + 달걀 + 노른자/흰자 변형 모두 포함', () => {
    const tokens = collectAllergyTokens(['계란']);
    expect(tokens.has('계란')).toBe(true);
    expect(tokens.has('달걀')).toBe(true);
    expect(tokens.has('egg')).toBe(true);
    expect(tokens.has('노른자')).toBe(true);
    expect(tokens.has('계란노른자')).toBe(true);
    expect(tokens.has('달걀흰자')).toBe(true);
  });

  it('normalize: "다진 마늘" → "마늘" + alias 확장', () => {
    const tokens = collectAllergyTokens(['다진 마늘']);
    expect(tokens.has('마늘')).toBe(true);
  });

  it('대소문자 무시', () => {
    const tokensLower = collectAllergyTokens(['Peanut']);
    expect(tokensLower.has('peanut')).toBe(true);
    expect(tokensLower.has('땅콩')).toBe(true);
  });

  it('여러 알레르기 → 모든 토큰 합쳐서 반환', () => {
    const tokens = collectAllergyTokens(['땅콩', '새우']);
    expect(tokens.has('땅콩')).toBe(true);
    expect(tokens.has('peanut')).toBe(true);
    expect(tokens.has('새우')).toBe(true);
    expect(tokens.has('shrimp')).toBe(true);
  });
});

describe('isRecipeBlockedByAllergies', () => {
  it('알레르기 없음 → 안전 (false)', () => {
    const tokens = new Set<string>();
    expect(isRecipeBlockedByAllergies(['양파', '마늘'], tokens)).toBe(false);
  });

  it('직접 매칭 — 땅콩 알레르기 + 땅콩 든 레시피 → 차단', () => {
    const tokens = collectAllergyTokens(['땅콩']);
    expect(isRecipeBlockedByAllergies(['양파', '땅콩', '소금'], tokens)).toBe(true);
  });

  it('한↔영 매칭 — "땅콩" 알레르기 + "peanut" 든 레시피 → 차단', () => {
    const tokens = collectAllergyTokens(['땅콩']);
    expect(isRecipeBlockedByAllergies(['양파', 'peanut', '소금'], tokens)).toBe(true);
  });

  it('영↔한 매칭 — "shrimp" 알레르기 + "새우" 든 레시피 → 차단', () => {
    const tokens = collectAllergyTokens(['shrimp']);
    expect(isRecipeBlockedByAllergies(['양파', '새우', '마늘'], tokens)).toBe(true);
  });

  it('substring 매칭 — "땅콩" 알레르기 + "땅콩버터" 든 레시피 → 차단', () => {
    const tokens = collectAllergyTokens(['땅콩']);
    expect(isRecipeBlockedByAllergies(['땅콩버터', '빵'], tokens)).toBe(true);
  });

  it('계란 동의어 — "egg" 알레르기 + "달걀" 든 레시피 → 차단 (양방향)', () => {
    const tokens = collectAllergyTokens(['egg']);
    expect(isRecipeBlockedByAllergies(['달걀', '밀가루'], tokens)).toBe(true);
  });

  it('normalize — "다진 새우" 재료 ↔ "새우" 알레르기 매칭', () => {
    const tokens = collectAllergyTokens(['새우']);
    expect(isRecipeBlockedByAllergies(['다진 새우', '마늘'], tokens)).toBe(true);
  });

  it('알레르기 없는 레시피 → 안전', () => {
    const tokens = collectAllergyTokens(['땅콩', '새우']);
    expect(isRecipeBlockedByAllergies(['양파', '마늘', '간장'], tokens)).toBe(false);
  });

  it('밀가루 — "밀" 알레르기 + "밀가루" 든 레시피 → 차단', () => {
    const tokens = collectAllergyTokens(['밀']);
    expect(isRecipeBlockedByAllergies(['밀가루', '계란'], tokens)).toBe(true);
  });

  it('우유 영문 — "milk" 알레르기 + "우유" 든 레시피 → 차단', () => {
    const tokens = collectAllergyTokens(['milk']);
    expect(isRecipeBlockedByAllergies(['우유', '설탕'], tokens)).toBe(true);
  });
});

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

// 2026-05-29: 알레르기 매핑이 ALIASES 에서 ALLERGEN_SYNONYMS (별도 파일) 로 분리.
// 안전 critical path 격리 회귀 가드 — ALIASES 가 어떻게 변하든 알레르기 안전 유지.
describe('알레르기 매핑 ALIASES 분리 — 안전 critical path 격리', () => {
  it('돼지고기 알레르기 → 삼겹살·베이컨·pork 든 레시피 모두 차단 (부위·가공 보수적 포함)', () => {
    const tokens = collectAllergyTokens(['돼지고기']);
    expect(isRecipeBlockedByAllergies(['삼겹살', '양파'], tokens)).toBe(true);
    expect(isRecipeBlockedByAllergies(['베이컨', '계란'], tokens)).toBe(true);
    expect(isRecipeBlockedByAllergies(['pork', 'salt'], tokens)).toBe(true);
    expect(isRecipeBlockedByAllergies(['스팸', '김치'], tokens)).toBe(true);
  });

  it('대두 알레르기 → 두유·두부·간장·된장 등 콩 가공품 모두 차단', () => {
    const tokens = collectAllergyTokens(['대두']);
    expect(isRecipeBlockedByAllergies(['두유'], tokens)).toBe(true);
    expect(isRecipeBlockedByAllergies(['두부'], tokens)).toBe(true);
    expect(isRecipeBlockedByAllergies(['간장'], tokens)).toBe(true);
    expect(isRecipeBlockedByAllergies(['된장'], tokens)).toBe(true);
    expect(isRecipeBlockedByAllergies(['콩나물'], tokens)).toBe(true);
  });

  it('우유 알레르기 → 치즈·요거트·버터 등 유제품 모두 차단', () => {
    const tokens = collectAllergyTokens(['우유']);
    expect(isRecipeBlockedByAllergies(['치즈'], tokens)).toBe(true);
    expect(isRecipeBlockedByAllergies(['요거트'], tokens)).toBe(true);
    expect(isRecipeBlockedByAllergies(['버터'], tokens)).toBe(true);
    expect(isRecipeBlockedByAllergies(['생크림'], tokens)).toBe(true);
  });

  it('토마토 알레르기 → 케첩·토마토소스·방울토마토 모두 차단', () => {
    const tokens = collectAllergyTokens(['토마토']);
    expect(isRecipeBlockedByAllergies(['케첩'], tokens)).toBe(true);
    expect(isRecipeBlockedByAllergies(['토마토소스'], tokens)).toBe(true);
    expect(isRecipeBlockedByAllergies(['방울토마토'], tokens)).toBe(true);
  });
});

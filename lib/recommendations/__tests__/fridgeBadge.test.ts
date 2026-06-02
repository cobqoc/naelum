import { describe, it, expect } from 'vitest';
import { getFridgeBadge } from '../fridgeBadge';

// 회귀 안전망: RecipeCard 냉장고 배지 판정. 핵심은 "데이터 불완전 → 초록(바로 가능) 추정 금지".
// 옛 버그(2026-06-03): 추천 API 가 missingIngredientNames 를 안 실어 카드가 length 0 → 모두 "바로 가능".

describe('getFridgeBadge — 방어형 배지 판정', () => {
  it('매칭 미부착(matchRate undefined) → 배지 없음', () => {
    expect(getFridgeBadge({}, 'full')).toBeNull();
    expect(getFridgeBadge({ missingCount: 0, totalIngredients: 5 }, 'full')).toBeNull();
  });

  it('★ footgun: matchRate 있는데 missingCount 부재 → null (초록 오판 금지)', () => {
    // 옛 RecipeCard 라면 missingIngredientNames?? [] → length 0 → "바로 가능" 으로 떨어졌음.
    expect(getFridgeBadge({ matchRate: 50, totalIngredients: 7 }, 'full')).toBeNull();
    expect(getFridgeBadge({ matchRate: 0, totalIngredients: 7 }, 'positive')).toBeNull();
  });

  it('완전 데이터 · 부족 0 · full → 바로 가능', () => {
    expect(getFridgeBadge({ matchRate: 100, missingCount: 0, totalIngredients: 5 }, 'full'))
      .toEqual({ missingCount: 0, isReady: true });
  });

  it('완전 데이터 · 부족 6 · full → 6개 부족(바로 가능 아님)', () => {
    expect(getFridgeBadge({ matchRate: 14, missingCount: 6, totalIngredients: 7 }, 'full'))
      .toEqual({ missingCount: 6, isReady: false });
  });

  it('positive: 바로 가능 아니면 배지 숨김', () => {
    expect(getFridgeBadge({ matchRate: 40, missingCount: 3, totalIngredients: 5 }, 'positive')).toBeNull();
    expect(getFridgeBadge({ matchRate: 100, missingCount: 0, totalIngredients: 5 }, 'positive'))
      .toEqual({ missingCount: 0, isReady: true });
  });

  it('totalIngredients 0 이하 → 판정 불가 → null', () => {
    expect(getFridgeBadge({ matchRate: 0, missingCount: 0, totalIngredients: 0 }, 'full')).toBeNull();
  });
});

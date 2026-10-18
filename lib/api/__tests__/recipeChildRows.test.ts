import { describe, it, expect } from 'vitest';
import {
  normalizeSubstitutesForStorage, namesWithoutIngredientId,
  buildRecipeIngredientRows, buildRecipeStepRows, buildRecipeTagRows, buildTipStepRows, buildTipTagRows,
} from '../recipeChildRows';

// 2026-10-04 API1-37: 레시피·팁 POST/PUT 의 자식 행 매핑 2벌씩 → 빌더 1벌. 기대값은 원본 라우트 매핑 식 그대로 계산한 결과.
describe('normalizeSubstitutesForStorage', () => {
  it('legacy string[]·객체[] → 정규화 객체[], 빈 결과·비배열 → null', () => {
    expect(normalizeSubstitutesForStorage([' 두부 ', { name: '유부', note: ' 반만 ' }, { name: '' }, 3])).toEqual([
      { name: '두부' }, { name: '유부', note: '반만' },
    ]);
    expect(normalizeSubstitutesForStorage([])).toBeNull();
    expect(normalizeSubstitutesForStorage(null)).toBeNull();
    expect(normalizeSubstitutesForStorage('x')).toBeNull();
  });
});

describe('buildRecipeIngredientRows', () => {
  const exactIds = new Map([['양파', 'id-onion']]);
  it('원본 매핑과 같은 행 — 클라 id 우선, 없으면 정확일치, 없으면 null / is_optional 기본 false / display_order 1부터', () => {
    const rows = buildRecipeIngredientRows('r1', [
      { ingredient_name: '양파', quantity: 2, unit: '개' },
      { ingredient_name: '마늘', ingredient_id: 'id-garlic', quantity: '3', unit: '쪽', notes: '다진', is_optional: true, substitutes: ['마늘가루'] },
      { ingredient_name: '고수', ingredient_id: null },
    ], exactIds);
    expect(rows).toEqual([
      { recipe_id: 'r1', ingredient_name: '양파', ingredient_id: 'id-onion', quantity: 2, unit: '개', notes: undefined, is_optional: false, substitutes: null, display_order: 1 },
      { recipe_id: 'r1', ingredient_name: '마늘', ingredient_id: 'id-garlic', quantity: '3', unit: '쪽', notes: '다진', is_optional: true, substitutes: [{ name: '마늘가루' }], display_order: 2 },
      { recipe_id: 'r1', ingredient_name: '고수', ingredient_id: null, quantity: undefined, unit: undefined, notes: undefined, is_optional: false, substitutes: null, display_order: 3 },
    ]);
  });

  it('namesWithoutIngredientId — id 없는 재료 이름만(원본 filter→map 과 동일)', () => {
    expect(namesWithoutIngredientId([
      { ingredient_name: 'a' }, { ingredient_name: 'b', ingredient_id: 'x' }, { ingredient_name: 'c', ingredient_id: '' },
    ])).toEqual(['a', 'c']);
  });
});

describe('buildRecipeStepRows / buildRecipeTagRows', () => {
  it('단계: step_number 1부터, 필드 그대로(빈 값 보정 없음 — 원본과 동일)', () => {
    expect(buildRecipeStepRows('r1', [
      { instruction: '썬다', title: '손질', timer_minutes: 5, tip: '얇게', image_url: 'u' },
      { instruction: '볶는다' },
    ])).toEqual([
      { recipe_id: 'r1', step_number: 1, title: '손질', instruction: '썬다', timer_minutes: 5, tip: '얇게', image_url: 'u' },
      { recipe_id: 'r1', step_number: 2, title: undefined, instruction: '볶는다', timer_minutes: undefined, tip: undefined, image_url: undefined },
    ]);
  });

  it('태그', () => {
    expect(buildRecipeTagRows('r1', ['한식', '간단'])).toEqual([
      { recipe_id: 'r1', tag_name: '한식' }, { recipe_id: 'r1', tag_name: '간단' },
    ]);
  });
});

describe('buildTipStepRows / buildTipTagRows', () => {
  it('팁 단계: tip·image_url 빈 값은 null(원본 `|| null`)', () => {
    expect(buildTipStepRows('t1', [{ instruction: 'a', tip: '', image_url: 'img' }, { instruction: 'b' }])).toEqual([
      { tip_id: 't1', step_number: 1, instruction: 'a', tip: null, image_url: 'img' },
      { tip_id: 't1', step_number: 2, instruction: 'b', tip: null, image_url: null },
    ]);
  });

  it('팁 태그', () => {
    expect(buildTipTagRows('t1', ['손질'])).toEqual([{ tip_id: 't1', tag: '손질' }]);
  });
});

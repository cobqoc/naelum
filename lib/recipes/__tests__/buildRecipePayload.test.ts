import { describe, it, expect } from 'vitest';
import { buildRecipePayload, type RecipeFormState } from '@/lib/recipes/buildRecipePayload';

// recipes/new/page.tsx 의 handleSubmit·handleDraft payload 가 옛 inline 코드와
// byte-identical 인지 회귀 가드. 옛 코드(2026-05-27 분해 직전) 가 만든 객체와
// shape·값 동일해야 함. POST /api/recipes 가 의존하는 boundary.

function makeState(overrides: Partial<RecipeFormState> = {}): RecipeFormState {
  return {
    title: '김치찌개',
    description: '돼지고기 김치찌개',
    thumbnailImage: null,
    ingredientsImage: null,
    servings: '',
    cookTime: '',
    difficulty: '',
    cuisineType: '',
    customCuisineType: '',
    dishType: '',
    customDishType: '',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sodium: '',
    ingredients: [],
    steps: [],
    tags: [],
    remixSourceId: null,
    ...overrides,
  };
}

describe('buildRecipePayload', () => {
  it('최소 state — title/description trim, 빈값 null 정규화', () => {
    const p = buildRecipePayload(makeState({ title: '  김치  ', description: '  맛있음  ' }));
    expect(p.title).toBe('김치');
    expect(p.description).toBe('맛있음');
    expect(p.servings).toBeNull();
    expect(p.cook_time_minutes).toBeNull();
    expect(p.difficulty_level).toBeNull();
    expect(p.calories).toBeNull();
    expect(p.protein_grams).toBeNull();
    expect(p.tags).toEqual([]);
    expect(p.ingredients).toEqual([]);
    expect(p.steps).toEqual([]);
    expect(p.meal_type).toBe('lunch');
    expect(p.is_remix).toBe(false);
    expect(p.original_recipe_id).toBeNull();
  });

  it('status 옵션 미지정 — status 필드 없음 (server-side default published)', () => {
    const p = buildRecipePayload(makeState());
    expect('status' in p).toBe(false);
  });

  it('status: draft — status 필드 추가', () => {
    const p = buildRecipePayload(makeState(), { status: 'draft' });
    expect(p.status).toBe('draft');
  });

  it('숫자 필드 — servings/cookTime 직접 전달, calories parseInt, protein parseFloat', () => {
    const p = buildRecipePayload(makeState({
      servings: 4, cookTime: 30,
      calories: '350', protein: '12.5', carbs: '40', fat: '8.3',
      fiber: '5', sodium: '800',
    }));
    expect(p.servings).toBe(4);
    expect(p.cook_time_minutes).toBe(30);
    expect(p.calories).toBe(350);
    expect(p.protein_grams).toBe(12.5);
    expect(p.carbs_grams).toBe(40);
    expect(p.fat_grams).toBe(8.3);
    expect(p.fiber_grams).toBe(5);
    expect(p.sodium_mg).toBe(800);
  });

  it('cuisine_type/dish_type — 일반값은 그대로, "other"+custom 은 custom 으로 치환', () => {
    const p1 = buildRecipePayload(makeState({ cuisineType: 'korean', dishType: 'soup' }));
    expect(p1.cuisine_type).toBe('korean');
    expect(p1.dish_type).toBe('soup');

    const p2 = buildRecipePayload(makeState({
      cuisineType: 'other', customCuisineType: '  퓨전한식  ',
      dishType: 'other', customDishType: '  사이드  ',
    }));
    expect(p2.cuisine_type).toBe('퓨전한식');
    expect(p2.dish_type).toBe('사이드');

    // "other" 인데 custom 비어있으면 'other' 그대로 (옛 코드 동작 보존)
    const p3 = buildRecipePayload(makeState({ cuisineType: 'other', customCuisineType: '   ' }));
    expect(p3.cuisine_type).toBe('other');
  });

  it('재료 — 빈 이름 filter, trim, quantity parseFloat||null, unit "선택" → null', () => {
    const p = buildRecipePayload(makeState({
      ingredients: [
        { ingredient_name: '  양파  ', ingredient_id: 'uuid-1', quantity: '2', unit: '개', notes: '  중간크기  ', is_optional: false, substitutes: [] },
        { ingredient_name: '', quantity: '1', unit: 'g', notes: '', is_optional: false, substitutes: [] }, // filter 됨
        { ingredient_name: '간장', quantity: '', unit: '선택', notes: '', is_optional: true, substitutes: [] },
      ],
    }));
    const ings = p.ingredients as Array<Record<string, unknown>>;
    expect(ings).toHaveLength(2);
    expect(ings[0]).toEqual({
      ingredient_name: '양파', ingredient_id: 'uuid-1', quantity: 2, unit: '개', notes: '중간크기', is_optional: false, substitutes: [],
    });
    expect(ings[1]).toEqual({
      ingredient_name: '간장', ingredient_id: null, quantity: null, unit: null, notes: null, is_optional: true, substitutes: [],
    });
  });

  it('단계 — 빈 instruction filter, trim, tip 빈문자열 null', () => {
    const p = buildRecipePayload(makeState({
      steps: [
        { instruction: '  볶는다  ', timer_minutes: 5, tip: '  팁  ', image_url: 'url1' },
        { instruction: '', timer_minutes: null, tip: '', image_url: null }, // filter
        { instruction: '끓인다', timer_minutes: null, tip: '', image_url: null },
      ],
    }));
    const steps = p.steps as Array<Record<string, unknown>>;
    expect(steps).toHaveLength(2);
    expect(steps[0]).toEqual({ instruction: '볶는다', timer_minutes: 5, tip: '팁', image_url: 'url1' });
    expect(steps[1]).toEqual({ instruction: '끓인다', timer_minutes: null, tip: null, image_url: null });
  });

  it('remix tracking — remixSourceId 있으면 original_recipe_id + is_remix=true', () => {
    const p = buildRecipePayload(makeState({ remixSourceId: 'remix-uuid' }));
    expect(p.original_recipe_id).toBe('remix-uuid');
    expect(p.is_remix).toBe(true);
  });

  it('식단 옵션 — boolean 그대로 전달', () => {
    const p = buildRecipePayload(makeState({ isVegetarian: true, isVegan: false, isGlutenFree: true }));
    expect(p.is_vegetarian).toBe(true);
    expect(p.is_vegan).toBe(false);
    expect(p.is_gluten_free).toBe(true);
  });

  it('thumbnail/ingredients 이미지 url — string 또는 null 그대로', () => {
    const p1 = buildRecipePayload(makeState({ thumbnailImage: 'https://...', ingredientsImage: null }));
    expect(p1.thumbnail_url).toBe('https://...');
    expect(p1.ingredients_image_url).toBeNull();
  });
});

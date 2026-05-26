import type { RecipeIngredient, RecipeStep } from '@/lib/constants/recipe';

// handleSubmit·handleDraft 의 payload 빌딩이 byte-identical 중복(~75줄 × 2) 이라
// 단일 진실 소스로 추출. 차이는 `status: 'draft'` 한 줄뿐 — options.status 로 분기.
// boundary 함수(POST /api/recipes 바로 직전) 라 순수 — 외부 의존성 0, vitest 가능.

export interface RecipeFormState {
  title: string;
  description: string;
  thumbnailImage: string | null;
  ingredientsImage: string | null;
  servings: number | '';
  cookTime: number | '';
  difficulty: string;
  cuisineType: string;
  customCuisineType: string;
  dishType: string;
  customDishType: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sodium: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tags: string[];
  remixSourceId?: string | null;
}

export interface BuildPayloadOptions {
  /** 'draft' 지정 시 임시저장. 미지정 시 server-side default(`published`) 사용 — handleSubmit. */
  status?: 'draft';
}

/**
 * 폼 상태 → POST /api/recipes body 객체.
 * - 빈 문자열·'선택' 센티넬 → null 정규화
 * - 숫자 필드 parseFloat/parseInt
 * - 재료/단계 trim + 빈 값 필터는 호출자 책임(검증 단계와 분리)
 */
export function buildRecipePayload(
  state: RecipeFormState,
  options: BuildPayloadOptions = {},
): Record<string, unknown> {
  const validIngredients = state.ingredients.filter(i => i.ingredient_name.trim());
  const validSteps = state.steps.filter(s => s.instruction.trim());

  const payload: Record<string, unknown> = {
    title: state.title.trim(),
    description: state.description.trim(),
    thumbnail_url: state.thumbnailImage,
    ingredients_image_url: state.ingredientsImage,
    servings: state.servings !== '' ? state.servings : null,
    cook_time_minutes: state.cookTime !== '' ? state.cookTime : null,
    difficulty_level: state.difficulty || null,
    cuisine_type: state.cuisineType === 'other' && state.customCuisineType.trim()
      ? state.customCuisineType.trim()
      : state.cuisineType,
    dish_type: state.dishType === 'other' && state.customDishType.trim()
      ? state.customDishType.trim()
      : state.dishType,
    meal_type: 'lunch',
    is_vegetarian: state.isVegetarian,
    is_vegan: state.isVegan,
    is_gluten_free: state.isGlutenFree,
    calories: state.calories ? parseInt(state.calories) : null,
    protein_grams: state.protein ? parseFloat(state.protein) : null,
    carbs_grams: state.carbs ? parseFloat(state.carbs) : null,
    fat_grams: state.fat ? parseFloat(state.fat) : null,
    fiber_grams: state.fiber ? parseFloat(state.fiber) : null,
    sodium_mg: state.sodium ? parseInt(state.sodium) : null,
    ingredients: validIngredients.map(i => ({
      ingredient_name: i.ingredient_name.trim(),
      ingredient_id: i.ingredient_id ?? null,
      quantity: parseFloat(i.quantity) || null,
      unit: (i.unit && i.unit !== '선택') ? i.unit : null,
      notes: i.notes.trim() || null,
      is_optional: i.is_optional,
      substitutes: i.substitutes ?? [],
    })),
    steps: validSteps.map(s => ({
      instruction: s.instruction.trim(),
      timer_minutes: s.timer_minutes,
      tip: s.tip.trim() || null,
      image_url: s.image_url,
    })),
    tags: state.tags,
    original_recipe_id: state.remixSourceId || null,
    is_remix: !!state.remixSourceId,
  };

  if (options.status === 'draft') {
    payload.status = 'draft';
  }

  return payload;
}

import { normalizeSubstitutes } from '@/lib/recipes/substituteChips';

/**
 * 레시피·팁 자식 행(재료·단계·태그) 빌더 — POST(생성)·PUT(수정) 라우트에 2벌씩 있던 런타임 동일 매핑의 단일 출처.
 * (2026-10-04 API1-37, 행위보존: 필드 식을 원본 그대로 옮김. 라우트의 조건·delete→insert 순서·에러 문구는 각 라우트에 그대로)
 */

/** legacy string[] / 신규 객체[] 어느 입력이든 정규화된 객체[]로 저장(없으면 null) — 원본 두 라우트의 같은 함수. */
export function normalizeSubstitutesForStorage(raw: unknown): unknown[] | null {
  const list = normalizeSubstitutes(raw);
  return list.length > 0 ? list : null;
}

export interface RecipeIngredientInput {
  ingredient_name: string;
  ingredient_id?: string | null;
  quantity?: unknown;
  unit?: unknown;
  notes?: unknown;
  is_optional?: boolean;
  substitutes?: unknown;
}

/** 클라가 번호(ingredient_id)를 안 준 재료 이름 — 이름 정확일치 해석(resolveExactIngredientIds) 대상. */
export function namesWithoutIngredientId(ingredients: RecipeIngredientInput[]): string[] {
  return ingredients.filter(i => !i.ingredient_id).map(i => i.ingredient_name);
}

export function buildRecipeIngredientRows(
  recipeId: string,
  ingredients: RecipeIngredientInput[],
  exactIds: Map<string, string>,
) {
  return ingredients.map((ing, index) => ({
    recipe_id: recipeId,
    ingredient_name: ing.ingredient_name,
    ingredient_id: ing.ingredient_id || exactIds.get(ing.ingredient_name) || null,
    quantity: ing.quantity,
    unit: ing.unit,
    notes: ing.notes,
    is_optional: ing.is_optional || false,
    substitutes: normalizeSubstitutesForStorage(ing.substitutes),
    display_order: index + 1,
  }));
}

export interface RecipeStepInput {
  title?: unknown;
  instruction: unknown;
  timer_minutes?: unknown;
  tip?: unknown;
  image_url?: unknown;
}

export function buildRecipeStepRows(recipeId: string, steps: RecipeStepInput[]) {
  return steps.map((step, index) => ({
    recipe_id: recipeId,
    step_number: index + 1,
    title: step.title,
    instruction: step.instruction,
    timer_minutes: step.timer_minutes,
    tip: step.tip,
    image_url: step.image_url,
  }));
}

export function buildRecipeTagRows(recipeId: string, tags: string[]) {
  return tags.map(tag => ({
    recipe_id: recipeId,
    tag_name: tag,
  }));
}

export interface TipStepInput {
  instruction: unknown;
  tip?: unknown;
  image_url?: unknown;
}

export function buildTipStepRows(tipId: string, steps: TipStepInput[]) {
  return steps.map((step, idx) => ({
    tip_id: tipId,
    step_number: idx + 1,
    instruction: step.instruction,
    tip: step.tip || null,
    image_url: step.image_url || null,
  }));
}

export function buildTipTagRows(tipId: string, tags: string[]) {
  return tags.map(tag => ({ tip_id: tipId, tag }));
}

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

/**
 * 자식 배열 사전 검증 — 부모 쓰기 *전에* 호출해 잘못된 입력을 400 으로 돌려보낸다 (2026-10-19 감사 API1-06 1차).
 * 이전엔 부모 저장 → 자식 delete → insert 순서에서 insert 가 DB 제약(varchar 길이·numeric 범위)에 걸리면 500 과 함께
 * 기존 재료·단계·태그가 전부 사라지거나, 새 레시피가 재료 0개로 공개됐다. 한도는 prod 컬럼 정의(2026-10-19 실측)와 같다.
 * 반환: 오류 문구(API 문자열 — 클라는 번역 문구로 치환) 또는 null.
 */
const QUANTITY_MAX = 99_999_999.99 // recipe_ingredients.quantity numeric(10,2)
const INT_MAX = 2_147_483_647

function isBlankish(v: unknown): boolean {
  return v === undefined || v === null || v === ''
}

function tooLong(v: unknown, max: number): boolean {
  return !isBlankish(v) && (typeof v !== 'string' || v.length > max)
}

export function validateRecipeChildren(input: { ingredients?: unknown; steps?: unknown; tags?: unknown }): string | null {
  const { ingredients, steps, tags } = input
  if (ingredients !== undefined && ingredients !== null) {
    if (!Array.isArray(ingredients)) return '재료 형식이 올바르지 않습니다.'
    for (const ing of ingredients as Record<string, unknown>[]) {
      if (!ing || typeof ing.ingredient_name !== 'string' || !ing.ingredient_name.trim()) return '재료 이름을 입력해주세요.'
      if (ing.ingredient_name.length > 100) return '재료 이름은 100자 이내로 입력해주세요.'
      if (tooLong(ing.unit, 50)) return '재료 단위는 50자 이내로 입력해주세요.'
      if (!isBlankish(ing.quantity)) {
        const q = typeof ing.quantity === 'number' ? ing.quantity : Number(ing.quantity)
        if (!Number.isFinite(q) || Math.abs(q) > QUANTITY_MAX) return '재료 수량이 올바르지 않습니다.'
      }
    }
  }
  if (steps !== undefined && steps !== null) {
    if (!Array.isArray(steps)) return '조리 단계 형식이 올바르지 않습니다.'
    for (const step of steps as Record<string, unknown>[]) {
      if (!step || typeof step.instruction !== 'string') return '조리 단계 내용을 입력해주세요.'
      if (tooLong(step.title, 200)) return '단계 제목은 200자 이내로 입력해주세요.'
      if (!isBlankish(step.timer_minutes)) {
        const t = Number(step.timer_minutes)
        if (!Number.isInteger(t) || t < 0 || t > INT_MAX) return '타이머 시간이 올바르지 않습니다.'
      }
    }
  }
  return validateTagList(tags, 50)
}

/** 팁 자식 배열 — tip_steps.instruction 필수, tip_tags.tag varchar(100). */
export function validateTipChildren(input: { steps?: unknown; tags?: unknown }): string | null {
  const { steps, tags } = input
  if (steps !== undefined && steps !== null) {
    if (!Array.isArray(steps)) return '단계 형식이 올바르지 않습니다.'
    for (const step of steps as Record<string, unknown>[]) {
      if (!step || typeof step.instruction !== 'string') return '단계 내용을 입력해주세요.'
    }
  }
  return validateTagList(tags, 100)
}

function validateTagList(tags: unknown, max: number): string | null {
  if (tags === undefined || tags === null) return null
  if (!Array.isArray(tags)) return '태그 형식이 올바르지 않습니다.'
  for (const tag of tags) {
    if (typeof tag !== 'string' || !tag.trim()) return '태그 형식이 올바르지 않습니다.'
    if (tag.length > max) return `태그는 ${max}자 이내로 입력해주세요.`
  }
  return null
}

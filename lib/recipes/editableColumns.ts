/**
 * 사용자가 직접 수정 가능한 `recipes` 컬럼 화이트리스트 — mass-assignment 방어 (H1).
 *
 * POST/PUT 라우트가 `body` 를 `...recipeData` 로 통째 update/insert 하면, 소유자가
 * `average_rating`·`cooked_count`·`views_count`·`likes_count`·`saves_count`·`status`·
 * `published_at`·`author_id`·`is_featured` 등을 직접 세팅해 카운터 RPC 우회·trending/rating
 * sort 오염이 가능하다. 이 화이트리스트의 *콘텐츠 컬럼만* 통과시켜 차단한다.
 *
 * 제외된 컬럼은 전용 경로로만 갱신:
 *  - status/published_at → `recipes/[id]/visibility` 라우트 (PUT) · POST 의 명시 분기
 *  - average_rating/cooked_count/views_count/likes_count/saves_count → RPC·트리거
 *  - author_id → 생성 시 서버가 user.id 로 강제, 이후 불변 (RLS WITH CHECK)
 *  - is_remix/original_recipe_id → 생성 시에만 (편집으로 remix 정체성 변경 불가)
 *
 * 새 사용자 편집 가능 컬럼 추가 시 이 배열에 명시적으로 추가할 것.
 */
export const EDITABLE_RECIPE_COLUMNS = [
  'thumbnail_url',
  'ingredients_image_url',
  'servings',
  'cook_time_minutes',
  'difficulty_level',
  'cuisine_type',
  'dish_type',
  'meal_type',
  'is_vegetarian',
  'is_vegan',
  'is_gluten_free',
  'calories',
  'protein_grams',
  'carbs_grams',
  'fat_grams',
  'fiber_grams',
  'sodium_mg',
] as const;

/** body 에서 편집 가능 콘텐츠 컬럼만 골라낸다 (존재하는 키만). */
export function pickEditableRecipeColumns(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const col of EDITABLE_RECIPE_COLUMNS) {
    if (col in body) out[col] = body[col];
  }
  return out;
}

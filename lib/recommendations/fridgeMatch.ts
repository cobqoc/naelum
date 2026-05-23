import { createClient } from '@/lib/supabase/client'
import { computeRecipeMatch, type RecipeMatchResult } from './match'

type SupabaseClient = ReturnType<typeof createClient>

/**
 * 레시피 배열에 냉장고 match(보유/대체/없음) 부착 — 추천 외 페이지(전체·검색)용 클라이언트 헬퍼.
 *
 * 추천 페이지는 서버(API)에서 match 를 계산하지만, 전체·검색 페이지는 ISR/동적 fetch라
 * 클라이언트에서 계산한다. 핵심 매칭은 computeRecipeMatch 단일 출처 — 세 페이지 카운트 일치.
 * 비로그인이거나 냉장고가 비면 match 없이 그대로 반환 → 카드에 냉장고 줄이 안 뜬다.
 * 호출처는 setState 전에 await — 카드가 첫 렌더부터 줄을 포함해 layout shift 방지.
 */
export async function attachFridgeMatch<T extends { id: string }>(
  supabase: SupabaseClient,
  userId: string | null,
  recipes: T[],
): Promise<(T & Partial<RecipeMatchResult>)[]> {
  if (!userId || recipes.length === 0) return recipes

  const { data: userIngredients } = await supabase
    .from('user_ingredients')
    .select('ingredient_name, ingredient_id')
    .eq('user_id', userId)
  if (!userIngredients || userIngredients.length === 0) return recipes

  const names = userIngredients.map(i => i.ingredient_name.toLowerCase())
  const idSet = new Set<string>(
    userIngredients.filter(i => i.ingredient_id).map(i => i.ingredient_id as string),
  )

  const { data: riRows } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id, ingredient_name, ingredient_id, is_optional, substitutes')
    .in('recipe_id', recipes.map(r => r.id))

  const byRecipe = new Map<string, { ingredient_name: string; ingredient_id: string | null; is_optional?: boolean; substitutes?: (string | { name?: string; note?: string })[] | null }[]>()
  for (const row of riRows ?? []) {
    const arr = byRecipe.get(row.recipe_id) ?? []
    arr.push({
      ingredient_name: row.ingredient_name,
      ingredient_id: row.ingredient_id,
      is_optional: row.is_optional ?? false,
      // legacy string[] / 신규 객체[] — computeRecipeMatch 가 두 형식 모두 처리.
      substitutes: Array.isArray(row.substitutes) ? (row.substitutes as (string | { name?: string; note?: string })[]) : null,
    })
    byRecipe.set(row.recipe_id, arr)
  }

  return recipes.map(r => ({
    ...r,
    ...computeRecipeMatch(names, idSet, byRecipe.get(r.id) ?? []),
  }))
}

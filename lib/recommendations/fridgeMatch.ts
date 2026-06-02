import { createClient } from '@/lib/supabase/client'
import { matchRecipe, assembleRecipeMatchFields, type RecipeIngredientInput } from './matchV2'
import { fetchRelationsForRecipe, fetchUserVariantBases, fetchUnitCoeffs } from './fetchRelations'

type SupabaseClient = ReturnType<typeof createClient>

export interface FridgeMatchResult {
  ownedCount: number
  totalIngredients: number
  matchRate: number
  ingredientStatus: 'none' | 'partial' | 'all'
  ownedIngredientNames: string[]
  missingIngredientNames: string[]
  substitutableIngredients: { ingredient: string; via: string }[]
  matchedCount: number
  missingCount: number
}

/**
 * V2 레시피 배열에 냉장고 match 부착 (2026-05-29).
 *
 * 전체·검색 페이지용 클라이언트 헬퍼. 추천 페이지는 서버(API)에서 같은 매칭.
 * V2 변화:
 *   - 옛: computeRecipeMatch + 이름 매칭 + 정규화 + 코드 상수 lookup
 *   - V2: matchRecipe + ingredient_id 그래프 + DB ingredient_relations
 *   - 정규화·추측 0
 *
 * 비로그인 또는 냉장고 빈 경우 match 없이 그대로 반환.
 */
export async function attachFridgeMatch<T extends { id: string }>(
  supabase: SupabaseClient,
  userId: string | null,
  recipes: T[],
): Promise<(T & Partial<FridgeMatchResult>)[]> {
  if (!userId || recipes.length === 0) return recipes

  const { data: userIngredients } = await supabase
    .from('user_ingredients')
    .select('ingredient_name, ingredient_id, quantity, unit')
    .eq('user_id', userId)
  if (!userIngredients || userIngredients.length === 0) return recipes

  const userIdSet = new Set<string>(
    userIngredients
      .filter(i => i.ingredient_id !== null && i.ingredient_id !== undefined)
      .map(i => i.ingredient_id as string),
  )
  const userIdToName = new Map<string, string>()
  // 양 매칭(Phase 2) — 보유 재료 양 맵
  const userQtyMap = new Map<string, { quantity: number | null; unit: string | null }>()
  for (const ui of userIngredients) {
    if (ui.ingredient_id) {
      userIdToName.set(ui.ingredient_id as string, ui.ingredient_name)
      userQtyMap.set(ui.ingredient_id as string, { quantity: ui.quantity ?? null, unit: ui.unit ?? null })
    }
  }

  const { data: riRows } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id, ingredient_name, ingredient_id, is_optional, quantity, unit')
    .in('recipe_id', recipes.map(r => r.id))

  const byRecipe = new Map<string, RecipeIngredientInput[]>()
  for (const row of riRows ?? []) {
    const arr = byRecipe.get(row.recipe_id) ?? []
    arr.push({
      ingredient_id: row.ingredient_id ?? null,
      ingredient_name: row.ingredient_name,
      is_optional: row.is_optional ?? false,
      quantity: row.quantity ?? null,
      unit: row.unit ?? null,
    })
    byRecipe.set(row.recipe_id, arr)
  }

  // 모든 레시피 재료의 id 모음 → 한 번에 그래프 fetch
  const allRecipeIngredientIds = Array.from(
    new Set(
      Array.from(byRecipe.values())
        .flat()
        .map(i => i.ingredient_id)
        .filter((id): id is string => id !== null),
    ),
  )
  const graph = await fetchRelationsForRecipe(allRecipeIngredientIds, supabase)
  const userBaseMap = await fetchUserVariantBases([...userIdSet], supabase)
  const coeffsMap = await fetchUnitCoeffs(allRecipeIngredientIds, supabase)

  return recipes.map(r => {
    const ingredients = byRecipe.get(r.id) ?? []
    const summary = matchRecipe(ingredients, userIdSet, graph, userBaseMap, userQtyMap, coeffsMap)
    return { ...r, ...assembleRecipeMatchFields(ingredients, summary, userIdToName) }
  })
}

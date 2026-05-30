import { createClient } from '@/lib/supabase/client'
import { matchRecipe, type RecipeIngredientInput } from './matchV2'
import { fetchRelationsForRecipe, fetchUserVariantBases } from './fetchRelations'

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
    .select('ingredient_name, ingredient_id')
    .eq('user_id', userId)
  if (!userIngredients || userIngredients.length === 0) return recipes

  const userIdSet = new Set<string>(
    userIngredients
      .filter(i => i.ingredient_id !== null && i.ingredient_id !== undefined)
      .map(i => i.ingredient_id as string),
  )
  const userIdToName = new Map<string, string>()
  for (const ui of userIngredients) {
    if (ui.ingredient_id) userIdToName.set(ui.ingredient_id as string, ui.ingredient_name)
  }

  const { data: riRows } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id, ingredient_name, ingredient_id, is_optional')
    .in('recipe_id', recipes.map(r => r.id))

  const byRecipe = new Map<string, RecipeIngredientInput[]>()
  for (const row of riRows ?? []) {
    const arr = byRecipe.get(row.recipe_id) ?? []
    arr.push({
      ingredient_id: row.ingredient_id ?? null,
      ingredient_name: row.ingredient_name,
      is_optional: row.is_optional ?? false,
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

  return recipes.map(r => {
    const ingredients = byRecipe.get(r.id) ?? []
    const summary = matchRecipe(ingredients, userIdSet, graph, userBaseMap)
    const ownedIngredientNames: string[] = []
    const missingIngredientNames: string[] = []
    const substitutableIngredients: { ingredient: string; via: string }[] = []
    summary.results.forEach((result, i) => {
      const ing = ingredients[i]
      if (ing.is_optional) return
      if (result.kind === 'owned') ownedIngredientNames.push(ing.ingredient_name)
      else if (result.via) {
        const viaName = userIdToName.get(result.via) ?? ''
        if (viaName) substitutableIngredients.push({ ingredient: ing.ingredient_name, via: viaName })
        else missingIngredientNames.push(ing.ingredient_name)
      } else {
        missingIngredientNames.push(ing.ingredient_name)
      }
    })
    return {
      ...r,
      ownedCount: summary.ownedCount,
      totalIngredients: summary.totalCount,
      matchRate: summary.matchRate,
      ingredientStatus: summary.ingredientStatus,
      ownedIngredientNames,
      missingIngredientNames,
      substitutableIngredients,
      matchedCount: summary.ownedCount + substitutableIngredients.length,
      missingCount: missingIngredientNames.length,
    }
  })
}

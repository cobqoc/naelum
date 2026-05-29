import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { INTEREST_TYPE_CUISINE } from '@/lib/constants/userPreferences'
import { matchRecipe, type RecipeIngredientInput } from '@/lib/recommendations/matchV2'
import { fetchRelationsForRecipe, fetchAllergensForRecipe } from '@/lib/recommendations/fetchRelations'
import { isRecipeBlockedV2, normalizeUserAllergens } from '@/lib/recommendations/allergyFilterV2'

// V2 알레르기 필터 — DB allergens 컬럼 lookup (2026-05-29).
// substring 매칭·정규화 추측 제거. ingredient_id 기반 정확 매칭만.
// user_allergies 테이블 → 사용자 알레르기 키워드 → 재료 마스터의 allergens 비교.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function filterByAllergies<T extends Record<string, any>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  recipes: T[]
): Promise<T[]> {
  const { data: allergies, error } = await supabase
    .from('user_allergies')
    .select('ingredient_name')
    .eq('user_id', userId)

  // DB 일시 장애 시 보수적 통과 (안전 critical 이지만 가용성 우선).
  if (error) {
    console.error('[filterByAllergies] user_allergies read failed:', error)
    return recipes
  }
  if (!allergies || allergies.length === 0) return recipes

  const userAllergens = normalizeUserAllergens(
    allergies.map((a: { ingredient_name: string | null }) => a.ingredient_name).filter((n: string | null): n is string => !!n)
  )
  if (userAllergens.length === 0) return recipes

  // 모든 레시피 재료의 id 모음 → 한 번에 allergens fetch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getIngs = (r: any): { ingredient_id?: string | null }[] => (r?.ingredients ?? []) as { ingredient_id?: string | null }[]
  const allIds = Array.from(
    new Set(
      recipes
        .flatMap(r => getIngs(r))
        .map(i => i.ingredient_id)
        .filter((id): id is string => !!id),
    ),
  )
  if (allIds.length === 0) return recipes

  const allergensMap = await fetchAllergensForRecipe(allIds, supabase)

  return recipes.filter(recipe => {
    const recipeIds = getIngs(recipe)
      .map(i => i.ingredient_id)
      .filter((id): id is string => !!id)
    const recipeAllergensMap = new Map<string, string[]>()
    for (const id of recipeIds) {
      const a = allergensMap.get(id)
      if (a) recipeAllergensMap.set(id, a)
    }
    return !isRecipeBlockedV2(recipeAllergensMap, userAllergens)
  })
}

// 추천 mode 술어 — V2 ownedCount·totalCount·missingCount 기반.
type RecipeWithMatch = {
  ownedCount: number
  totalIngredients: number
  matchRate: number
  matchedCount: number
  missingCount: number
}

function isReady(r: RecipeWithMatch): boolean {
  return r.totalIngredients > 0 && r.ownedCount === r.totalIngredients
}
function isAlmost(r: RecipeWithMatch): boolean {
  return r.missingCount >= 1 && r.missingCount <= 3
}
function isAny(r: RecipeWithMatch): boolean {
  return r.matchRate > 0
}

// GET /api/recommendations - 재료 기반 레시피 추천
export async function GET(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
  const { allowed } = await checkRateLimit(`recommendations:${ip}`, { windowMs: 60 * 1000, maxRequests: 20 })
  if (!allowed) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const type = searchParams.get('type') || 'ingredients'
  const rawLimit = parseInt(searchParams.get('limit') || '12')
  const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 12 : rawLimit), 50)
  // 재료 기반 mode: ready(부족 0) | almost(부족 1~3) | all(매칭 >0). ingredients type 에서만 사용.
  // 'auto'면 서버가 bestMode 자동 판단 (바로 가능 ≥1 → ready, 아니면 almost → all 순서).
  const modeParam = (searchParams.get('mode') || 'auto') as 'auto' | 'ready' | 'almost' | 'all'

  const { data: { user } } = await supabase.auth.getUser()

  let recommendations: unknown[] = []
  let resolvedMode: typeof modeParam = modeParam

  try {
    switch (type) {
      case 'ingredients': {
        // 체험 모드: 비로그인 시 쿼리 파라미터로 재료 전달 (ingredients=토마토,양파,...)
        let ingredientNames: string[] = []
        let userIngredientIds: string[] = []

        if (user) {
          const { data: userIngredients } = await supabase
            .from('user_ingredients')
            .select('ingredient_name, ingredient_id')
            .eq('user_id', user.id)
          if (!userIngredients || userIngredients.length === 0) {
            return NextResponse.json({ recommendations: [], message: '보유 재료를 먼저 등록해주세요' })
          }
          ingredientNames = userIngredients.map(i => i.ingredient_name.toLowerCase())
          userIngredientIds = userIngredients
            .filter(i => i.ingredient_id)
            .map(i => i.ingredient_id as string)
        } else {
          const rawIngredients = searchParams.get('ingredients') || ''
          ingredientNames = rawIngredients
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 30)
          if (ingredientNames.length === 0) {
            return NextResponse.json({ recommendations: [], message: '보유 재료를 먼저 등록해주세요' })
          }
        }

        const userIdSet = new Set(userIngredientIds)

        // V2: 후보 검색 — FK 우선, 이름 ilike fallback (코드 상수 확장 제거)
        let idCandidateIds: string[] = []
        if (userIngredientIds.length > 0) {
          const { data: idCandidateRows } = await supabase
            .from('recipe_ingredients')
            .select('recipe_id')
            .in('ingredient_id', userIngredientIds)
          idCandidateIds = idCandidateRows?.map(r => r.recipe_id) ?? []
        }

        // 이름 ilike fallback — 옛 데이터의 ingredient_id null 케이스 대응. V2 매칭은
        // ID 기반이지만 후보 검색 단계는 이름으로 보강 (sweep 최소화).
        let nameCandidateIds: string[] = []
        if (ingredientNames.length > 0) {
          const ilikeClauses = ingredientNames
            .slice(0, 20)
            .map(ing => `ingredient_name.ilike.%${ing}%`)
            .join(',')
          const { data: nameCandidateRows } = await supabase
            .from('recipe_ingredients')
            .select('recipe_id')
            .or(ilikeClauses)
          nameCandidateIds = nameCandidateRows?.map(r => r.recipe_id) ?? []
        }

        const candidateIds = [...new Set([...idCandidateIds, ...nameCandidateIds])]
        if (!candidateIds.length) {
          return NextResponse.json({ recommendations: [], mode: resolvedMode })
        }

        // 후보 레시피 fetch — ingredient_id 포함
        const { data: recipes } = await supabase
          .from('recipes')
          .select(`
            id, title, description, thumbnail_url, display_image,
            prep_time_minutes, cook_time_minutes, difficulty_level, dish_type,
            average_rating, servings,
            author:profiles!recipes_author_id_fkey(username, avatar_url),
            ingredients:recipe_ingredients(ingredient_name, ingredient_id, is_optional)
          `)
          .eq('status', 'published')
          .in('id', candidateIds.slice(0, 300))

        if (!recipes) {
          return NextResponse.json({ recommendations: [], mode: resolvedMode })
        }

        // 알레르기 필터링 V2 (로그인 사용자만)
        const filteredRecipes = user
          ? await filterByAllergies(supabase, user.id, recipes)
          : recipes

        // V2 매칭 — ingredient_relations 그래프 한 번에 fetch
        const allRecipeIngredientIds = Array.from(
          new Set(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (filteredRecipes as any[])
              .flatMap(r => r.ingredients ?? [])
              .map((i: { ingredient_id: string | null }) => i.ingredient_id)
              .filter((id: string | null): id is string => !!id),
          ),
        )
        const graph = await fetchRelationsForRecipe(allRecipeIngredientIds, supabase)

        // 분류 — V2 matchRecipe (ID 기반, 그래프 lookup)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recipesWithMatch = filteredRecipes.map((recipe: any) => {
          const ingredients: RecipeIngredientInput[] = (recipe.ingredients ?? []).map(
            (i: { ingredient_id: string | null; ingredient_name: string; is_optional?: boolean }) => ({
              ingredient_id: i.ingredient_id ?? null,
              ingredient_name: i.ingredient_name,
              is_optional: i.is_optional ?? false,
            }),
          )
          const summary = matchRecipe(ingredients, userIdSet, graph)
          const matchedCount = summary.results.filter(
            (res, i) => !ingredients[i].is_optional && (res.kind === 'owned' || res.kind === 'preparable' || res.kind === 'substitute'),
          ).length
          const missingCount = summary.totalCount - matchedCount
          return {
            ...recipe,
            ownedCount: summary.ownedCount,
            totalIngredients: summary.totalCount,
            matchRate: summary.matchRate,
            matchedCount,
            missingCount,
            ingredientStatus: summary.ingredientStatus,
          }
        })


        // 'auto' 모드: 서버가 가장 유용한 결과 선택
        if (modeParam === 'auto') {
          if (recipesWithMatch.some(isReady)) resolvedMode = 'ready'
          else if (recipesWithMatch.some(isAlmost)) resolvedMode = 'almost'
          else resolvedMode = 'all'
        }

        const predicate =
          resolvedMode === 'ready' ? isReady :
          resolvedMode === 'almost' ? isAlmost :
          isAny

        recommendations = recipesWithMatch
          .filter(predicate)
          .sort((a, b) => {
            // 부족 재료 적은 순(= 만들기 쉬운 순) → 매칭률 → 평점.
            // "재료 N개만 더 있으면" 추천이라 작은 N 이 위로 와야 자연스럽다.
            if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount
            if (b.matchRate !== a.matchRate) return b.matchRate - a.matchRate
            return (b.average_rating || 0) - (a.average_rating || 0)
          })
          .slice(0, limit)

        break
      }

      case 'personalized': {
        if (!user) {
          const { data } = await supabase
            .from('recipes')
            .select(`
              id, title, description, thumbnail_url, display_image,
              prep_time_minutes, cook_time_minutes, difficulty_level, dish_type,
              average_rating,
              author:profiles!recipes_author_id_fkey(username, avatar_url)
            `)
            .eq('status', 'published')
            .order('average_rating', { ascending: false })
            .limit(limit)

          recommendations = data || []
        } else {
          // 사용자 관심사 조회
          const { data: interests } = await supabase
            .from('user_interests')
            .select('interest_value')
            .eq('user_id', user.id)
            .eq('interest_type', INTEREST_TYPE_CUISINE)

          const cuisineTypes = interests?.map(i => i.interest_value) || []

          let query = supabase
            .from('recipes')
            .select(`
              id, title, description, thumbnail_url, display_image,
              prep_time_minutes, cook_time_minutes, difficulty_level, dish_type,
              average_rating, cuisine_type,
              author:profiles!recipes_author_id_fkey(username, avatar_url),
              ingredients:recipe_ingredients(ingredient_name)
            `)
            .eq('status', 'published')

          if (cuisineTypes.length > 0) {
            query = query.in('cuisine_type', cuisineTypes)
          }

          const { data } = await query
            .order('average_rating', { ascending: false })
            .limit(limit * 2) // 알레르기 필터링 후 부족할 수 있으므로 여유분

          let results = data || []

          // 알레르기 필터링
          results = await filterByAllergies(supabase, user.id, results)

          recommendations = results.slice(0, limit)
        }
        break
      }

      case 'trending': {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        // 최근 7일간 가장 많이 만들어진 레시피
        const { data: trendingCooked } = await supabase
          .from('cooking_sessions')
          .select('recipe_id')
          .not('completed_at', 'is', null)
          .gte('completed_at', weekAgo.toISOString())

        if (trendingCooked && trendingCooked.length > 0) {
          // 레시피별 만들어본 횟수 집계
          const cookedCounts = new Map<string, number>()
          trendingCooked.forEach(s => {
            cookedCounts.set(s.recipe_id, (cookedCounts.get(s.recipe_id) || 0) + 1)
          })

          // 상위 레시피 ID 추출
          const topRecipeIds = [...cookedCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id]) => id)

          if (topRecipeIds.length > 0) {
            const { data } = await supabase
              .from('recipes')
              .select(`
                id, title, description, thumbnail_url, display_image,
                prep_time_minutes, cook_time_minutes, difficulty_level, dish_type,
                average_rating, views_count,
                author:profiles!recipes_author_id_fkey(username, avatar_url)
              `)
              .eq('status', 'published')
              .in('id', topRecipeIds)

            // cooked_count 추가 후 정렬
            recommendations = (data || [])
              .map(r => ({ ...r, cooked_count: cookedCounts.get(r.id) || 0 }))
              .sort((a, b) => (b.cooked_count || 0) - (a.cooked_count || 0))
          }
        }

        // 트렌딩 결과가 없으면 최근 높은 평점 레시피로 대체
        if (recommendations.length === 0) {
          const { data } = await supabase
            .from('recipes')
            .select(`
              id, title, description, thumbnail_url, display_image,
              prep_time_minutes, cook_time_minutes, difficulty_level, dish_type,
              average_rating, views_count,
              author:profiles!recipes_author_id_fkey(username, avatar_url)
            `)
            .eq('status', 'published')
            .order('average_rating', { ascending: false })
            .limit(limit)

          recommendations = data || []
        }
        break
      }

      case 'meal_time': {
        const hour = new Date().getHours()
        let mealType: string

        if (hour >= 6 && hour < 10) {
          mealType = 'breakfast'
        } else if (hour >= 11 && hour < 14) {
          mealType = 'lunch'
        } else if (hour >= 17 && hour < 21) {
          mealType = 'dinner'
        } else {
          mealType = 'snack'
        }

        const { data } = await supabase
          .from('recipes')
          .select(`
            id, title, description, thumbnail_url, display_image,
            prep_time_minutes, cook_time_minutes, difficulty_level, dish_type,
            average_rating, meal_type,
            author:profiles!recipes_author_id_fkey(username, avatar_url)
          `)
          .eq('status', 'published')
          .eq('meal_type', mealType)
          .order('average_rating', { ascending: false })
          .limit(limit)

        recommendations = data || []

        if (recommendations.length === 0) {
          const { data: fallback } = await supabase
            .from('recipes')
            .select(`
              id, title, description, thumbnail_url, display_image,
              prep_time_minutes, cook_time_minutes, difficulty_level, dish_type,
              average_rating,
              author:profiles!recipes_author_id_fkey(username, avatar_url)
            `)
            .eq('status', 'published')
            .order('average_rating', { ascending: false })
            .limit(limit)

          recommendations = fallback || []
        }
        break
      }
    }
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json({ error: '추천을 불러오는데 실패했습니다' }, { status: 500 })
  }

  // 로그인 사용자: 요리한 레시피 has_cooked 배지 enrichment
  if (user && recommendations.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recipeIds = recommendations.map((r: any) => r.id).filter(Boolean) as string[]
    const { data: cooked } = await supabase
      .from('cooking_sessions')
      .select('recipe_id')
      .eq('user_id', user.id)
      .in('recipe_id', recipeIds)
    const cookedSet = new Set(cooked?.map(s => s.recipe_id) || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recommendations = recommendations.map((r: any) => ({ ...r, has_cooked: cookedSet.has(r.id) }))
  }

  return NextResponse.json({ recommendations, type, mode: resolvedMode })
}

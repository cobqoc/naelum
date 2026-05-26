import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { INTEREST_TYPE_CUISINE } from '@/lib/constants/userPreferences'
import {
  INGREDIENT_ALIASES,
  INGREDIENT_SUBSTITUTES,
  computeRecipeMatch,
  isReady,
  isAlmost,
  isAny,
} from '@/lib/recommendations/match'

// 사용자 식단/알레르기 필터 적용
async function filterByDietaryPreferences<T extends { ingredients?: { ingredient_name: string }[] }>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  recipes: T[]
): Promise<T[]> {
  // 사용자 식단 선호도 조회
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('preference_type, preference_value')
    .eq('user_id', userId)

  if (!preferences || preferences.length === 0) return recipes

  const allergies = preferences
    .filter(p => p.preference_type === 'allergy')
    .map(p => p.preference_value.toLowerCase())

  if (allergies.length === 0) return recipes

  // 알레르기 재료가 포함된 레시피 필터링
  return recipes.filter(recipe => {
    const recipeIngredients = (recipe.ingredients || []).map(
      (i: { ingredient_name: string }) => i.ingredient_name.toLowerCase()
    )
    return !recipeIngredients.some((ri: string) =>
      allergies.some(allergy => ri.includes(allergy) || allergy.includes(ri))
    )
  })
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

        const userIngredientIdSet = new Set(userIngredientIds)

        // 1) ingredient_id FK 매칭으로 후보 recipe_id 조회 (정확도 높음)
        let idCandidateIds: string[] = []
        if (userIngredientIds.length > 0) {
          const { data: idCandidateRows } = await supabase
            .from('recipe_ingredients')
            .select('recipe_id')
            .in('ingredient_id', userIngredientIds)
          idCandidateIds = idCandidateRows?.map(r => r.recipe_id) ?? []
        }

        // 2) 텍스트 ILIKE 매칭으로 추가 후보 조회 (미연결 재료 대응)
        const expandedSet = new Set<string>(ingredientNames)
        for (const ing of ingredientNames) {
          // 후보 검색은 동의어 + 대체재 둘 다로 확장 (대체 가능한 레시피도 후보 포함)
          const related = [...(INGREDIENT_ALIASES[ing] ?? []), ...(INGREDIENT_SUBSTITUTES[ing] ?? [])]
          related.forEach(s => expandedSet.add(s.toLowerCase().trim()))
        }

        const ilikeClauses = [...expandedSet]
          .slice(0, 40)
          .map(ing => `ingredient_name.ilike.%${ing}%`)
          .join(',')

        const { data: nameCandidateRows } = await supabase
          .from('recipe_ingredients')
          .select('recipe_id')
          .or(ilikeClauses)

        const candidateIds = [...new Set([
          ...idCandidateIds,
          ...(nameCandidateRows?.map(r => r.recipe_id) ?? []),
        ])]

        if (!candidateIds.length) {
          return NextResponse.json({ recommendations: [], mode: resolvedMode })
        }

        // 후보 레시피만 fetch — ingredient_id 포함 (FK 매칭에 사용)
        const { data: recipes } = await supabase
          .from('recipes')
          .select(`
            id, title, description, thumbnail_url, display_image,
            prep_time_minutes, cook_time_minutes, difficulty_level, dish_type,
            average_rating, servings,
            author:profiles!recipes_author_id_fkey(username, avatar_url),
            ingredients:recipe_ingredients(ingredient_name, ingredient_id, is_optional, substitutes)
          `)
          .eq('status', 'published')
          .in('id', candidateIds.slice(0, 300))

        if (!recipes) {
          return NextResponse.json({ recommendations: [], mode: resolvedMode })
        }

        // 알레르기 필터링 적용 (로그인 사용자만)
        const filteredRecipes = user
          ? await filterByDietaryPreferences(supabase, user.id, recipes)
          : recipes

        // 어드민 승격된 대체재 매핑 fetch — 양방향 Map 구성.
        // 코드 상수 INGREDIENT_SUBSTITUTES와 동등 우선순위로 매칭에 사용.
        const { data: globalSubs } = await supabase
          .from('ingredient_substitutes_global')
          .select('from_name, to_name')
        const extraSubs = new Map<string, Set<string>>()
        for (const row of globalSubs ?? []) {
          const a = row.from_name.toLowerCase().trim()
          const b = row.to_name.toLowerCase().trim()
          if (!extraSubs.has(a)) extraSubs.set(a, new Set())
          extraSubs.get(a)!.add(b)
          if (!extraSubs.has(b)) extraSubs.set(b, new Set())
          extraSubs.get(b)!.add(a)
        }

        // 보유/대체/없음 분류 — computeRecipeMatch(match.ts) 단일 출처. 전체·검색 페이지와 동일 로직.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recipesWithMatch = filteredRecipes.map((recipe: any) => ({
          ...recipe,
          ...computeRecipeMatch(ingredientNames, userIngredientIdSet, recipe.ingredients || [], extraSubs),
        }))

        // mode별 필터 함수(isReady/isAlmost/isAny)는 @/lib/recommendations/match 에서 import

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
          results = await filterByDietaryPreferences(supabase, user.id, results)

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

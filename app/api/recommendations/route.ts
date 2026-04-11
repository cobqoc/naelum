import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { levenshteinSimilarity } from '@/lib/utils/levenshtein'

// 재료 매칭: 퍼지 매칭 + 동의어 처리
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  '소고기': ['쇠고기', '한우', '소고기'],
  '쇠고기': ['소고기', '한우'],
  '돼지고기': ['돈육', '포크'],
  '닭고기': ['치킨', '닭'],
  '계란': ['달걀', '에그'],
  '달걀': ['계란', '에그'],
  '파': ['대파', '쪽파'],
  '대파': ['파', '쪽파'],
  '고추': ['청양고추', '풋고추'],
  '간장': ['진간장', '국간장', '양조간장'],
  '된장': ['쌈장'],
  '참기름': ['참깨기름'],
  '식용유': ['올리브유', '카놀라유', '포도씨유'],
}

function isIngredientMatch(userIng: string, recipeIng: string): boolean {
  const a = userIng.toLowerCase().trim()
  const b = recipeIng.toLowerCase().trim()

  // 정확히 일치
  if (a === b) return true

  // 동의어 체크
  const synonyms = INGREDIENT_SYNONYMS[a]
  if (synonyms && synonyms.some(s => s === b || b.includes(s) || s.includes(b))) return true

  // 한쪽이 다른 한쪽을 완전히 포함 (최소 2글자 이상일 때만)
  if (a.length >= 2 && b.length >= 2) {
    if (a === b.slice(0, a.length) || b === a.slice(0, b.length)) return true
  }

  // 레벤슈타인 유사도 (0.7 이상이면 매칭)
  if (a.length >= 2 && b.length >= 2) {
    const similarity = levenshteinSimilarity(a, b)
    if (similarity >= 0.7) return true
  }

  return false
}

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
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const type = searchParams.get('type') || 'ingredients'
  const rawLimit = parseInt(searchParams.get('limit') || '12')
  const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 12 : rawLimit), 50)

  const { data: { user } } = await supabase.auth.getUser()

  let recommendations: unknown[] = []

  try {
    switch (type) {
      case 'ingredients': {
        if (!user) {
          return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
        }

        const { data: userIngredients } = await supabase
          .from('user_ingredients')
          .select('ingredient_name')
          .eq('user_id', user.id)

        if (!userIngredients || userIngredients.length === 0) {
          return NextResponse.json({ recommendations: [], message: '보유 재료를 먼저 등록해주세요' })
        }

        const ingredientNames = userIngredients.map(i => i.ingredient_name.toLowerCase())

        const { data: recipes } = await supabase
          .from('recipes')
          .select(`
            id, title, description, thumbnail_url, display_image,
            prep_time_minutes, cook_time_minutes, difficulty_level,
            average_rating, servings,
            author:profiles(username, avatar_url),
            ingredients:recipe_ingredients(ingredient_name)
          `)
          .eq('is_published', true)
          .eq('is_public', true)
          .limit(100)

        if (!recipes) {
          return NextResponse.json({ recommendations: [] })
        }

        // 알레르기 필터링 적용
        const filteredRecipes = await filterByDietaryPreferences(supabase, user.id, recipes)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recipesWithMatch = filteredRecipes.map((recipe: any) => {
          const recipeIngredientsList: { ingredient_name: string }[] = recipe.ingredients || []
          const recipeIngredients: string[] = recipeIngredientsList.map(i => i.ingredient_name.toLowerCase())
          const matchedIngredients = recipeIngredients.filter((ri: string) =>
            ingredientNames.some((ui: string) => isIngredientMatch(ui, ri))
          )
          const missingIngredientNames = recipeIngredientsList
            .filter(i => !ingredientNames.some(ui => isIngredientMatch(ui, i.ingredient_name.toLowerCase())))
            .map(i => i.ingredient_name)
          const matchRate = recipeIngredients.length > 0
            ? (matchedIngredients.length / recipeIngredients.length) * 100
            : 0
          const missingCount = recipeIngredients.length - matchedIngredients.length

          // Generate substitute suggestions for missing ingredients
          const substitutes: Record<string, string[]> = {}
          for (const missing of missingIngredientNames) {
            const syns = INGREDIENT_SYNONYMS[missing]
            if (syns) {
              const available = syns.filter(s =>
                ingredientNames.some(ui => isIngredientMatch(ui, s.toLowerCase()))
              )
              if (available.length > 0) {
                substitutes[missing] = available
              }
            }
          }

          return {
            ...recipe,
            matchRate: Math.round(matchRate),
            missingCount,
            matchedCount: matchedIngredients.length,
            totalIngredients: recipeIngredients.length,
            missingIngredientNames,
            substitutes,
          }
        })

        recommendations = recipesWithMatch
          .filter(r => r.matchRate > 0)
          .sort((a, b) => {
            if (b.matchRate !== a.matchRate) return b.matchRate - a.matchRate
            if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount
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
              prep_time_minutes, cook_time_minutes, difficulty_level,
              average_rating,
              author:profiles(username, avatar_url)
            `)
            .eq('is_published', true)
            .eq('is_public', true)
            .order('average_rating', { ascending: false })
            .limit(limit)

          recommendations = data || []
        } else {
          // 사용자 관심사 조회
          const { data: interests } = await supabase
            .from('user_interests')
            .select('interest_value')
            .eq('user_id', user.id)
            .eq('interest_type', 'cuisine')

          const cuisineTypes = interests?.map(i => i.interest_value) || []

          let query = supabase
            .from('recipes')
            .select(`
              id, title, description, thumbnail_url, display_image,
              prep_time_minutes, cook_time_minutes, difficulty_level,
              average_rating, cuisine_type,
              author:profiles(username, avatar_url),
              ingredients:recipe_ingredients(ingredient_name)
            `)
            .eq('is_published', true)
            .eq('is_public', true)

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
                prep_time_minutes, cook_time_minutes, difficulty_level,
                average_rating, views_count,
                author:profiles(username, avatar_url)
              `)
              .eq('is_published', true)
              .eq('is_public', true)
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
              prep_time_minutes, cook_time_minutes, difficulty_level,
              average_rating, views_count,
              author:profiles(username, avatar_url)
            `)
            .eq('is_published', true)
            .eq('is_public', true)
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
            prep_time_minutes, cook_time_minutes, difficulty_level,
            average_rating, meal_type,
            author:profiles(username, avatar_url)
          `)
          .eq('is_published', true)
          .eq('is_public', true)
          .eq('meal_type', mealType)
          .order('average_rating', { ascending: false })
          .limit(limit)

        recommendations = data || []

        if (recommendations.length === 0) {
          const { data: fallback } = await supabase
            .from('recipes')
            .select(`
              id, title, description, thumbnail_url, display_image,
              prep_time_minutes, cook_time_minutes, difficulty_level,
              average_rating,
              author:profiles(username, avatar_url)
            `)
            .eq('is_published', true)
            .eq('is_public', true)
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

  return NextResponse.json({ recommendations, type })
}

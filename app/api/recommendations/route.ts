import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { levenshteinSimilarity } from '@/lib/utils/levenshtein'
import { checkRateLimit } from '@/lib/ratelimit'

// 재료 매칭: 퍼지 매칭 + 동의어 처리
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  // 육류
  '소고기': ['쇠고기', '한우', '우육', '소 고기'],
  '쇠고기': ['소고기', '한우', '우육'],
  '돼지고기': ['돈육', '포크', '삼겹살', '돼지 고기'],
  '닭고기': ['치킨', '닭', '닭 고기', '닭살'],
  '닭가슴살': ['닭살', '치킨 가슴살'],
  '삼겹살': ['돼지고기', '돈육', '베이컨'],
  '베이컨': ['삼겹살', '훈제 삼겹살'],
  '소시지': ['비엔나', '프랑크푸르트'],
  '참치': ['참치캔', '참치 통조림', '투나'],
  '새우': ['쉬림프', '새우살'],
  '오징어': ['꼴뚜기', '한치'],
  '게': ['꽃게', '게살'],
  '조개': ['바지락', '모시조개', '홍합'],

  // 달걀/유제품
  '계란': ['달걀', '에그', '鷄卵'],
  '달걀': ['계란', '에그'],
  '우유': ['밀크', '우유팩'],
  '버터': ['마가린', '무염버터', '가염버터'],
  '치즈': ['슬라이스치즈', '체다치즈', '모짜렐라'],
  '요거트': ['요구르트', '플레인요거트'],
  '생크림': ['휘핑크림', '크림'],

  // 채소
  '파': ['대파', '쪽파', '실파', '파대'],
  '대파': ['파', '쪽파', '실파'],
  '쪽파': ['파', '대파', '실파'],
  '양파': ['어니언'],
  '마늘': ['다진마늘', '편마늘', '통마늘'],
  '다진마늘': ['마늘', '마늘즙'],
  '생강': ['생강즙', '다진생강'],
  '고추': ['청양고추', '풋고추', '홍고추', '꽈리고추'],
  '청양고추': ['고추', '매운고추'],
  '감자': ['포테이토'],
  '고구마': ['스위트포테이토'],
  '당근': ['캐럿'],
  '애호박': ['주키니', '호박'],
  '호박': ['애호박', '단호박', '늙은호박'],
  '가지': ['에그플랜트'],
  '시금치': ['시금치나물'],
  '배추': ['절임배추', '배추김치'],
  '양배추': ['캐비지'],
  '브로콜리': ['브로콜리나물'],
  '파프리카': ['피망', '고추'],
  '피망': ['파프리카'],
  '버섯': ['표고버섯', '느타리버섯', '새송이버섯', '팽이버섯'],
  '표고버섯': ['버섯', '말린표고', '건표고'],
  '느타리버섯': ['버섯'],
  '팽이버섯': ['버섯'],
  '새송이버섯': ['버섯'],
  '토마토': ['방울토마토'],
  '오이': ['청오이'],
  '무': ['무우', '단무지'],
  '콩나물': ['숙주나물', '숙주'],
  '숙주': ['콩나물', '숙주나물'],

  // 곡류/면류
  '밥': ['쌀밥', '흰밥', '잡곡밥'],
  '쌀': ['백미', '현미', '찹쌀'],
  '국수': ['소면', '중면', '라면'],
  '라면': ['라면사리', '인스턴트라면'],
  '파스타': ['스파게티', '페투치네', '펜네'],
  '두부': ['순두부', '연두부', '부침두부'],
  '순두부': ['두부', '연두부'],

  // 양념/소스
  '간장': ['진간장', '국간장', '양조간장', '왜간장'],
  '된장': ['쌈장', '청국장'],
  '고추장': ['쌈장'],
  '쌈장': ['된장', '고추장'],
  '참기름': ['참깨기름'],
  '들기름': ['들깨기름'],
  '식용유': ['올리브유', '카놀라유', '포도씨유', '해바라기유'],
  '올리브유': ['식용유', '올리브오일'],
  '설탕': ['백설탕', '흑설탕', '올리고당', '꿀'],
  '꿀': ['설탕', '올리고당'],
  '소금': ['천일염', '꽃소금', '맛소금'],
  '식초': ['현미식초', '사과식초', '감식초'],
  '굴소스': ['굴 소스', '오이스터소스'],
  '케첩': ['토마토케첩', '토마토소스'],
  '마요네즈': ['마요', '마요네이즈'],
  '고춧가루': ['고추가루', '빨간고춧가루'],
  '후추': ['후춧가루', '흑후추', '백후추'],
  '깨': ['참깨', '통깨', '깨소금'],
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

  const { data: { user } } = await supabase.auth.getUser()

  let recommendations: unknown[] = []

  try {
    switch (type) {
      case 'ingredients': {
        // 체험 모드: 비로그인 시 쿼리 파라미터로 재료 전달 (ingredients=토마토,양파,...)
        let ingredientNames: string[] = []
        if (user) {
          const { data: userIngredients } = await supabase
            .from('user_ingredients')
            .select('ingredient_name')
            .eq('user_id', user.id)
          if (!userIngredients || userIngredients.length === 0) {
            return NextResponse.json({ recommendations: [], message: '보유 재료를 먼저 등록해주세요' })
          }
          ingredientNames = userIngredients.map(i => i.ingredient_name.toLowerCase())
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

        // 사용자 재료 + 동의어 확장 (DB 사전 필터링용)
        const expandedSet = new Set<string>(ingredientNames)
        for (const ing of ingredientNames) {
          const synonyms = INGREDIENT_SYNONYMS[ing]
          if (synonyms) synonyms.forEach(s => expandedSet.add(s.toLowerCase().trim()))
        }

        // recipe_ingredients에서 매칭 recipe_id 먼저 조회 (1000개 전체 로드 대신)
        const ilikeClauses = [...expandedSet]
          .slice(0, 40)
          .map(ing => `ingredient_name.ilike.%${ing}%`)
          .join(',')

        const { data: candidateRows } = await supabase
          .from('recipe_ingredients')
          .select('recipe_id')
          .or(ilikeClauses)

        if (!candidateRows?.length) {
          return NextResponse.json({ recommendations: [] })
        }

        const candidateIds = [...new Set(candidateRows.map(r => r.recipe_id))]

        // 후보 레시피만 fetch (기존 .limit(1000) 대신)
        const { data: recipes } = await supabase
          .from('recipes')
          .select(`
            id, title, description, thumbnail_url, display_image,
            prep_time_minutes, cook_time_minutes, difficulty_level,
            average_rating, servings,
            author:profiles!recipes_author_id_fkey(username, avatar_url),
            ingredients:recipe_ingredients(ingredient_name)
          `)
          .eq('status', 'published')
          .in('id', candidateIds.slice(0, 300))

        if (!recipes) {
          return NextResponse.json({ recommendations: [] })
        }

        // 알레르기 필터링 적용 (로그인 사용자만)
        const filteredRecipes = user
          ? await filterByDietaryPreferences(supabase, user.id, recipes)
          : recipes

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
            .eq('interest_type', 'cuisine')

          const cuisineTypes = interests?.map(i => i.interest_value) || []

          let query = supabase
            .from('recipes')
            .select(`
              id, title, description, thumbnail_url, display_image,
              prep_time_minutes, cook_time_minutes, difficulty_level,
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
                prep_time_minutes, cook_time_minutes, difficulty_level,
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
              prep_time_minutes, cook_time_minutes, difficulty_level,
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
            prep_time_minutes, cook_time_minutes, difficulty_level,
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
              prep_time_minutes, cook_time_minutes, difficulty_level,
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

  return NextResponse.json({ recommendations, type })
}

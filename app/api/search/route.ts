import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { levenshteinSimilarity } from '@/lib/utils/levenshtein'
import { checkRateLimit } from '@/lib/ratelimit'

// 검색어 정제: 특수문자 제거
function sanitizeQuery(q: string): string {
  return q.replace(/[%_\\]/g, '').trim()
}

// 안전한 정수 파싱 (범위 제한)
function safeParseInt(value: string | null, defaultVal: number, min: number, max: number): number {
  const parsed = parseInt(value || String(defaultVal))
  if (isNaN(parsed)) return defaultVal
  return Math.min(Math.max(parsed, min), max)
}

// GET /api/search - 통합 검색
export async function GET(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
  const { allowed } = await checkRateLimit(`search:${ip}`, { windowMs: 60 * 1000, maxRequests: 30 })
  if (!allowed) {
    return NextResponse.json({ error: '검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const rawQuery = searchParams.get('q') || ''
  const query = sanitizeQuery(rawQuery)
  const type = searchParams.get('type') || 'all'
  const page = safeParseInt(searchParams.get('page'), 1, 1, 1000)
  const limit = safeParseInt(searchParams.get('limit'), 20, 1, 50)

  const cuisine = searchParams.get('cuisine')
  const difficulty = searchParams.get('difficulty')
  const maxTime = searchParams.get('maxTime')
  const dietary = searchParams.get('dietary')

  const offset = (page - 1) * limit
  const results: {
    recipes?: { data: unknown[]; total: number };
    users?: { data: unknown[]; total: number };
    ingredients?: { data: unknown[]; total: number };
  } = {}

  if (!query) {
    return NextResponse.json({ results: {}, query: '' })
  }

  // 레시피, 사용자, 재료 검색을 병렬로 실행
  const searchPromises: Promise<void>[] = []

  // 레시피 검색
  if (type === 'all' || type === 'recipes') {
    searchPromises.push((async () => {
      let recipeQuery = supabase
        .from('recipes')
        .select(`
          id, title, description, thumbnail_url, display_image,
          prep_time_minutes, cook_time_minutes, difficulty_level,
          average_rating, views_count, cuisine_type,
          author:profiles(username, avatar_url)
        `, { count: 'exact' })
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)

      if (cuisine) recipeQuery = recipeQuery.eq('cuisine_type', cuisine)
      if (difficulty) recipeQuery = recipeQuery.eq('difficulty_level', difficulty)
      if (maxTime) {
        const parsedMaxTime = safeParseInt(maxTime, 0, 0, 1440)
        if (parsedMaxTime > 0) recipeQuery = recipeQuery.lte('total_time_minutes', parsedMaxTime)
      }
      if (dietary === 'vegetarian') recipeQuery = recipeQuery.eq('is_vegetarian', true)
      if (dietary === 'vegan') recipeQuery = recipeQuery.eq('is_vegan', true)
      if (dietary === 'gluten_free') recipeQuery = recipeQuery.eq('is_gluten_free', true)

      const { data: recipes, count: recipesCount } = await recipeQuery
        .order('average_rating', { ascending: false })
        .range(offset, offset + limit - 1)

      let recipeResults = recipes || []
      if (recipeResults.length > 0 && query.length >= 2) {
        recipeResults = [...recipeResults].sort((a, b) => {
          const simA = levenshteinSimilarity(query, a.title)
          const simB = levenshteinSimilarity(query, b.title)
          return simB - simA
        })
      }

      results.recipes = { data: recipeResults, total: recipesCount || 0 }
    })())
  }

  // 사용자 검색
  if (type === 'all' || type === 'users') {
    searchPromises.push((async () => {
      const { data: users, count: usersCount } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, followers_count, recipes_count', { count: 'exact' })
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .order('followers_count', { ascending: false })
        .range(offset, offset + limit - 1)

      results.users = { data: users || [], total: usersCount || 0 }
    })())
  }

  // 재료 검색 (재료가 포함된 레시피)
  if (type === 'all' || type === 'ingredients') {
    searchPromises.push((async () => {
      const { data: ingredientRecipes, count: ingredientCount } = await supabase
        .from('recipe_ingredients')
        .select(`
          recipe:recipes!inner(
            id, title, description, thumbnail_url, display_image,
            prep_time_minutes, cook_time_minutes, difficulty_level,
            average_rating, views_count,
            author:profiles(username, avatar_url),
            status
          )
        `, { count: 'exact' })
        .ilike('ingredient_name', `%${query}%`)
        .eq('recipe.status', 'published')
        .range(offset, offset + limit - 1)

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const uniqueRecipes: any[] = ingredientRecipes
        ? [...new Map(ingredientRecipes.map((item: any) => [item.recipe?.id, item.recipe])).values()].filter(Boolean)
        : []
      /* eslint-enable @typescript-eslint/no-explicit-any */

      results.ingredients = { data: uniqueRecipes, total: ingredientCount || 0 }
    })())
  }

  await Promise.all(searchPromises)

  // 검색 히스토리 저장 (로그인 사용자, 논블로킹)
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user && query) {
      supabase.from('search_history').insert({
        user_id: user.id,
        search_query: query,
        search_type: type,
        result_count: (results.recipes?.total || 0) + (results.users?.total || 0)
      }).then(() => {})
    }
  })

  return NextResponse.json({ results, query, pagination: { page, limit } })
}

import { createClient } from '@/lib/supabase/server'
import { getClientIp } from '@/lib/api/clientIp'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { parsePagination } from '@/lib/api/pagination'
import { checkRateLimit } from '@/lib/ratelimit'
import { resolveExactIngredientIds } from '@/lib/ingredients/resolveIngredientId'
import { pickEditableRecipeColumns } from '@/lib/recipes/editableColumns'
// 2026-10-04 API1-37: 자식 행 매핑(재료·단계·태그)·normalizeSubstitutesForStorage 가 PUT 과 2벌 → lib/api/recipeChildRows 단일 출처
// (저장 boundary: legacy string[] / 신규 객체[] → 정규화 객체[], 빈 배열은 NULL — 동작 그대로)
import {
  namesWithoutIngredientId, buildRecipeIngredientRows, buildRecipeStepRows, buildRecipeTagRows,
} from '@/lib/api/recipeChildRows'

// GET /api/recipes - 레시피 목록 조회
export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { allowed } = await checkRateLimit(`recipes:${ip}`, { windowMs: 60 * 1000, maxRequests: 60 })
  if (!allowed) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, offset, rangeEnd } = parsePagination(searchParams, { defaultLimit: 12 })
  const cuisine = searchParams.get('cuisine')
  const dish = searchParams.get('dish')
  const difficulty = searchParams.get('difficulty')
  const maxTime = searchParams.get('maxTime')
  const dietary = searchParams.get('dietary')
  const VALID_SORT_COLUMNS = ['created_at', 'average_rating', 'views_count', 'likes_count', 'title', 'popular', 'rating']
  const VALID_ORDERS = ['asc', 'desc']
  const rawSort = searchParams.get('sort') || 'created_at'
  const rawOrder = searchParams.get('order') || 'desc'
  const sort = VALID_SORT_COLUMNS.includes(rawSort) ? rawSort : 'created_at'
  const order = VALID_ORDERS.includes(rawOrder) ? rawOrder : 'desc'

  let query = supabase
    .from('recipes')
    .select(`
      *,
      author:profiles!recipes_author_id_fkey(id, username, avatar_url),
      ingredients:recipe_ingredients(ingredient_name),
      tags:recipe_tags(tag_name)
    `, { count: 'exact' })
    .eq('status', 'published')

  // 필터 적용
  if (cuisine) {
    query = query.eq('cuisine_type', cuisine)
  }
  if (dish) {
    query = query.eq('dish_type', dish)
  }
  if (difficulty) {
    query = query.eq('difficulty_level', difficulty)
  }
  if (maxTime) {
    const maxTimeNum = parseInt(maxTime, 10)
    if (Number.isFinite(maxTimeNum) && maxTimeNum > 0) {
      query = query.lte('total_time_minutes', maxTimeNum)
    }
  }
  if (dietary === 'vegetarian') {
    query = query.eq('is_vegetarian', true)
  }
  if (dietary === 'vegan') {
    query = query.eq('is_vegan', true)
  }
  if (dietary === 'gluten_free') {
    query = query.eq('is_gluten_free', true)
  }

  // 정렬
  if (sort === 'popular' || sort === 'rating') {
    query = query.order('average_rating', { ascending: false })
  } else {
    query = query.order(sort, { ascending: order === 'asc' })
  }

  query = query.range(offset, rangeEnd)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    recipes: data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}

// POST /api/recipes - 레시피 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const body = await request.json()
  const { title, description, ingredients, steps, tags, ...recipeData } = body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 })
  }
  if (title.length > 200) {
    return NextResponse.json({ error: '제목은 200자 이내로 입력해주세요.' }, { status: 400 })
  }
  if (description && typeof description === 'string' && description.length > 500) {
    return NextResponse.json({ error: '설명은 500자 이내로 입력해주세요.' }, { status: 400 })
  }

  // 레시피 생성 (total_time_minutes는 DB에서 자동 계산되는 Generated Column)
  // mass-assignment 방어(H1): 콘텐츠 컬럼 화이트리스트만 + remix 정체성·status 는 서버가 명시 강제.
  // 카운터(average_rating·cooked_count·views_count 등)는 body 로 주입 불가.
  const status = body.status === 'draft' ? 'draft' : 'published'
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      author_id: user.id,
      title,
      description,
      ...pickEditableRecipeColumns(recipeData),
      original_recipe_id: recipeData.original_recipe_id ?? null,
      is_remix: !!recipeData.is_remix,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null
    })
    .select()
    .single()

  if (recipeError) {
    return NextResponse.json({ error: recipeError.message }, { status: 500 })
  }

  // 재료 추가
  if (ingredients && ingredients.length > 0) {
    // 클라가 번호 안 준 재료는 *이름 정확일치* 로만 자동 번호 부여 (추측 0). 못 찾으면 null → 어드민 큐.
    const exactIds = await resolveExactIngredientIds(namesWithoutIngredientId(ingredients), supabase)
    const ingredientsToInsert = buildRecipeIngredientRows(recipe.id, ingredients, exactIds)

    const { error: ingErr } = await supabase.from('recipe_ingredients').insert(ingredientsToInsert)
    if (ingErr) {
      return NextResponse.json({ error: `재료 저장 실패: ${ingErr.message}` }, { status: 500 })
    }
  }

  // 조리 단계 추가
  if (steps && steps.length > 0) {
    const stepsToInsert = buildRecipeStepRows(recipe.id, steps)

    const { error: stepErr } = await supabase.from('recipe_steps').insert(stepsToInsert)
    if (stepErr) {
      return NextResponse.json({ error: `조리 단계 저장 실패: ${stepErr.message}` }, { status: 500 })
    }
  }

  // 태그 추가
  if (tags && tags.length > 0) {
    const tagsToInsert = buildRecipeTagRows(recipe.id, tags)

    const { error: tagErr } = await supabase.from('recipe_tags').insert(tagsToInsert)
    if (tagErr) {
      return NextResponse.json({ error: `태그 저장 실패: ${tagErr.message}` }, { status: 500 })
    }
  }

  // profiles.recipes_count 는 recipes 의 trigger_update_profile_recipes(AFTER INSERT OR DELETE)가 관리.
  // 2026-10-04 API1-09: 여기서 부르던 rpc('increment_recipes_count') 는 prod 에 함수가 없어(pg_proc 실측)
  // 매번 PGRST202 로 실패·결과 무시되던 죽은 왕복 → 제거(동작 동일).

  // 작성자 username 동봉 — 클라가 작성 후 /@username 리다이렉트에 사용(데이터 계층 이전:
  // recipes/new 의 draft 저장 후 profiles.username 직접 read 제거. 발행 경로는 무시).
  const { data: authorProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()

  // 캐시 무효화 불필요: 홈(force-dynamic)·레시피 상세(force-dynamic)는 매 요청 SSR이고,
  // /recipes 목록은 셸만 static(revalidate 3600)이며 실제 목록은 AllRecipesClient가
  // 클라이언트에서 fetch → 새 레시피가 즉시 노출됨. (과거 "홈 60초 revalidate 캐시" 주석은
  // 실재하지 않는 캐시를 가리켜 stale, 2026-06-08 정정.)

  return NextResponse.json({ recipe, username: authorProfile?.username ?? null }, { status: 201 })
}

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { parsePagination } from '@/lib/api/pagination'

// GET /api/recipes - 레시피 목록 조회
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, offset, rangeEnd } = parsePagination(searchParams, { defaultLimit: 12 })
  const cuisine = searchParams.get('cuisine')
  const difficulty = searchParams.get('difficulty')
  const maxTime = searchParams.get('maxTime')
  const dietary = searchParams.get('dietary')
  const sort = searchParams.get('sort') || 'created_at'
  const order = searchParams.get('order') || 'desc'

  let query = supabase
    .from('recipes')
    .select(`
      *,
      author:profiles(id, username, avatar_url),
      ingredients:recipe_ingredients(ingredient_name),
      tags:recipe_tags(tag_name)
    `, { count: 'exact' })
    .eq('is_published', true)
    .eq('is_public', true)

  // 필터 적용
  if (cuisine) {
    query = query.eq('cuisine_type', cuisine)
  }
  if (difficulty) {
    query = query.eq('difficulty_level', difficulty)
  }
  if (maxTime) {
    query = query.lte('total_time_minutes', parseInt(maxTime))
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

  // 레시피 생성 (total_time_minutes는 DB에서 자동 계산되는 Generated Column)
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      author_id: user.id,
      title,
      description,
      ...recipeData,
      is_published: body.is_published !== false,
      published_at: body.is_published !== false ? new Date().toISOString() : null
    })
    .select()
    .single()

  if (recipeError) {
    return NextResponse.json({ error: recipeError.message }, { status: 500 })
  }

  // 재료 추가
  if (ingredients && ingredients.length > 0) {
    const ingredientsToInsert = ingredients.map((ing: { ingredient_name: string; quantity: number; unit: string; notes?: string; is_optional?: boolean }, index: number) => ({
      recipe_id: recipe.id,
      ingredient_name: ing.ingredient_name,
      quantity: ing.quantity,
      unit: ing.unit,
      notes: ing.notes,
      is_optional: ing.is_optional || false,
      display_order: index + 1
    }))

    await supabase.from('recipe_ingredients').insert(ingredientsToInsert)
  }

  // 조리 단계 추가
  if (steps && steps.length > 0) {
    const stepsToInsert = steps.map((step: { title?: string; instruction: string; timer_minutes?: number; tip?: string; image_url?: string | null }, index: number) => ({
      recipe_id: recipe.id,
      step_number: index + 1,
      title: step.title,
      instruction: step.instruction,
      timer_minutes: step.timer_minutes,
      tip: step.tip,
      image_url: step.image_url
    }))

    await supabase.from('recipe_steps').insert(stepsToInsert)
  }

  // 태그 추가
  if (tags && tags.length > 0) {
    const tagsToInsert = tags.map((tag: string) => ({
      recipe_id: recipe.id,
      tag_name: tag
    }))

    await supabase.from('recipe_tags').insert(tagsToInsert)
  }

  // 사용자 레시피 카운트 업데이트
  await supabase.rpc('increment_recipes_count', { user_id: user.id })

  return NextResponse.json({ recipe }, { status: 201 })
}

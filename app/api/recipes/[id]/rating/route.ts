import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { notifyRating } from '@/lib/notifications/create'
import { checkRateLimit } from '@/lib/ratelimit'

// GET /api/recipes/[id]/rating - 사용자 리뷰 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  // 사용자의 리뷰 조회
  const { data: rating } = await supabase
    .from('recipe_ratings')
    .select('rating, review, created_at, updated_at')
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    hasReview: !!rating,
    rating: rating?.rating,
    review: rating?.review,
    created_at: rating?.created_at,
    updated_at: rating?.updated_at
  })
}

// POST /api/recipes/[id]/rating - 평점 등록/수정
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { allowed } = await checkRateLimit(`rating:${user.id}`, { windowMs: 60 * 1000, maxRequests: 10 })
  if (!allowed) {
    return NextResponse.json({ error: '평점 등록이 너무 빠릅니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const { rating, review } = await request.json()

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: '평점은 1~5 사이여야 합니다' }, { status: 400 })
  }

  // 기존 평점 확인
  const { data: existingRating } = await supabase
    .from('recipe_ratings')
    .select('id')
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingRating) {
    // 평점 수정
    await supabase
      .from('recipe_ratings')
      .update({
        rating,
        review: review || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingRating.id)
  } else {
    // 새 평점 등록
    await supabase
      .from('recipe_ratings')
      .insert({
        recipe_id: recipeId,
        user_id: user.id,
        rating,
        review: review || null
      })
  }

  // 평균 평점 재계산 (SECURITY DEFINER 함수 사용)
  // RPC는 TABLE(avg_rating numeric, count_ratings integer)를 반환하므로 컬럼명이 다르다.
  const { data: result, error: rpcError } = await supabase
    .rpc('update_recipe_ratings', { recipe_id: recipeId })
    .single()

  if (rpcError) {
    console.error('Error updating recipe ratings:', rpcError)
    return NextResponse.json({ error: '평점 업데이트에 실패했습니다' }, { status: 500 })
  }

  const typedResult = result as { avg_rating: number; count_ratings: number }

  // 알림 생성 (새 평점일 때만)
  if (!existingRating) {
    const { data: recipe } = await supabase
      .from('recipes')
      .select('author_id, title')
      .eq('id', recipeId)
      .maybeSingle()

    if (recipe && recipe.author_id !== user.id) {
      const { data: rater } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()

      await notifyRating(
        supabase,
        recipe.author_id,
        rater?.username || '누군가',
        recipeId,
        recipe.title,
        rating,
        user.id,
      )
    }
  }

  return NextResponse.json({
    success: true,
    rating,
    review,
    averageRating: typedResult.avg_rating,
    ratingsCount: typedResult.count_ratings
  })
}

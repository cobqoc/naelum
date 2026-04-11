import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parsePagination } from '@/lib/api/pagination'

// GET /api/recipes/[id]/ratings - 레시피의 모든 리뷰 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, offset, rangeEnd } = parsePagination(searchParams)

  // 모든 리뷰 조회 (텍스트 리뷰 우선, 그 다음 최신순)
  const { data: ratings, count, error } = await supabase
    .from('recipe_ratings')
    .select(`
      rating,
      review,
      photo_url,
      is_photo_only,
      completed_at,
      created_at,
      updated_at,
      user_id,
      user:profiles(username, avatar_url)
    `, { count: 'exact' })
    .eq('recipe_id', recipeId)
    .order('is_photo_only', { ascending: true }) // 텍스트 리뷰 우선
    .order('created_at', { ascending: false })
    .range(offset, rangeEnd)

  if (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json({ error: '리뷰를 불러오는데 실패했습니다' }, { status: 500 })
  }

  return NextResponse.json({
    ratings: ratings || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    }
  })
}

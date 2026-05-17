import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { parsePagination } from '@/lib/api/pagination'

// GET /api/users/me/recipes?type=saved&page=N&limit=N
// 현재 로그인 사용자의 저장 레시피 목록 (모바일 앱 전용 — username 없이 쿠키 인증으로 접근)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const type = searchParams.get('type') || 'saved'
  const { page, limit, offset, rangeEnd } = parsePagination(searchParams, { defaultLimit: 20 })

  if (type !== 'saved') {
    return NextResponse.json({ error: '지원하지 않는 type입니다' }, { status: 400 })
  }

  const { data: saves, count } = await supabase
    .from('recipe_saves')
    .select(`
      notes,
      recipe:recipes(
        id, title, description, thumbnail_url, display_image,
        prep_time_minutes, cook_time_minutes, difficulty_level,
        average_rating,
        author:profiles!recipes_author_id_fkey(username, avatar_url)
      )
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, rangeEnd)

  const recipes = saves?.map(s => ({ ...s.recipe, save_notes: s.notes })) ?? []

  return NextResponse.json({
    recipes,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
}

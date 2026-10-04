import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { parsePagination } from '@/lib/api/pagination'

// GET /api/users/me/recipes?type=saved|created&page=N&limit=N
// 현재 로그인 사용자의 저장/작성 레시피 목록 (모바일 앱 전용 — username 없이 쿠키 인증으로 접근)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const type = searchParams.get('type') || 'saved'
  const { page, limit, offset, rangeEnd } = parsePagination(searchParams, { defaultLimit: 20 })

  if (type === 'created') {
    const { data: recipes, count } = await supabase
      .from('recipes')
      .select(`
        id, title, description, thumbnail_url, display_image,
        prep_time_minutes, cook_time_minutes, difficulty_level,
        average_rating,
        author:profiles!recipes_author_id_fkey(username, avatar_url)
      `, { count: 'exact' })
      .eq('author_id', user.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, rangeEnd)

    return NextResponse.json({
      recipes: recipes ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    })
  }

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

  // 2026-10-04 API1-10: 비-inner 임베드라 RLS 로 가려진(비공개 전환된) 레시피는 recipe=null 로 남아
  // id 없는 항목({ save_notes })이 섞였다(KMP 저장목록 DTO 디코딩 실패). 그런 항목만 제외 — 정상 항목·순서 동일.
  const recipes = saves?.filter(s => s.recipe != null).map(s => ({ ...s.recipe, save_notes: s.notes })) ?? []

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

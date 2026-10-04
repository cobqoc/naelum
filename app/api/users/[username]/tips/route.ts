import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parsePagination } from '@/lib/api/pagination'

// GET /api/users/[username]/tips?type=published|drafts|private&page=1&limit=12
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { page, limit, offset, rangeEnd } = parsePagination(searchParams, { defaultLimit: 12 })
  const type = searchParams.get('type') || 'published'

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profile.id

  if ((type === 'drafts' || type === 'private') && !isOwnProfile) {
    return NextResponse.json({ tips: [], pagination: { page, limit, total: 0, totalPages: 0 } })
  }

  let query = supabase
    .from('tip')
    .select('id, title, thumbnail_url, category, duration_minutes, views_count, is_public, is_draft, created_at', { count: 'exact' })
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .range(offset, rangeEnd)

  if (type === 'published') {
    // 공개 팁만 — 본인·남의 프로필 동일 (2026-10-04 API1-33: 아무 일도 안 하던 빈 `if (!isOwnProfile) {}` 제거)
    query = query.eq('is_public', true).eq('is_draft', false)
  } else if (type === 'drafts') {
    query = query.eq('is_draft', true)
  } else if (type === 'private') {
    query = query.eq('is_public', false).eq('is_draft', false)
  } else {
    // 2026-10-04 API1-33: 알 수 없는 type 은 필터 없이 작성자 팁 전체(본인이면 임시저장·비공개 섞임)가 200 으로 나갔다
    // → recipes 라우트(`default: 잘못된 타입입니다` 400)와 같이 거부. 웹(published|drafts|private)·KMP(published) 호출은 불변.
    return NextResponse.json({ error: '잘못된 타입입니다' }, { status: 400 })
  }

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    tips: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}

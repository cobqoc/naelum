import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { parsePagination } from '@/lib/api/pagination'

// GET /api/notifications - 알림 목록 조회
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  // 경량 모드: 안읽은 개수만 (헤더 종 배지 30초 폴링 — 목록 쿼리 생략).
  if (searchParams.get('countOnly') === 'true') {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    return NextResponse.json({ unreadCount: count || 0 })
  }

  const { page, limit, offset, rangeEnd } = parsePagination(searchParams)
  const unreadOnly = searchParams.get('unread') === 'true'

  let query = supabase
    .from('notifications')
    .select(`
      *,
      related_user:profiles!notifications_related_user_id_fkey(username, avatar_url)
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data: notifications, error, count } = await query
    .range(offset, rangeEnd)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 읽지 않은 알림 수
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return NextResponse.json({
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}

// PUT /api/notifications - 알림 읽음 처리
export async function PUT(request: NextRequest) {
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  let body: { id?: string; markAll?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다' }, { status: 400 });
  }
  const { id, markAll } = body

  if (markAll) {
    // 모든 알림 읽음 처리
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (id) {
    // 특정 알림 읽음 처리
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/notifications - 알림 삭제
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: '알림 ID가 필요합니다' }, { status: 400 })
  }

  // DELETE RLS 정책(20260601_notifications_delete_rls)으로 본인 알림 삭제 허용.
  // .error 명시 체크 — 정책 누락/권한 문제로 0행 삭제 시 조용한 부활 방지(H12).
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

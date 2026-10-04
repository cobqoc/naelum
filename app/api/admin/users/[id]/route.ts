import { verifyAdminAndLog } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/admin/users/[id] - 사용자 차단/해제
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // 2026-10-04 AG2-49: 형식 오류 JSON·null 본문은 500 이었다 → action 없음으로 보고 아래 기존 400('유효하지 않은 작업입니다').
  let body: { action?: unknown; reason?: unknown; ban_type?: unknown; expires_at?: unknown } | null
  try {
    body = await request.json()
  } catch {
    body = null
  }
  const { action, reason, ban_type, expires_at } = body ?? {}

  if (action === 'ban') {
    const auth = await verifyAdminAndLog(
      'ban_user',
      'user',
      id,
      { reason, ban_type },
      request
    )

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Ban user
    const { error } = await auth.supabase.from('banned_users').insert({
      user_id: id,
      banned_by: auth.user.id,
      reason,
      ban_type: ban_type || 'permanent',
      expires_at: ban_type === 'temporary' ? expires_at : null
    })

    if (error) {
      // 2026-10-04 AG2-49: 잘못된 입력·상태가 500 이던 경로만 4xx 로 — 이미 차단된 사용자(banned_users.user_id UNIQUE, 23505)
      // → 409, DB 가 거부한 만료일 형식(22007/22008) → 400. 그 외 오류는 기존처럼 500.
      if (error.code === '23505') {
        return NextResponse.json({ error: '이미 차단된 사용자입니다' }, { status: 409 })
      }
      if (error.code === '22007' || error.code === '22008') {
        return NextResponse.json({ error: '유효하지 않은 만료일입니다' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '사용자가 차단되었습니다' })
  }

  if (action === 'unban') {
    const auth = await verifyAdminAndLog('unban_user', 'user', id, {}, request)

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { error } = await auth.supabase
      .from('banned_users')
      .delete()
      .eq('user_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '차단이 해제되었습니다' })
  }

  return NextResponse.json({ error: '유효하지 않은 작업입니다' }, { status: 400 })
}

// DELETE /api/admin/users/[id] - 사용자 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const auth = await verifyAdminAndLog('delete_user', 'user', id, {}, request)

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  // 자기 계정은 이 경로로 삭제 금지 (설정 > 계정 삭제에서 처리)
  if (id === auth.user.id) {
    return NextResponse.json({ error: '본인 계정은 설정에서 삭제하세요' }, { status: 400 })
  }

  // 관리자는 대상 유저의 소유자가 아니라 user-context client 의 profiles.delete() 가
  // RLS 에 막혀 0행 삭제+silent success + auth.users 잔존(재로그인 가능)이었다(H15).
  // service-role 로 auth.users 를 삭제 → profiles_id_fkey ON DELETE CASCADE 로
  // 프로필·연관 데이터까지 정리(자기삭제 delete_user RPC 와 동일 효과).
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: '사용자가 삭제되었습니다' })
}

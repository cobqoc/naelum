import { verifyAdminAndLog } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/admin/users/[id] - 사용자 차단/해제
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { action, reason, ban_type, expires_at } = body

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

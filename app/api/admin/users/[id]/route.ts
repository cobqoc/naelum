import { verifyAdminAndLog } from '@/lib/supabase/admin'
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

  // Delete user (cascade will handle related data)
  const { error } = await auth.supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: '사용자가 삭제되었습니다' })
}

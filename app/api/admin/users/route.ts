import { verifyAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { parsePagination } from '@/lib/api/pagination'

// GET /api/admin/users - 사용자 목록 조회
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin()

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = new URL(request.url)
  const { page, limit, offset, rangeEnd } = parsePagination(searchParams)
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''

  let query = auth.supabase
    .from('profiles')
    .select('id, username, email, role, avatar_url, created_at, recipe_count', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
  }

  if (role) {
    query = query.eq('role', role)
  }

  query = query.range(offset, rangeEnd)

  const { data: users, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check ban status for each user (including ban details)
  const userIds = users?.map(u => u.id) || []
  const { data: bannedUsers } = await auth.supabase
    .from('banned_users')
    .select('user_id, reason, ban_type, expires_at')
    .in('user_id', userIds)

  const banMap = Object.fromEntries(
    (bannedUsers || []).map(b => [b.user_id, b])
  )

  const usersWithStatus = users?.map(user => ({
    ...user,
    is_banned: !!banMap[user.id],
    ban_reason: banMap[user.id]?.reason ?? null,
    ban_type: banMap[user.id]?.ban_type ?? null,
    ban_expires_at: banMap[user.id]?.expires_at ?? null,
  }))

  return NextResponse.json({
    users: usersWithStatus,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}

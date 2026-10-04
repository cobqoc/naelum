import { guardAdminApi } from '@/lib/api/adminGuard'
import { NextRequest, NextResponse } from 'next/server'
import { parsePagination } from '@/lib/api/pagination'
import { quoteOrFilterValue } from '@/lib/api/sanitizeSearch'

// GET /api/admin/users - 사용자 목록 조회
export async function GET(request: NextRequest) {
  // 2026-10-04 AG2-30: IP→rate limit→verifyAdmin 보일러플레이트 → lib/api/adminGuard(같은 키·문구·상태코드)
  const guard = await guardAdminApi(request)
  if (guard.response) return guard.response
  const auth = guard.auth

  const { searchParams } = new URL(request.url)
  const { page, limit, offset, rangeEnd } = parsePagination(searchParams)
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''

  let query = auth.supabase
    .from('profiles')
    .select('id, username, email, role, avatar_url, created_at, recipes_count', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    // 2026-10-04 AG2-25: 입력을 .or() 문자열에 그대로 넣어 `kim,lee`·`a)` 같은 검색어가 필터 파싱 오류(500)였다
    // → 예약 문자(`,()`)가 있을 때만 값을 인용(postgrest-js .in() 규칙). 일반 검색어는 필터 문자열 그대로.
    const pattern = quoteOrFilterValue(`%${search}%`)
    query = query.or(`username.ilike.${pattern},email.ilike.${pattern}`)
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

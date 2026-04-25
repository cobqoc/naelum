import { verifyAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { parsePagination } from '@/lib/api/pagination'
import { checkRateLimit } from '@/lib/ratelimit'

/**
 * GET /api/admin/actions
 * 관리자 활동 로그 조회
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
  const { allowed } = await checkRateLimit(`admin-api:${ip}`, { windowMs: 10 * 60 * 1000, maxRequests: 100 })
  if (!allowed) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  try {
    // 관리자 권한 확인
    const auth = await verifyAdmin()

    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error, code: auth.code },
        { status: auth.status }
      )
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url)
    const { page, limit, offset, rangeEnd } = parsePagination(searchParams, { defaultLimit: 50 })
    const adminId = searchParams.get('admin_id') || ''
    const actionType = searchParams.get('action_type') || ''

    // 기본 쿼리
    let query = auth.supabase
      .from('admin_actions')
      .select(`
        *,
        admin:profiles!admin_id(username, avatar_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // 필터 적용
    if (adminId) {
      query = query.eq('admin_id', adminId)
    }

    if (actionType) {
      query = query.eq('action_type', actionType)
    }

    // 페이지네이션
    query = query.range(offset, rangeEnd)

    const { data: actions, error, count } = await query

    if (error) {
      console.error('Failed to fetch admin actions:', error)
      return NextResponse.json(
        { error: '로그 조회 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      actions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Admin actions fetch error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

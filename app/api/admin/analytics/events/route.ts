import { verifyAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

/**
 * 관리자용 events 행동 분석 endpoint.
 * - 기존 /api/admin/analytics(recipes·users 통계)와 별개 — 자체 analytics 행동 데이터 전용
 * - events 테이블 row를 client로 반환 → /admin/analytics 페이지에서 차트 집계
 * - 향후 데이터 ↑ 시 RPC function으로 server-side 집계 migrate
 */

const MAX_DAYS = 90
const MAX_ROWS = 10_000

export async function GET(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
  const { allowed } = await checkRateLimit(`admin-analytics-events:${ip}`, { windowMs: 10 * 60 * 1000, maxRequests: 100 })
  if (!allowed) {
    return NextResponse.json({ error: '요청이 너무 많습니다.' }, { status: 429 })
  }

  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = new URL(request.url)
  const daysRaw = parseInt(searchParams.get('days') ?? '7', 10)
  const days = Math.max(1, Math.min(MAX_DAYS, isNaN(daysRaw) ? 7 : daysRaw))
  const since = new Date(Date.now() - days * 86_400_000).toISOString()

  const { data: events, error } = await auth.supabase
    .from('events')
    .select('id, event_type, page, payload, viewport_w, viewport_h, user_id, session_id, ua, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS)

  if (error) {
    console.error('[admin/analytics/events] select 실패:', error)
    return NextResponse.json({ error: 'select failed' }, { status: 500 })
  }

  return NextResponse.json({
    days,
    total: events?.length ?? 0,
    events: events ?? [],
  })
}

import { verifyAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { dailyPageViews, topEvents, topPages, eventStats, type EventRow } from '@/lib/analytics/aggregateEvents'

/**
 * 관리자용 events 행동 분석 endpoint.
 * - 기존 /api/admin/analytics(recipes·users 통계)와 별개 — 자체 analytics 행동 데이터 전용
 * - 같은 행(기간 필터·최신순·10k 상한)을 서버에서 집계해 요약만 반환 (perf 2026-09-28: 이전엔 원본 최대 1만 행을
 *   브라우저로 보내 페이지가 집계). 집계 코드는 lib/analytics/aggregateEvents — 이전 페이지 코드와 동일(vitest 오라클).
 * - 10k 상한 의미 보존 — SQL GROUP BY 로 바꾸면 상한 밖 행까지 세어 숫자가 달라진다.
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
    .select('event_type, page, payload, viewport_w, user_id, session_id, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS)

  if (error) {
    console.error('[admin/analytics/events] select 실패:', error)
    return NextResponse.json({ error: 'select failed' }, { status: 500 })
  }

  const rows = (events ?? []) as EventRow[]
  return NextResponse.json({
    days,
    total: rows.length,
    daily: dailyPageViews(rows),
    topEvents: topEvents(rows),
    topPages: topPages(rows),
    stats: eventStats(rows),
  })
}

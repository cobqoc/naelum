import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

/**
 * 자체 analytics — 사용자 행동 이벤트 수집.
 *
 * 호환:
 * - search_history·recommendation_history는 별개 유지. events는 일반 행동(페이지뷰·클릭) 전용.
 * - 비로그인 사용자도 트래킹 가능(user_id nullable, session_id로 식별).
 * - GDPR: 클라이언트(`lib/analytics/track.ts`)에서 CookieConsent.analytics 동의 확인 후에만 호출.
 *
 * 검증:
 * - eventType: snake_case, 최대 50자
 * - payload JSON: 최대 ~2KB (남용 방지)
 * - page·sessionId·ua 길이 제한
 */

const ALLOWED_EVENT_TYPE = /^[a-z][a-z0-9_]{0,49}$/
const MAX_PAYLOAD_BYTES = 2000
const MAX_PAGE_LEN = 200
const MAX_SESSION_LEN = 100
const MAX_UA_LEN = 500

export async function POST(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // rate limit: user면 user.id 기준, 비로그인이면 IP 기준. 60/분 — 페이지뷰+클릭 합쳐서 여유.
  const limitKey = `events:${user?.id ?? ip}`
  const { allowed } = await checkRateLimit(limitKey, { windowMs: 60 * 1000, maxRequests: 60 })
  if (!allowed) {
    return NextResponse.json({ error: 'rate limit' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const b = body as {
    eventType?: unknown
    payload?: unknown
    page?: unknown
    sessionId?: unknown
    viewportW?: unknown
    viewportH?: unknown
  }

  // eventType 검증
  if (typeof b.eventType !== 'string' || !ALLOWED_EVENT_TYPE.test(b.eventType)) {
    return NextResponse.json({ error: 'invalid eventType' }, { status: 400 })
  }
  // sessionId 검증
  if (typeof b.sessionId !== 'string' || b.sessionId.length === 0 || b.sessionId.length > MAX_SESSION_LEN) {
    return NextResponse.json({ error: 'invalid sessionId' }, { status: 400 })
  }
  // payload 크기 검증
  let payloadJson: Record<string, unknown> | null = null
  if (b.payload !== undefined && b.payload !== null) {
    if (typeof b.payload !== 'object' || Array.isArray(b.payload)) {
      return NextResponse.json({ error: 'invalid payload type' }, { status: 400 })
    }
    const serialized = JSON.stringify(b.payload)
    if (serialized.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: 'payload too large' }, { status: 400 })
    }
    payloadJson = b.payload as Record<string, unknown>
  }
  // page 검증
  let page: string | null = null
  if (b.page !== undefined && b.page !== null) {
    if (typeof b.page !== 'string' || b.page.length > MAX_PAGE_LEN) {
      return NextResponse.json({ error: 'invalid page' }, { status: 400 })
    }
    page = b.page
  }
  // viewport 검증 (선택)
  const viewportW = typeof b.viewportW === 'number' && b.viewportW > 0 && b.viewportW <= 10000 ? Math.floor(b.viewportW) : null
  const viewportH = typeof b.viewportH === 'number' && b.viewportH > 0 && b.viewportH <= 10000 ? Math.floor(b.viewportH) : null

  const ua = (request.headers.get('user-agent') ?? '').slice(0, MAX_UA_LEN)

  // user_id는 클라이언트 입력 무시 — 서버 인증 결과만 사용 (다른 user 사칭 차단)
  const { error } = await supabase
    .from('events')
    .insert({
      user_id: user?.id ?? null,
      session_id: b.sessionId,
      event_type: b.eventType,
      payload: payloadJson,
      page,
      viewport_w: viewportW,
      viewport_h: viewportH,
      ua,
    })

  if (error) {
    console.error('[events] insert 실패:', error)
    return NextResponse.json({ error: 'insert failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

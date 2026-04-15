import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/ratelimit'
import { validateOrigin } from '@/lib/security/csrf'

// 이메일 정규식 (RFC 5322 간소화)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // IP별 5분 10회 제한 (스팸 방지)
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  const { allowed } = await checkRateLimit(`waitlist:${ip}`, {
    windowMs: 5 * 60 * 1000,
    maxRequests: 10,
  })
  if (!allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }

  let body: { email?: string; source?: string; language?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: '유효한 이메일을 입력해주세요.' }, { status: 400 })
  }
  if (email.length > 254) {
    return NextResponse.json({ error: '이메일이 너무 깁니다.' }, { status: 400 })
  }

  const source = typeof body.source === 'string' ? body.source.slice(0, 64) : null
  const language = typeof body.language === 'string' ? body.language.slice(0, 8) : null
  const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null
  const referrer = request.headers.get('referer')?.slice(0, 500) ?? null

  // Service role client — waitlist 테이블은 RLS로 anon 직접 접근 차단됨
  // waitlist는 신규 테이블이라 database.types.ts에 아직 없어 any 캐스팅 (재생성 전까지)
  const admin = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('waitlist').insert({
    email,
    source,
    language,
    user_agent: userAgent,
    referrer,
  })

  if (error) {
    // 중복 이메일은 "이미 등록됨"으로 친절하게 처리 (성공처럼)
    if (error.code === '23505') {
      return NextResponse.json({ success: true, alreadySubscribed: true })
    }
    console.error('[waitlist] insert error:', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/reset-password-email — 비밀번호 재설정 이메일 발송 (KMP 모바일 앱 전용)
// 이메일 존재 여부 노출 방지: 항상 200 ok 반환
export async function POST(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'

  const { allowed } = await checkRateLimit(`reset-pw:${ip}`, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
  })
  if (!allowed) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: true })
    }

    const supabase = await createClient()
    await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password-verify`,
    })
  } catch {
    // 베스트에포트: 실패해도 응답 동일
  }

  return NextResponse.json({ ok: true })
}

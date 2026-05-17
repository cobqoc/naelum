import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

// POST /api/auth/signup — 이메일/비밀번호 신규 가입 (KMP 모바일 앱 전용)
// 성공 시 Set-Cookie(세션) + { user: { id, email } } 반환. 이후 인증 요청에 쿠키 자동 첨부.
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요' }, { status: 400 })
    }

    const ip = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    const { allowed } = await checkRateLimit(`signup:${ip}`, { windowMs: 60 * 60 * 1000, maxRequests: 5 })
    if (!allowed) {
      return NextResponse.json({ error: '가입 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: '가입에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ user: { id: data.user.id, email: data.user.email } })
  } catch (error) {
    console.error('[auth/signup] POST error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

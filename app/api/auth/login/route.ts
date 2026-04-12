import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkLoginAttempt, recordFailedAttempt, clearLoginAttempts } from '@/lib/security/loginLimiter'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요' }, { status: 400 })
    }

    // IP 기반 rate limiting
    const ip = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'
    const identifier = `${ip}:${email}`

    const limitCheck = await checkLoginAttempt(identifier)
    if (!limitCheck.allowed) {
      const retryAfter = limitCheck.lockedUntil
        ? Math.ceil((limitCheck.lockedUntil - Date.now()) / 1000 / 60)
        : 15
      return NextResponse.json({
        error: `로그인 시도 횟수를 초과했습니다. ${retryAfter}분 후 다시 시도해주세요.`,
        locked: true,
        lockedUntil: limitCheck.lockedUntil,
        remainingAttempts: 0
      }, { status: 429 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const failResult = await recordFailedAttempt(identifier)
      return NextResponse.json({
        error: error.message,
        remainingAttempts: failResult.remainingAttempts,
        locked: failResult.locked
      }, { status: 401 })
    }

    // 성공 시 시도 기록 초기화
    await clearLoginAttempts(identifier)

    return NextResponse.json({
      user: { id: data.user.id, email: data.user.email },
      remainingAttempts: 5
    })
  } catch (error) {
    console.error('[auth/login] POST error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

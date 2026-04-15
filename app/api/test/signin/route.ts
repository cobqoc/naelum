import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * 테스트 전용 signin 엔드포인트.
 *
 * Playwright E2E 테스트가 이 라우트에 POST해서 세션 쿠키를 획득한다.
 * Supabase 서버 클라이언트가 Next.js cookies()를 통해 auth-token 쿠키를
 * 자동으로 설정하므로, 응답 헤더가 Playwright 컨텍스트의 쿠키 자에 저장된다.
 *
 * 보안:
 * - Vercel 환경(production, preview, development)에서는 VERCEL 환경변수가
 *   자동 설정되므로 즉시 404 반환. 로컬 dev/test에서만 동작.
 * - 추가로 TEST_SIGNIN_ALLOW=1 환경변수가 없으면 거부 (이중 가드).
 * - 실제 로그인 로직은 일반 signInWithPassword와 동일하므로 rate limit 등
 *   기존 제약이 그대로 적용됨.
 */
export async function POST(request: Request) {
  // Vercel 배포 환경에서는 VERCEL=1이 자동 설정됨
  if (process.env.VERCEL) {
    return new NextResponse('Not found', { status: 404 })
  }

  // 이중 가드: 로컬에서도 명시적으로 활성화해야 동작
  if (process.env.TEST_SIGNIN_ALLOW !== '1') {
    return new NextResponse('Not found', { status: 404 })
  }

  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { email, password } = body
  if (!email || !password) {
    return NextResponse.json({ error: 'email_and_password_required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    return NextResponse.json({ error: error?.message ?? 'signin_failed' }, { status: 401 })
  }

  return NextResponse.json({ userId: data.user.id })
}

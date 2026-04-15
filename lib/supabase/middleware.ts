import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

/**
 * 미들웨어에서 호출되는 Supabase 세션 갱신 함수.
 *
 * 부가적으로 검증된 user.id를 `x-naelum-user-id` request header로 주입해
 * 하위 서버 컴포넌트(`app/page.tsx` 등)가 `supabase.auth.getUser()`를 중복 호출하지
 * 않아도 되게 한다. 이로써 요청당 auth 서버 round trip을 1회 절약 (~100ms).
 *
 * 보안:
 * - 클라이언트가 `x-naelum-user-id`를 위조해 보낼 수 있으므로 중계 전에 항상 delete 후
 *   실제 검증된 user.id로 덮어쓴다. 페이지 코드는 이 헤더를 신뢰해도 됨.
 */
const USER_ID_HEADER = 'x-naelum-user-id'

export async function updateSession(request: NextRequest): Promise<{ response: NextResponse; user: User | null }> {
  // 1차: supabase가 cookie 갱신을 기록할 임시 응답
  const cookieCollector = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            cookieCollector.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: 세션 갱신 + user 반환
  // getUser()가 네트워크 오류 등으로 throw하면 미들웨어 전체가 503으로 실패하므로
  // try/catch로 감싸고 실패 시 비인증(guest)으로 처리
  let user: User | null = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // auth 서버 오류 시 guest로 처리 (서비스 중단 방지)
  }

  // 2차: user.id를 request header에 심은 최종 응답 생성 + 쿠키 이전
  const headers = new Headers(request.headers)
  // 클라이언트가 직접 보냈을 가능성 있는 가짜 헤더 제거 (spoofing 방지)
  headers.delete(USER_ID_HEADER)
  if (user) {
    headers.set(USER_ID_HEADER, user.id)
  }

  const finalResponse = NextResponse.next({ request: { headers } })
  // cookieCollector에 쌓인 쿠키(토큰 갱신 포함)를 최종 응답으로 이전
  for (const c of cookieCollector.cookies.getAll()) {
    finalResponse.cookies.set(c)
  }

  return { response: finalResponse, user }
}

/** 서버 컴포넌트/라우트에서 middleware가 주입한 검증된 user.id를 읽는다. */
export async function getVerifiedUserIdFromHeaders(): Promise<string | null> {
  const { headers } = await import('next/headers')
  const h = await headers()
  return h.get(USER_ID_HEADER)
}

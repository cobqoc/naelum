import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

// 로그인 필요 경로 (정적)
const PROTECTED_ROUTES = [
  '/tip/new',
  '/recipes/new',
  '/fridge',
  '/recommendations',
]

// 로그인 필요 경로 (동적 세그먼트 포함)
const PROTECTED_PATTERNS = [
  /^\/recipes\/[^/]+\/cook(\/|$)/,
  /^\/recipes\/[^/]+\/edit(\/|$)/,
]

// 관리자 전용 경로
const ADMIN_ROUTES = ['/admin']

// 이미 로그인된 사용자를 홈으로 리다이렉트할 경로
const AUTH_ONLY_ROUTES = ['/login', '/signup', '/signup/set-password']

function createSupabaseClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected =
    PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) ||
    PROTECTED_PATTERNS.some((p) => p.test(pathname))
  const isAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  const isAuthOnly = AUTH_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))

  // updateSession은 항상 1회 호출 (쿠키 갱신 + user 반환)
  const { response, user } = await updateSession(request)

  // 이미 로그인된 사용자가 /login, /signup 접근 시 홈으로 리다이렉트
  if (isAuthOnly && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 미인증 사용자가 보호된 경로 접근 시 로그인으로 리다이렉트
  if (!user && (isProtected || isAdmin)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 인증된 사용자에 대한 추가 체크 (차단 여부, 관리자 권한)
  if (user && (isProtected || isAdmin)) {
    const supabase = createSupabaseClient(request)

    const { data: banned } = await supabase
      .from('banned_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (banned) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (isAdmin) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

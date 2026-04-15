import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

// AI 학습 데이터 수집 봇 (모든 경로 차단 — robots.txt 제외)
const BLOCKED_AI_CRAWLERS = [
  /GPTBot/i,
  /ChatGPT-User/i,
  /Google-Extended/i,
  /\bCCBot\b/i,
  /anthropic-ai/i,
  /ClaudeBot/i,
  /Bytespider/i,        // TikTok/ByteDance
  /AhrefsBot/i,
  /SemrushBot/i,
  /MJ12bot/i,
  /DotBot/i,
  /DataForSeoBot/i,
  /PetalBot/i,
]

// 악성 스크래퍼 User-Agent (API 경로만 차단)
const BLOCKED_UA_PATTERNS = [
  /python-requests/i,
  /scrapy/i,
  /wget/i,
  /libwww-perl/i,
  /Go-http-client/i,
  /java\/\d/i,
  /\bbot\b(?!.*(?:google|bing|yandex|naver|kakao|apple|twitter|facebook|slack))/i,
  /\bcrawler\b(?!.*(?:google|bing|yandex))/i,
  /\bspider\b(?!.*(?:google|bing|yandex))/i,
]

function isAICrawler(request: NextRequest): boolean {
  const ua = request.headers.get('user-agent') || ''
  return BLOCKED_AI_CRAWLERS.some(p => p.test(ua))
}

function isBlockedBot(request: NextRequest): boolean {
  const ua = request.headers.get('user-agent') || ''
  if (!ua) return true // User-Agent 없으면 차단
  return BLOCKED_UA_PATTERNS.some(p => p.test(ua))
}

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

  // AI 크롤러: robots.txt 제외 전체 차단
  if (pathname !== '/robots.txt' && isAICrawler(request)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // 악성 봇: API 경로만 차단
  if (pathname.startsWith('/api/') && isBlockedBot(request)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const isProtected =
    PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) ||
    PROTECTED_PATTERNS.some((p) => p.test(pathname))
  const isAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  const isAuthOnly = AUTH_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))

  // 세션 쿠키 없으면 user는 반드시 null → Supabase API 호출 생략
  const hasSessionCookie = request.cookies.getAll().some(
    c => c.name.startsWith('sb-') && c.name.includes('-auth-token')
  )

  if (!hasSessionCookie) {
    if (isProtected || isAdmin) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    // isAuthOnly: user가 null이므로 리다이렉트 불필요
    return NextResponse.next()
  }

  // 세션 쿠키 있음: 토큰 갱신 + user 반환
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

  // 약관/온보딩 게이트
  // naelum_terms_ok 쿠키가 없는 로그인 유저는 DB 프로필 확인
  // onboarding_completed: true → 30일짜리 확인 쿠키 발급 후 통과
  // onboarding_completed: false 또는 프로필 없음 → terms-agreement 리다이렉트
  const termsOk = request.cookies.get('naelum_terms_ok')?.value === '1'
  if (user && !termsOk && !pathname.startsWith('/auth/') && !pathname.startsWith('/api/')) {
    const supabase = createSupabaseClient(request)
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/auth/terms-agreement', request.url))
    }

    // 온보딩 완료 → 30일 확인 쿠키 발급 (이후 DB 조회 생략)
    response.cookies.set('naelum_terms_ok', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

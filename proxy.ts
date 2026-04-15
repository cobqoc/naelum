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

// bfcache 차단: 뒤로가기로 인증 플로우를 우회하지 못하도록
// /signup, /login, /auth/* 및 세션 쿠키가 있는 모든 응답에서 브라우저 캐시 비활성화.
// no-store가 있으면 bfcache도 무효화되어 네비게이션 시 항상 미들웨어가 재실행된다.
function applyNoStore(res: NextResponse, pathname: string, hasSession: boolean) {
  const needsNoStore =
    hasSession ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth/')
  if (needsNoStore) {
    res.headers.set('Cache-Control', 'no-store, must-revalidate')
  }
  return res
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
      return applyNoStore(NextResponse.redirect(loginUrl), pathname, false)
    }
    // isAuthOnly: user가 null이므로 리다이렉트 불필요
    return applyNoStore(NextResponse.next(), pathname, false)
  }

  // 세션 쿠키 있음: 토큰 갱신 + user 반환
  const { response, user } = await updateSession(request)

  // 이미 로그인된 사용자가 /login, /signup 접근 시 홈으로 리다이렉트
  if (isAuthOnly && user) {
    return applyNoStore(NextResponse.redirect(new URL('/', request.url)), pathname, true)
  }

  // 미인증 사용자가 보호된 경로 접근 시 로그인으로 리다이렉트
  if (!user && (isProtected || isAdmin)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return applyNoStore(NextResponse.redirect(loginUrl), pathname, !!user)
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
      return applyNoStore(NextResponse.redirect(new URL('/', request.url)), pathname, true)
    }

    if (isAdmin) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        return applyNoStore(NextResponse.redirect(new URL('/', request.url)), pathname, true)
      }
    }
  }

  // 약관/온보딩 게이트 — 항상 DB를 소스 오브 트루스로 조회한다.
  // 과거에 naelum_terms_ok 쿠키로 fast-path를 썼지만, profile 상태가 서버에서
  // 변경될 때(삭제/재생성, admin 리셋 등) 쿠키가 stale 상태로 남아 게이트를
  // 우회하는 버그가 있었다. 정확성 > 성능 원칙으로 매 요청마다 DB 체크.
  if (user && !pathname.startsWith('/auth/') && !pathname.startsWith('/api/')) {
    const supabase = createSupabaseClient(request)
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.onboarding_completed) {
      return applyNoStore(
        NextResponse.redirect(new URL('/auth/terms-agreement', request.url)),
        pathname,
        true
      )
    }
  }

  // 과거 버전에서 발급된 naelum_terms_ok 쿠키는 더 이상 사용하지 않으므로 제거한다.
  // (브라우저에 남아있어도 무해하지만 이번 기회에 청소)
  if (request.cookies.get('naelum_terms_ok')) {
    response.cookies.delete('naelum_terms_ok')
  }

  return applyNoStore(response, pathname, hasSessionCookie)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

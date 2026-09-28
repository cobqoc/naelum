import { NextResponse, type NextRequest } from 'next/server'
import { updateSession, USER_ID_HEADER } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales'
import { peekSessionJwt } from '@/lib/auth/peekSessionJwt'

// /[lang]/ path-based i18n. URL prefix가 없으면 detected locale로 redirect.
// 각 locale별 정적 prerender → CDN 캐시 분리 가능 (Vary 쿠키 없이도 캐싱).
const I18N_EXEMPT_PREFIXES = [
  '/api/',
  '/_next/',
  '/icons/',
  '/sitemap.xml',
  '/robots.txt',
  '/manifest.json',
  '/offline.html',  // SW STATIC_ASSETS — locale 307 redirect 시 cache.addAll이 redirected 응답 거부 → install 실패 (C/AUDIT C6 footgun)
  '/favicon.ico',
  '/sw.js',
  '/workbox-',
]

function isI18nExempt(pathname: string): boolean {
  return I18N_EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))
}

// public/ 정적 PWA 자산 — 세션 갱신·온보딩 게이트가 필요 없는 파일. 봇 차단 뒤, i18n 리다이렉트 앞에서
// 통과시킨다(perf 2026-09-27). 브라우저는 /sw.js 를 매 하드 내비게이션마다 쿠키와 함께 다시 받아가므로,
// 로그인 사용자는 이 요청 하나에 getUser(Auth 왕복) + profiles 조회를 매번 치르고 있었다.
// 응답 바이트·헤더는 동일: 비로그인은 원래 no-store 없이, 세션 쿠키 보유자는 원래대로 no-store.
// 부수 효과 하나: onboarding_completed=false 세션에서 /sw.js 가 terms-agreement 로 307 되어 SW 등록이
// 실패하던 잠복 버그가 사라진다(SW 는 navigate 를 network-only 로 넘기므로 게이트는 페이지 요청에서 그대로 작동).
// 목록은 쿠키가 실려 오는 세 파일로 한정 — /robots.txt·/sitemap.xml 은 크롤러 요청이라 쿠키가 없고,
// AI 크롤러 403 을 유지하기 위해 matcher 제외 대신 코드 내 early return 을 쓴다.
const STATIC_PASSTHROUGH = ['/sw.js', '/manifest.json', '/offline.html']

/** Supabase 세션 쿠키(`sb-<ref>-auth-token*`) 보유 여부 — 없으면 user 는 반드시 null (Supabase 호출 생략 근거). */
function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    c => c.name.startsWith('sb-') && c.name.includes('-auth-token')
  )
}

function hasLangPrefix(pathname: string): Language | null {
  // /ko or /ko/anything
  const m = /^\/([a-z]{2})(?=\/|$)/.exec(pathname)
  if (!m) return null
  const lang = m[1] as Language
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : null
}

function detectLanguage(request: NextRequest): Language {
  // 1) language 쿠키 우선
  const fromCookie = request.cookies.get('language')?.value as Language | undefined
  if (fromCookie && SUPPORTED_LANGUAGES.includes(fromCookie)) return fromCookie
  // 2) Accept-Language 헤더
  const al = request.headers.get('accept-language') || ''
  const first = al.split(',')[0]?.trim().split('-')[0] as Language | undefined
  if (first && SUPPORTED_LANGUAGES.includes(first)) return first
  return 'ko'
}

/** pathname에서 lang prefix 제거. /ko/recipes → /recipes. lang 없으면 그대로. */
function stripLang(pathname: string): string {
  const m = /^\/([a-z]{2})(?=\/|$)(.*)$/.exec(pathname)
  if (!m) return pathname
  const lang = m[1] as Language
  if (!SUPPORTED_LANGUAGES.includes(lang)) return pathname
  return m[2] || '/'
}

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

/** auth-js EXPIRY_MARGIN_MS(3 × 30s)와 동일 — 이 구간이면 서버 클라이언트가 토큰 갱신을 시도하므로 겹치기 생략 */
const JWT_EXPIRY_MARGIN_MS = 90_000

/** 게이트가 쓰는 profiles 행(role·onboarding_completed). null = 행 없음/오류. */
type GateProfileRow = { role: string | null; onboarding_completed: boolean | null } | null

// 로그인 필요 경로 (정적)
// — 체험 모드 철학: 재료 추가/추천/조리 가이드는 비로그인도 가능.
//   쓰기(낼름/만들어봤어요/댓글/조리 완료 기록)만 로그인 요구.
const PROTECTED_ROUTES = [
  '/tip/new',
  '/recipes/new',
  '/fridge',
]

// 로그인 필요 경로 (동적 세그먼트 포함)
const PROTECTED_PATTERNS = [
  /^\/recipes\/[^/]+\/edit(\/|$)/,
]

// 관리자 전용 경로
const ADMIN_ROUTES = ['/admin']

// 이미 로그인된 사용자를 홈으로 리다이렉트할 경로
const AUTH_ONLY_ROUTES = ['/signin', '/signup', '/signup/set-password']

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
// /signup, /signin, /auth/* 및 세션 쿠키가 있는 모든 응답에서 브라우저 캐시 비활성화.
// no-store가 있으면 bfcache도 무효화되어 네비게이션 시 항상 미들웨어가 재실행된다.
function applyNoStore(res: NextResponse, pathname: string, hasSession: boolean) {
  // lang prefix 제거 후 매칭 — /ko/signin, /en/signup 모두 인식.
  const m = /^\/([a-z]{2})(?=\/|$)(.*)$/.exec(pathname)
  const bare = m && SUPPORTED_LANGUAGES.includes(m[1] as Language) ? (m[2] || '/') : pathname
  const needsNoStore =
    hasSession ||
    bare.startsWith('/signup') ||
    bare.startsWith('/signin') ||
    bare.startsWith('/auth/')
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

  // 정적 PWA 자산 통과 — 세션 갱신·게이트 생략, Cache-Control 은 기존과 동일 (STATIC_PASSTHROUGH 주석 참고)
  if (STATIC_PASSTHROUGH.includes(pathname)) {
    return applyNoStore(NextResponse.next(), pathname, hasSupabaseSessionCookie(request))
  }

  // /[lang]/ path-based i18n: bare path는 detected lang으로 redirect.
  // /api, /icons 등 i18n 무관 경로는 skip.
  if (!isI18nExempt(pathname) && !hasLangPrefix(pathname)) {
    const lang = detectLanguage(request)
    const redirected = new URL(`/${lang}${pathname === '/' ? '' : pathname}${request.nextUrl.search}`, request.url)
    return NextResponse.redirect(redirected, 307)
  }

  // 보호된 경로 매칭은 lang prefix를 제거한 상태로 — /ko/signin, /en/signin 모두 /signin 패턴에 매칭.
  const bare = stripLang(pathname)
  const isProtected =
    PROTECTED_ROUTES.some((r) => bare === r || bare.startsWith(r + '/')) ||
    PROTECTED_PATTERNS.some((p) => p.test(bare))
  const isAdmin = ADMIN_ROUTES.some((r) => bare.startsWith(r))
  const isAuthOnly = AUTH_ONLY_ROUTES.some((r) => bare === r || bare.startsWith(r + '/'))
  // 현재 요청의 lang prefix — 리다이렉트 시 같은 lang 유지.
  const langPrefix = hasLangPrefix(pathname) ? `/${hasLangPrefix(pathname)}` : ''

  // /login → /signin 호환 redirect (2026-05-26 rename, 외부 북마크 대비)
  // /api/auth/login 은 i18n 면제라 여기 안 옴. KMP 앱은 /api/auth/signin 직접 호출.
  if (bare === '/login' || bare.startsWith('/login/')) {
    const newPath = bare.replace(/^\/login/, '/signin')
    return NextResponse.redirect(
      new URL(`${langPrefix}${newPath}${request.nextUrl.search}`, request.url),
      308
    )
  }

  // 세션 쿠키 없으면 user는 반드시 null → Supabase API 호출 생략
  const hasSessionCookie = hasSupabaseSessionCookie(request)

  if (!hasSessionCookie) {
    if (isProtected || isAdmin) {
      const loginUrl = new URL(`${langPrefix}/signin`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return applyNoStore(NextResponse.redirect(loginUrl), pathname, false)
    }
    // isAuthOnly: user가 null이므로 리다이렉트 불필요
    // fix (2026-09-28): 세션 쿠키가 없어도 클라이언트가 보낸 x-naelum-user-id 는 반드시 제거한다.
    // 이전엔 이 분기에서 제거하지 않아, 비로그인 요청이 위조 헤더로 홈 SSR 을 "로그인 상태"로 렌더시킬 수 있었다
    // (RLS 로 개인 데이터 유출은 없었지만 인증 판정이 위조 가능). 쿠키 있는 경로(updateSession·읽기 API)는 이미 제거함.
    const headers = new Headers(request.headers)
    headers.delete(USER_ID_HEADER)
    return applyNoStore(NextResponse.next({ request: { headers } }), pathname, false)
  }

  // 읽기 API fast path (perf 2026-09-27): GET/HEAD /api/* 에서는 미들웨어가 인증 결과를 쓰지 않는다.
  //  - isAuthOnly/isProtected/isAdmin 은 페이지 경로 패턴이라 /api/* 는 매칭되지 않고
  //  - 온보딩 게이트는 변경 메서드(POST/PUT/PATCH/DELETE)에만 적용되며(isGatedMutatingApi)
  //  - x-naelum-user-id 를 읽는 곳은 홈 페이지(app/[lang]/page.tsx)뿐, API 라우트는 0곳.
  // 모든 API 라우트는 requireAuth/verifyAdmin/createClient 로 스스로 인증한다 → Auth 왕복 1회 절감.
  // 만료 임박 토큰 갱신은 라우트의 createClient()(route handler 에서 cookies().set 가능)가 같은 방식으로 수행한다.
  // 응답은 기존과 동일: 위조 헤더 제거, 레거시 쿠키 청소, Cache-Control no-store.
  if (pathname.startsWith('/api/') && (request.method === 'GET' || request.method === 'HEAD')) {
    const headers = new Headers(request.headers)
    headers.delete(USER_ID_HEADER)
    const readResponse = NextResponse.next({ request: { headers } })
    if (request.cookies.get('naelum_terms_ok')) {
      readResponse.cookies.delete('naelum_terms_ok')
    }
    return applyNoStore(readResponse, pathname, true)
  }

  // 약관/온보딩 게이트 대상 판정(아래 게이트 주석 참고) — profiles 조회를 getUser 와 겹치기 위해 위로 올림.
  const isApiPath = pathname.startsWith('/api/')
  const isAuthApi = pathname.startsWith('/api/auth/')
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
  const isGatedPage = !isApiPath && !bare.startsWith('/auth/')
  const isGatedMutatingApi = isApiPath && !isAuthApi && isMutating

  // (perf 2026-09-27) 게이트용 profiles 행 조회를 getUser(Auth 왕복)와 겹쳐 시작한다.
  // 쿠키의 *서명 미검증* sub 로 시작만 하고, 아래에서 검증된 user.id 와 같을 때만 결과를 쓴다 — 판정은 여전히
  // 검증된 user 로만 한다. 토큰 만료 90초 이내(auth-js 가 갱신을 시도하는 구간)면 겹치지 않고 기존 직렬 경로.
  // 조회는 요청 자신의 쿠키 JWT 로 PostgREST 가 인가하므로(profiles SELECT 는 인증 사용자에 공개) 위조 sub 로
  // 얻을 수 있는 것이 없고, 불일치·오류·마진 안이면 기존 쿼리가 기존 시점에 그대로 실행된다.
  let overlap: { sub: string; promise: Promise<GateProfileRow | undefined> } | null = null
  if (isGatedPage || isGatedMutatingApi || isProtected || isAdmin) {
    const jwt = await peekSessionJwt((name) => request.cookies.get(name)?.value, process.env.NEXT_PUBLIC_SUPABASE_URL!)
    if (jwt && jwt.exp * 1000 - Date.now() > JWT_EXPIRY_MARGIN_MS) {
      overlap = {
        sub: jwt.sub,
        // PostgREST 빌더는 .then 호출 시 즉시 요청을 보낸다. 결과는 절대 reject 하지 않는 Promise 로 감싼다.
        promise: Promise.resolve(
          createSupabaseClient(request)
            .from('profiles')
            .select('role, onboarding_completed')
            .eq('id', jwt.sub)
            .maybeSingle()
            .then(
              ({ data, error }) => (error ? undefined : ((data as GateProfileRow) ?? null)),
              () => undefined,
            ),
        ),
      }
    }
  }

  // 세션 쿠키 있음: 토큰 갱신 + user 반환
  const { response, user } = await updateSession(request)

  // 겹쳐 읽은 행 — 검증된 user 와 같은 id 이고 오류가 없을 때만 사용. undefined = 사용 불가(기존 쿼리 실행).
  // 게이트가 실제로 행을 필요로 할 때만 기다린다(로그인 사용자의 /signin 리다이렉트 등은 기다리지 않음).
  const getOverlappedProfile = async (): Promise<GateProfileRow | undefined> =>
    overlap && user && overlap.sub === user.id ? overlap.promise : undefined

  // 이미 로그인된 사용자가 /signin, /signup 접근 시 홈으로 리다이렉트
  if (isAuthOnly && user) {
    return applyNoStore(NextResponse.redirect(new URL(`${langPrefix}/`, request.url)), pathname, true)
  }

  // 미인증 사용자가 보호된 경로 접근 시 로그인으로 리다이렉트
  if (!user && (isProtected || isAdmin)) {
    const loginUrl = new URL(`${langPrefix}/signin`, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return applyNoStore(NextResponse.redirect(loginUrl), pathname, !!user)
  }

  // 보호/관리자 경로에서 읽은 profiles 행을 아래 온보딩 게이트가 재사용한다 (같은 요청·같은 행).
  // undefined = 아직 안 읽음(게이트가 기존 쿼리 실행), null = 읽었지만 없음/오류.
  let gateProfile: GateProfileRow | undefined

  // 인증된 사용자에 대한 추가 체크 (차단 여부, 관리자 권한)
  if (user && (isProtected || isAdmin)) {
    const supabase = createSupabaseClient(request)

    // banned 조회와 profiles(role·onboarding) 조회는 서로 독립한 읽기 → 병렬 (perf 2026-09-27).
    // 판정 순서(차단 → 관리자 권한 → 온보딩)는 그대로다.
    const [{ data: banned }, profileRes] = await Promise.all([
      supabase
        .from('banned_users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle(),
      // 겹쳐 읽은 행이 있으면 그것을, 없으면(불일치·오류·마진 안) 기존과 같은 조회를 banned 와 병렬로.
      getOverlappedProfile().then(async (row): Promise<{ data: GateProfileRow; error: unknown }> =>
        row !== undefined
          ? { data: row, error: null }
          : await supabase
              .from('profiles')
              .select('role, onboarding_completed')
              .eq('id', user.id)
              .maybeSingle(),
      ),
    ])
    gateProfile = profileRes.error ? null : profileRes.data

    if (banned) {
      await supabase.auth.signOut()
      return applyNoStore(NextResponse.redirect(new URL(`${langPrefix}/`, request.url)), pathname, true)
    }

    // 이전 `.single()` + (error || !profile || role !== 'admin') 와 같은 입력 집합에서 리다이렉트:
    // 행 없음/오류 → gateProfile null → 리다이렉트.
    if (isAdmin && (!gateProfile || gateProfile.role !== 'admin')) {
      return applyNoStore(NextResponse.redirect(new URL(`${langPrefix}/`, request.url)), pathname, true)
    }
  }

  // 약관/온보딩 게이트 — 항상 DB를 소스 오브 트루스로 조회한다.
  // 과거에 naelum_terms_ok 쿠키로 fast-path를 썼지만, profile 상태가 서버에서
  // 변경될 때(삭제/재생성, admin 리셋 등) 쿠키가 stale 상태로 남아 게이트를
  // 우회하는 버그가 있었다. 정확성 > 성능 원칙으로 매 요청마다 DB 체크.
  //
  // 페이지뿐 아니라 *변경(mutating) API* 도 게이트한다. 과거엔 `/api/*` 를 통째로
  // 제외해, 약관·연령 미동의(onboarding_completed=false) 세션이 페이지 게이트를
  // 우회해 POST/PUT/PATCH/DELETE 로 레시피·댓글·재료 등을 직접 쓸 수 있었다(동의 강제 무력화).
  // 예외:
  //   - /auth/ 페이지(약관 화면 자체) — 무한 redirect 방지
  //   - /api/auth/* — signin·signout·cancel-signup 등 온보딩을 *완료/탈출* 하는 데 필요
  //   - GET 등 비변경 메서드 — 읽기는 무해 + 온보딩 중 /api/users/check-username(GET) 필요
  // 온보딩 완료 write(profile.onboarding_completed=true)·아바타 업로드는 클라이언트
  // 직접 supabase 호출이라 /api 를 안 거침 → API 게이트해도 온보딩이 막히지 않는다.
  // (isApiPath·isGatedPage·isGatedMutatingApi 판정은 updateSession 위로 올라가 있다)
  if (user && (isGatedPage || isGatedMutatingApi)) {
    // 보호/관리자 경로에서 이미 읽은 행이 있으면 재사용(같은 요청의 같은 행), 없으면 기존 쿼리 그대로.
    let profile: { onboarding_completed: boolean | null } | null
    const overlapped = gateProfile === undefined ? await getOverlappedProfile() : undefined
    if (gateProfile !== undefined) {
      profile = gateProfile
    } else if (overlapped !== undefined) {
      profile = overlapped
    } else {
      const supabase = createSupabaseClient(request)
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle()
      profile = data
    }

    if (!profile?.onboarding_completed) {
      if (isGatedMutatingApi) {
        // API 는 redirect 가 무의미 → 403 JSON 으로 표면화.
        return applyNoStore(
          NextResponse.json({ error: 'onboarding_required' }, { status: 403 }),
          pathname,
          true
        )
      }
      return applyNoStore(
        NextResponse.redirect(new URL(`${langPrefix}/auth/terms-agreement`, request.url)),
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

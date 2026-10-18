// Next.js 16 + Turbopack 환경에서는 sentry.client.config.ts가 더 이상 로드되지 않는다.
// @sentry/nextjs 10.x의 deprecation warning에 따라 instrumentation-client.ts로 이동.
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
//
// GDPR: Sentry는 에러 추적·IP·세션 리플레이를 수집 → 사용자 동의 필수.
// localStorage에서 consent 동기 읽기 → analytics 허용 시에만 init.
//
// 주의: lib/cookieConsent/types.ts를 import하지 않는다.
// instrumentation-client.ts는 [app-client] 번들과 분리된 독립 번들로 실행되므로,
// 같은 모듈을 두 번들이 공유하면 Turbopack dev 모드에서 "module factory not available" 에러 발생.
//
// ── SDK 지연 로딩 (perf, 2026-09-27) ──────────────────────────────────────────
// 이전엔 `import * as Sentry from '@sentry/nextjs'` 정적 import 라 SDK 전체(core·browser·
// replay/rrweb·tracing ≈ 350KB raw / ~110KB gz — 2026-09-27 실측, docs/CHANGELOG 2026-09)가 *모든 라우트의 공유 메인 청크*에 실렸다.
// 그런데 init 은 `enabled: hasDsn && 동의` 라 동의 전(대부분의 세션)엔 이벤트를 하나도 안 보낸다.
// 이제 활성 여부를 (이전과 같은 시점인) 모듈 평가 시 한 번 결정하고, 활성일 때만 SDK 를
// dynamic import 해 init 한다. 비활성 세션은 SDK 바이트를 아예 내려받지 않는다.
//
// 에러 바운더리(app/error.tsx 등)는 `@sentry/nextjs` 를 직접 import 하지 않고 아래 전역
// promise(`__naelumSentry`)를 통해 캡처한다 → init 이 항상 capture 보다 먼저 실행되고,
// 앱 번들 어디에도 SDK 정적 import 가 남지 않는다. (모듈 공유 대신 전역을 쓰는 이유는 위 주의 참고.)
//
// 관측 가능한 차이는 관측성뿐(사용자 UI 없음):
//  - 활성(동의) 세션: SDK 가 수백 ms 늦게 붙어 그 사이 라우터 전환·브레드크럼은 미수집.
//    에러 바운더리 캡처는 로드 후 전달되므로 유실 없음.
//  - 비활성 세션: 이전에도 전송 0 → 차이 없음(오히려 fetch/XHR 래핑·rrweb DOM 녹화 부하 제거).

// 파사드(lib/sentry/client.ts)만 dynamic import — 네임스페이스 전체 import('@sentry/nextjs') 는 tree-shaking 을 잃어
// 비동기 청크가 ~225KB raw 커진다(감사 BW-1 검증). 파사드는 이 파일에서만 import 한다(파일 상단 주의 참고).
type SentryModule = typeof import('./lib/sentry/client')
type NavigationType = Parameters<SentryModule['captureRouterTransitionStart']>[1]
type SentryGlobal = typeof globalThis & { __naelumSentry?: Promise<SentryModule | null> }

// lib/cookieConsent/types.ts와 동기화 유지: CONSENT_KEY, CURRENT_CONSENT_VERSION
const _CONSENT_KEY = 'naelum_cookie_consent'
const _CONSENT_VERSION = 1

function _hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(_CONSENT_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return (
      typeof parsed?.version === 'number' &&
      parsed.version >= _CONSENT_VERSION &&
      parsed.analytics === true
    )
  } catch {
    return false
  }
}

const hasDsn = !!process.env.NEXT_PUBLIC_SENTRY_DSN
const hasAnalyticsConsent = _hasAnalyticsConsent()

// 활성화 조건 (이전 `enabled:` 옵션과 동일):
//   1. DSN 설정됨
//   2. 사용자가 "분석·에러 추적" 쿠키 동의 (GDPR)
// 비동의 사용자는 SDK 자체를 로드하지 않는다(이전: 로드는 하되 이벤트 전송 안 함).
const enabled = hasDsn && hasAnalyticsConsent

let sentry: SentryModule | null = null

if (enabled) {
  const ready: Promise<SentryModule | null> = import('./lib/sentry/client')
    .then((Sentry) => {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

        enabled,

        // 샘플링 비율 (프로덕션에서 10% 트랜잭션 추적)
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // 세션 리플레이 (에러 발생 시 100%, 일반 1%) — 동의한 유저만
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: 0.01,

        integrations: [Sentry.replayIntegration()],

        debug: process.env.NODE_ENV === 'development',
      })
      sentry = Sentry
      return Sentry
    })
    .catch(() => null) // SDK 청크 로드 실패 = 관측성만 손실, 앱 동작 무관
  ;(globalThis as SentryGlobal).__naelumSentry = ready
}

// Next 가 클라이언트 네비게이션마다 호출. SDK 로드 전(또는 비활성)엔 no-op —
// 원본 Sentry.captureRouterTransitionStart 도 init 전엔 내부 핸들러가 없어 no-op 이었다.
export function onRouterTransitionStart(href: string, navigationType: NavigationType): void {
  sentry?.captureRouterTransitionStart(href, navigationType)
}

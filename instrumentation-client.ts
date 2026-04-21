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

import * as Sentry from '@sentry/nextjs'

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

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 활성화 조건:
  //   1. DSN 설정됨
  //   2. 사용자가 "분석·에러 추적" 쿠키 동의 (GDPR)
  // 비동의 사용자는 Sentry SDK가 이벤트 전송 자체를 안 함.
  enabled: hasDsn && hasAnalyticsConsent,

  // 샘플링 비율 (프로덕션에서 10% 트랜잭션 추적)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 세션 리플레이 (에러 발생 시 100%, 일반 1%) — 동의한 유저만
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,

  integrations: [Sentry.replayIntegration()],

  debug: process.env.NODE_ENV === 'development',
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

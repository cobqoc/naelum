// Next.js 16 + Turbopack 환경에서는 sentry.client.config.ts가 더 이상 로드되지 않는다.
// @sentry/nextjs 10.x의 deprecation warning에 따라 instrumentation-client.ts로 이동.
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
//
// GDPR: Sentry는 에러 추적·IP·세션 리플레이를 수집 → 사용자 동의 필수.
// localStorage에서 consent 동기 읽기 → analytics 허용 시에만 init.

import * as Sentry from '@sentry/nextjs'
import { canUseAnalytics } from '@/lib/cookieConsent/types'

const hasDsn = !!process.env.NEXT_PUBLIC_SENTRY_DSN
const hasAnalyticsConsent = canUseAnalytics() // localStorage 동기 읽기

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

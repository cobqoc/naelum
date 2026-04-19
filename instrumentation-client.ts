// Next.js 16 + Turbopack 환경에서는 sentry.client.config.ts가 더 이상 로드되지 않는다.
// @sentry/nextjs 10.x의 deprecation warning에 따라 instrumentation-client.ts로 이동.
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 비활성화: DSN 없으면 아무것도 전송하지 않음
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 샘플링 비율 (프로덕션에서 10% 트랜잭션 추적)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 세션 리플레이 (에러 발생 시 100%, 일반 1%)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,

  integrations: [Sentry.replayIntegration()],

  debug: process.env.NODE_ENV === 'development',
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

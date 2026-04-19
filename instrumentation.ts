// Next.js 13+ instrumentation 표준 entry — server/edge runtime용 Sentry 초기화.
// 기존 sentry.server.config.ts / sentry.edge.config.ts를 동적 import로 분기.

import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// 서버 컴포넌트/route handler에서 throw된 에러를 Sentry로 캡처
export const onRequestError = Sentry.captureRequestError

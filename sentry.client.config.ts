import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 비활성화: DSN 없으면 아무것도 전송하지 않음
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 샘플링 비율 (프로덕션에서 10% 트랜잭션 추적)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 세션 리플레이 (에러 발생 시 100%, 일반 1%)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // 개발 환경에서 콘솔 출력
  debug: process.env.NODE_ENV === 'development',
});

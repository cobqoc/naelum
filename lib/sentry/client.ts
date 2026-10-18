/**
 * Sentry 브라우저 SDK 파사드 — instrumentation-client.ts 전용.
 *
 * `import('@sentry/nextjs')` 처럼 네임스페이스 전체를 dynamic import 하면 Turbopack 이 모든 export
 * (feedback·replay-canvas·profiling·feature-flag 통합·react-router 계측 등)를 실체화해 비동기 청크가
 * 약 +225KB raw 커진다(감사 측정: 579KB raw/182KB gz). 필요한 이름만 re-export 하는 이 파사드를
 * dynamic import 하면 정적 import 때와 같은 tree-shaking 이 유지된다(예상 ≈360KB raw/115KB gz).
 *
 * ⚠️ 이 파일은 instrumentation-client.ts 에서만 import 할 것. 앱 번들 코드가 import 하면
 *   (1) SDK 가 다시 앱 번들에 정적으로 들어가고 (2) instrumentation-client 는 별도 번들이라 같은 모듈을
 *   두 번들이 공유하면 Turbopack dev 에서 "module factory not available" 에러가 난다.
 *   에러 바운더리는 lib/sentry/captureException.ts(런타임 import 없음) 를 쓴다. (perf 2026-09-27)
 */
export { init, replayIntegration, captureRouterTransitionStart, captureException } from '@sentry/nextjs'

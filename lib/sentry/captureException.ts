/**
 * 에러 바운더리용 Sentry 캡처 — `@sentry/nextjs` 를 정적 import 하지 않는다.
 *
 * instrumentation-client.ts 가 (DSN + analytics 동의일 때만) SDK 를 dynamic import 해 init 한 뒤
 * 전역 `__naelumSentry` promise 에 모듈을 실어 둔다. 여기서는 그 promise 를 기다렸다가 캡처하므로
 *  - init 이 항상 capture 보다 먼저 실행되고,
 *  - 비활성(비동의·DSN 없음) 세션에선 SDK 바이트를 전혀 내려받지 않는다.
 * 이전 동작(enabled:false 로 init 된 SDK 가 이벤트를 drop)과 결과 동일 — 전송되는 이벤트 집합이 같다.
 *
 * instrumentation-client.ts 와 모듈을 공유하지 않는 이유: 그 파일은 별도 번들이라 같은 모듈을
 * 두 번들이 공유하면 Turbopack dev 에서 "module factory not available" 에러(파일 상단 주석 참고).
 */
type SentryModule = typeof import('./client') // 타입 전용 — 런타임 import 금지(SDK 가 앱 번들로 돌아옴)
type SentryGlobal = typeof globalThis & { __naelumSentry?: Promise<SentryModule | null> }

export function captureException(error: unknown): void {
  const ready = (globalThis as SentryGlobal).__naelumSentry
  if (!ready) return
  ready.then((Sentry) => { Sentry?.captureException(error) }).catch(() => {})
}

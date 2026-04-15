/**
 * @supabase/realtime-js 대체 shim.
 *
 * 우리 앱은 Supabase realtime(WebSocket 구독)을 사용하지 않는다 (grep으로 확인 —
 * 어떤 파일에서도 .channel().subscribe() 호출 없음). 그런데 @supabase/supabase-js는
 * 생성자에서 `new RealtimeClient(...)`를 호출하고, 내부적으로 setAuth/channel 등을
 * 호출하기 때문에 실제 realtime-js(~80KB)가 번들에 포함되어 있었다.
 *
 * 이 shim은 클래스 surface만 유지하고 실제 WebSocket 로직은 모두 제거해
 * 클라이언트 번들에서 realtime-js를 통째로 빼낸다.
 *
 * 만약 나중에 realtime 기능이 필요해지면:
 * - next.config.ts의 turbopack/webpack alias를 제거
 * - 실제 패키지가 다시 번들에 포함됨
 */

// supabase-js가 import하는 심볼만 노출. 나머지는 `export * from '@supabase/realtime-js'`가
// undefined를 넘겨도 우리 앱이 직접 사용하지 않으므로 런타임에 문제 없음.

export class RealtimeClient {
  constructor(_url?: string, _options?: unknown) {}

  setAuth(_token: string | null): void {}

  channel(_name: string, _opts?: unknown): RealtimeChannel {
    return new RealtimeChannel()
  }

  getChannels(): RealtimeChannel[] {
    return []
  }

  removeChannel(_channel: RealtimeChannel): Promise<'ok' | 'timed out' | 'error'> {
    return Promise.resolve('ok')
  }

  removeAllChannels(): Promise<Array<'ok' | 'timed out' | 'error'>> {
    return Promise.resolve([])
  }

  disconnect(_code?: number, _reason?: string): void {}

  connect(): void {}
}

export class RealtimeChannel {
  topic: string = ''
  state: string = 'closed'

  subscribe(_callback?: unknown, _timeout?: number): this {
    return this
  }

  unsubscribe(_timeout?: number): Promise<'ok' | 'timed out' | 'error'> {
    return Promise.resolve('ok')
  }

  on(_event: string, _opts: unknown, _callback: unknown): this {
    return this
  }

  send(_payload: unknown, _opts?: unknown): Promise<'ok' | 'error' | 'timed out'> {
    return Promise.resolve('ok')
  }

  track(_payload: unknown, _opts?: unknown): Promise<'ok' | 'error' | 'timed out'> {
    return Promise.resolve('ok')
  }

  untrack(_opts?: unknown): Promise<'ok' | 'error' | 'timed out'> {
    return Promise.resolve('ok')
  }
}

// supabase-js가 혹시 이 타입들을 import 할 수 있어 export만 해둠
export type RealtimePresenceState = Record<string, unknown>
export type RealtimePostgresChangesPayload = Record<string, unknown>
export type REALTIME_PRESENCE_LISTEN_EVENTS = 'sync' | 'join' | 'leave'
export type REALTIME_LISTEN_TYPES = 'broadcast' | 'presence' | 'postgres_changes'
export type REALTIME_SUBSCRIBE_STATES = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR'

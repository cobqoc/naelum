import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  broadcastCrossTabAuth,
  subscribeCrossTabAuth,
  AUTH_CHANNEL_NAME,
  AUTH_EVENT_STORAGE_KEY,
} from '../crossTabAuth';

// 브라우저 전역 가짜 — BroadcastChannel·localStorage·window(EventTarget)
const log: string[] = [];

class FakeChannel {
  static instances: FakeChannel[] = [];
  onmessage: ((ev: { data: unknown }) => unknown) | null = null;
  closed = false;
  constructor(public name: string) {
    log.push(`new ${name}`);
    FakeChannel.instances.push(this);
  }
  postMessage(data: unknown) { log.push(`post ${JSON.stringify(data)}`); }
  close() { this.closed = true; log.push('close'); }
}

function fakeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => { log.push(`set ${k} ${v}`); m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
    clear: () => m.clear(),
  };
}

const storageEvent = (key: string | null, newValue: string | null) =>
  Object.assign(new Event('storage'), { key, newValue });

let win: EventTarget;

beforeEach(() => {
  log.length = 0;
  FakeChannel.instances = [];
  win = new EventTarget();
  vi.stubGlobal('window', win);
  vi.stubGlobal('localStorage', fakeStorage());
  vi.stubGlobal('BroadcastChannel', FakeChannel);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-04T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const NOW = new Date('2026-10-04T00:00:00Z').getTime();

describe('broadcastCrossTabAuth — 송신 형식·순서는 추출 전과 동일', () => {
  it('AUTH_SUCCESS: 채널 post → close → storage(timestamp 포함) 순서', () => {
    broadcastCrossTabAuth({ type: 'AUTH_SUCCESS' });
    expect(log).toEqual([
      `new ${AUTH_CHANNEL_NAME}`,
      'post {"type":"AUTH_SUCCESS"}',
      'close',
      `set ${AUTH_EVENT_STORAGE_KEY} {"type":"AUTH_SUCCESS","timestamp":${NOW}}`,
    ]);
    expect(AUTH_CHANNEL_NAME).toBe('auth-channel');
    expect(AUTH_EVENT_STORAGE_KEY).toBe('naelum_auth_event');
  });

  it('PASSWORD_RESET_READY: 토큰 키 순서 type→accessToken→refreshToken(→timestamp)', () => {
    broadcastCrossTabAuth({ type: 'PASSWORD_RESET_READY', accessToken: 'a', refreshToken: 'r' });
    expect(log).toEqual([
      `new ${AUTH_CHANNEL_NAME}`,
      'post {"type":"PASSWORD_RESET_READY","accessToken":"a","refreshToken":"r"}',
      'close',
      `set ${AUTH_EVENT_STORAGE_KEY} {"type":"PASSWORD_RESET_READY","accessToken":"a","refreshToken":"r","timestamp":${NOW}}`,
    ]);
  });

  it('BroadcastChannel 미지원(undefined) — 예외 없이 storage 폴백은 발송 (부수 버그 수정)', () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    expect(() => broadcastCrossTabAuth({ type: 'AUTH_SUCCESS' })).not.toThrow();
    expect(log).toEqual([`set ${AUTH_EVENT_STORAGE_KEY} {"type":"AUTH_SUCCESS","timestamp":${NOW}}`]);
  });

  it('BroadcastChannel 생성 예외(SecurityError 등)도 폴백 발송', () => {
    vi.stubGlobal('BroadcastChannel', class { constructor() { throw new Error('SecurityError'); } });
    broadcastCrossTabAuth({ type: 'AUTH_SUCCESS' });
    expect(log).toEqual([`set ${AUTH_EVENT_STORAGE_KEY} {"type":"AUTH_SUCCESS","timestamp":${NOW}}`]);
  });

  it('localStorage 쓰기 예외(사생활 보호 모드 등)는 삼킨다 — 채널은 정상 발송', () => {
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('QuotaExceededError'); } });
    expect(() => broadcastCrossTabAuth({ type: 'AUTH_SUCCESS' })).not.toThrow();
    expect(log).toEqual([`new ${AUTH_CHANNEL_NAME}`, 'post {"type":"AUTH_SUCCESS"}', 'close']);
  });
});

describe('subscribeCrossTabAuth — 채널·storage 두 경로 수신', () => {
  it('채널 메시지는 event.data 그대로, storage 는 키 일치 시 JSON 파싱 결과로 전달', () => {
    const ch: unknown[] = [];
    const st: unknown[] = [];
    const off = subscribeCrossTabAuth({ onChannelMessage: (d) => { ch.push(d); }, onStorageMessage: (d) => { st.push(d); } });
    expect(FakeChannel.instances).toHaveLength(1);
    FakeChannel.instances[0].onmessage!({ data: { type: 'AUTH_SUCCESS' } });
    win.dispatchEvent(storageEvent('other_key', '{"type":"AUTH_SUCCESS"}'));
    win.dispatchEvent(storageEvent(AUTH_EVENT_STORAGE_KEY, '{"type":"PASSWORD_RESET_READY","accessToken":"a"}'));
    win.dispatchEvent(storageEvent(AUTH_EVENT_STORAGE_KEY, null)); // 키 삭제 이벤트 → '{}'
    win.dispatchEvent(storageEvent(AUTH_EVENT_STORAGE_KEY, 'not json')); // 파싱 실패 → 무시
    expect(ch).toEqual([{ type: 'AUTH_SUCCESS' }]);
    expect(st).toEqual([{ type: 'PASSWORD_RESET_READY', accessToken: 'a' }, {}]);
    off();
  });

  it('storage 핸들러 예외는 삼킨다(기존 try/catch 동작)', () => {
    subscribeCrossTabAuth({ onChannelMessage: () => {}, onStorageMessage: () => { throw new Error('boom'); } });
    expect(() => win.dispatchEvent(storageEvent(AUTH_EVENT_STORAGE_KEY, '{"type":"x"}'))).not.toThrow();
  });

  it('정리 함수: 채널 close + storage 리스너 해제', () => {
    const st: unknown[] = [];
    const off = subscribeCrossTabAuth({ onChannelMessage: () => {}, onStorageMessage: (d) => { st.push(d); } });
    off();
    expect(FakeChannel.instances[0].closed).toBe(true);
    win.dispatchEvent(storageEvent(AUTH_EVENT_STORAGE_KEY, '{"type":"AUTH_SUCCESS"}'));
    expect(st).toEqual([]);
  });

  it('BroadcastChannel 미지원 — 예외 없이 storage 폴백 리스너는 등록된다 (부수 버그 수정)', () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    const st: unknown[] = [];
    let off: () => void = () => {};
    expect(() => { off = subscribeCrossTabAuth({ onChannelMessage: () => {}, onStorageMessage: (d) => { st.push(d); } }); }).not.toThrow();
    win.dispatchEvent(storageEvent(AUTH_EVENT_STORAGE_KEY, '{"type":"AUTH_SUCCESS"}'));
    expect(st).toEqual([{ type: 'AUTH_SUCCESS' }]);
    expect(() => off()).not.toThrow();
    win.dispatchEvent(storageEvent(AUTH_EVENT_STORAGE_KEY, '{"type":"AUTH_SUCCESS"}'));
    expect(st).toHaveLength(1);
  });
});

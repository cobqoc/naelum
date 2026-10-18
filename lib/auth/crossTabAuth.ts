/**
 * 크로스탭 인증 이벤트 — 이메일 링크로 열린 *새 탭*(auth/verify·auth/reset-password-verify)이
 * 원래 탭(회원가입 메일 대기 화면·로그인의 비밀번호 찾기 모달)에 "인증 완료"를 알린다.
 *
 * 2026-10-04 (PAU-16): 송신 4벌·수신 2벌로 복제돼 있던 코드를 1벌로. 채널 이름·storage 키·
 * 메시지 형식({ type, accessToken?, refreshToken? } + storage 엔 timestamp)·송신 순서
 * (채널 → storage)는 추출 전과 동일. 수신 쪽은 채널/storage 경로별 처리 차이(대기 여부·키 삭제
 * 순서)가 화면마다 달라 콜백을 경로별로 받는다.
 *
 * 부수 버그 수정(미지원 경로만): 예전엔 `new BroadcastChannel` 을 try 없이 호출해 미지원 브라우저
 * (iOS Safari < 15.4 등)에서 ① 송신 탭(verify)은 세션 확립에 성공하고도 예외로 '인증 실패' 화면,
 * ② 수신 탭은 effect 가 throw 해 에러 화면 — localStorage 폴백이 등록·발송되기 전에 죽어 한 번도
 * 동작할 수 없었다. 생성 실패만 삼키고 storage 폴백으로 계속한다(지원 브라우저 동작은 그대로).
 */

export const AUTH_CHANNEL_NAME = 'auth-channel';
export const AUTH_EVENT_STORAGE_KEY = 'naelum_auth_event';

/** 송신 이벤트 */
export type CrossTabAuthEvent =
  | { type: 'AUTH_SUCCESS' }
  | { type: 'PASSWORD_RESET_READY'; accessToken: string | undefined; refreshToken: string | undefined };

/** 수신 메시지 — 다른 탭이 보낸 값이라 형태를 보장하지 않는다(필드 존재를 확인하고 쓸 것) */
export interface CrossTabAuthMessage {
  type?: string;
  accessToken?: string;
  refreshToken?: string;
}

/** 다른 탭에 인증 이벤트 송신 — BroadcastChannel 후 localStorage 폴백(+timestamp) */
export function broadcastCrossTabAuth(event: CrossTabAuthEvent): void {
  try {
    const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    channel.postMessage(event);
    channel.close();
  } catch {
    // BroadcastChannel 미지원 — 아래 localStorage 폴백만 사용
  }
  try {
    localStorage.setItem(AUTH_EVENT_STORAGE_KEY, JSON.stringify({ ...event, timestamp: Date.now() }));
  } catch {}
}

/**
 * 다른 탭의 인증 이벤트 구독. 지원 브라우저에선 같은 이벤트가 두 경로로 모두 올 수 있다.
 * - onChannelMessage: BroadcastChannel 메시지(event.data 그대로)
 * - onStorageMessage: storage 이벤트(키 일치 시 newValue JSON 파싱 — 파싱·핸들러 예외는 삼킴, 기존 동작)
 * @returns 정리 함수(채널 close + storage 리스너 해제)
 */
export function subscribeCrossTabAuth(handlers: {
  onChannelMessage: (data: CrossTabAuthMessage) => void | Promise<void>;
  onStorageMessage: (data: CrossTabAuthMessage) => void;
}): () => void {
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<CrossTabAuthMessage>) => handlers.onChannelMessage(event.data);
  } catch {
    // BroadcastChannel 미지원 — storage 폴백만 사용
    channel = null;
  }

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === AUTH_EVENT_STORAGE_KEY) {
      try {
        const data = JSON.parse(event.newValue || '{}');
        handlers.onStorageMessage(data);
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    channel?.close();
    window.removeEventListener('storage', handleStorageEvent);
  };
}

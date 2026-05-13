/**
 * 자체 analytics 클라이언트 헬퍼.
 *
 * - CookieConsent.analytics 동의한 경우에만 전송 (GDPR)
 * - session_id는 localStorage uuid (지속) — 같은 브라우저에서 visitor 식별
 * - fetch keepalive → beforeunload·페이지 이동 중에도 전송 보장
 * - 실패는 silent (사용자 영향 0)
 */

import { readStoredConsent } from '@/lib/cookieConsent/types';

const SESSION_KEY = 'naelum_analytics_session';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (window.crypto?.randomUUID?.() ?? `s${Date.now()}_${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

function isAnalyticsAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  const consent = readStoredConsent();
  // analytics 동의 안 한 경우(또는 미결정) 전송 안 함
  return consent?.analytics === true;
}

export interface TrackPayload {
  [key: string]: unknown;
}

/**
 * 이벤트 전송. analytics 동의 안 한 경우 no-op.
 * 클라이언트 컴포넌트 또는 client-only 코드에서만 호출.
 */
export function track(eventType: string, payload?: TrackPayload): void {
  if (!isAnalyticsAllowed()) return;
  if (typeof window === 'undefined') return;

  const sessionId = getSessionId();
  if (!sessionId) return;

  let body: string;
  try {
    body = JSON.stringify({
      eventType,
      payload: payload ?? null,
      page: window.location.pathname,
      sessionId,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
    });
  } catch {
    return; // payload 직렬화 실패
  }

  // sendBeacon 우선 — 브라우저 background로 전송, networkidle·page navigate 영향 없음.
  // fetch keepalive로 fallback (sendBeacon 실패 시).
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon('/api/events', blob)) return;
    }
  } catch {/* fallthrough */}

  void fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {/* silent */});
}

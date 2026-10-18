'use client';

/**
 * GDPR 쿠키 동의 타입 정의
 *
 * 버전 관리 정책:
 * - 개인정보 처리방침 또는 쿠키 정책이 변경되면 CURRENT_CONSENT_VERSION을 올린다.
 * - 사용자가 가진 version < CURRENT_CONSENT_VERSION 이면 배너 재노출 (GDPR 재동의 의무).
 */

/** 현재 쿠키 정책 버전. 정책 변경 시 올리면 전 유저 재동의 유도됨. */
export const CURRENT_CONSENT_VERSION = 1;

/** 로컬 저장소 키 — version은 value 안에 포함되어 있음. (파일 내부 전용 — 2026-10-04 외부 소비처 0 확인) */
const CONSENT_KEY = 'naelum_cookie_consent';

/**
 * 쿠키 카테고리.
 * - essential: 항상 true (서비스 작동 필수 — 로그인·세션·CSRF). 사용자 거부 불가.
 * - analytics: Sentry 에러 추적, 향후 분석 도구. 사용자 선택.
 * - marketing: 광고/리마케팅. 현재 미사용이나 향후 대비.
 */
export interface CookieConsent {
  version: number;
  essential: true; // 항상 true
  analytics: boolean;
  marketing: boolean;
  timestamp: string; // ISO datetime
}

/**
 * 저장된 consent를 파싱. 유효하지 않거나 버전 낮으면 null 반환 (= 배너 재노출).
 */
function parseStoredConsent(raw: string | null): CookieConsent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // 필수 필드 존재 + 현재 버전 이상
    if (
      typeof parsed?.version === 'number' &&
      parsed.version >= CURRENT_CONSENT_VERSION &&
      typeof parsed?.analytics === 'boolean' &&
      typeof parsed?.marketing === 'boolean' &&
      typeof parsed?.timestamp === 'string'
    ) {
      return {
        version: parsed.version,
        essential: true,
        analytics: parsed.analytics,
        marketing: parsed.marketing,
        timestamp: parsed.timestamp,
      };
    }
    return null; // 구버전 또는 잘못된 shape
  } catch {
    return null;
  }
}

/**
 * SSR 안전: 클라이언트에서만 localStorage 읽기.
 */
export function readStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    return parseStoredConsent(localStorage.getItem(CONSENT_KEY));
  } catch {
    return null;
  }
}

/**
 * localStorage에 consent 저장.
 */
export function writeStoredConsent(consent: CookieConsent): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // storage 사용 불가 — 무시
  }
}

// 2026-10-04: 소비처 0 이던 canUseAnalytics·canUseMarketing·DEFAULT_REJECTED·DEFAULT_ACCEPTED_ALL·ConsentChoice 삭제.
// instrumentation-client.ts 는 번들 분리를 위해 이 파일을 import 하지 않고 자체 _hasAnalyticsConsent() 를 쓴다.

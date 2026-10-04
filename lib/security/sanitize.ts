/**
 * HTML sanitization to prevent XSS attacks.
 * Strips all HTML tags and dangerous attributes from user input.
 */

const HTML_TAG_REGEX = /<\/?[^>]+(>|$)/g;
const SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_REGEX = /\bon\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_URI_REGEX = /javascript\s*:/gi;
const DATA_URI_REGEX = /data\s*:[^,]*(?:;[^,]*)*,/gi;

/**
 * Sanitize a string by removing HTML tags and dangerous content.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  return input
    .replace(SCRIPT_REGEX, '')
    .replace(EVENT_HANDLER_REGEX, '')
    .replace(JAVASCRIPT_URI_REGEX, '')
    .replace(DATA_URI_REGEX, '')
    .replace(HTML_TAG_REGEX, '')
    .trim();
}

// (2026-10-04 API1-32: 호출처 0(테스트만 사용)이던 `sanitizeObject` 제거 — 라우트는 필드별 sanitizeHtml 을 직접 쓴다.)

/**
 * 이메일 HTML 본문에 사용자 입력을 넣기 전 이스케이프(& < > ").
 * 문의·저작권 신고 알림 메일이 같은 함수를 각자 복붙하던 것을 단일화(2026-10-04).
 */
export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * 이메일 헤더(subject)에 들어갈 값의 개행·제어문자 제거 — 헤더 인젝션 방지.
 * `이름\nBcc: victim@…` 같은 입력으로 메일 헤더를 조작하지 못하게 한 줄로 강제(최대 100자).
 */
export function sanitizeEmailHeader(str: string): string {
  return str.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

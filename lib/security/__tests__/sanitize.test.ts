import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../sanitize';

// XSS 방지 — 사용자 입력에서 HTML/스크립트/위험 속성 제거.
// 보안 직결 함수라 현재 제거 동작을 정확히 고정한다.

describe('sanitizeHtml', () => {
  it('빈 값 → 빈 문자열', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('평문은 그대로 (trim 적용)', () => {
    expect(sanitizeHtml('plain text')).toBe('plain text');
    expect(sanitizeHtml('  spaced  ')).toBe('spaced');
  });

  it('HTML 태그 제거', () => {
    expect(sanitizeHtml('<b>hi</b>')).toBe('hi');
    expect(sanitizeHtml('Hello <world>')).toBe('Hello');
  });

  it('<script> 블록 완전 제거', () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).toBe('');
  });

  it('이벤트 핸들러 속성 + 태그 제거', () => {
    expect(sanitizeHtml('<img src=x onerror="alert(1)">')).toBe('');
  });

  it('javascript: URI 스킴 제거', () => {
    expect(sanitizeHtml('javascript:alert(1)')).toBe('alert(1)');
  });

  it('태그가 아닌 "<" 는 보존 — 이모티콘·비교·분량 표기', () => {
    expect(sanitizeHtml('a < b')).toBe('a < b');
    expect(sanitizeHtml('<3 최고')).toBe('<3 최고');
    expect(sanitizeHtml('정말 맛있어요 <3')).toBe('정말 맛있어요 <3');
    expect(sanitizeHtml('물은 <1컵, 소금 <= 1작은술')).toBe('물은 <1컵, 소금 <= 1작은술');
  });

  it('닫는 태그·주석·닫히지 않은 태그는 제거', () => {
    expect(sanitizeHtml('a</b> c')).toBe('a c');
    expect(sanitizeHtml('x<!-- hidden -->y')).toBe('xy');
    expect(sanitizeHtml('hi <img src=x onerror=alert(1)')).toBe('hi');
  });
});

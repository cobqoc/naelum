import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeObject } from '../sanitize';

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

  it('알려진 한계: "<"가 포함된 정상 텍스트도 잘림 (회귀 감지용 고정)', () => {
    // HTML_TAG_REGEX(/<\/?[^>]+(>|$)/)가 "< b"를 태그로 오인해 제거한다.
    // 현 구현의 알려진 약점 — 동작을 고정하고, 개선 시 의도된 변경으로 드러나게 한다.
    expect(sanitizeHtml('a < b')).toBe('a');
  });
});

describe('sanitizeObject', () => {
  it('문자열 필드만 sanitize, 비문자열은 보존', () => {
    expect(
      sanitizeObject({ name: '<b>Tom</b>', age: 5, active: true, bio: 'plain' }),
    ).toEqual({ name: 'Tom', age: 5, active: true, bio: 'plain' });
  });

  it('얕은(shallow) 처리 — 중첩 객체 문자열은 건드리지 않음', () => {
    expect(sanitizeObject({ meta: { html: '<b>x</b>' } })).toEqual({
      meta: { html: '<b>x</b>' },
    });
  });
});

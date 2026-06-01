import { describe, it, expect } from 'vitest';
import { sanitizeSearchTerm } from '../sanitizeSearch';

describe('sanitizeSearchTerm (H7 PostgREST 필터 주입 방어)', () => {
  it('일반 단어/한글/숫자/공백/점은 보존', () => {
    expect(sanitizeSearchTerm('김치찌개')).toBe('김치찌개');
    expect(sanitizeSearchTerm('초고추장 2.0')).toBe('초고추장 2.0');
    expect(sanitizeSearchTerm('  양파  ')).toBe('양파');
  });

  it('필터 구분자/그룹/배열/인용/이스케이프 문자를 제거한다', () => {
    expect(sanitizeSearchTerm('a,b')).toBe('ab');
    expect(sanitizeSearchTerm('a(b)c')).toBe('abc');
    expect(sanitizeSearchTerm('x{y}z')).toBe('xyz');
    expect(sanitizeSearchTerm('a"b\\c')).toBe('abc');
  });

  it('LIKE 와일드카드(% _ *)를 제거한다', () => {
    expect(sanitizeSearchTerm('a%b_c*d')).toBe('abcd');
  });

  it('주입 시도: 컬럼 필터 주입 토큰을 무력화', () => {
    // `name.ilike.x,is_admin.eq.true` 류 OR 절 주입 시도 → 콤마·점 일부 제거로 단일 토큰화
    const injected = 'x,status.eq.pending';
    const out = sanitizeSearchTerm(injected);
    expect(out).not.toContain(',');
    expect(out).toBe('xstatus.eq.pending'); // 콤마 제거 → 새 OR 절로 분리 불가
  });
});

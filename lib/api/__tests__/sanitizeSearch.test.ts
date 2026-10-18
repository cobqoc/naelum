import { describe, it, expect } from 'vitest';
import { sanitizeSearchTerm, quoteOrFilterValue } from '../sanitizeSearch';

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

// 2026-10-04 AG2-25: .or() 값 인용 — postgrest-js .in() 과 같은 규칙.

describe('quoteOrFilterValue', () => {
  it('예약 문자 없는 일반 입력은 그대로 (기존 필터 문자열과 동일)', () => {
    for (const v of ['%김치%', '%chef_kim%', '%john.doe@x.com%', '양파%', '%Olive Oil%', '%%']) {
      expect(quoteOrFilterValue(v)).toBe(v);
    }
  });

  it('`,` `(` `)` 가 있으면 큰따옴표로 감싼다', () => {
    expect(quoteOrFilterValue('%kim,lee%')).toBe('"%kim,lee%"');
    expect(quoteOrFilterValue('(주%')).toBe('"(주%"');
    expect(quoteOrFilterValue('%a)%')).toBe('"%a)%"');
  });

  it('따옴표 문법을 깨는 " 와 \\ 는 제거', () => {
    expect(quoteOrFilterValue('%a"b%')).toBe('%ab%');
    expect(quoteOrFilterValue('%a\\b,c%')).toBe('"%ab,c%"');
  });
});

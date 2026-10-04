import { describe, it, expect } from 'vitest';
import { escapeLikePattern, hasUnescapableLikeChar } from '../likePattern';

// 2026-10-04 AG2-13: user-ingredients/add 의 "대소문자 무시 정확 일치" ilike 검색용.
describe('escapeLikePattern', () => {
  it('특수문자 없는 일반 이름은 그대로 (한글·영문·공백·숫자·점)', () => {
    for (const s of ['양파', '고추장', 'Olive Oil', '우유 1.5L', '']) {
      expect(escapeLikePattern(s)).toBe(s);
    }
  });

  it('LIKE 패턴 문자 % _ 와 이스케이프 문자 \\ 를 \\ 로 이스케이프', () => {
    expect(escapeLikePattern('고%')).toBe('고\\%');
    expect(escapeLikePattern('_추')).toBe('\\_추');
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b');
    expect(escapeLikePattern('%_\\')).toBe('\\%\\_\\\\');
  });

  it('* 는 건드리지 않음 (PostgREST 가 % 로 치환 — 호출부에서 재검증)', () => {
    expect(escapeLikePattern('고*')).toBe('고*');
  });
});

describe('hasUnescapableLikeChar', () => {
  it('* 가 있을 때만 true', () => {
    expect(hasUnescapableLikeChar('고*')).toBe(true);
    expect(hasUnescapableLikeChar('고%')).toBe(false);
    expect(hasUnescapableLikeChar('양파')).toBe(false);
  });
});

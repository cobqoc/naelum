import { describe, it, expect } from 'vitest';
import { checkMinAge, MIN_AGE } from '../ageGate';

// 기준 시각: 2026-10-04 로컬 정오(시간대와 무관하게 달력 날짜 계산을 검증)
const NOW = new Date(2026, 9, 4, 12, 0, 0);

describe('checkMinAge', () => {
  it('최소 나이는 16세', () => {
    expect(MIN_AGE).toBe(16);
  });

  it('생일 당일 16세가 되면 통과', () => {
    expect(checkMinAge('2010-10-04', NOW)).toEqual({ age: 16, meetsMinimum: true });
  });

  it('생일 하루 전이면 15세라 거부', () => {
    expect(checkMinAge('2010-10-05', NOW)).toEqual({ age: 15, meetsMinimum: false });
  });

  it('월이 지났으면 나이를 그대로, 안 지났으면 1 뺀다', () => {
    expect(checkMinAge('2000-01-31', NOW).age).toBe(26);
    expect(checkMinAge('2000-12-01', NOW).age).toBe(25);
  });

  it('빈 값·파싱 불가·존재하지 않는 날짜는 거부', () => {
    expect(checkMinAge('', NOW)).toEqual({ age: 0, meetsMinimum: false });
    expect(checkMinAge('not-a-date', NOW)).toEqual({ age: 0, meetsMinimum: false });
    expect(checkMinAge('2010-13-45', NOW)).toEqual({ age: 0, meetsMinimum: false });
    expect(checkMinAge('2010-02-30', NOW)).toEqual({ age: 0, meetsMinimum: false });
  });

  it('윤년 2월 29일생도 계산된다', () => {
    expect(checkMinAge('2008-02-29', NOW)).toEqual({ age: 18, meetsMinimum: true });
  });

  it('now 를 생략하면 현재 시각 기준(호출부 시그니처 호환)', () => {
    expect(checkMinAge('1990-01-01').meetsMinimum).toBe(true);
  });
});

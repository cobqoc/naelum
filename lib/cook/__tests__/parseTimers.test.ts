import { describe, it, expect } from 'vitest';
import { parseAllTimers } from '@/lib/cook/parseTimers';

describe('parseAllTimers — 기본 분 단위', () => {
  it('"N분" 추출', () => {
    expect(parseAllTimers('강불에 5분간 끓이세요')).toEqual([5]);
    expect(parseAllTimers('3분 볶고 10분 끓이기')).toEqual([3, 10]);
  });

  it('분 접미사 — 간/동안/정도/씩/가량', () => {
    expect(parseAllTimers('5분간 4분동안 3분정도 2분씩 1분가량')).toEqual([5, 4, 3, 2, 1]);
  });

  it('중복 제거', () => {
    expect(parseAllTimers('5분 볶고 다시 5분')).toEqual([5]);
  });

  it('1~120분 범위 밖은 제외', () => {
    expect(parseAllTimers('0분 200분 150분')).toEqual([]);
  });
});

describe('parseAllTimers — 시간 단위 (2026-05-22)', () => {
  it('"N시간 M분" → 총 분', () => {
    expect(parseAllTimers('1시간 30분 고으세요')).toEqual([90]);
    expect(parseAllTimers('1시간30분')).toEqual([90]);
  });

  it('"N시간" 단독 → 분 환산', () => {
    expect(parseAllTimers('2시간 푹 삶기')).toEqual([120]);
  });

  it('"1시간 30분"을 "30분"으로 오파싱하지 않음', () => {
    expect(parseAllTimers('1시간 30분 삶기')).not.toContain(30);
    expect(parseAllTimers('1시간 30분 삶기')).toEqual([90]);
  });

  it('3시간+ 는 120분 상한 초과로 제외', () => {
    expect(parseAllTimers('3시간 고기를 삶는다')).toEqual([]);
  });
});

describe('parseAllTimers — 오탐 방지', () => {
  it('"N분의 M"(분수)은 타이머 아님', () => {
    expect(parseAllTimers('10분의 1로 자른다')).toEqual([]);
    expect(parseAllTimers('재료의 3분의 2를 넣고 5분간 볶기')).toEqual([5]);
  });

  it('등분·인분은 오탐 아님 (숫자가 "분"에 안 붙음)', () => {
    expect(parseAllTimers('양파를 4등분, 2인분 분량')).toEqual([]);
  });

  it('범위 "3~4분" → 상한값 하나만', () => {
    expect(parseAllTimers('3~4분간 데치기')).toEqual([4]);
  });
});

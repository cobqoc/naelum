import { describe, it, expect } from 'vitest';
import { levenshtein, levenshteinSimilarity, isSimilar } from '../levenshtein';

// 재료 중복 매칭의 핵심 알고리즘. 정확도가 비즈니스 로직(중복 재료 병합)에 직결되므로
// 경계값을 고정한다. AI가 이 로직을 건드리면 여기서 회귀가 잡힌다.

describe('levenshtein', () => {
  it('고전 예시 kitten→sitting = 3', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });

  it('한글 1글자 치환 = 1', () => {
    expect(levenshtein('토마토', '토마또')).toBe(1);
  });

  it('동일 문자열 = 0', () => {
    expect(levenshtein('same', 'same')).toBe(0);
  });

  it('빈 문자열 경계: ("","")=0, ("abc","")=3, ("","abc")=3', () => {
    expect(levenshtein('', '')).toBe(0);
    expect(levenshtein('abc', '')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });

  it('공통 문자 없는 한글 = 더 긴 쪽 길이', () => {
    // 토마토(3) vs 감자(2) → 전부 다름 → 3
    expect(levenshtein('토마토', '감자')).toBe(3);
  });
});

describe('levenshteinSimilarity', () => {
  it('완전 일치 = 1.0', () => {
    expect(levenshteinSimilarity('토마토', '토마토')).toBe(1.0);
  });

  it('빈 문자열 둘 다 = 1.0 (0으로 나눔 가드)', () => {
    expect(levenshteinSimilarity('', '')).toBe(1.0);
  });

  it('대소문자 무시 (내부 toLowerCase)', () => {
    expect(levenshteinSimilarity('ABC', 'abc')).toBe(1.0);
  });

  it('1글자 차이 / 3글자 = 1 - 1/3 ≈ 0.6667', () => {
    expect(levenshteinSimilarity('토마토', '토마또')).toBeCloseTo(0.6667, 4);
  });
});

describe('isSimilar', () => {
  it('완전 일치 → true', () => {
    expect(isSimilar('토마토', '토마토')).toBe(true);
  });

  it('전혀 다른 재료 → false', () => {
    expect(isSimilar('토마토', '감자')).toBe(false);
  });

  it('새송이버섯 vs 새송이 → similarity 0.6, 기본 threshold 0.8 → false', () => {
    // 주의: levenshtein.ts JSDoc 예시는 이 케이스를 true 라고 적었으나
    // 실제 동작은 false (1 - 2/5 = 0.6 < 0.8). 문서 drift — 실제 동작을 고정한다.
    expect(isSimilar('새송이버섯', '새송이')).toBe(false);
  });

  it('threshold 파라미터가 동작 (0.6 이면 위 케이스 true)', () => {
    expect(isSimilar('새송이버섯', '새송이', 0.6)).toBe(true);
  });
});

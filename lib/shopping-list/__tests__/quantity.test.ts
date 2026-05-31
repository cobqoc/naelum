import { describe, it, expect } from 'vitest';
import { parseQuantity, mergeQuantity } from '@/lib/shopping-list/quantity';

describe('parseQuantity', () => {
  it('유효 숫자 문자열은 숫자로', () => {
    expect(parseQuantity('200')).toBe(200);
    expect(parseQuantity('1.5')).toBe(1.5);
    expect(parseQuantity(' 3 ')).toBe(3);
    expect(parseQuantity('2개')).toBe(2); // 단위 접미사는 parseFloat 가 잘라냄
  });

  it('비숫자·누락·범위는 null (NaN 흘리지 않음)', () => {
    expect(parseQuantity('약간')).toBeNull();
    expect(parseQuantity('적당량')).toBeNull();
    expect(parseQuantity('한 줌')).toBeNull();
    expect(parseQuantity('')).toBeNull();
    expect(parseQuantity('   ')).toBeNull();
    expect(parseQuantity(undefined)).toBeNull();
    expect(parseQuantity(null)).toBeNull();
  });

  it('음수는 미상 처리', () => {
    expect(parseQuantity('-5')).toBeNull();
  });

  it('어떤 입력에도 NaN 을 반환하지 않는다', () => {
    for (const s of ['약간', 'abc', '~', '', '2~3', 'NaN', 'Infinity']) {
      const r = parseQuantity(s);
      expect(r === null || Number.isFinite(r)).toBe(true);
    }
  });
});

describe('mergeQuantity — 미상값은 기존을 파괴하지 않는다', () => {
  it('C7 회귀: 기존 3개 + "약간"(null) → 3 유지 (null 파괴 금지)', () => {
    expect(mergeQuantity(3, parseQuantity('약간'))).toBe(3);
  });

  it('둘 다 유효 숫자 → 합산', () => {
    expect(mergeQuantity(3, parseQuantity('2'))).toBe(5);
    expect(mergeQuantity(200, parseQuantity('100'))).toBe(300);
  });

  it('기존 미상 + 새 숫자 → 새 숫자로 채움', () => {
    expect(mergeQuantity(null, parseQuantity('2'))).toBe(2);
  });

  it('둘 다 미상 → null', () => {
    expect(mergeQuantity(null, parseQuantity('약간'))).toBeNull();
  });

  it('병합 결과는 절대 NaN 이 아니다', () => {
    const cases: Array<[number | null, string]> = [
      [3, '약간'], [null, '약간'], [3, '2'], [null, '5'], [0, '약간'],
    ];
    for (const [cur, raw] of cases) {
      const r = mergeQuantity(cur, parseQuantity(raw));
      expect(r === null || Number.isFinite(r)).toBe(true);
    }
  });
});

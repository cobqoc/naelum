import { describe, it, expect } from 'vitest';
import { convertAmount, compareQuantity, dimensionOf } from '../quantity';

describe('dimensionOf', () => {
  it('부피·무게·개수 차원 분류', () => {
    expect(dimensionOf('ml')).toBe('volume');
    expect(dimensionOf('큰술')).toBe('volume');
    expect(dimensionOf('g')).toBe('mass');
    expect(dimensionOf('kg')).toBe('mass');
    expect(dimensionOf('개')).toBe('count');
    expect(dimensionOf('쪽')).toBe('count');
  });
});

describe('convertAmount — 같은 차원(계수 불필요)', () => {
  it('같은 단위 그대로', () => {
    expect(convertAmount(3, '개', '개')).toBe(3);
  });
  it('부피↔부피 (큰술→ml, 컵→ml)', () => {
    expect(convertAmount(2, '큰술', 'ml')).toBe(30);
    expect(convertAmount(1, '컵', 'ml')).toBe(200);
    expect(convertAmount(1, 'l', 'ml')).toBe(1000);
  });
  it('무게↔무게 (kg→g)', () => {
    expect(convertAmount(1.5, 'kg', 'g')).toBe(1500);
  });
  it('한글 별칭 (그램→kg)', () => {
    expect(convertAmount(2000, '그램', 'kg')).toBe(2);
  });
});

describe('convertAmount — 차원 교차(계수 필요, 없으면 null)', () => {
  it('부피↔무게 계수 없으면 null', () => {
    expect(convertAmount(100, 'ml', 'g')).toBeNull();
  });
  it('부피↔무게 밀도 있으면 변환', () => {
    // 물 100ml = 100g (밀도 1)
    expect(convertAmount(100, 'ml', 'g', { gramsPerMl: 1 })).toBe(100);
    // 기름 100ml = 92g (밀도 0.92)
    expect(convertAmount(100, 'ml', 'g', { gramsPerMl: 0.92 })).toBeCloseTo(92);
  });
  it('개수↔무게 계수 없으면 null', () => {
    expect(convertAmount(2, '개', 'g')).toBeNull();
  });
  it('개수↔무게 개당무게 있으면 변환 (양파 1개=200g)', () => {
    expect(convertAmount(2, '개', 'g', { gramsPerCountUnit: { '개': 200 } })).toBe(400);
    expect(convertAmount(400, 'g', '개', { gramsPerCountUnit: { '개': 200 } })).toBe(2);
  });
  it('다른 개수 단위끼리는 양쪽 계수 필요', () => {
    expect(convertAmount(2, '개', '쪽', { gramsPerCountUnit: { '개': 200 } })).toBeNull();
    expect(convertAmount(1, '개', '쪽', { gramsPerCountUnit: { '개': 50, '쪽': 5 } })).toBe(10);
  });
});

describe('compareQuantity — 충족 판정', () => {
  it('같은 단위 부족 (양파 3개 필요 vs 1개 보유)', () => {
    expect(compareQuantity(3, '개', 1, '개')).toEqual({ kind: 'short', by: 2, unit: '개' });
  });
  it('같은 단위 충분', () => {
    expect(compareQuantity(2, '개', 5, '개')).toEqual({ kind: 'enough' });
  });
  it('정확히 같으면 충분', () => {
    expect(compareQuantity(3, '개', 3, '개')).toEqual({ kind: 'enough' });
  });
  it('변환 가능 차원 교차 (간장 30ml 필요 vs 2큰술 보유 = 30ml)', () => {
    expect(compareQuantity(30, 'ml', 2, '큰술')).toEqual({ kind: 'enough' });
  });
  it('계수 없는 차원 교차 → unknown(degrade)', () => {
    expect(compareQuantity(200, 'g', 1, '개')).toEqual({ kind: 'unknown' });
  });
  it('필요량 미입력(약간/적당량) → unknown', () => {
    expect(compareQuantity(null, '', 1, '개')).toEqual({ kind: 'unknown' });
    expect(compareQuantity(0, '개', 1, '개')).toEqual({ kind: 'unknown' });
  });
  it('보유량 미입력 → unknown', () => {
    expect(compareQuantity(3, '개', null, '개')).toEqual({ kind: 'unknown' });
  });
  it('밀도로 부족분 계산 (물 200g 필요 vs 100ml 보유 = 100g → 100g 부족)', () => {
    const v = compareQuantity(200, 'g', 100, 'ml', { gramsPerMl: 1 });
    expect(v).toEqual({ kind: 'short', by: 100, unit: 'g' });
  });
});

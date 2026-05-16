import { describe, it, expect } from 'vitest';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  mlToCups,
  cupsToMl,
  mlToTablespoons,
  tablespoonsToMl,
  mlToTeaspoons,
  teaspoonsToMl,
  gramsToOunces,
  ouncesToGrams,
  kgToLbs,
  lbsToKg,
} from '../unitConversion';

// 레시피 단위 변환. 전부 소수 2자리 반올림 계약. 라운딩 누적/역변환 오차를
// 고정해 AI 수정 시 미세 회귀를 잡는다.

describe('온도 변환', () => {
  it('섭씨→화씨 경계', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(37)).toBe(98.6);
  });

  it('화씨→섭씨 (2자리 반올림)', () => {
    expect(fahrenheitToCelsius(32)).toBe(0);
    expect(fahrenheitToCelsius(212)).toBe(100);
    expect(fahrenheitToCelsius(100)).toBe(37.78);
  });
});

describe('부피 변환', () => {
  it('ml ↔ cup', () => {
    expect(mlToCups(236.588)).toBe(1);
    expect(cupsToMl(1)).toBe(236.59); // 반올림된 계약값
    expect(mlToCups(100)).toBe(0.42);
  });

  it('ml ↔ 큰술(tbsp)', () => {
    expect(mlToTablespoons(14.787)).toBe(1);
    expect(tablespoonsToMl(1)).toBe(14.79);
  });

  it('ml ↔ 작은술(tsp)', () => {
    expect(mlToTeaspoons(4.929)).toBe(1);
    expect(teaspoonsToMl(1)).toBe(4.93);
  });
});

describe('무게 변환', () => {
  it('g ↔ oz', () => {
    expect(gramsToOunces(28.3495)).toBe(1);
    expect(ouncesToGrams(1)).toBe(28.35);
  });

  it('kg ↔ lbs', () => {
    expect(kgToLbs(1)).toBe(2.2);
    expect(lbsToKg(1)).toBe(0.45);
  });
});

describe('반올림 계약 (소수 2자리)', () => {
  it('결과는 소수 2자리를 넘지 않는다', () => {
    for (const v of [mlToCups(123), cupsToMl(0.333), gramsToOunces(57), kgToLbs(3.14159)]) {
      expect(Number.isFinite(v)).toBe(true);
      expect(Math.round(v * 100) / 100).toBe(v);
    }
  });
});

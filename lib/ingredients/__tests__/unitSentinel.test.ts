import { describe, it, expect } from 'vitest';
import { toStoredUnit, UNIT_SENTINEL } from '../unitSentinel';

describe('toStoredUnit — 단위 센티넬 정규화 (ICL-14/PHR-44)', () => {
  it("센티넬 '선택'·빈 값·null·undefined 는 null", () => {
    expect(UNIT_SENTINEL).toBe('선택');
    expect(toStoredUnit('선택')).toBeNull();
    expect(toStoredUnit('')).toBeNull();
    expect(toStoredUnit(null)).toBeNull();
    expect(toStoredUnit(undefined)).toBeNull();
  });
  it('실제 단위는 그대로(대소문자·공백 가공 없음)', () => {
    for (const u of ['개', 'g', 'kg', 'ml', 'L', '큰술', '작은술', '컵', 'T', 't', '마리']) {
      expect(toStoredUnit(u)).toBe(u);
    }
  });
});

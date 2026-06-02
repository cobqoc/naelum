import { describe, it, expect } from 'vitest';
import { localDateISO, addDaysLocalISO } from '../localDate';

// 타임존 독립: Date 생성자/getter 모두 로컬이라 어느 TZ에서 돌려도 동일 결과.
describe('localDateISO — 로컬 날짜(UTC 변환 안 함)', () => {
  it('KST 새벽도 로컬 날짜 그대로 (UTC면 하루 빨라짐)', () => {
    // 로컬 6/3 04:41 (KST면 UTC 6/2 19:41). 로컬 기준이라 6/3 이어야 함.
    expect(localDateISO(new Date(2026, 5, 3, 4, 41))).toBe('2026-06-03');
  });
  it('월/일 zero-pad', () => {
    expect(localDateISO(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(localDateISO(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('addDaysLocalISO', () => {
  it('오늘/3일/한 달 뒤', () => {
    const base = new Date(2026, 5, 3);
    expect(addDaysLocalISO(0, base)).toBe('2026-06-03');
    expect(addDaysLocalISO(3, base)).toBe('2026-06-06');
    expect(addDaysLocalISO(30, base)).toBe('2026-07-03');
  });
  it('월 경계 넘김', () => {
    expect(addDaysLocalISO(3, new Date(2026, 5, 30))).toBe('2026-07-03');
  });
});

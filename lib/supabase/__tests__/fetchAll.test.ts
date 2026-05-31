import { describe, it, expect } from 'vitest';
import { fetchAllRows } from '@/lib/supabase/fetchAll';

// .range(from,to) 만 흉내내는 가짜 쿼리 — pageSize 만큼 슬라이스 반환.
function mockQuery(allRows: number[]) {
  return () => ({
    range(from: number, to: number) {
      return Promise.resolve({ data: allRows.slice(from, to + 1), error: null as null });
    },
  });
}

describe('fetchAllRows — 1000행 절단 방지 페이지네이션', () => {
  it('여러 페이지에 걸쳐 모든 행을 모은다 (마지막 부분 페이지에서 종료)', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => i); // 0..4
    const out = await fetchAllRows(mockQuery(rows), 2);   // pages: [0,1][2,3][4]
    expect(out).toEqual([0, 1, 2, 3, 4]);
  });

  it('pageSize 정확히 나누어떨어져도 누락 없음', async () => {
    const rows = Array.from({ length: 4 }, (_, i) => i);
    const out = await fetchAllRows(mockQuery(rows), 2);   // [0,1][2,3][] → break
    expect(out).toEqual([0, 1, 2, 3]);
  });

  it('1000 경계: 2500행도 전부 반환 (silent 절단 없음)', async () => {
    const rows = Array.from({ length: 2500 }, (_, i) => i);
    const out = await fetchAllRows(mockQuery(rows), 1000);
    expect(out).toHaveLength(2500);
    expect(out[2499]).toBe(2499);
  });

  it('빈 결과는 빈 배열', async () => {
    const out = await fetchAllRows(mockQuery([]), 1000);
    expect(out).toEqual([]);
  });

  it('.error 는 throw 로 표면화 (부분 데이터 숨기지 않음)', async () => {
    const failing = () => ({
      range: () => Promise.resolve({ data: null, error: { message: 'boom' } }),
    });
    await expect(fetchAllRows(failing)).rejects.toThrow('boom');
  });
});

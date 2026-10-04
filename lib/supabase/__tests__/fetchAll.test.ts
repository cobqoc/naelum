import { describe, it, expect } from 'vitest';
import { fetchAllRows, fetchAllData, fetchAllDataIfExists, isMissingRelationError } from '@/lib/supabase/fetchAll';

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

// 2026-10-04 API1-14: GDPR export 의 prod 미적용 테이블(delivery_*)·없는 컬럼(recipe_notes.user_id) 대응.
function failingWith(code: string, message = 'boom') {
  return () => ({
    range: () => Promise.resolve({ data: null, error: { message, code } }),
  });
}

describe('isMissingRelationError — "테이블/컬럼 없음" 코드만 true', () => {
  it.each(['PGRST205', 'PGRST204', '42P01', '42703'])('%s → true', (code) => {
    expect(isMissingRelationError({ code })).toBe(true);
  });

  it.each(['42501', 'PGRST116', '57014', '23505', ''])('%s → false (권한·다중행·타임아웃 등은 없음 아님)', (code) => {
    expect(isMissingRelationError({ code })).toBe(false);
  });

  it('code 없음·null·undefined → false', () => {
    expect(isMissingRelationError({})).toBe(false);
    expect(isMissingRelationError(null)).toBe(false);
    expect(isMissingRelationError(undefined)).toBe(false);
  });
});

describe('fetchAllDataIfExists — 없는 테이블/컬럼만 빈 배열, 나머지는 fetchAllData 와 동일', () => {
  it('정상 조회는 fetchAllData 와 같은 결과 (페이지네이션 포함)', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => i);
    expect(await fetchAllDataIfExists(mockQuery(rows), 2)).toEqual(await fetchAllData(mockQuery(rows), 2));
    expect(await fetchAllDataIfExists(mockQuery(rows), 2)).toEqual({ data: [0, 1, 2, 3, 4] });
  });

  it('테이블 없음(PGRST205·42P01)·컬럼 없음(42703·PGRST204) → { data: [] }', async () => {
    for (const code of ['PGRST205', '42P01', '42703', 'PGRST204']) {
      await expect(fetchAllDataIfExists(failingWith(code))).resolves.toEqual({ data: [] });
    }
  });

  it('그 외 오류는 throw 유지 (부분 데이터를 완전한 척 내보내지 않음)', async () => {
    await expect(fetchAllDataIfExists(failingWith('42501', 'permission denied'))).rejects.toThrow('permission denied');
    await expect(fetchAllDataIfExists(failingWith('57014', 'timeout'))).rejects.toThrow('timeout');
  });

  it('fetchAllRows·fetchAllData 는 "없음" 오류도 그대로 throw (기존 동작 불변)', async () => {
    await expect(fetchAllRows(failingWith('PGRST205', 'no table'))).rejects.toThrow('no table');
    await expect(fetchAllData(failingWith('42703', 'no column'))).rejects.toThrow('no column');
  });
});

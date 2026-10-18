/**
 * PostgREST 1000행 silent 제한을 우회해 *모든* 행을 가져오는 페이지네이션 헬퍼.
 *
 * **왜**: Supabase `.select()` 는 `.range()` 없으면 최대 1000행만 반환하고 에러 없이
 * 조용히 잘린다(CLAUDE.md 함정). GDPR export·sitemap 처럼 전체 행이 *진짜* 필요한
 * 곳에서 1000행 초과 데이터가 silent 누락되면 법적 완전성·SEO 결함(AUDIT H9).
 *
 * `.range(from, to)` 로 페이지를 끝까지 돌며 누적한다. 마지막 페이지(반환 < pageSize)
 * 에서 종료. `.error` 는 throw 로 표면화 — 부분 데이터를 "완전"인 척 내보내지 않는다.
 *
 * 사용:
 *   const rows = await fetchAllRows(() => sb.from('events').select('*').eq('user_id', uid));
 */

/** `.range()` 만 의존 — PostgREST builder 제네릭 결합 회피용 최소 인터페이스. */
interface Rangeable<T> {
  range(from: number, to: number): PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }>;
}

/**
 * "이 환경엔 그 테이블/컬럼이 없다" 는 오류 코드 — PostgREST 스키마 캐시 미존재(PGRST205 테이블·PGRST204 컬럼)
 * 와 Postgres undefined_table(42P01)·undefined_column(42703). 그 외(권한·타임아웃·네트워크 등)는 해당 없음.
 */
const MISSING_RELATION_CODES = new Set(['PGRST205', 'PGRST204', '42P01', '42703']);

export function isMissingRelationError(error: { code?: string } | null | undefined): boolean {
  return !!error?.code && MISSING_RELATION_CODES.has(error.code);
}

async function collectRows<T>(
  makeQuery: () => Rangeable<T>,
  pageSize: number,
  missingAsEmpty: boolean,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  for (;;) {
    // builder 는 await 후 재사용 불가 → 매 페이지 factory 로 새로 만든다.
    const { data, error } = await makeQuery().range(from, from + pageSize - 1);
    if (error) {
      if (missingAsEmpty && isMissingRelationError(error)) return [];
      throw new Error(error.message);
    }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export async function fetchAllRows<T = unknown>(
  makeQuery: () => Rangeable<T>,
  pageSize = 1000,
): Promise<T[]> {
  return collectRows(makeQuery, pageSize, false);
}

/** `{ data }` 래핑 버전 — 기존 `xRes.data ?? []` 접근 코드와 호환. */
export async function fetchAllData<T = unknown>(
  makeQuery: () => Rangeable<T>,
  pageSize = 1000,
): Promise<{ data: T[] }> {
  return { data: await fetchAllRows<T>(makeQuery, pageSize) };
}

/**
 * `fetchAllData` 와 같지만 *환경에 따라 아직 없는* 테이블/컬럼(isMissingRelationError)만 빈 결과로 본다.
 * 2026-10-04 API1-14: GDPR export 가 prod 미적용 배달 스키마(delivery_*)·user_id 컬럼이 없는 recipe_notes 를
 * 조회해 throw → export 전체가 500 이었다. "없음" 외의 오류는 그대로 throw — 부분 데이터를 완전한 척
 * 내보내지 않는 원칙(위 주석)은 유지.
 */
export async function fetchAllDataIfExists<T = unknown>(
  makeQuery: () => Rangeable<T>,
  pageSize = 1000,
): Promise<{ data: T[] }> {
  return { data: await collectRows<T>(makeQuery, pageSize, true) };
}

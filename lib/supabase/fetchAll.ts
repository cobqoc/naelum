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
  range(from: number, to: number): PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
}

export async function fetchAllRows<T = unknown>(
  makeQuery: () => Rangeable<T>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  for (;;) {
    // builder 는 await 후 재사용 불가 → 매 페이지 factory 로 새로 만든다.
    const { data, error } = await makeQuery().range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

/** `{ data }` 래핑 버전 — 기존 `xRes.data ?? []` 접근 코드와 호환. */
export async function fetchAllData<T = unknown>(
  makeQuery: () => Rangeable<T>,
  pageSize = 1000,
): Promise<{ data: T[] }> {
  return { data: await fetchAllRows<T>(makeQuery, pageSize) };
}

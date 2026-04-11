/**
 * 페이지네이션 파라미터 파싱 헬퍼
 *
 * 페이지/limit/offset을 한 번에 추출하고, 안전한 기본값/상한값을 보장한다.
 * - page가 NaN이거나 1 미만이면 1로 보정
 * - limit가 NaN이거나 1 미만이면 default로 보정, max를 초과하면 max로 클램프
 * - rangeStart/rangeEnd는 supabase의 .range() 호출에 바로 사용 가능
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  rangeStart: number;
  rangeEnd: number;
}

export interface ParsePaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export function parsePagination(
  searchParams: URLSearchParams,
  { defaultLimit = 20, maxLimit = 100 }: ParsePaginationOptions = {},
): PaginationParams {
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawLimit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const limit = Math.min(
    Math.max(Number.isFinite(rawLimit) && rawLimit >= 1 ? rawLimit : defaultLimit, 1),
    maxLimit,
  );

  const offset = (page - 1) * limit;
  return {
    page,
    limit,
    offset,
    rangeStart: offset,
    rangeEnd: offset + limit - 1,
  };
}

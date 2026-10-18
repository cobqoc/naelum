/**
 * 정렬된 행 목록에서 키별 *첫* 행만 남긴다(순서 보존). 키가 없는(null·undefined·'') 행은 제외.
 *
 * 2026-10-04 API1-42: 프로필 "만든 요리" 탭 — cooking_sessions 는 (user, recipe) UNIQUE 가 없어 같은 레시피를
 * 여러 번 완성하면 세션 행마다 카드가 중복됐다. completed_at 내림차순 세션에 레시피 id 를 키로 쓰면
 * "레시피별 가장 최근 완성 1건" 이 되고, RLS 로 가려진 레시피(null 임베드)는 키가 없어 빠진다.
 */
export function firstPerKey<T>(rows: readonly T[], keyOf: (row: T) => string | null | undefined): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const key = keyOf(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/**
 * user_ingredients 행의 도감 조인(`ingredients_master`) 평탄화 — emoji·shelf_life_days 를 최상위로 올리고
 * 중첩 키는 제거한다. GET /api/user-ingredients?withMaster=1 과 홈 SSR 이 공유(행 shape 단일 출처).
 * 순수 함수라 server-only 가 아니다 (vitest 대상). (perf 2026-09-28)
 *
 * 키 순서: [...원본 컬럼, 'emoji', 'shelf_life_days'] — 이전 route 구현
 * (`{ ...row, emoji, shelf_life_days, ingredients_master: undefined }`)의 JSON 직렬화 결과와 동일.
 */
export function flattenMasterJoin<T extends { ingredients_master?: unknown }>(rows: T[]) {
  return rows.map((row) => {
    const { ingredients_master, ...rest } = row;
    const master = ingredients_master as { emoji?: string | null; shelf_life_days?: Record<string, number> | null } | null | undefined;
    return {
      ...rest,
      emoji: master?.emoji ?? null,
      shelf_life_days: master?.shelf_life_days ?? null,
    };
  });
}

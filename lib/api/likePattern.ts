/**
 * PostgREST `like`/`ilike` 값에 사용자 입력을 *글자 그대로* 비교하려고 넣을 때의 이스케이프 (2026-10-04 AG2-13).
 *
 * Postgres LIKE 의 패턴 문자 `%`(임의 길이)·`_`(한 글자)와 이스케이프 문자 `\` 앞에 `\` 를 붙인다
 * (LIKE 기본 ESCAPE 가 `\`). 특수문자 없는 입력은 그대로 반환.
 *
 * 주의: `*` 는 PostgREST 가 like/ilike 패턴에서 무조건 `%` 로 치환해(이스케이프 수단 없음) 여기서 막을 수 없다.
 * `*` 가 들어간 입력은 호출부에서 결과를 다시 정확 일치로 걸러야 한다(`hasUnescapableLikeChar`).
 */
export function escapeLikePattern(raw: string): string {
  return raw.replace(/[\\%_]/g, '\\$&');
}

/** PostgREST like 값에서 이스케이프할 수 없는 와일드카드(`*`)가 들어 있는지. */
export function hasUnescapableLikeChar(raw: string): boolean {
  return raw.includes('*');
}

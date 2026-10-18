/**
 * 닉네임 중복 확인용 ilike 패턴 — 대소문자 무시 *정확 일치*.
 * `_`·`%`·`\` 는 LIKE 와일드카드라 이스케이프한다(닉네임에 `_` 허용 — 안 하면 `a_b` 가 `axb` 와 겹침).
 * DB 의 lower(username) unique 인덱스(20261019_username_rules.sql)와 같은 기준 — `Chef`·`chef` 공존 방지(PAU-37).
 */
export function usernameIlikePattern(username: string): string {
  return username.replace(/[\\%_]/g, (c) => `\\${c}`)
}

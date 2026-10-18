/**
 * PostgREST 필터에 사용자 입력을 안전하게 보간하기 위한 검색어 정규화 (H7).
 *
 * `.or('name.ilike.%${term}%,...')`·`aliases.cs.{${term}}` 처럼 사용자 입력을 PostgREST
 * 필터 문자열에 문자열 보간하면, 필터 문법에서 의미를 갖는 문자로 조건을 깨고 임의 컬럼
 * 필터를 주입할 수 있다(데이터 노출). 다음을 제거해 방어한다:
 *
 *  - `,`            — 필터 조건 구분자 (새 OR 절 주입)
 *  - `(` `)`        — 그룹 / 함수 호출
 *  - `{` `}`        — 배열 리터럴 (cs/cd 연산자)
 *  - `"`            — 값 인용
 *  - `\`            — 이스케이프
 *  - `%` `_`        — LIKE 와일드카드 (사용자가 패턴 제어 못하게)
 *  - `*`            — PostgREST 와일드카드
 *
 * 검색어는 단어 매칭용이라 구두점 제거로 UX 손실이 거의 없다. (`.` 은 값 안에서
 * 구분자가 아니므로 보존 — "초고추장 2.0" 등 정상.)
 */
export function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[%_\\,(){}":*]/g, '').trim();
}

/**
 * PostgREST 논리 필터(`.or('col.op.값,…')`) 문자열에 사용자 입력 값을 *글자 그대로* 넣기 위한 인용 (2026-10-04 AG2-25).
 *
 * postgrest-js 의 `.in()` 과 같은 규칙: 예약 문자(`,` `(` `)`)가 있으면 큰따옴표로 감싸고, 없으면 그대로 둔다
 * → 특수문자 없는 일반 입력은 기존 필터 문자열과 바이트 동일. 따옴표 문법을 깨는 `"`·`\` 만 제거.
 *
 * `sanitizeSearchTerm` 과 달리 LIKE 와일드카드(`%`·`_`·`*`)를 지우지 않는다 — 관리자 사용자 검색의 `chef_kim`·
 * `john_doe@…` 처럼 `_` 가 든 *정상* 입력이 `chefkim` 으로 바뀌어 결과가 달라지는 것을 막기 위함
 * (`_` 는 LIKE 에서 자기 자신과도 일치하므로 기존 결과 유지).
 */
export function quoteOrFilterValue(raw: string): string {
  const v = raw.replace(/["\\]/g, '');
  return /[,()]/.test(v) ? `"${v}"` : v;
}

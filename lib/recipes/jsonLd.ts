/**
 * 레시피 상세 JSON-LD(<script type="application/ld+json">) 직렬화·문자열 헬퍼 — 순수 함수(vitest).
 *
 * 2026-10-04 [TT-28] 저장형 XSS 차단: `JSON.stringify` 는 `<` 를 이스케이프하지 않아 제목·설명·
 * 재료명·단계에 `</script><script>…` 가 들어가면 script 요소가 조기 종료되고 주입 스크립트가
 * 실행됐다(CSP 가 'unsafe-inline' 허용이라 못 막음). `<` 를 JSON 유니코드 이스케이프 `\u003c` 로
 * 바꾸면 `</script`·`<!--` 시퀀스가 원천적으로 사라진다(Next.js JSON-LD 공식 가이드 패턴).
 * JSON 에서 `<` 는 문자열 값 안에만 나올 수 있고 `\u003c` 는 JSON.parse 가 같은 `<` 로 복원하므로
 * 검색엔진이 읽는 구조화 데이터 의미는 그대로다. `<` 가 없는 데이터는 JSON.stringify 와 바이트 동일.
 * (`>`·`&`·U+2028/2029 는 script raw text 에서 위험하지 않고 JSON.parse 로만 읽히므로 건드리지 않는다.)
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * JSON-LD recipeIngredient 한 줄 — "재료명 수량 단위".
 *
 * 2026-10-04 [PHR-10] 수량 공란(DB null) 재료가 `소금 null` 로 출력되던 버그 수정: null·빈 값은 건너뛴다.
 * 수량·단위가 모두 있는 정상 경로는 옛 식(`${name} ${quantity} ${unit}`.trim())과 출력 동일.
 * '선택' 은 작성 폼의 단위 미선택 센티넬(DB 값) — 표시하지 않는다(옛 동작 유지).
 */
export function formatJsonLdIngredient(
  name: string,
  quantity: number | string | null | undefined,
  unit: string | null | undefined,
): string {
  const displayUnit = (unit && unit !== '선택') ? unit : '';
  return [name, quantity, displayUnit]
    .filter((v) => v != null && v !== '')
    .join(' ')
    .trim();
}

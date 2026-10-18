// 배달 봉인 (2026-10-15) — 배달은 계속 만들되 공개하지 않는다(유저 결정).
// DELIVERY_ENABLED='true' 인 환경(로컬·Preview·e2e)에서만 배달·가게·라이더 화면과 배달 API 가 열린다.
// 운영(main)에는 이 값을 넣지 않는다 → 관리자 포함 누구에게나 404. 출시 = 운영 환경변수에 'true'.
// 판정은 proxy.ts 한 곳에서만 한다(i18n 리다이렉트보다 앞 — /delivery 도 /ko/delivery 도 같은 404).

/** 봉인 대상 경로 — lang prefix 를 뗀 경로 기준. */
export const DELIVERY_PREFIXES = ['/delivery', '/merchant', '/rider', '/api/delivery'] as const

/** lang prefix 를 뗀 경로가 배달 영역인가. `/delivery-tips` 같은 이름 겹침은 제외. */
export function isDeliveryPath(barePath: string): boolean {
  return DELIVERY_PREFIXES.some((p) => barePath === p || barePath.startsWith(p + '/'))
}

/** 정확히 'true' 일 때만 열림 — 빈 값·오타·'1' 은 모두 봉인(실수로 열리는 쪽을 막는다). */
export function isDeliveryEnabled(flag: string | undefined): boolean {
  return flag === 'true'
}

/**
 * 재료 onSubmit payload 정규화 — 순수 함수.
 *
 * god-file(IngredientForm) 분해 Phase 2: 표현과 무관한 순수 함수라 분리해
 * vitest 단독 검증(영상 「2차 소프트웨어 위기」 테스트 처방). 로직은 원본과
 * byte-identical — 동작 변경 0.
 *
 * - 빈 문자열 date("") → null: PostgreSQL date 컬럼이 ""를 거부(22007 invalid syntax)
 * - "preset-XXX" 형식 ingredient_id → null: ingredients_master FK는 UUID이므로
 *   preset 임시 id 못 들어감
 *
 * 회귀: 빈 가이드 → 모달 → 양파 1탭 시 purchase_date=""·expiry_date=""로 400
 * 발생하던 버그. T 그대로 반환 — caller가 type cast 안 해도 됨. 내부에서만
 * nullable 변환을 type system 우회.
 */
export function sanitizeOutgoingPayload<T>(data: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- nullable 변환을 위한 한 곳 우회
  const d = data as any;
  const purchase: string = d.purchase_date ?? '';
  const expiry: string = d.expiry_date ?? '';
  const ingId: string | null = d.ingredient_id ?? null;
  return {
    ...d,
    purchase_date: purchase || null,
    expiry_date: expiry || null,
    ingredient_id: ingId && !ingId.startsWith('preset-') ? ingId : null,
  };
}

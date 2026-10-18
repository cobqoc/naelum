import { sanitizeOutgoingPayload } from './sanitizeOutgoingPayload';

/**
 * 냉장고 재료 *수정* 저장 payload — `sanitizeOutgoingPayload` + 재료 FK(ingredient_id) 보존 규칙.
 *
 * 수정 폼 상태엔 ingredient_id 가 없어서 sanitize 가 `ingredient_id: null` 을 붙이고, 그대로 update 하면
 * 수량만 바꿔도 DB 의 재료 FK 가 지워졌다 → 추천 매칭(fridgeMatch 는 FK 있는 재료만 보유로 침)·이모지·
 * 보관기간 추정이 조용히 사라짐(2026-10-04 수정, 2026-05-14 부터 존재).
 *
 * - 이름이 그대로면 ingredient_id 키를 빼서 update 가 FK 를 건드리지 않게 한다.
 * - 이름을 바꿨으면 기존 FK 는 다른 재료를 가리키므로 이전처럼 null 로 보낸다(오매칭 방지).
 */
export function sanitizeEditPayload<T extends { ingredient_name: string; ingredient_id?: string | null }>(
  formData: T,
  originalName: string,
): T {
  const payload = sanitizeOutgoingPayload(formData);
  if (formData.ingredient_name !== originalName) return payload;
  const { ingredient_id: _unchangedFk, ...rest } = payload;
  return rest as unknown as T;
}

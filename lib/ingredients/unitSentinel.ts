/**
 * 단위 "미선택" 센티넬 — 재료 폼 단위 select 의 기본 옵션 값('선택'). UI 전용 값이라 DB 에 저장하지 않는다.
 *
 * 냉장고 추가·수정 저장 경로에 변환이 없어 user_ingredients.unit 에 '선택' 이 그대로 들어가
 * 그룹 시트에 "1선택" 처럼 노출됐다(ICL-14 / PHR-44, 2026-10-04). 레시피(buildRecipePayload)·장보기 라우트는
 * 이미 같은 규칙(`unit && unit !== '선택' ? unit : null`)으로 거른다.
 */
export const UNIT_SENTINEL = '선택';

/** 저장·표시용 단위 정규화 — 센티넬·빈 값·null 은 null, 그 외는 그대로. */
export function toStoredUnit(unit: string | null | undefined): string | null {
  return unit && unit !== UNIT_SENTINEL ? unit : null;
}

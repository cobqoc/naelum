/**
 * 글로벌 범용 재료 프리셋 — 신규 사용자용 "자주 쓰는 재료"가 비어있을 때 대체 노출.
 * 카테고리·이모지는 ingredients_master DB 단일 소스로 런타임 조회.
 * usePopularIngredients() 훅이 이 이름 목록으로 DB에서 category + emoji를 가져옴.
 */
export const POPULAR_ITEM_NAMES: readonly string[] = [
  '마늘', '양파', '감자', '당근', '토마토', '시금치',
  '계란', '닭고기',
  '쌀', '밀가루',
  '우유', '버터', '치즈',
  '소금', '설탕', '올리브오일',
];

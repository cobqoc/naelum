/**
 * 한국 가정 필수 재료 프리셋 — 신규 사용자용 "자주 쓰는 재료"가 비어있을 때 대체 노출.
 * 카테고리별 TOP 재료들. ingredients_master에서 이름으로 매칭해 ID 연결.
 */

export interface PopularItem {
  name: string;
  category: string;
  icon: string;
}

export const POPULAR_ITEMS: PopularItem[] = [
  // 채소
  { name: '양파', category: 'veggie', icon: '🧅' },
  { name: '대파', category: 'veggie', icon: '🌿' },
  { name: '마늘', category: 'veggie', icon: '🧄' },
  { name: '감자', category: 'veggie', icon: '🥔' },
  { name: '당근', category: 'veggie', icon: '🥕' },
  { name: '양배추', category: 'veggie', icon: '🥬' },
  { name: '오이', category: 'veggie', icon: '🥒' },
  { name: '애호박', category: 'veggie', icon: '🥬' },
  // 육류·계란
  { name: '계란', category: 'dairy', icon: '🥚' },
  { name: '닭가슴살', category: 'meat', icon: '🍗' },
  { name: '돼지고기', category: 'meat', icon: '🥩' },
  { name: '소고기', category: 'meat', icon: '🥩' },
  // 곡물·면
  { name: '쌀', category: 'grain', icon: '🍚' },
  { name: '라면', category: 'grain', icon: '🍜' },
  // 유제품
  { name: '우유', category: 'dairy', icon: '🥛' },
  { name: '치즈', category: 'dairy', icon: '🧀' },
  // 양념
  { name: '간장', category: 'seasoning', icon: '🥫' },
  { name: '고추장', category: 'seasoning', icon: '🌶️' },
  { name: '된장', category: 'seasoning', icon: '🥣' },
  { name: '소금', category: 'condiment', icon: '🧂' },
];

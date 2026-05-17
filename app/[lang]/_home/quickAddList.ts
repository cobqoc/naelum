/**
 * Quick-add 핵심 재료 30개 (한식 홈쿡 빈도 큐레이션)
 * - 데이터 출처 없이 상식 기반 큐레이션 (search_count는 유저 0명 상태라 의미 없음)
 * - 향후 유저가 늘어나면 ingredients_master.search_count 기반으로 자동 업데이트 가능
 */

export type QuickAddIngredient = {
  name: string;          // 한국어 이름 (DB의 ingredient_name으로 그대로 저장)
  category: 'veggie' | 'meat' | 'seafood' | 'dairy' | 'seasoning' | 'grain' | 'other';
  storage: '냉장' | '냉동' | '상온';
};

export const QUICK_ADD: QuickAddIngredient[] = [
  // 채소 (12)
  { name: '양파', category: 'veggie', storage: '상온' },
  { name: '마늘', category: 'veggie', storage: '냉장' },
  { name: '대파', category: 'veggie', storage: '냉장' },
  { name: '당근', category: 'veggie', storage: '냉장' },
  { name: '감자', category: 'veggie', storage: '상온' },
  { name: '청양고추', category: 'veggie', storage: '냉장' },
  { name: '애호박', category: 'veggie', storage: '냉장' },
  { name: '배추', category: 'veggie', storage: '냉장' },
  { name: '무', category: 'veggie', storage: '냉장' },
  { name: '콩나물', category: 'veggie', storage: '냉장' },
  { name: '시금치', category: 'veggie', storage: '냉장' },
  { name: '깻잎', category: 'veggie', storage: '냉장' },

  // 육류/수산/단백질 (6)
  { name: '돼지고기', category: 'meat', storage: '냉장' },
  { name: '소고기', category: 'meat', storage: '냉장' },
  { name: '닭고기', category: 'meat', storage: '냉장' },
  { name: '계란', category: 'dairy', storage: '냉장' },
  { name: '두부', category: 'other', storage: '냉장' },
  { name: '새우', category: 'seafood', storage: '냉동' },

  // 유제품 (2)
  { name: '우유', category: 'dairy', storage: '냉장' },
  { name: '치즈', category: 'dairy', storage: '냉장' },

  // 조미료 (7)
  { name: '간장', category: 'seasoning', storage: '상온' },
  { name: '된장', category: 'seasoning', storage: '냉장' },
  { name: '고추장', category: 'seasoning', storage: '냉장' },
  { name: '참기름', category: 'seasoning', storage: '상온' },
  { name: '식용유', category: 'seasoning', storage: '상온' },
  { name: '설탕', category: 'seasoning', storage: '상온' },
  { name: '소금', category: 'seasoning', storage: '상온' },
  { name: '후추', category: 'seasoning', storage: '상온' },

  // 기타 핵심 (3)
  { name: '김치', category: 'other', storage: '냉장' },
  { name: '밥', category: 'grain', storage: '냉장' },
  { name: '김', category: 'other', storage: '상온' },
];

/**
 * 칩 클릭으로 추가 시 user_ingredients insert 페이로드 생성.
 * expiry_date는 저장하지 않음 — 추정치를 넣으면 만료 경고의 신뢰성이 떨어지고,
 * CLAUDE.md 데이터 무결성 원칙("확인할 수 없는 값은 NULL")과도 어긋남.
 * 만료 경고는 유저가 명시적으로 입력한 expiry_date, 또는 purchase_date 기반 "묵힌 기간" fallback으로 처리.
 */
export function quickAddToPayload(item: QuickAddIngredient, userId: string) {
  return {
    user_id: userId,
    ingredient_name: item.name,
    category: item.category,
    storage_location: item.storage,
    quantity: 1,
    unit: '개',
    purchase_date: new Date().toISOString().slice(0, 10),
  };
}

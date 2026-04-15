/**
 * Quick-add 핵심 재료 30개 (한식 홈쿡 빈도 큐레이션)
 * - 데이터 출처 없이 상식 기반 큐레이션 (search_count는 유저 0명 상태라 의미 없음)
 * - 향후 유저가 늘어나면 ingredients_master.search_count 기반으로 자동 업데이트 가능
 */

export type QuickAddIngredient = {
  name: string;          // 한국어 이름 (DB의 ingredient_name으로 그대로 저장)
  emoji: string;
  category: 'veggie' | 'meat' | 'seafood' | 'dairy' | 'seasoning' | 'grain' | 'other';
  storage: '냉장' | '냉동' | '상온';
};

export const QUICK_ADD: QuickAddIngredient[] = [
  // 채소 (12)
  { name: '양파', emoji: '🧅', category: 'veggie', storage: '상온' },
  { name: '마늘', emoji: '🧄', category: 'veggie', storage: '냉장' },
  { name: '대파', emoji: '🌱', category: 'veggie', storage: '냉장' },
  { name: '당근', emoji: '🥕', category: 'veggie', storage: '냉장' },
  { name: '감자', emoji: '🥔', category: 'veggie', storage: '상온' },
  { name: '청양고추', emoji: '🌶️', category: 'veggie', storage: '냉장' },
  { name: '애호박', emoji: '🥒', category: 'veggie', storage: '냉장' },
  { name: '배추', emoji: '🥬', category: 'veggie', storage: '냉장' },
  { name: '무', emoji: '🥕', category: 'veggie', storage: '냉장' },
  { name: '콩나물', emoji: '🌱', category: 'veggie', storage: '냉장' },
  { name: '시금치', emoji: '🥬', category: 'veggie', storage: '냉장' },
  { name: '깻잎', emoji: '🌿', category: 'veggie', storage: '냉장' },

  // 육류/수산/단백질 (6)
  { name: '돼지고기', emoji: '🥩', category: 'meat', storage: '냉장' },
  { name: '소고기', emoji: '🥩', category: 'meat', storage: '냉장' },
  { name: '닭고기', emoji: '🍗', category: 'meat', storage: '냉장' },
  { name: '계란', emoji: '🥚', category: 'dairy', storage: '냉장' },
  { name: '두부', emoji: '🟦', category: 'other', storage: '냉장' },
  { name: '새우', emoji: '🍤', category: 'seafood', storage: '냉동' },

  // 유제품 (2)
  { name: '우유', emoji: '🥛', category: 'dairy', storage: '냉장' },
  { name: '치즈', emoji: '🧀', category: 'dairy', storage: '냉장' },

  // 조미료 (7)
  { name: '간장', emoji: '🍶', category: 'seasoning', storage: '상온' },
  { name: '된장', emoji: '🍶', category: 'seasoning', storage: '냉장' },
  { name: '고추장', emoji: '🌶️', category: 'seasoning', storage: '냉장' },
  { name: '참기름', emoji: '🍶', category: 'seasoning', storage: '상온' },
  { name: '식용유', emoji: '🛢️', category: 'seasoning', storage: '상온' },
  { name: '설탕', emoji: '🍚', category: 'seasoning', storage: '상온' },
  { name: '소금', emoji: '🧂', category: 'seasoning', storage: '상온' },

  // 기타 핵심 (3)
  { name: '김치', emoji: '🥬', category: 'other', storage: '냉장' },
  { name: '밥', emoji: '🍚', category: 'grain', storage: '냉장' },
  { name: '김', emoji: '🌿', category: 'other', storage: '상온' },
];

/** 칩 클릭으로 추가 시 user_ingredients insert 페이로드 생성 */
export function quickAddToPayload(item: QuickAddIngredient, userId: string) {
  return {
    user_id: userId,
    ingredient_name: item.name,
    category: item.category,
    storage_location: item.storage,
    quantity: 1,
    unit: '개',
    purchase_date: new Date().toISOString().slice(0, 10),
    // 기본 신선도: 채소/단백질 5일, 유제품 7일, 조미료 30일, 기타 14일
    expiry_date: defaultExpiryFor(item.category),
  };
}

function defaultExpiryFor(category: QuickAddIngredient['category']): string {
  const days =
    category === 'seasoning' ? 30 :
    category === 'dairy' ? 7 :
    category === 'meat' || category === 'seafood' ? 5 :
    category === 'veggie' ? 7 :
    14;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

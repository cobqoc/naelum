import { addDaysISO } from './helpers';
import type { FridgeItem } from './types';

/**
 * DEMO 재료 — 비로그인 체험용. 14개로 균형:
 *   - 2개 D-day 경고(돼지고기 위험·두부 주의) — 신선도 UX 시연
 *   - 나머지 12개는 깨끗한 신선 상태 (첫인상 부담 최소화)
 *   - 한국 레시피 필수재료 포함 (김치찌개 등 "바로 가능" 매칭 확보)
 */
export const DEMO: FridgeItem[] = [
  // === 냉장 (7) ===
  { id:'d1', ingredient_name:'돼지고기', category:'meat',    expiry_date: addDaysISO(1),  storage_location:'냉장', purchase_date: addDaysISO(-3) },
  { id:'d2', ingredient_name:'두부',     category:'other',   expiry_date: addDaysISO(3),  storage_location:'냉장', purchase_date: addDaysISO(-2) },
  { id:'d3', ingredient_name:'계란',     category:'dairy',   expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  { id:'d4', ingredient_name:'김치',     category:'other',   expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-2) },
  { id:'d5', ingredient_name:'당근',     category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  { id:'d6', ingredient_name:'마늘',     category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  { id:'d7', ingredient_name:'고추',     category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  // === 냉동 (1) ===
  { id:'d8', ingredient_name:'새우',     category:'seafood', expiry_date: null,           storage_location:'냉동', purchase_date: addDaysISO(-2) },
  // === 상온 (6) ===
  { id:'d9',  ingredient_name:'감자',    category:'veggie',    expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-2) },
  { id:'d10', ingredient_name:'양파',    category:'veggie',    expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-1) },
  { id:'d11', ingredient_name:'쌀',      category:'grain',     expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-1) },
  { id:'d12', ingredient_name:'부침가루', category:'grain',    expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-1) },
  { id:'d13', ingredient_name:'간장',    category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-2) },
  { id:'d14', ingredient_name:'참기름',  category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-2) },
];

import { addDaysISO } from './helpers';
import type { FridgeItem } from './types';

/**
 * DEMO 재료 — 비로그인 체험용. 20개 글로벌 구성:
 *   - 2개 D-day 경고(닭고기 D-1 위험·버터 D-3 주의) — 신선도 UX 시연
 *   - 나머지 18개는 깨끗한 신선 상태 (첫인상 부담 최소화)
 *   - 한식 특화 재료 제거 → 전 세계 공통 식재료로 구성
 */
export const DEMO: FridgeItem[] = [
  // === 냉장 (본체, 8) ===
  { id:'d1', ingredient_name:'닭고기',   category:'meat',    expiry_date: addDaysISO(1),  storage_location:'냉장', purchase_date: addDaysISO(-3) },
  { id:'d2', ingredient_name:'버터',     category:'dairy',   expiry_date: addDaysISO(3),  storage_location:'냉장', purchase_date: addDaysISO(-5) },
  { id:'d3', ingredient_name:'계란',     category:'dairy',   expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  { id:'d4', ingredient_name:'토마토',   category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  { id:'d5', ingredient_name:'당근',     category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  { id:'d6', ingredient_name:'마늘',     category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  { id:'d7', ingredient_name:'양배추',   category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  { id:'d8', ingredient_name:'버섯',     category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  // === 냉동 (2) ===
  { id:'d10', ingredient_name:'새우',    category:'seafood', expiry_date: null,           storage_location:'냉동', purchase_date: addDaysISO(-2) },
  { id:'d21', ingredient_name:'소고기',  category:'meat',    expiry_date: null,           storage_location:'냉동', purchase_date: addDaysISO(-2) },
  // === 상온 (10) ===
  { id:'d11', ingredient_name:'감자',    category:'veggie',    expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-2) },
  { id:'d12', ingredient_name:'양파',    category:'veggie',    expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-1) },
  { id:'d13', ingredient_name:'밀가루',  category:'grain',     expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-1) },
  { id:'d14', ingredient_name:'쌀',      category:'grain',     expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-1) },
  { id:'d15', ingredient_name:'파스타',  category:'grain',     expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-1) },
  { id:'d16', ingredient_name:'올리브유', category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-2) },
  { id:'d17', ingredient_name:'꿀',      category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-2) },
  { id:'d18', ingredient_name:'식용유',  category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-2) },
  { id:'d19', ingredient_name:'소금',    category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-2) },
  { id:'d20', ingredient_name:'후추',    category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-2) },
];

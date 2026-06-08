import type { FridgeIngredient } from '@/components/Fridge/FridgeShelf';

/**
 * 비로그인 미리보기 냉장고(InteractiveFridge·StaticAnonymousFridge)용 샘플 재료.
 *
 * 두 컴포넌트가 동일 샘플을 인라인 중복 정의하던 것을 단일 출처로 통합.
 * ingredient_name·storage_location 의 한글은 *데모/DB 값* — 표시는 어차피 블러 처리(오버레이 뒤)라
 * 번역 대상 아님. ('use client' 가 아닌 데이터 모듈이라 i18n 스캐너 비대상.)
 */
export const SAMPLE_INGREDIENTS: FridgeIngredient[] = [
  { id: 's1', ingredient_name: '양파', category: 'veggie', storage_location: '냉장' },
  { id: 's2', ingredient_name: '소고기', category: 'meat', storage_location: '냉장' },
  { id: 's3', ingredient_name: '두부', category: 'other', storage_location: '냉장' },
  { id: 's4', ingredient_name: '계란', category: 'dairy', storage_location: '냉장' },
  { id: 's5', ingredient_name: '새우', category: 'seafood', storage_location: '냉동' },
  { id: 's6', ingredient_name: '삼겹살', category: 'meat', storage_location: '냉동' },
  { id: 's7', ingredient_name: '소금', category: 'seasoning', storage_location: '상온' },
  { id: 's8', ingredient_name: '쌀', category: 'grain', storage_location: '상온' },
];

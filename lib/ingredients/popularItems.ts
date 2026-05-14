/**
 * 글로벌 범용 재료 프리셋 — 신규 사용자용 "자주 쓰는 재료"가 비어있을 때 대체 노출.
 * 전 세계 어느 나라든 공통적으로 사용하는 재료들. ingredients_master DB 이름(한글)과 매칭.
 */

export interface PopularItem {
  name: string;
  category: string;
  icon: string;
}

export const POPULAR_ITEMS: PopularItem[] = [
  // 채소·향신채 (global aromatics & vegetables)
  { name: '마늘', category: 'veggie', icon: '🧄' },
  { name: '양파', category: 'veggie', icon: '🧅' },
  { name: '감자', category: 'veggie', icon: '🥔' },
  { name: '당근', category: 'veggie', icon: '🥕' },
  { name: '토마토', category: 'veggie', icon: '🍅' },
  { name: '시금치', category: 'veggie', icon: '🥬' },
  // 단백질 (global proteins)
  { name: '계란', category: 'dairy', icon: '🥚' },
  { name: '닭고기', category: 'meat', icon: '🍗' },
  // 곡물 (global grains)
  { name: '쌀', category: 'grain', icon: '🍚' },
  { name: '밀가루', category: 'grain', icon: '🌾' },
  // 유제품 (global dairy)
  { name: '우유', category: 'dairy', icon: '🥛' },
  { name: '버터', category: 'dairy', icon: '🧈' },
  { name: '치즈', category: 'dairy', icon: '🧀' },
  // 기본 조미료 (universal seasonings)
  { name: '소금', category: 'condiment', icon: '🧂' },
  { name: '설탕', category: 'condiment', icon: '🍬' },
  { name: '올리브오일', category: 'seasoning', icon: '🫒' },
];

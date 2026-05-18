/**
 * cart 드롭다운 분해(Phase 2) 내부 공유 타입·상수.
 * 부모(ShoppingCartDropdown)와 추출 표현 컴포넌트가 단일 출처로 공유 —
 * 중복 정의/ prop 스레딩 회피. 값·의미는 원본과 동일.
 */

// chip / autocomplete / manual 비율 측정 — 카테고리 탭 추가 vs 검색 강화 결정용
export type CartAddSource = 'chip' | 'autocomplete' | 'manual';

export interface Suggestion {
  id: string;
  name: string;
  category: string;
}

// 직접 추가·수량 수정 시 흔히 쓰는 단위 (DB 저장값이라 한글 그대로 — CLAUDE.md 규칙)
export const COMMON_UNITS = ['개', 'g', 'kg', 'ml', 'L', '팩', '봉지', '병', '통', '장', '큰술', '작은술'];

export type QuickItem = {
  name: string;
  category: string;
  icon?: string;
  fromFavorites: boolean;
};

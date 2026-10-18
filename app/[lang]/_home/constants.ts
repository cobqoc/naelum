// 홈페이지 타이밍·수량 상수. 매직넘버 제거 목적.

// 삭제 undo 창 — 사용자가 "실행 취소" 누를 수 있는 시간 (토스트 지속시간과 동일).
export const DELETE_UNDO_WINDOW_MS = 5500;

// 추천 API 호출 debounce — items 연속 변경 시 마지막 변경만 fetch.
export const RECOMMENDATIONS_FETCH_DEBOUNCE_MS = 500;

// 추천 API limit — 홈에서 fetch하는 최대 레시피 수.
export const RECOMMENDATIONS_LIMIT = 30;

// 일반 토스트 자동 숨김.
export const TOAST_AUTO_HIDE_MS = 2000;

// localStorage 키 — 홈 관련 상태 persist.
// v2: DEMO 시드 확장(14→20개, 한식 ready 3+개 매칭 보장)으로 기존 캐시 무효화.
// v3: 냉동 칩에 닭고기 추가(20→21개) — 본체/냉동 시각 균형 개선.
// v4: 한식 특화 재료 → 글로벌 공통 재료로 교체 (외국 사용자 UX 개선).
// v5: 냉동 소고기(포괄명) → 삼겹살(부위) 교체 + 만두 추가(20→21개). 캐시 무효화.
export const LS_KEY_DEMO_ITEMS = 'naelum_demo_items_v5';
export const LS_KEY_ONBOARDING_BANNER = (userId: string) => `naelum_onboarding_banner_${userId}`;

// Long-press 트리거 시간 (모바일 chip에서 장누름 시 삭제 확인).
export const LONG_PRESS_MS = 500;

/**
 * FridgeSVG 내부 선반 좌표 매핑 (viewBox: 30 -5 540 670 기준).
 * 실측 rail y좌표를 percentage로 변환. (y - (-5)) / 670 = percent.
 * - 냉장 선반1 rail top: y=119   → 선반 위 공간 y≈60~118
 * - 냉장 선반2 rail top: y=214   → 선반 위 공간 y≈140~213
 * - 냉장 서랍 top:        y=320  → 선반 위 공간 y≈240~319
 * - 냉동 서랍 top:        y=526  → 선반 위 공간 y≈420~525
 * - x는 모두 184~416 (width 232)
 */
export const SHELF_LEFT = '28.5%';   // (184-30)/540 = 28.5%
export const SHELF_WIDTH = '43%';    // 232/540 = 43%
export const SHELVES: { top: string; height: string; kind: 'fridge' | 'freezer' }[] = [
  { top: '9.7%',  height: '8.7%',  kind: 'fridge' },
  { top: '21.6%', height: '10.9%', kind: 'fridge' },
  { top: '36.6%', height: '11.8%', kind: 'fridge' },
  { top: '63.4%', height: '15.7%', kind: 'freezer' },
];

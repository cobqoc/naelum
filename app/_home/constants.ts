// 홈페이지 타이밍·수량 상수. 매직넘버 제거 목적.

// 삭제 undo 창 — 사용자가 "실행 취소" 누를 수 있는 시간 (토스트 지속시간과 동일).
export const DELETE_UNDO_WINDOW_MS = 5500;

// 추천 API 호출 debounce — items 연속 변경 시 마지막 변경만 fetch.
export const RECOMMENDATIONS_FETCH_DEBOUNCE_MS = 500;

// 추천 API limit — 홈에서 fetch하는 최대 레시피 수.
export const RECOMMENDATIONS_LIMIT = 30;

// 비로그인 첫 방문 툴팁 — 표시 delay, 자동 숨김까지 시간.
export const FIRST_VISIT_TIP_SHOW_DELAY_MS = 900;
export const FIRST_VISIT_TIP_AUTO_HIDE_MS = 8000;

// 일반 토스트 자동 숨김.
export const TOAST_AUTO_HIDE_MS = 2000;

// 비로그인 체험 모드에서 "추가됐어요" 토스트 지속시간 (액션 버튼 누를 여유 필요해 길게).
export const DEMO_ADD_TOAST_MS = 6000;

// localStorage 키 — 홈 관련 상태 persist.
export const LS_KEY_DEMO_ITEMS = 'naelum_demo_items';
export const LS_KEY_SEEN_HOME_TIP = 'naelum_seen_home_tip';
export const LS_KEY_ONBOARDING_BANNER = (userId: string) => `naelum_onboarding_banner_${userId}`;

// 카테고리별 예상 보관 기한 (일). expiry_date가 없을 때 urgencyScore/freshState가 fallback으로 사용.
// 평균적인 냉장 보관 기준 보수적 추정값. 실제 식재료 상태를 보장하지 않음.
export const CATEGORY_SHELF_LIFE_DAYS: Record<string, number> = {
  seafood: 3,
  meat: 5,
  dairy: 7,
  veggie: 14,
  grain: 30,
  seasoning: 90,
};
export const DEFAULT_SHELF_LIFE_DAYS = 7;

export function getShelfLifeDays(category: string | null | undefined): number {
  if (!category) return DEFAULT_SHELF_LIFE_DAYS;
  return CATEGORY_SHELF_LIFE_DAYS[category] ?? DEFAULT_SHELF_LIFE_DAYS;
}

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

// 냉장고 도어 선반 chip 좌표 — 좌·우 도어 각 2단(상단·중단).
export const DOOR_SHELVES: { side: 'left' | 'right'; left: string; width: string; top: string; height: string }[] = [
  { side: 'left',  left: '7%',  width: '16%', top: '11%', height: '6%' },
  { side: 'left',  left: '7%',  width: '16%', top: '23%', height: '6%' },
  { side: 'right', left: '77%', width: '16%', top: '11%', height: '6%' },
  { side: 'right', left: '77%', width: '16%', top: '23%', height: '6%' },
];
export const MAX_DOOR_CHIPS_PER_SHELF = 2;

/**
 * KitchenSVG landscape viewBox="0 -35 640 200" — 찬장(translate 230) 안 4선반.
 * top% = (shelfY+35)/200*100. items-end 기반 chip 바닥이 선반 상면.
 */
export const PANTRY_SHELVES: { top: string; height: string; left: string; width: string }[] = [
  { left: '0%',  width: '36%', top: '22%', height: '18%' }, // 좌상단 olive
  { left: '14%', width: '22%', top: '67%', height: '16%' }, // 좌하단 terracotta (화분 우측)
  { left: '64%', width: '25%', top: '15%', height: '18%' }, // 우상단 mauve
  { left: '64%', width: '36%', top: '63%', height: '15%' }, // 우하단 slate
];

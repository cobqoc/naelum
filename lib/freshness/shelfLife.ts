// 재료 보관기간(shelf-life) 해석 — 순수 모듈. i18n·DB·React 의존 0 (vitest 가능).
//
// 설계(2026-06-03 결정, docs 대화록):
// - 추정 사다리: ① 유저 입력 expiry_date(진실, 이 모듈 밖) → ② 재료별 shelf_life_days
//   (ingredients_master, FoodKeeper/식약처 출처) → ③ 카테고리+보관위치 fallback(아래 표)
//   → ④ 정보 부족이면 null(추정 안 함).
// - 이 결과는 **앱 내 시각(저위험)** 전용. OS 푸시(고위험)는 유저 입력 expiry_date 만 씀.
// - DB 에 저장하지 않고 **읽을 때 계산**(compute-on-read) → 무결성·보정 즉시반영.
// - 모르면(보관위치/구매일 불명) **추정 안 함** — 틀린 추정이 신뢰를 깎는 게 더 나쁨.

/** 정규 보관위치. user_ingredients.storage_location 은 이 외에 '기타'·null 도 나옴. */
export type StorageLocation = '냉장' | '냉동' | '상온';

const STORAGE_SET = new Set<StorageLocation>(['냉장', '냉동', '상온']);

/** ingredients_master 의 21 카테고리 + 폼의 'other'. 본질 분류 기준([[project_ingredient_category_taxonomy]]). */
export type ShelfLifeCategory =
  | 'veggie' | 'fruit' | 'meat' | 'seafood' | 'dairy' | 'egg' | 'grain' | 'legume'
  | 'mushroom' | 'nuts' | 'oil' | 'processed' | 'seasoning' | 'spice' | 'sweetener'
  | 'condiment' | 'fermented' | 'seaweed' | 'seeds' | 'bakery' | 'alcohol' | 'other';

/**
 * tier③ — 카테고리×보관위치 **거친 fallback**(일수). 재료별 shelf_life_days(tier②) 없을 때만.
 * 시각 추정 전용이라 정밀도가 목적이 아님(정밀은 tier② 가 담당). 보수적 ballpark.
 * 단위: 일. (>=365 ≈ 1년)
 */
export const CATEGORY_STORAGE_DAYS: Record<ShelfLifeCategory, Record<StorageLocation, number>> = {
  veggie:    { 냉장: 14,  냉동: 180, 상온: 5 },
  fruit:     { 냉장: 10,  냉동: 180, 상온: 5 },
  meat:      { 냉장: 3,   냉동: 120, 상온: 1 },
  seafood:   { 냉장: 2,   냉동: 90,  상온: 1 },
  dairy:     { 냉장: 7,   냉동: 30,  상온: 1 },
  egg:       { 냉장: 35,  냉동: 365, 상온: 7 },
  grain:     { 냉장: 180, 냉동: 365, 상온: 180 },
  legume:    { 냉장: 180, 냉동: 365, 상온: 180 },
  mushroom:  { 냉장: 7,   냉동: 90,  상온: 2 },
  nuts:      { 냉장: 180, 냉동: 365, 상온: 90 },
  oil:       { 냉장: 365, 냉동: 365, 상온: 180 },
  processed: { 냉장: 14,  냉동: 90,  상온: 30 },
  seasoning: { 냉장: 365, 냉동: 365, 상온: 365 },
  spice:     { 냉장: 365, 냉동: 365, 상온: 730 },
  sweetener: { 냉장: 730, 냉동: 730, 상온: 730 },
  condiment: { 냉장: 90,  냉동: 180, 상온: 60 },
  fermented: { 냉장: 90,  냉동: 180, 상온: 14 },
  seaweed:   { 냉장: 30,  냉동: 180, 상온: 365 },
  seeds:     { 냉장: 180, 냉동: 365, 상온: 90 },
  bakery:    { 냉장: 7,   냉동: 90,  상온: 3 },
  alcohol:   { 냉장: 365, 냉동: 365, 상온: 365 },
  other:     { 냉장: 7,   냉동: 90,  상온: 14 },
};

/** 보관위치 정규화. 정규 3종이면 그대로, '기타'·null·미지는 null(추정 불가 신호). */
export function normalizeStorage(s: string | null | undefined): StorageLocation | null {
  const v = (s ?? '').trim();
  return STORAGE_SET.has(v as StorageLocation) ? (v as StorageLocation) : null;
}

/** 카테고리 정규화. 알려진 카테고리면 그대로, 아니면 'other'. */
export function normalizeCategory(c: string | null | undefined): ShelfLifeCategory {
  const v = (c ?? '').trim().toLowerCase();
  return v in CATEGORY_STORAGE_DAYS ? (v as ShelfLifeCategory) : 'other';
}

export interface ResolveShelfLifeInput {
  /** ingredients_master.shelf_life_days — 보관위치 키의 일수 맵. tier②. */
  shelfLifeDays?: Record<string, number> | null;
  /** user_ingredients.category 또는 master.category. tier③. */
  category?: string | null;
  storageLocation?: string | null;
}

/**
 * 보관위치 기준 예상 보관일수. 사다리 ②→③, 정보 부족이면 null.
 * - 보관위치 불명(기타/null) → null (모르면 추정 안 함, H5)
 * - tier②: shelfLifeDays[보관위치] 가 숫자면 그 값
 * - tier③: CATEGORY_STORAGE_DAYS[category][보관위치]
 */
export function resolveShelfLifeDays(input: ResolveShelfLifeInput): number | null {
  const storage = normalizeStorage(input.storageLocation);
  if (!storage) return null;

  const perIngredient = input.shelfLifeDays?.[storage];
  if (typeof perIngredient === 'number' && perIngredient >= 0) return perIngredient;

  const cat = normalizeCategory(input.category);
  return CATEGORY_STORAGE_DAYS[cat][storage];
}

// 'YYYY-MM-DD' → UTC 자정 epoch ms. SSR-stable(helpers.ts 와 동일 규약 — TZ별 ±1일 hydration 회피).
function dateOnlyToUTC(d: string): number {
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, day);
}

export interface EstimateExpiryInput extends ResolveShelfLifeInput {
  /** user_ingredients.purchase_date ('YYYY-MM-DD'). 없으면 추정 불가. */
  purchaseDate?: string | null;
}

/**
 * 예상 만료일('YYYY-MM-DD', UTC 기준) — purchase_date + 예상 보관일수.
 * 구매일 없거나 보관일수 해석 불가면 null(추정 안 함).
 * ⚠️ 유저가 직접 입력한 expiry_date 가 있으면 **그게 우선**(이 함수 호출 전에 분기) — tier①은 이 모듈 밖.
 */
export function estimateExpiry(input: EstimateExpiryInput): string | null {
  if (!input.purchaseDate) return null;
  const days = resolveShelfLifeDays(input);
  if (days === null) return null;
  return new Date(dateOnlyToUTC(input.purchaseDate) + days * 86400000).toISOString().slice(0, 10);
}

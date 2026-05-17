import { QUICK_ADD } from './quickAddList';

import { getIngredientEmoji, getPreciseIngredientEmoji } from '../../../lib/utils/ingredientEmoji';
import type { FridgeItem } from './types';

/** 오늘 기준 만료일까지 남은 일수. expiry_date 없으면 99(만료 아님). */
export function daysUntilExpiry(d: string | null): number {
  if (!d) return 99;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp = new Date(d); exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** 구매 후 경과일. purchase_date 없으면 음수(미확인) 반환. */
export function daysSincePurchase(d: string | null | undefined): number {
  if (!d) return -1;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const pur = new Date(d); pur.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - pur.getTime()) / (1000 * 60 * 60 * 24));
}

/** 오늘+d일을 ISO(YYYY-MM-DD) 문자열로. DEMO 데이터 생성용. */
export function addDaysISO(d: number): string {
  const date = new Date(); date.setDate(date.getDate() + d);
  return date.toISOString().slice(0, 10);
}

/** QUICK_ADD에 있으면 해당 이모지, 없으면 category 기본값, 그것도 없으면 📦.
 *  정확일치 → 부분포함 순서: '물' 검색이 '콩나물'에 잘못 잡히는 등 짧은 이름 오매칭 방지. */
export function getEmoji(name: string, category: string): string {
  const exact = QUICK_ADD.find(q => q.name === name);
  if (exact) return exact.emoji;
  const partial = QUICK_ADD.find(q => name.includes(q.name) || q.name.includes(name));
  if (partial) return partial.emoji;
  return getIngredientEmoji(name, category);
}

/** getEmoji 의 "정확한 것만" 버전 — QUICK_ADD(정확/부분) 또는 EXACT/KEYWORD
 *  매핑 히트만 반환, 카테고리 일반 폴백 자리에서는 null.
 *  칩처럼 부정확한 중복 이모지가 무(無)보다 나쁜 스캔 표면 전용. */
export function getPreciseEmoji(name: string): string | null {
  const exact = QUICK_ADD.find(q => q.name === name);
  if (exact) return exact.emoji;
  const partial = QUICK_ADD.find(q => name.includes(q.name) || q.name.includes(name));
  if (partial) return partial.emoji;
  return getPreciseIngredientEmoji(name);
}

/**
 * 재료의 신선도 상태를 결정.
 * - expiry_date가 있으면 그걸 기준으로 D-N 계산 (정확한 만료일)
 * - 없으면 purchase_date 기준 "묵힌 기간" fallback. 카테고리별 예상 유통기한을 임계값으로.
 *     해산물(3일)·육류(5일)·유제품(7일)·채소(14일)·곡물(30일)·조미료(90일). fallback 7일.
 * - 둘 다 없으면: 중립(경고 없음)
 *
 * label은 i18n을 위해 kind+n으로 분리. 화면 표시는 formatFreshLabel(state, t)로 변환.
 */
export type FreshLabelKind = 'expired' | 'dDay' | 'daysAged' | null;

export function freshState(item: Pick<FridgeItem, 'expiry_date' | 'purchase_date' | 'category'>): {
  border: string;
  labelKind: FreshLabelKind;
  labelN: number;
  isDanger: boolean;
} {
  const days = daysUntilExpiry(item.expiry_date);
  if (item.expiry_date) {
    if (days <= 0) return { border: '#991b1b', labelKind: 'expired', labelN: 0, isDanger: true };
    if (days <= 3) return { border: '#dc2626', labelKind: 'dDay', labelN: days, isDanger: true };
    if (days <= 7) return { border: '#d97706', labelKind: 'dDay', labelN: days, isDanger: false };
    return { border: '#4d7c0f', labelKind: null, labelN: 0, isDanger: false };
  }
  const since = daysSincePurchase(item.purchase_date);
  if (since <= 0) return { border: '#4d7c0f', labelKind: null, labelN: 0, isDanger: false };
  return { border: '#4d7c0f', labelKind: 'daysAged', labelN: since, isDanger: false };
}

/** freshState 결과를 locale별 표시 문자열로. 빈 라벨이면 빈 문자열. */
export function formatFreshLabel(
  kind: FreshLabelKind,
  n: number,
  t: { fridge: { expired: string; dDay: string; daysAged: string } }
): string {
  if (kind === 'expired') return t.fridge.expired;
  if (kind === 'dDay') return t.fridge.dDay.replace('{n}', String(n));
  if (kind === 'daysAged') return t.fridge.daysAged.replace('{n}', String(n));
  return '';
}

/** 긴급도 스코어 — 작을수록 우선(만료 임박). 선반 정렬에 사용. */
export function urgencyScore(item: FridgeItem): number {
  if (item.expiry_date) return daysUntilExpiry(item.expiry_date);
  const since = daysSincePurchase(item.purchase_date);
  if (since < 0) return 99;
  return Math.max(0, 99 - since);
}

/**
 * DEMO 판정 — `isDemoItem` flag 우선, 기존 localStorage 호환을 위해 id 스킴도 fallback.
 *
 * ⚠️ 데모 id는 `d`+숫자(`d1`..`d21`, demoItems.ts) 또는 legacy `demo*`.
 * 단순 `id.startsWith('d')` 는 `gen_random_uuid()` UUID 중 약 1/16(첫 hex 글자 'd')을
 * 실제 DB 행인데도 데모로 오판 → updateIngredient/삭제가 PATCH 없이 로컬만 갱신,
 * DB 침묵 유실. 따라서 `d`+숫자 전체 일치(`/^d\d+$/`)로만 판정해 UUID와 분리한다.
 */
export function isDemoRecord(item: { id: string; isDemoItem?: boolean }): boolean {
  if (item.isDemoItem) return true;
  return /^d\d+$/.test(item.id) || item.id.startsWith('demo');
}

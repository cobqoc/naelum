import { QUICK_ADD } from './quickAddList';
import { getShelfLifeDays } from './constants';
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

/** QUICK_ADD에 있으면 해당 이모지, 없으면 category 기본값, 그것도 없으면 📦. */
export function getEmoji(name: string, category: string): string {
  const found = QUICK_ADD.find(q => q.name === name || name.includes(q.name) || q.name.includes(name));
  if (found) return found.emoji;
  return ({ veggie:'🥬', meat:'🥩', seafood:'🐟', dairy:'🥛', grain:'🌾', seasoning:'🧂' } as Record<string,string>)[category] ?? '📦';
}

/**
 * 재료의 신선도 상태를 결정.
 * - expiry_date가 있으면 그걸 기준으로 D-N 계산 (정확한 만료일)
 * - 없으면 purchase_date 기준 "묵힌 기간" fallback. 카테고리별 예상 유통기한을 임계값으로.
 *     해산물(3일)·육류(5일)·유제품(7일)·채소(14일)·곡물(30일)·조미료(90일). fallback 7일.
 * - 둘 다 없으면: 중립(경고 없음)
 */
export function freshState(item: Pick<FridgeItem, 'expiry_date' | 'purchase_date' | 'category'>): {
  border: string;
  label: string;
  isDanger: boolean;
} {
  const days = daysUntilExpiry(item.expiry_date);
  if (item.expiry_date) {
    if (days <= 0) return { border: '#991b1b', label: '만료', isDanger: true };
    if (days <= 3) return { border: '#dc2626', label: `D-${days}`, isDanger: true };
    if (days <= 7) return { border: '#d97706', label: `D-${days}`, isDanger: false };
    return { border: '#4d7c0f', label: '', isDanger: false };
  }
  const since = daysSincePurchase(item.purchase_date);
  if (since < 0) return { border: '#4d7c0f', label: '', isDanger: false };
  const shelfLife = getShelfLifeDays(item.category);
  const warn = Math.ceil(shelfLife * 0.5);
  if (since >= shelfLife) return { border: '#dc2626', label: `${since}일째`, isDanger: true };
  if (since >= warn) return { border: '#d97706', label: `${since}일째`, isDanger: false };
  return { border: '#4d7c0f', label: '', isDanger: false };
}

/** 긴급도 스코어 — 작을수록 우선(만료 임박). 선반 정렬에 사용. */
export function urgencyScore(item: FridgeItem): number {
  if (item.expiry_date) return daysUntilExpiry(item.expiry_date);
  const since = daysSincePurchase(item.purchase_date);
  if (since < 0) return 99;
  const shelfLife = getShelfLifeDays(item.category);
  return Math.max(-1, shelfLife - since);
}

/** DEMO 판정 — `isDemoItem` flag 우선, 기존 localStorage 호환을 위해 id prefix도 fallback. */
export function isDemoRecord(item: { id: string; isDemoItem?: boolean }): boolean {
  if (item.isDemoItem) return true;
  return item.id.startsWith('d') || item.id.startsWith('demo');
}

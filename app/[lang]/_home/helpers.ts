import type { FridgeItem } from './types';

// SSR-stable 날짜 산수 — local-midnight vs UTC-parsing 혼용이 timezone 별로 ±1일 어긋나
// React #418 (hydration text mismatch)을 일으켰던 원인. 양쪽 모두 UTC 기준으로 일관 처리.
// 'YYYY-MM-DD' 문자열을 UTC 자정 epoch ms 로 변환.
function dateOnlyToUTC(d: string): number {
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, day);
}

// 오늘(UTC) 자정 epoch ms — 서버/브라우저 동일.
function todayUTC(): number {
  const n = new Date();
  return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
}

/** 오늘 기준 만료일까지 남은 일수. expiry_date 없으면 99(만료 아님). */
export function daysUntilExpiry(d: string | null): number {
  if (!d) return 99;
  return Math.ceil((dateOnlyToUTC(d) - todayUTC()) / 86400000);
}

/** 구매 후 경과일. purchase_date 없으면 음수(미확인) 반환. */
export function daysSincePurchase(d: string | null | undefined): number {
  if (!d) return -1;
  return Math.floor((todayUTC() - dateOnlyToUTC(d)) / 86400000);
}

/** 오늘+d일을 ISO(YYYY-MM-DD) 문자열로. DEMO 데이터 생성용. UTC 기준 (SSR-stable). */
export function addDaysISO(d: number): string {
  return new Date(todayUTC() + d * 86400000).toISOString().slice(0, 10);
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

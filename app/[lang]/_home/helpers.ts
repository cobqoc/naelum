import type { FridgeItem } from './types';
import { estimateExpiry } from '@/lib/freshness/shelfLife';

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
 * 재료의 신선도 상태를 결정. 사다리:
 * - ① expiry_date(유저 입력=진실) 있으면 그 기준 D-N. **빨강 펄스(isDanger)는 여기에만.**
 * - ②③ 없으면 purchase_date + 보관위치별 보관일수(lib/freshness)로 *추정*. 추측이라
 *      isDanger 안 띄우고(빨강X) amber + "예상" 라벨(isEstimate=true)로 확정과 구분.
 * - ④ 추정 불가(보관위치/구매일 불명) → 기존 "묵힌 기간" fallback.
 *
 * label은 i18n을 위해 kind+n으로 분리. 화면 표시는 formatFreshLabel(kind, n, t, isEstimate)로 변환.
 */
export type FreshLabelKind = 'expired' | 'dDay' | 'daysAged' | null;

export function freshState(item: Pick<FridgeItem, 'expiry_date' | 'purchase_date' | 'category' | 'storage_location' | 'shelf_life_days'>): {
  border: string;
  labelKind: FreshLabelKind;
  labelN: number;
  isDanger: boolean;
  isEstimate: boolean;
} {
  // ① 확정 만료일(진실) — 행위 불변. isDanger(빨강 펄스)는 여기에만 허용.
  const days = daysUntilExpiry(item.expiry_date);
  if (item.expiry_date) {
    if (days <= 0) return { border: '#991b1b', labelKind: 'expired', labelN: 0, isDanger: true, isEstimate: false };
    if (days <= 3) return { border: '#dc2626', labelKind: 'dDay', labelN: days, isDanger: true, isEstimate: false };
    if (days <= 7) return { border: '#d97706', labelKind: 'dDay', labelN: days, isDanger: false, isEstimate: false };
    return { border: '#4d7c0f', labelKind: null, labelN: 0, isDanger: false, isEstimate: false };
  }

  // ②③ 추정 — purchase_date + 보관위치별 보관일수. 추측이라 isDanger=false(빨강 안 띄움).
  const estISO = estimateExpiry({
    purchaseDate: item.purchase_date ?? null,
    shelfLifeDays: item.shelf_life_days,
    category: item.category,
    storageLocation: item.storage_location,
  });
  if (estISO) {
    const estDays = daysUntilExpiry(estISO);
    if (estDays <= 0) return { border: '#d97706', labelKind: 'expired', labelN: 0, isDanger: false, isEstimate: true };
    if (estDays <= 7) return { border: '#d97706', labelKind: 'dDay', labelN: estDays, isDanger: false, isEstimate: true };
    return { border: '#4d7c0f', labelKind: null, labelN: 0, isDanger: false, isEstimate: true };
  }

  // ④ 추정 불가 — 기존 "묵힌 기간" fallback (불변).
  const since = daysSincePurchase(item.purchase_date);
  if (since <= 0) return { border: '#4d7c0f', labelKind: null, labelN: 0, isDanger: false, isEstimate: false };
  return { border: '#4d7c0f', labelKind: 'daysAged', labelN: since, isDanger: false, isEstimate: false };
}

/** freshState 결과를 locale별 표시 문자열로. 빈 라벨이면 빈 문자열. */
export function formatFreshLabel(
  kind: FreshLabelKind,
  n: number,
  t: { fridge: { expired: string; dDay: string; daysAged: string; estimatePrefix: string } },
  isEstimate = false
): string {
  let label = '';
  if (kind === 'expired') label = t.fridge.expired;
  else if (kind === 'dDay') label = t.fridge.dDay.replace('{n}', String(n));
  else if (kind === 'daysAged') label = t.fridge.daysAged.replace('{n}', String(n));
  if (!label) return '';
  // 추정은 "예상" 접두로 확정과 구분(추측을 사실인 척 안 함).
  return isEstimate ? `${t.fridge.estimatePrefix} ${label}` : label;
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

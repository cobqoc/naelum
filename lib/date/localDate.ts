/**
 * 로컬 타임존 기준 날짜 포맷.
 *
 * `new Date().toISOString().slice(0,10)` 은 **UTC** 날짜라 KST(UTC+9) 자정~오전 9시엔
 * 하루 빨라진다(예: 로컬 6/3 04:41 = UTC 6/2 → "오늘"이 6/2로 표시되는 버그, 2026-06-03 발견).
 * 사용자가 *직접 보고 고르는* 날짜(유통기한 빠른선택·구매일 기본값)는 로컬 기준이어야 한다.
 *
 * ⚠️ 냉장고 신선도("N일째"·D-day) 계산은 `app/[lang]/_home/helpers.ts` 가 **의도적으로 UTC** 사용
 *    (SSR/CSR 동일값 → React #418 hydration mismatch 회피). 그쪽은 건드리지 말 것.
 */

/** 로컬 타임존 기준 YYYY-MM-DD. */
export function localDateISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 오늘(로컬)에서 days 일 뒤를 YYYY-MM-DD(로컬)로. 유통기한 빠른선택용. */
export function addDaysLocalISO(days: number, base: Date = new Date()): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return localDateISO(d);
}

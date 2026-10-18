/**
 * 장보기 수량 파싱·병합 — 순수 함수 (AUDIT_2026-05-31 C7 근본 수정).
 *
 * **고친 버그**: 레시피 재료 quantity 는 `"약간"`·`"적당량"`·`"2~3"` 같은
 * 비숫자 문자열이 흔하다(한국 레시피). 기존 route 는 `parseFloat("약간")` = `NaN`
 * 을 그대로 산술에 썼다:
 *   - 병합: `currentQty + NaN = NaN` → JSON 직렬화 시 `null` → **이미 쌓아둔
 *     "양파 3개"가 null 로 파괴**(데이터유실).
 *   - 삽입: `NaN` 저장 → 이후 수량 산수 전부 NaN 전파.
 *
 * **원칙**: 수량은 *유효한 유한수* 아니면 "수량 미상(null)" 둘 중 하나.
 * 비숫자/누락은 null 로 정직하게 떨어뜨리고(데이터 무결성 규칙), 병합 시
 * 미상값이 기존 누적을 *절대* 덮어쓰지 않는다.
 */

const UNICODE_FRACTIONS: Record<string, string> = { '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4' };

/**
 * 사용자/레시피가 준 수량 문자열을 유효 숫자 또는 null 로.
 * `"200"`·`"1.5"`·`"200g"` → 앞 숫자. **분수** `"1/2"` → 0.5, `"1 1/2"` → 1.5, `"½"` → 0.5
 * (예전엔 parseFloat 라 "1/2" 가 1 로 저장돼 상세·장보기·인분 배율이 전부 2배였다 — 2026-10-04 감사 ICL-28).
 * `"약간"`·`""`·`undefined` → null. 범위 `"2~3"` 은 지금처럼 앞 숫자(2) — 범위 처리는 별도 결정.
 * NaN 을 절대 흘리지 않고, 음수·무한대·분모 0 도 null 처리.
 */
export function parseQuantity(raw?: string | number | null): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) && raw >= 0 ? raw : null;
  let str = String(raw).trim();
  for (const [glyph, frac] of Object.entries(UNICODE_FRACTIONS)) {
    str = str.replace(new RegExp(`(\\d)?\\s*${glyph}`), (_m, whole?: string) => (whole ? `${whole} ${frac}` : frac));
  }
  let n: number;
  const mixed = str.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)/);
  const frac = str.match(/^(\d+)\s*\/\s*(\d+)/);
  if (mixed) {
    n = Number(mixed[3]) === 0 ? NaN : Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  } else if (frac) {
    n = Number(frac[2]) === 0 ? NaN : Number(frac[1]) / Number(frac[2]);
  } else {
    n = parseFloat(str);
  }
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null; // 음수 수량은 의미 없음 → 미상 처리
  return n;
}

/**
 * 기존 항목 수량(current)에 새 수량(incoming)을 더한 *병합 결과*.
 * 핵심 불변식: **미상값(null)은 절대 기존 값을 파괴하지 않는다.**
 *  - 새 수량 미상 → 기존 그대로 유지 (NaN 파괴 버그의 정반대)
 *  - 기존 미상 + 새 숫자 → 새 숫자로 채움
 *  - 둘 다 숫자 → 합산
 *  - 둘 다 미상 → null
 */
export function mergeQuantity(current: number | null, incoming: number | null): number | null {
  if (incoming == null) return current;      // 미상은 더하지 않음 → 기존 보존
  if (current == null) return incoming;       // 기존 미상이면 새 값으로 시작
  return current + incoming;                  // 둘 다 유효 숫자 → 합산
}

/**
 * 양·단위 비교 — 매칭용 순수 함수 (2026-05-31).
 * 설계: docs/INGREDIENT_MODEL_REDESIGN.md §8 Phase 2.
 *
 * 표시용 `useUnitConversion`(미터법↔야드파운드 토글)과 *다른 관심사* — 여기선
 * "필요량 vs 보유량 충족 여부"를 결정한다.
 *
 * 결정적·degrade-safe:
 *  - 같은 단위 / 같은 차원(부피끼리·무게끼리)은 *데이터 없이* 비교.
 *  - 차원 교차(부피↔무게, 개수↔무게)는 *재료별 계수*(밀도·개당 무게) 필요 → 없으면 null(=비교 불가).
 *  - 비교 불가·양 미입력이면 호출처가 "양 판단 생략"으로 degrade(거짓 정확성 회피).
 *
 * 추측 0: 모르는 단위·계수 없으면 *null*. 임의 변환 안 함.
 */

/** 부피 단위 → ml 정규화 (만국 공통 상수, useUnitConversion 과 동일 값) */
const VOLUME_TO_ML: Record<string, number> = {
  ml: 1, l: 1000, '리터': 1000, '밀리리터': 1,
  '큰술': 15, tbsp: 15, '작은술': 5, tsp: 5, '컵': 200, cup: 200,
};

/** 무게 단위 → g 정규화 */
const MASS_TO_G: Record<string, number> = {
  g: 1, '그램': 1, kg: 1000, '킬로그램': 1000, mg: 0.001,
};

/** 재료별 변환 계수 — 데이터(8-B)로 채움. 없으면 차원 교차 변환 불가. */
export interface UnitCoeffs {
  /** 밀도 g/ml (부피↔무게). 예: 물 1, 기름 ~0.92 */
  gramsPerMl?: number;
  /** 개수 단위 → 무게(g). 예: { '개': 200(양파), '쪽': 5(마늘) } */
  gramsPerCountUnit?: Record<string, number>;
}

export type Dimension = 'volume' | 'mass' | 'count';

function normUnit(unit: string): string {
  return unit.trim().toLowerCase();
}

export function dimensionOf(unit: string): Dimension {
  const u = normUnit(unit);
  if (u in VOLUME_TO_ML) return 'volume';
  if (u in MASS_TO_G) return 'mass';
  return 'count'; // 개·알·쪽·장·대·줌·모… (count 차원)
}

/**
 * qty(fromUnit) → toUnit 으로 변환. 불가하면 null.
 * 같은 단위·같은 차원은 계수 불필요. 차원 교차는 coeffs 필요.
 */
export function convertAmount(
  qty: number,
  fromUnit: string,
  toUnit: string,
  coeffs?: UnitCoeffs,
): number | null {
  const f = normUnit(fromUnit);
  const t = normUnit(toUnit);
  if (f === t) return qty;

  const df = dimensionOf(f);
  const dt = dimensionOf(t);

  // 같은 차원 — 계수 불필요
  if (df === 'volume' && dt === 'volume') return (qty * VOLUME_TO_ML[f]) / VOLUME_TO_ML[t];
  if (df === 'mass' && dt === 'mass') return (qty * MASS_TO_G[f]) / MASS_TO_G[t];

  // 공통 base(g)로 환산 — 차원 교차는 계수 필요
  const toGrams = (q: number, unit: string, dim: Dimension): number | null => {
    if (dim === 'mass') return q * MASS_TO_G[unit];
    if (dim === 'volume') return coeffs?.gramsPerMl ? q * VOLUME_TO_ML[unit] * coeffs.gramsPerMl : null;
    // count
    const g = coeffs?.gramsPerCountUnit?.[unit];
    return g ? q * g : null;
  };
  const fromGrams = (g: number, unit: string, dim: Dimension): number | null => {
    if (dim === 'mass') return g / MASS_TO_G[unit];
    if (dim === 'volume') return coeffs?.gramsPerMl ? g / coeffs.gramsPerMl / VOLUME_TO_ML[unit] : null;
    const per = coeffs?.gramsPerCountUnit?.[unit];
    return per ? g / per : null;
  };

  const grams = toGrams(qty, f, df);
  if (grams === null) return null;
  return fromGrams(grams, t, dt);
}

export type QtyVerdict =
  | { kind: 'enough' }
  | { kind: 'short'; by: number; unit: string }
  | { kind: 'unknown' }; // 양 미입력·변환 불가 → 판단 생략

const EPS = 1e-6;

/**
 * 필요량(need) vs 보유량(have) 충족 비교.
 * 둘 다 양>0 + 변환 가능해야 판정. 아니면 unknown(degrade).
 */
export function compareQuantity(
  needQty: number | null | undefined,
  needUnit: string,
  haveQty: number | null | undefined,
  haveUnit: string,
  coeffs?: UnitCoeffs,
): QtyVerdict {
  if (needQty == null || needQty <= 0) return { kind: 'unknown' };
  if (haveQty == null || haveQty <= 0) return { kind: 'unknown' };

  const haveInNeed = convertAmount(haveQty, haveUnit, needUnit, coeffs);
  if (haveInNeed === null) return { kind: 'unknown' };

  if (haveInNeed >= needQty - EPS) return { kind: 'enough' };
  // 소수 2자리 반올림 (표시용)
  const by = Math.round((needQty - haveInNeed) * 100) / 100;
  return { kind: 'short', by, unit: needUnit };
}

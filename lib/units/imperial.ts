/**
 * 미터법·한국 계량 단위 → 야드파운드 표시 변환 (순수 함수 — lib/hooks/useUnitConversion 이 씀).
 *
 * 2026-10-19 감사 ICL-27: 예전 표는 cup·tbsp·oz·lb 를 오히려 미터법으로 바꿨고('Imperial' 을 고르면 "2 oz" 가 "57 g"),
 * 한국 '컵'(200ml)을 미국 컵(236.588ml)으로 취급해 18% 과대 표시했다. 이제 방향은 metric → imperial 한쪽뿐이고,
 * 이미 야드파운드인 단위는 그대로 둔다. 한국 계량 상수(컵 200ml·큰술 15ml·작은술 5ml)는 lib/units/quantity.ts 와 같다.
 */

const ML_PER_US_CUP = 236.588
const ML_PER_US_TBSP = 14.787
const ML_PER_US_TSP = 4.929
const G_PER_OZ = 28.3495
const G_PER_LB = 453.592

/** 한국 계량 기준 부피(ml). 'L'·'리터' 포함. */
const VOLUME_ML: Record<string, number> = {
  ml: 1, '밀리리터': 1, l: 1000, '리터': 1000, '컵': 200, '큰술': 15, '작은술': 5,
}
const MASS_G: Record<string, number> = { g: 1, '그램': 1, kg: 1000, '킬로그램': 1000 }

function format(v: number): string {
  if (v < 0.01) return v.toString()
  if (v < 1) return v.toFixed(2)
  if (v < 10) return v.toFixed(1)
  return Math.round(v).toString()
}

export function toImperial(quantity: string, unit: string): { quantity: string; unit: string; isConverted: boolean } {
  const n = parseFloat(quantity)
  const key = unit.trim().toLowerCase()
  if (isNaN(n)) return { quantity, unit, isConverted: false }

  const ml = VOLUME_ML[key]
  if (ml !== undefined) {
    const total = n * ml
    // 60ml(¼컵) 미만은 숟가락 단위가 읽기 쉽다
    if (total >= ML_PER_US_CUP / 4) return { quantity: format(total / ML_PER_US_CUP), unit: 'cup', isConverted: true }
    if (total >= ML_PER_US_TBSP) return { quantity: format(total / ML_PER_US_TBSP), unit: 'tbsp', isConverted: true }
    return { quantity: format(total / ML_PER_US_TSP), unit: 'tsp', isConverted: true }
  }
  const g = MASS_G[key]
  if (g !== undefined) {
    const total = n * g
    if (total >= G_PER_LB) return { quantity: format(total / G_PER_LB), unit: 'lb', isConverted: true }
    return { quantity: format(total / G_PER_OZ), unit: 'oz', isConverted: true }
  }
  // 이미 야드파운드(cup·tbsp·tsp·oz·lb)이거나 개수 단위 — 그대로
  return { quantity, unit, isConverted: false }
}

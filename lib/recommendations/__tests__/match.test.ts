import { describe, it, expect } from 'vitest'
import {
  isIngredientMatch,
  isFundamental,
  isReady,
  isAlmost,
  isAny,
} from '@/lib/recommendations/match'

// ── BASELINE ──────────────────────────────────────────────────────────────
// 이 파일은 god-file(route.ts)에서 추출한 순수 매칭 로직의 회귀 가드.
// STEP 1(refactor): 추출 직후 = "수정 전 동작" 그대로 통과해야 함(아래 BUG 포함).
//   고추장↔고추 오매칭, isAlmost 절대기준이 *의도된 baseline*으로 기록됨.
// STEP 2(fix)에서 BUG 케이스 기대값을 정답으로 뒤집고 isAlmost 시그니처를 갱신.

describe('isIngredientMatch — baseline(수정 전)', () => {
  it('정확 일치', () => {
    expect(isIngredientMatch('간장', '간장')).toBe(true)
  })

  it('동의어 매칭', () => {
    expect(isIngredientMatch('설탕', '올리고당')).toBe(true) // synonym
    expect(isIngredientMatch('다진마늘', '마늘')).toBe(true) // synonym 목록에 마늘 포함
    expect(isIngredientMatch('대파', '파')).toBe(true) // synonym
  })

  it('🐛 BUG(baseline): prefix 규칙이 고추장↔고추를 오매칭한다', () => {
    // '고추' === '고추장'.slice(0,2) → true. 장류 vs 생고추인데도 매칭됨.
    expect(isIngredientMatch('고추장', '고추')).toBe(true)
  })

  it('무관 재료는 매칭 안 됨', () => {
    expect(isIngredientMatch('우무묵', '설탕')).toBe(false)
    expect(isIngredientMatch('오미자', '간장')).toBe(false)
    expect(isIngredientMatch('단감', '고추장')).toBe(false)
  })
})

describe('isFundamental', () => {
  it('물 계열은 보편 재료', () => {
    expect(isFundamental('물')).toBe(true)
    expect(isFundamental('생수')).toBe(true)
    expect(isFundamental('water')).toBe(true)
    expect(isFundamental(' 물 ')).toBe(true)
  })
  it('양념은 보편 재료 아님(C 미적용)', () => {
    expect(isFundamental('설탕')).toBe(false)
    expect(isFundamental('간장')).toBe(false)
    expect(isFundamental('고추장')).toBe(false)
  })
})

describe('mode 술어 — baseline(수정 전)', () => {
  it('isReady: 전부 보유해야 ready', () => {
    expect(isReady({ matchedCount: 3, totalIngredients: 3 })).toBe(true)
    expect(isReady({ matchedCount: 2, totalIngredients: 3 })).toBe(false)
    expect(isReady({ matchedCount: 0, totalIngredients: 0 })).toBe(false)
  })

  it('🐛 BUG(baseline): isAlmost가 절대기준(부족 1~2개)이라 33%도 통과', () => {
    expect(isAlmost({ missingCount: 1 })).toBe(true)
    expect(isAlmost({ missingCount: 2 })).toBe(true) // 단감피클 1/3(33%)도 여기 걸림
    expect(isAlmost({ missingCount: 0 })).toBe(false)
    expect(isAlmost({ missingCount: 3 })).toBe(false)
  })

  it('isAny: matchRate > 0', () => {
    expect(isAny({ matchRate: 1 })).toBe(true)
    expect(isAny({ matchRate: 0 })).toBe(false)
  })
})

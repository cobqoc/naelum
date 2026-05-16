import { describe, it, expect } from 'vitest'
import {
  isIngredientMatch,
  isFundamental,
  isReady,
  isAlmost,
  isAny,
} from '@/lib/recommendations/match'

// route.ts(god-file)에서 추출한 순수 매칭 로직의 회귀 가드.
// 2026-05-17 fix: prefix 부분일치 제거(A) + isAlmost 상대기준(B).
// 실제 사용자 제보(보유=설탕/고추장/간장)로 드러난 3개 오분류를 결정적으로 차단.

describe('isIngredientMatch — exact / synonym', () => {
  it('정확 일치', () => {
    expect(isIngredientMatch('간장', '간장')).toBe(true)
  })

  it('정당한 부분일치는 동의어 테이블이 커버 (prefix 규칙 없이도)', () => {
    expect(isIngredientMatch('다진마늘', '마늘')).toBe(true) // synonym
    expect(isIngredientMatch('대파', '파')).toBe(true) // synonym
    expect(isIngredientMatch('닭고기', '닭')).toBe(true) // synonym 목록에 '닭'
    expect(isIngredientMatch('설탕', '올리고당')).toBe(true) // synonym (C 미적용)
  })
})

describe('isIngredientMatch — prefix 오매칭 제거(A)', () => {
  it('고추장 ≠ 고추 — 장류 vs 생고추 (사용자 제보 핵심 버그)', () => {
    expect(isIngredientMatch('고추장', '고추')).toBe(false)
  })

  it('같은 패턴의 광범위 오매칭도 함께 제거', () => {
    expect(isIngredientMatch('간장', '간장게장')).toBe(false)
    expect(isIngredientMatch('김', '김치')).toBe(false)
    expect(isIngredientMatch('사과', '사과식초')).toBe(false)
  })

  it('애초에 무관한 재료는 여전히 매칭 안 됨', () => {
    expect(isIngredientMatch('우무묵', '설탕')).toBe(false)
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
  it('양념은 보편 재료 아님 (C 미적용)', () => {
    expect(isFundamental('설탕')).toBe(false)
    expect(isFundamental('간장')).toBe(false)
    expect(isFundamental('고추장')).toBe(false)
  })
})

describe('mode 술어', () => {
  it('isReady: 전부 보유해야 ready', () => {
    expect(isReady({ matchedCount: 3, totalIngredients: 3 })).toBe(true)
    expect(isReady({ matchedCount: 2, totalIngredients: 3 })).toBe(false)
    expect(isReady({ matchedCount: 0, totalIngredients: 0 })).toBe(false)
  })

  it('isAlmost: 부족 1~2개 AND matchRate ≥ 60% (상대기준 B)', () => {
    // 정상 "거의" — 대부분 보유, 1~2개만 더
    expect(isAlmost({ missingCount: 1, matchRate: 67 })).toBe(true) // 2/3 보유
    expect(isAlmost({ missingCount: 2, matchRate: 60 })).toBe(true) // 3/5, 경계
    expect(isAlmost({ missingCount: 2, matchRate: 75 })).toBe(true) // 6/8

    // 사용자 제보 오분류 — 이제 '거의'에서 제외
    expect(isAlmost({ missingCount: 2, matchRate: 33 })).toBe(false) // 단감피클·우무오미자 1/3
    expect(isAlmost({ missingCount: 2, matchRate: 50 })).toBe(false) // 고추장아찌 2/4 (A 적용 후)

    // 경계/극단
    expect(isAlmost({ missingCount: 0, matchRate: 100 })).toBe(false) // 부족 0 → ready 영역
    expect(isAlmost({ missingCount: 3, matchRate: 80 })).toBe(false) // 너무 많이 부족
  })

  it('isAny: matchRate > 0', () => {
    expect(isAny({ matchRate: 1 })).toBe(true)
    expect(isAny({ matchRate: 0 })).toBe(false)
  })
})

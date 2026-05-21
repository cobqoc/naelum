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

describe('isIngredientMatch — 동의어 양방향 (2026-05-19)', () => {
  it('달걀 ↔ 계란 양방향', () => {
    expect(isIngredientMatch('달걀', '계란')).toBe(true)
    expect(isIngredientMatch('계란', '달걀')).toBe(true)
  })

  it('달걀노른자 ↔ 계란노른자 양방향', () => {
    expect(isIngredientMatch('달걀노른자', '계란노른자')).toBe(true)
    expect(isIngredientMatch('계란노른자', '달걀노른자')).toBe(true)
  })

  it('달걀흰자 ↔ 계란흰자 양방향', () => {
    expect(isIngredientMatch('달걀흰자', '계란흰자')).toBe(true)
    expect(isIngredientMatch('계란흰자', '달걀흰자')).toBe(true)
  })

  it('참깨 → 깨 (역방향, 이전엔 미스매칭)', () => {
    expect(isIngredientMatch('참깨', '깨')).toBe(true)
    expect(isIngredientMatch('깨', '참깨')).toBe(true)
  })
})

describe('isIngredientMatch — exact / synonym', () => {
  it('정확 일치', () => {
    expect(isIngredientMatch('간장', '간장')).toBe(true)
  })

  it('정당한 부분일치는 동의어 테이블이 커버 (prefix 규칙 없이도)', () => {
    expect(isIngredientMatch('다진마늘', '마늘')).toBe(true) // 정규화: 다진마늘→마늘
    expect(isIngredientMatch('대파', '파')).toBe(true) // 정규화: 파→대파
    expect(isIngredientMatch('닭고기', '닭')).toBe(true) // synonym 목록에 '닭'
    expect(isIngredientMatch('설탕', '올리고당')).toBe(true) // synonym (C 미적용)
  })
})

describe('isIngredientMatch — 정규화 기반 매칭 (2026-05-18)', () => {
  it('다진X ↔ X 양방향', () => {
    expect(isIngredientMatch('다진마늘', '마늘')).toBe(true)
    expect(isIngredientMatch('마늘', '다진마늘')).toBe(true)
    expect(isIngredientMatch('다진생강', '생강')).toBe(true)
  })

  it('다진파 ↔ 대파 (접두사 제거 + 별칭)', () => {
    expect(isIngredientMatch('다진파', '대파')).toBe(true)
    expect(isIngredientMatch('대파', '다진파')).toBe(true)
  })

  it('채썬/볶은/삶은 등 조리법 접두사', () => {
    expect(isIngredientMatch('채썬양파', '양파')).toBe(true)
    expect(isIngredientMatch('볶은 당근', '당근')).toBe(true)
    expect(isIngredientMatch('삶은계란', '계란')).toBe(true)
  })

  it('오매칭 방지: 정규화 후에도 다른 재료는 여전히 불일치', () => {
    expect(isIngredientMatch('간장', '고추장')).toBe(false)
    expect(isIngredientMatch('쪽파', '대파')).toBe(false) // 쪽파 ≠ 대파 (동의어 테이블 수정)
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

  it('isAlmost: 부족 1~3개 — 재료 N개만 더 있으면 (% 게이트 없음, 2026-05-21)', () => {
    // 재료 1~3개만 더 있으면 만들 수 있음 — matchRate 와 무관
    expect(isAlmost({ missingCount: 1 })).toBe(true)
    expect(isAlmost({ missingCount: 2 })).toBe(true)
    expect(isAlmost({ missingCount: 3 })).toBe(true) // 경계

    // 부족 0 → ready 영역 / 부족 4개↑ → "재료가 더 필요한 레시피" 영역
    expect(isAlmost({ missingCount: 0 })).toBe(false)
    expect(isAlmost({ missingCount: 4 })).toBe(false)
  })

  it('isAny: matchRate > 0', () => {
    expect(isAny({ matchRate: 1 })).toBe(true)
    expect(isAny({ matchRate: 0 })).toBe(false)
  })
})

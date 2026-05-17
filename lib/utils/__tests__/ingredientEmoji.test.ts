import { describe, it, expect } from 'vitest'
import { getIngredientEmoji, getPreciseIngredientEmoji } from '@/lib/utils/ingredientEmoji'

// 칩 fallback 게이트 회귀 가드.
// getIngredientEmoji 는 기존 동작 byte-identical(refactor) — getPreciseIngredientEmoji
// 에 위임만 추가. precise 함수는 카테고리 폴백 자리에서 null 을 반환해야 함.

describe('getIngredientEmoji — 기존 동작 보존(refactor)', () => {
  it('정확 매핑(EXACT_MAP)은 그대로', () => {
    expect(getIngredientEmoji('양파', 'veggie')).toBe('🧅')
    expect(getIngredientEmoji('토마토', 'veggie')).toBe('🍅')
    expect(getIngredientEmoji('당근', 'veggie')).toBe('🥕')
  })

  it('정확/키워드 매핑 없으면 카테고리 폴백 유지', () => {
    // 합성 이름(존재하지 않는 재료) — EXACT/KEYWORD 미스 → 카테고리 이모지
    expect(getIngredientEmoji('ZZZ존재하지않는재료', 'veggie')).toBe('🥬')
    expect(getIngredientEmoji('ZZZ존재하지않는재료', 'meat')).toBe('🥩')
    // 미지/빈 카테고리 → 📦
    expect(getIngredientEmoji('ZZZ존재하지않는재료', 'nope')).toBe('📦')
    expect(getIngredientEmoji('ZZZ존재하지않는재료', '')).toBe('📦')
  })
})

describe('getPreciseIngredientEmoji — 칩 게이트', () => {
  it('정확 매핑이면 그 이모지(non-null)', () => {
    expect(getPreciseIngredientEmoji('양파')).toBe('🧅')
    expect(getPreciseIngredientEmoji('토마토')).toBe('🍅')
  })

  it('카테고리 폴백 자리에서는 null (칩에서 숨김)', () => {
    expect(getPreciseIngredientEmoji('ZZZ존재하지않는재료')).toBeNull()
  })

  it('2026-05-17 보강분 — 흔한 재료 precise 매핑 + 변이형 커버', () => {
    expect(getPreciseIngredientEmoji('고춧가루')).toBe('🌶️')
    expect(getPreciseIngredientEmoji('굵은 고춧가루')).toBe('🌶️')
    expect(getPreciseIngredientEmoji('단호박')).toBe('🎃')
    expect(getPreciseIngredientEmoji('주키니호박')).toBe('🎃')
    expect(getPreciseIngredientEmoji('어묵')).toBe('🍢')
    expect(getPreciseIngredientEmoji('떡국떡')).toBe('🍡')
    expect(getPreciseIngredientEmoji('메밀')).toBe('🌾')
    expect(getPreciseIngredientEmoji('유자')).toBe('🍋')
    // 보강분이 기존 더 구체적인 매핑을 가리지 않음(끝=최저 우선순위)
    expect(getPreciseIngredientEmoji('애호박')).toBe('🥒') // EXACT 우선
    expect(getPreciseIngredientEmoji('떡갈비')).toBe('🍖') // '갈비' 우선
  })

  it('getIngredientEmoji = precise ?? 카테고리 폴백 (위임 일관성)', () => {
    // precise non-null → 두 함수 동일
    expect(getIngredientEmoji('양파', 'veggie')).toBe(getPreciseIngredientEmoji('양파'))
    // precise null → getIngredientEmoji 는 카테고리로 채움
    expect(getPreciseIngredientEmoji('ZZZ존재하지않는재료')).toBeNull()
    expect(getIngredientEmoji('ZZZ존재하지않는재료', 'fruit')).toBe('🍎')
  })
})

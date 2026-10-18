import { describe, it, expect } from 'vitest'
import { validateRecipeChildren, validateTipChildren } from '../recipeChildRows'

describe('validateRecipeChildren (API1-06)', () => {
  it('정상 입력 · 생략 필드는 통과', () => {
    expect(validateRecipeChildren({})).toBeNull()
    expect(validateRecipeChildren({
      ingredients: [{ ingredient_name: '양파', quantity: 0.5, unit: '개' }, { ingredient_name: '소금', quantity: null, unit: '' }],
      steps: [{ instruction: '썬다', title: null, timer_minutes: 5 }],
      tags: ['한식'],
    })).toBeNull()
  })

  it('DB 제약을 넘는 값은 쓰기 전에 거부', () => {
    expect(validateRecipeChildren({ tags: ['가'.repeat(51)] })).toMatch(/50자/)
    expect(validateRecipeChildren({ ingredients: [{ ingredient_name: 'a'.repeat(101) }] })).toMatch(/100자/)
    expect(validateRecipeChildren({ ingredients: [{ ingredient_name: '물', unit: 'u'.repeat(51) }] })).toMatch(/50자/)
    expect(validateRecipeChildren({ ingredients: [{ ingredient_name: '물', quantity: 1e9 }] })).toMatch(/수량/)
    expect(validateRecipeChildren({ steps: [{ instruction: 'x', title: 't'.repeat(201) }] })).toMatch(/200자/)
    expect(validateRecipeChildren({ steps: [{ instruction: 'x', timer_minutes: 1.5 }] })).toMatch(/타이머/)
  })

  it('형식 오류', () => {
    expect(validateRecipeChildren({ ingredients: 'x' })).not.toBeNull()
    expect(validateRecipeChildren({ ingredients: [{ ingredient_name: '  ' }] })).not.toBeNull()
    expect(validateRecipeChildren({ steps: [{}] })).not.toBeNull()
    expect(validateRecipeChildren({ tags: [1] })).not.toBeNull()
  })
})

describe('validateTipChildren', () => {
  it('팁 태그는 100자까지', () => {
    expect(validateTipChildren({ tags: ['a'.repeat(100)] })).toBeNull()
    expect(validateTipChildren({ tags: ['a'.repeat(101)] })).toMatch(/100자/)
    expect(validateTipChildren({ steps: [{ instruction: 'x' }] })).toBeNull()
  })
})

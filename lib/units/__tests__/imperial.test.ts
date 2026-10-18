import { describe, it, expect } from 'vitest'
import { toImperial } from '../imperial'

describe('toImperial (ICL-27)', () => {
  it('미터법 → 야드파운드', () => {
    expect(toImperial('500', 'g')).toEqual({ quantity: '1.1', unit: 'lb', isConverted: true })
    expect(toImperial('100', 'g')).toEqual({ quantity: '3.5', unit: 'oz', isConverted: true })
    expect(toImperial('1', 'L')).toEqual({ quantity: '4.2', unit: 'cup', isConverted: true })
  })
  it("한국 '컵'은 200ml 기준", () => {
    expect(toImperial('1', '컵')).toEqual({ quantity: '0.85', unit: 'cup', isConverted: true })
    expect(toImperial('1', '큰술').unit).toBe('tbsp')
    expect(toImperial('1', '작은술').unit).toBe('tsp')
  })
  it('이미 야드파운드·개수 단위·비수치는 그대로', () => {
    expect(toImperial('2', 'oz')).toEqual({ quantity: '2', unit: 'oz', isConverted: false })
    expect(toImperial('1', 'cup').isConverted).toBe(false)
    expect(toImperial('2', '개').isConverted).toBe(false)
    expect(toImperial('약간', 'g').isConverted).toBe(false)
  })
})

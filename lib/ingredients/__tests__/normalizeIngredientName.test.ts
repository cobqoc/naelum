import { describe, it, expect } from 'vitest'
import { normalizeIngredientName } from '@/lib/ingredients/normalizeIngredientName'

describe('normalizeIngredientName', () => {
  describe('조리법 접두사 제거', () => {
    it('다진X → X (파는 별칭까지 적용 → 대파)', () => {
      expect(normalizeIngredientName('다진마늘')).toBe('마늘')
      expect(normalizeIngredientName('다진파')).toBe('대파') // 접두사 제거 후 파→대파 별칭
      expect(normalizeIngredientName('다진생강')).toBe('생강')
      expect(normalizeIngredientName('다진 마늘')).toBe('마늘')
    })

    it('채썬X → X', () => {
      expect(normalizeIngredientName('채썬양파')).toBe('양파')
      expect(normalizeIngredientName('채썬 양파')).toBe('양파')
    })

    it('볶은/구운/삶은/데친 → 원재료', () => {
      expect(normalizeIngredientName('볶은 당근')).toBe('당근')
      expect(normalizeIngredientName('구운마늘')).toBe('마늘')
      expect(normalizeIngredientName('삶은계란')).toBe('계란')
      expect(normalizeIngredientName('데친시금치')).toBe('시금치')
    })

    it('냉동/말린/으깬 → 원재료', () => {
      expect(normalizeIngredientName('냉동새우')).toBe('새우')
      expect(normalizeIngredientName('냉동 새우')).toBe('새우')
      expect(normalizeIngredientName('말린표고')).toBe('표고')
      expect(normalizeIngredientName('으깬감자')).toBe('감자')
    })

    it('잘게 썬 → 원재료', () => {
      expect(normalizeIngredientName('잘게 썬 양파')).toBe('양파')
    })
  })

  describe('별칭 통일', () => {
    it('파 → 대파', () => {
      expect(normalizeIngredientName('파')).toBe('대파')
    })

    it('다진파 → 대파 (접두사 제거 후 별칭)', () => {
      expect(normalizeIngredientName('다진파')).toBe('대파')
    })

    it('무우 → 무', () => {
      expect(normalizeIngredientName('무우')).toBe('무')
    })
  })

  describe('안전 보호 — 변환되면 안 되는 케이스', () => {
    it('간장: "간" 접두사 제거 시 "장"(1자) → 보호됨', () => {
      expect(normalizeIngredientName('간장')).toBe('간장')
    })

    it('고춧가루/고추가루: 가루 접미사 제거 안 함', () => {
      expect(normalizeIngredientName('고춧가루')).toBe('고춧가루')
      expect(normalizeIngredientName('고추가루')).toBe('고추가루')
    })

    it('쪽파: 대파로 변환되지 않음 (다른 재료)', () => {
      expect(normalizeIngredientName('쪽파')).toBe('쪽파')
    })

    it('이미 정규화된 이름은 그대로', () => {
      expect(normalizeIngredientName('마늘')).toBe('마늘')
      expect(normalizeIngredientName('대파')).toBe('대파')
      expect(normalizeIngredientName('양파')).toBe('양파')
      expect(normalizeIngredientName('소고기')).toBe('소고기')
    })
  })
})

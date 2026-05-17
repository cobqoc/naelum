import { describe, it, expect } from 'vitest'
import { detectKoreanAndTranslate, computeAutoTags, type AutoTagInput } from '@/lib/recipes/autoTags'

// god-file(NewRecipePage) useEffect 인라인이던 순수 로직의 회귀 가드.
// page.tsx 에서 byte-identical 추출 — 현재 동작을 결정적으로 핀.
// 통합(체크박스→effect→TagsField 칩)은 e2e/recipe-creation.spec.ts
// "UI 회귀(식단옵션)"·"(Section1)" 가 별도 커버.

const base: AutoTagInput = {
  cuisineType: '', customCuisineType: '', dishType: '', customDishType: '',
  isVegetarian: false, isVegan: false, isGlutenFree: false,
}

describe('detectKoreanAndTranslate', () => {
  it('영어만 — trim 후 그대로(korean===english)', () => {
    expect(detectKoreanAndTranslate('fusion')).toEqual({ korean: 'fusion', english: 'fusion' })
    expect(detectKoreanAndTranslate('  fusion  ')).toEqual({ korean: 'fusion', english: 'fusion' })
  })

  it('한글+공백 — english 는 공백 제거(korean!==english)', () => {
    expect(detectKoreanAndTranslate('한 식')).toEqual({ korean: '한 식', english: '한식' })
  })

  it('한글 공백없음 — korean===english (호출측서 english 미추가)', () => {
    expect(detectKoreanAndTranslate('분식')).toEqual({ korean: '분식', english: '분식' })
  })

  it('혼합 — 한글 포함이면 로마자화 경로(공백제거·첫글자 upper)', () => {
    expect(detectKoreanAndTranslate('K푸드')).toEqual({ korean: 'K푸드', english: 'K푸드' })
    expect(detectKoreanAndTranslate('맛 nice')).toEqual({ korean: '맛 nice', english: '맛nice' })
  })
})

describe('computeAutoTags', () => {
  it('빈 입력 → []', () => {
    expect(computeAutoTags(base)).toEqual([])
  })

  it('표준 요리 종류 → CUISINE_TYPE_TAGS', () => {
    expect(computeAutoTags({ ...base, cuisineType: 'korean' })).toEqual(['한식', 'KoreanFood'])
  })

  it("커스텀 요리 종류 'other' — korean!==english 면 둘 다, 같으면 korean 만", () => {
    expect(computeAutoTags({ ...base, cuisineType: 'other', customCuisineType: '한 식' }))
      .toEqual(['한 식', '한식'])
    expect(computeAutoTags({ ...base, cuisineType: 'other', customCuisineType: '분식' }))
      .toEqual(['분식'])
    // 'other' 인데 커스텀 공백뿐 → 미추가
    expect(computeAutoTags({ ...base, cuisineType: 'other', customCuisineType: '   ' }))
      .toEqual([])
  })

  it('식단 옵션 → DIETARY_TAGS (선택된 것만, 순서 보존)', () => {
    expect(computeAutoTags({ ...base, isVegetarian: true })).toEqual(['채식', 'Vegetarian'])
    expect(computeAutoTags({ ...base, isVegetarian: true, isVegan: true, isGlutenFree: true }))
      .toEqual(['채식', 'Vegetarian', '비건', 'Vegan', '글루텐프리', 'GlutenFree'])
  })

  it('복합 — 순서: 요리종류 → 요리유형 → 식단', () => {
    expect(computeAutoTags({ ...base, cuisineType: 'korean', isVegan: true }))
      .toEqual(['한식', 'KoreanFood', '비건', 'Vegan'])
  })
})

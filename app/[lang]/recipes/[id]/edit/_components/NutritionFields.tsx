import type { TranslationKeys } from '@/lib/i18n/translations'
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper'

const NUTRITION_WRAPPER = '!rounded-xl !px-4 !py-3'

/**
 * 레시피 *수정* 폼 영양 정보 블록 표현 컴포넌트.
 *
 * god-file 분해 Phase 2. ⚠️ recipes/new 의 NutritionFields 와 검증 로직이 다르다:
 * new 는 상한(칼로리<5000·영양소<500)이 있고 edit 는 없다. new 것을 재사용하면
 * edit 동작이 바뀌므로(행위 변경) edit *현재* validateNutritionInput 을 그대로
 * 동봉해 edit 전용으로 추출한다. 두 폼 통합은 별도 제품 결정(이번 분해 범위 밖).
 *
 * 규약([[TagsField]] 동일): show·6필드 상태는 page 소유, 자식은 값+setter 만.
 * JSX·className 원본과 byte-identical → 행위 변경 0.
 */

interface NutritionFieldsProps {
  t: TranslationKeys
  tf: TranslationKeys['recipeForm']
  show: boolean
  onToggleShow: () => void
  calories: string
  setCalories: (v: string) => void
  protein: string
  setProtein: (v: string) => void
  carbs: string
  setCarbs: (v: string) => void
  fat: string
  setFat: (v: string) => void
  fiber: string
  setFiber: (v: string) => void
  sodium: string
  setSodium: (v: string) => void
}

// 영양 정보 검증 함수 (원본 edit/page.tsx 와 로직 동일 — 빈 값 허용, 음수/NaN
// 거부, int=정수 여부만. new 와 달리 상한 없음 — edit 행위 보존).
function validateNutritionInput(value: string, type: 'int' | 'decimal'): boolean {
  if (value === '') return true // 빈 값 허용 (선택사항)

  const num = parseFloat(value)
  if (isNaN(num) || num < 0) return false

  if (type === 'int') {
    return Number.isInteger(num)
  }

  return true
}

export default function NutritionFields({
  t,
  tf,
  show,
  onToggleShow,
  calories,
  setCalories,
  protein,
  setProtein,
  carbs,
  setCarbs,
  fat,
  setFat,
  fiber,
  setFiber,
  sodium,
  setSodium,
}: NutritionFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-secondary">
          {tf.nutritionLabel} <span className="text-text-muted text-xs">{tf.nutritionHint}</span>
        </label>
        <button
          type="button"
          onClick={onToggleShow}
          className="text-sm text-accent-warm hover:text-accent-hover transition-colors flex items-center gap-2"
        >
          {show ? tf.nutritionHide : tf.nutritionShow}
          <svg className={`w-4 h-4 transition-transform ${show ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {show && (
        <div className="rounded-xl bg-background-secondary p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 칼로리 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                {t.nutrition.calories} <span className="text-text-muted text-xs">(kcal)</span>
              </label>
              <InputBoxWrapper className={NUTRITION_WRAPPER}>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => {
                    if (validateNutritionInput(e.target.value, 'int')) {
                      setCalories(e.target.value)
                    }
                  }}
                  min="0"
                  step="1"
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                  placeholder={`${t.common.example} 350`}
                />
              </InputBoxWrapper>
            </div>

            {/* 단백질 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                {t.nutrition.protein} <span className="text-text-muted text-xs">(g)</span>
              </label>
              <InputBoxWrapper className={NUTRITION_WRAPPER}>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => {
                    if (validateNutritionInput(e.target.value, 'decimal')) {
                      setProtein(e.target.value)
                    }
                  }}
                  min="0"
                  step="0.1"
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                  placeholder={`${t.common.example} 25.5`}
                />
              </InputBoxWrapper>
            </div>

            {/* 탄수화물 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                {t.nutrition.carbs} <span className="text-text-muted text-xs">(g)</span>
              </label>
              <InputBoxWrapper className={NUTRITION_WRAPPER}>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => {
                    if (validateNutritionInput(e.target.value, 'decimal')) {
                      setCarbs(e.target.value)
                    }
                  }}
                  min="0"
                  step="0.1"
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                  placeholder={`${t.common.example} 45.0`}
                />
              </InputBoxWrapper>
            </div>

            {/* 지방 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                {t.nutrition.fat} <span className="text-text-muted text-xs">(g)</span>
              </label>
              <InputBoxWrapper className={NUTRITION_WRAPPER}>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => {
                    if (validateNutritionInput(e.target.value, 'decimal')) {
                      setFat(e.target.value)
                    }
                  }}
                  min="0"
                  step="0.1"
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                  placeholder={`${t.common.example} 12.5`}
                />
              </InputBoxWrapper>
            </div>

            {/* 식이섬유 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                {t.nutrition.fiber} <span className="text-text-muted text-xs">(g)</span>
              </label>
              <InputBoxWrapper className={NUTRITION_WRAPPER}>
                <input
                  type="number"
                  value={fiber}
                  onChange={(e) => {
                    if (validateNutritionInput(e.target.value, 'decimal')) {
                      setFiber(e.target.value)
                    }
                  }}
                  min="0"
                  step="0.1"
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                  placeholder={`${t.common.example} 3.5`}
                />
              </InputBoxWrapper>
            </div>

            {/* 나트륨 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                {t.nutrition.sodium} <span className="text-text-muted text-xs">(mg)</span>
              </label>
              <InputBoxWrapper className={NUTRITION_WRAPPER}>
                <input
                  type="number"
                  value={sodium}
                  onChange={(e) => {
                    if (validateNutritionInput(e.target.value, 'int')) {
                      setSodium(e.target.value)
                    }
                  }}
                  min="0"
                  step="1"
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                  placeholder={`${t.common.example} 800`}
                />
              </InputBoxWrapper>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

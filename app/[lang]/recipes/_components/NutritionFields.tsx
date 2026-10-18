import type { TranslationKeys } from '@/lib/i18n/translations';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import { validateNutritionInput, type NutritionLimits } from '@/lib/recipes/nutritionInput';

const NUTRITION_WRAPPER = '!rounded-xl !px-4 !py-3';

/**
 * 레시피 작성·수정 폼 공용 영양 정보 입력 블록 (presentational).
 *
 * 2026-10-04 [PHR-D1 (b)-2] new/edit 두 벌(JSX 는 세미콜론 외 동일)을 한 벌로. 유일한 차이인 검증 상한은
 * `limits` prop 으로 보존 — new: NEW_RECIPE_NUTRITION_LIMITS(5000/500), edit: 생략(상한 없음). 검증 함수는
 * lib/recipes/nutritionInput 으로 이동(옛 두 함수와 전 입력 동일 — vitest).
 *
 * god-file(NewRecipePage) 분해의 두 번째 down-payment — [[TagsField]] 규약 동일:
 *  1. 상태(showNutrition·6필드)는 부모(page.tsx)가 소유, 자식은 값+setter 만 받음
 *  2. JSX 는 원본과 byte-identical (마크업·className·핸들러 시그니처 동일) → 행위 변경 0
 *  3. 검증: npm run build(strict props) + e2e/recipe-creation.spec.ts 회귀
 *
 * validateNutritionInput 은 이 블록에서만 쓰이는 순수 함수라 응집상 함께 이동했다
 * (부모에서 다른 사용처 없음 — 이동해도 행위 동일, 부모 표면만 줄어듦).
 */

interface NutritionFieldsProps {
  t: TranslationKeys;
  tf: TranslationKeys['recipeForm'];
  show: boolean;
  onToggleShow: () => void;
  calories: string;
  setCalories: (v: string) => void;
  protein: string;
  setProtein: (v: string) => void;
  carbs: string;
  setCarbs: (v: string) => void;
  fat: string;
  setFat: (v: string) => void;
  fiber: string;
  setFiber: (v: string) => void;
  sodium: string;
  setSodium: (v: string) => void;
  /** 입력 상한 — new 만 지정({ int: 5000, decimal: 500 }), edit 는 생략(상한 없음) */
  limits?: NutritionLimits;
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
  limits,
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
                    if (validateNutritionInput(e.target.value, 'int', limits)) {
                      setCalories(e.target.value);
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
                    if (validateNutritionInput(e.target.value, 'decimal', limits)) {
                      setProtein(e.target.value);
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
                    if (validateNutritionInput(e.target.value, 'decimal', limits)) {
                      setCarbs(e.target.value);
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
                    if (validateNutritionInput(e.target.value, 'decimal', limits)) {
                      setFat(e.target.value);
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
                    if (validateNutritionInput(e.target.value, 'decimal', limits)) {
                      setFiber(e.target.value);
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
                    if (validateNutritionInput(e.target.value, 'int', limits)) {
                      setSodium(e.target.value);
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
  );
}

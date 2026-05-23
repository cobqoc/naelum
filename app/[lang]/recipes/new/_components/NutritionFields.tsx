import type { TranslationKeys } from '@/lib/i18n/translations';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';

const NUTRITION_WRAPPER = '!rounded-xl !px-4 !py-3';

/**
 * 레시피 작성 폼의 영양 정보 입력 블록 (presentational).
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
}

// 영양 정보 검증 함수 (원본 page.tsx 와 로직 동일 — 빈 값 허용, 음수/NaN 거부,
// int=칼로리·나트륨 max 5000 / decimal=영양소 max 500g)
function validateNutritionInput(value: string, type: 'int' | 'decimal'): boolean {
  if (value === '') return true; // 빈 값 허용 (선택사항)

  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return false;

  if (type === 'int') {
    return Number.isInteger(num) && num < 5000; // 칼로리 최대 5000
  } else {
    return num < 500; // 영양소 최대 500g
  }
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
                    if (validateNutritionInput(e.target.value, 'decimal')) {
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
                    if (validateNutritionInput(e.target.value, 'decimal')) {
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
                    if (validateNutritionInput(e.target.value, 'decimal')) {
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
                    if (validateNutritionInput(e.target.value, 'decimal')) {
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
                    if (validateNutritionInput(e.target.value, 'int')) {
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

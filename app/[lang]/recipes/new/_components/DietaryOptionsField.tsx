import type { Dispatch, SetStateAction } from 'react';
import type { TranslationKeys } from '@/lib/i18n/translations';
import { DIETARY_DESCRIPTIONS } from '@/lib/constants/recipe';

/**
 * 레시피 작성 폼 — 식단옵션(채식/비건/글루텐프리) 토글 + 툴팁 (presentational).
 *
 * god-file(NewRecipePage) 분해 — [[BasicInfoSection]]·[[RecipeFormFooter]]·
 * [[ThumbnailUploadField]] 규약 동일:
 *  1. 상태(isVegetarian/isVegan/isGlutenFree)·툴팁 state
 *     (hoveredDietaryOption)는 전부 부모(page.tsx) 소유. 이 컴포넌트는
 *     값+setter 콜백만(순수 표현 — ref/async/local state 0).
 *  2. JSX byte-identical(인라인 옵션 배열·마크업·className·툴팁·화살표
 *     SVG·핸들러 시그니처 동일) → 행위 변경 0.
 *  3. ⚠️ 최고 위험 블록: 체크박스(자식) → setter(부모) → 부모
 *     useEffect(autoTags) → setTags → [[TagsField]] 칩. setter 를
 *     부모 useState setter 그대로 전달해 부모 effect 의존성이 그대로
 *     발화하도록 보존. 회귀 가드: e2e/recipe-creation.spec.ts
 *     "UI 회귀(식단옵션)" 가 '채식' 토글 → '#Vegetarian' 칩 노출 검증.
 *  부모는 <section>·h2 유지, 이 컴포넌트는 식단 옵션 div 만 책임.
 */

interface DietaryOptionsFieldProps {
  tf: TranslationKeys['recipeForm'];
  isVegetarian: boolean;
  setIsVegetarian: Dispatch<SetStateAction<boolean>>;
  isVegan: boolean;
  setIsVegan: Dispatch<SetStateAction<boolean>>;
  isGlutenFree: boolean;
  setIsGlutenFree: Dispatch<SetStateAction<boolean>>;
  hoveredDietaryOption: string | null;
  setHoveredDietaryOption: Dispatch<SetStateAction<string | null>>;
}

export default function DietaryOptionsField({
  tf,
  isVegetarian, setIsVegetarian,
  isVegan, setIsVegan,
  isGlutenFree, setIsGlutenFree,
  hoveredDietaryOption, setHoveredDietaryOption,
}: DietaryOptionsFieldProps) {
  return (
          <div className="space-y-4">
            <label className="text-sm font-medium text-text-secondary">{tf.dietaryLabel}</label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: isVegetarian, setter: setIsVegetarian, label: tf.dietaryVegetarian, key: 'vegetarian' },
                { value: isVegan, setter: setIsVegan, label: tf.dietaryVegan, key: 'vegan' },
                { value: isGlutenFree, setter: setIsGlutenFree, label: tf.dietaryGlutenFree, key: 'glutenFree' },
              ].map(opt => (
                <div
                  key={opt.label}
                  className="relative"
                  onMouseEnter={() => setHoveredDietaryOption(opt.key)}
                  onMouseLeave={() => setHoveredDietaryOption(null)}
                  onTouchStart={() => setHoveredDietaryOption(opt.key)}
                  onTouchEnd={() => setTimeout(() => setHoveredDietaryOption(null), 2000)}
                >
                  <button
                    type="button"
                    onClick={() => opt.setter(!opt.value)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      opt.value
                        ? 'bg-accent-warm text-background-primary'
                        : 'bg-background-secondary text-text-muted hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>

                  {/* 툴팁 */}
                  {hoveredDietaryOption === opt.key && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-background-tertiary text-text-primary text-xs rounded-lg shadow-lg whitespace-nowrap z-10 animate-fadeIn">
                      {DIETARY_DESCRIPTIONS[opt.key as keyof typeof DIETARY_DESCRIPTIONS]}
                      {/* 툴팁 화살표 */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-background-tertiary"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
  );
}

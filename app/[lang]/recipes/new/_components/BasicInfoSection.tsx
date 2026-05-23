import type { Dispatch, SetStateAction } from 'react';
import type { TranslationKeys } from '@/lib/i18n/translations';
import { CUISINE_TYPES, DISH_TYPES, DIFFICULTY_LEVELS } from '@/lib/constants/recipe';
import InputBoxWrapper, {
  INPUT_INNER_STYLE,
  INPUT_INNER_COMFORTABLE_CLASS,
  INPUT_VARIANT_COMFORTABLE,
  INPUT_VARIANT_COMFORTABLE_TEXTAREA,
} from '@/components/UI/InputBoxWrapper';

/**
 * 레시피 작성 폼 Section 1(기본 정보) 블록 (presentational).
 *
 * god-file(NewRecipePage) 분해 — [[TagsField]]·[[NutritionFields]]·
 * [[StepsSection]]·[[IngredientsSection]] 규약 동일:
 *  1. 상태(title·description·메타·cuisine/dish)는 전부 부모(page.tsx)가 소유.
 *     이 컴포넌트는 값 + setState 콜백만 받는다(순수 controlled inputs — ref/
 *     async/local state 없음, 가장 결합도 낮은 블록).
 *  2. JSX 는 원본과 byte-identical (마크업·className·핸들러 시그니처 동일)
 *     → 행위 변경 0. setState 콜백은 부모 useState setter 를 그대로 전달.
 *  3. 검증: npm run build(strict props) + e2e/recipe-creation.spec.ts
 *     ("UI 회귀(Section1 기본정보)" 가 description·servings·difficulty·
 *      cuisine 커스텀 토글·dish 조건부 노출을 실제 exercise).
 *  부모는 <section>·h2 를 유지, 이 컴포넌트는 그 안의 필드들만 책임.
 */

interface BasicInfoSectionProps {
  t: TranslationKeys;
  tf: TranslationKeys['recipeForm'];
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  servings: number | '';
  setServings: Dispatch<SetStateAction<number | ''>>;
  prepTime: number | '';
  setPrepTime: Dispatch<SetStateAction<number | ''>>;
  cookTime: number | '';
  setCookTime: Dispatch<SetStateAction<number | ''>>;
  difficulty: string;
  setDifficulty: Dispatch<SetStateAction<string>>;
  cuisineType: string;
  setCuisineType: Dispatch<SetStateAction<string>>;
  customCuisineType: string;
  setCustomCuisineType: Dispatch<SetStateAction<string>>;
  dishType: string;
  setDishType: Dispatch<SetStateAction<string>>;
  customDishType: string;
  setCustomDishType: Dispatch<SetStateAction<string>>;
}

export default function BasicInfoSection({
  t, tf,
  title, setTitle,
  description, setDescription,
  servings, setServings,
  prepTime, setPrepTime,
  cookTime, setCookTime,
  difficulty, setDifficulty,
  cuisineType, setCuisineType,
  customCuisineType, setCustomCuisineType,
  dishType, setDishType,
  customDishType, setCustomDishType,
}: BasicInfoSectionProps) {
  return (
    <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">{tf.title} *</label>
            <InputBoxWrapper className={INPUT_VARIANT_COMFORTABLE}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={INPUT_INNER_COMFORTABLE_CLASS}
                style={INPUT_INNER_STYLE}
                placeholder={tf.titlePlaceholder}
              />
            </InputBoxWrapper>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">{tf.description}</label>
            <InputBoxWrapper className={INPUT_VARIANT_COMFORTABLE_TEXTAREA}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${INPUT_INNER_COMFORTABLE_CLASS} min-h-[80px] resize-none`}
                style={INPUT_INNER_STYLE}
                placeholder={tf.descriptionPlaceholder}
              />
            </InputBoxWrapper>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">{tf.servings} <span className="text-text-muted text-xs">{tf.optional}</span></label>
              <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value ? parseInt(e.target.value) : '')}
                  min="1"
                  placeholder={tf.optionalPlaceholder}
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                />
              </InputBoxWrapper>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">{tf.prepTime} <span className="text-text-muted text-xs">{tf.optional}</span></label>
              <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
                <input
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value) : '')}
                  min="0"
                  placeholder={tf.optionalPlaceholder}
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                />
              </InputBoxWrapper>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">{tf.cookTime} <span className="text-text-muted text-xs">{tf.optional}</span></label>
              <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
                <input
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value ? parseInt(e.target.value) : '')}
                  min="0"
                  placeholder={tf.optionalPlaceholder}
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                />
              </InputBoxWrapper>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">{tf.difficulty} <span className="text-text-muted text-xs">{tf.optional}</span></label>
              <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                >
                  <option value="">{tf.selectNone}</option>
                  {DIFFICULTY_LEVELS.map(d => (
                    <option key={d.value} value={d.value}>{t.difficulty[d.value]}</option>
                  ))}
                </select>
              </InputBoxWrapper>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">{tf.cuisine}</label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_TYPES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCuisineType(c.value)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    cuisineType === c.value
                      ? 'bg-accent-warm text-background-primary'
                      : 'bg-background-secondary text-text-muted hover:bg-white/10'
                  }`}
                >
                  {t.cuisineLabels[c.value as keyof typeof t.cuisineLabels] ?? c.label}
                </button>
              ))}
            </div>
            {/* 기타 선택 시 커스텀 입력 */}
            {cuisineType === 'other' && (
              <InputBoxWrapper className="!rounded-xl !px-4 !py-3">
                <input
                  type="text"
                  value={customCuisineType}
                  onChange={(e) => setCustomCuisineType(e.target.value)}
                  placeholder={tf.cuisinePlaceholder}
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                />
              </InputBoxWrapper>
            )}
          </div>

          {/* 요리 유형 (2단계) - 조건부 표시 */}
          {cuisineType && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-sm font-medium text-text-secondary">
                {tf.dishType} <span className="text-text-muted text-xs">{tf.optionalInputHint}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DISH_TYPES.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDishType(d.value)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      dishType === d.value
                        ? 'bg-accent-warm text-background-primary'
                        : 'bg-background-secondary text-text-muted hover:bg-white/10'
                    }`}
                  >
                    {t.dishLabels[d.value as keyof typeof t.dishLabels] ?? d.label}
                  </button>
                ))}
              </div>
              {/* 기타 선택 시 커스텀 입력 */}
              {dishType === 'other' && (
                <InputBoxWrapper className="!rounded-xl !px-4 !py-3">
                  <input
                    type="text"
                    value={customDishType}
                    onChange={(e) => setCustomDishType(e.target.value)}
                    placeholder={tf.dishTypePlaceholder}
                    className={INPUT_INNER_COMFORTABLE_CLASS}
                    style={INPUT_INNER_STYLE}
                  />
                </InputBoxWrapper>
              )}
            </div>
          )}
    </>
  );
}

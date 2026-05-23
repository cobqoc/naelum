'use client';

import Image from 'next/image';
import type { TranslationKeys } from '@/lib/i18n/translations';
import { UNITS, type RecipeIngredient as Ingredient } from '@/lib/constants/recipe';
import RecipeIngredientInput from '@/components/Recipes/RecipeIngredientInput';
import SubstituteChipInput from '@/components/Recipes/SubstituteChipInput';
import type { IngredientItem } from '@/components/Ingredients/IngredientAutocompleteTypes';

/**
 * 레시피 작성 폼의 재료 준비 블록 (presentational).
 *
 * 2026-05-23 레이아웃 재구성:
 *  - 각 재료 = 카드 (border + bg + padding) → 시각적 청크 단위 분명
 *  - row1: [재료명][수량][단위][☐선택재료][×] (없어도 OK 토글이 row1 안으로)
 *  - row2: [메모][🔄 chip 입력] flex-wrap (데스크톱 1줄·모바일 2줄)
 *  - 이전 3줄(option 줄 별도) → 2줄(데스크톱)/3줄(모바일·메모+chip 스택)
 *
 * 상태·로직·ref·getPlaceholder 는 page.tsx 가 소유, 이 컴포넌트는 값+콜백만.
 */

interface IngredientsSectionProps {
  t: TranslationKeys;
  tf: TranslationKeys['recipeForm'];
  ingredients: Ingredient[];
  ingredientsImage: string | null;
  uploadingIngredientsImage: boolean;
  isDraggingIngredients: boolean;
  unitInputRefs: React.RefObject<(HTMLInputElement | null)[]>;
  getPlaceholder: (index: number, field: 'name' | 'quantity' | 'notes') => string;
  onAddIngredients: () => void;
  onRemoveIngredient: (index: number) => void;
  onUpdateIngredient: (index: number, field: keyof Ingredient, value: string | boolean | string[]) => void;
  onSelectIngredient: (index: number, item: IngredientItem) => void;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  onDrag: (e: React.DragEvent) => void;
  onDragIn: (e: React.DragEvent) => void;
  onDragOut: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export default function IngredientsSection({
  t,
  tf,
  ingredients,
  ingredientsImage,
  uploadingIngredientsImage,
  isDraggingIngredients,
  unitInputRefs,
  getPlaceholder,
  onAddIngredients,
  onRemoveIngredient,
  onUpdateIngredient,
  onSelectIngredient,
  onImageUpload,
  onImageRemove,
  onDrag,
  onDragIn,
  onDragOut,
  onDrop,
}: IngredientsSectionProps) {
  return (
    <div className="rounded-xl bg-background-secondary p-4 md:p-6 space-y-6">
      {/* 재료 준비 이미지 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-secondary">{tf.ingredientsPhotoLabel}</label>
        {ingredientsImage ? (
          <div className="relative w-full h-64">
            <Image
              src={ingredientsImage}
              alt={tf.ingredientsPhotoLabel}
              fill
              className="object-cover rounded-xl"
            />
            <button
              onClick={onImageRemove}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-error transition-all text-xl"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="block w-full">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImageUpload(file);
                }
                e.target.value = '';
              }}
              className="hidden"
              disabled={uploadingIngredientsImage}
            />
            <div
              className={`w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                isDraggingIngredients
                  ? 'border-accent-warm bg-accent-warm/10'
                  : 'border-white/20 hover:border-accent-warm hover:bg-white/5'
              }`}
              onDragOver={onDrag}
              onDragEnter={onDragIn}
              onDragLeave={onDragOut}
              onDrop={onDrop}
            >
              {uploadingIngredientsImage ? (
                <>
                  <div className="w-8 h-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-text-muted">{tf.uploading}</span>
                </>
              ) : (
                <>
                  <svg className="w-10 h-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium text-text-primary">{tf.ingredientsPhotoAdd}</p>
                    <p className="text-xs text-text-muted mt-1">{tf.maxFileSize}</p>
                  </div>
                </>
              )}
            </div>
          </label>
        )}
      </div>

      {/* 구분선 */}
      <div className="border-t border-white/10"></div>

      {/* 재료 입력 카드 리스트 */}
      <div className="space-y-3">
        {ingredients.map((ing, index) => {
          const standardUnits = ['선택', 'g', 'kg', 'ml', 'L', '개', '큰술', '작은술', '컵', '줌', '꼬집', '조각', '장', '포기', '대', '모', '마리'];
          const isCustomUnit = ing.unit === '' || !standardUnits.includes(ing.unit);

          return (
            <div
              key={index}
              className={`rounded-lg border p-3 space-y-2 transition-colors ${
                ing.is_optional
                  ? 'border-warning/30 bg-warning/[0.04]'
                  : 'border-white/5 bg-white/[0.02]'
              }`}
            >
              {/* Row 1: 재료명·수량·단위·☐선택·× */}
              <div className="grid grid-cols-[1fr_64px_60px_auto_28px] sm:grid-cols-[1fr_90px_72px_auto_32px] gap-2 items-center">
                {/* 재료명 자동완성 */}
                <RecipeIngredientInput
                  value={ing.ingredient_name}
                  onChange={(value) => onUpdateIngredient(index, 'ingredient_name', value)}
                  onSelect={(item) => onSelectIngredient(index, item)}
                  placeholder={getPlaceholder(index, 'name')}
                />
                <input
                  type="text"
                  value={ing.quantity}
                  onChange={(e) => onUpdateIngredient(index, 'quantity', e.target.value)}
                  className="w-full rounded-lg bg-background-tertiary px-2 py-2 text-sm text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                  placeholder={getPlaceholder(index, 'quantity')}
                />
                {isCustomUnit ? (
                  <input
                    ref={(el) => { unitInputRefs.current[index] = el; }}
                    type="text"
                    value={ing.unit}
                    onChange={(e) => onUpdateIngredient(index, 'unit', e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        onUpdateIngredient(index, 'unit', '선택');
                      }
                    }}
                    className="w-full rounded-lg bg-background-tertiary px-2 py-2 text-sm text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                    placeholder={tf.ingUnitPlaceholder}
                  />
                ) : (
                  <select
                    value={ing.unit}
                    onChange={(e) => {
                      if (e.target.value === '기타') {
                        onUpdateIngredient(index, 'unit', '');
                        setTimeout(() => {
                          unitInputRefs.current[index]?.focus();
                        }, 0);
                      } else {
                        onUpdateIngredient(index, 'unit', e.target.value);
                      }
                    }}
                    className="w-full rounded-lg bg-background-tertiary px-1 py-2 text-sm text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{t.quickAdd.unitLabels[u as keyof typeof t.quickAdd.unitLabels] ?? u}</option>
                    ))}
                  </select>
                )}
                {/* ☐ 선택 재료 토글 */}
                <label
                  className={`flex items-center gap-1.5 px-2 py-2 rounded-lg cursor-pointer select-none text-xs whitespace-nowrap transition-colors ${
                    ing.is_optional
                      ? 'text-warning bg-warning/10'
                      : 'text-text-muted hover:bg-white/5'
                  }`}
                  title={tf.ingOptionalLabel}
                >
                  <input
                    type="checkbox"
                    checked={ing.is_optional}
                    onChange={(e) => onUpdateIngredient(index, 'is_optional', e.target.checked)}
                    className="w-3.5 h-3.5 rounded border border-white/20 bg-background-tertiary accent-accent-warm"
                  />
                  <span>{tf.ingOptionalShort}</span>
                </label>
                <button
                  onClick={() => onRemoveIngredient(index)}
                  disabled={ingredients.length <= 5}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-all ${
                    ingredients.length <= 5
                      ? 'text-text-muted opacity-30'
                      : 'text-error hover:bg-error/10'
                  }`}
                >
                  ×
                </button>
              </div>

              {/* Row 2: 메모 + 🔄 대체 재료 chip (데스크톱 side-by-side / 모바일 stack) */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={ing.notes}
                  onChange={(e) => onUpdateIngredient(index, 'notes', e.target.value)}
                  className="w-full sm:flex-1 sm:min-w-0 rounded-md bg-background-tertiary px-3 py-1.5 text-xs text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm placeholder:text-text-muted/60"
                  placeholder={getPlaceholder(index, 'notes')}
                />
                <div className="w-full sm:flex-1 sm:min-w-0">
                  <SubstituteChipInput
                    value={ing.substitutes ?? []}
                    onChange={(next) => onUpdateIngredient(index, 'substitutes', next)}
                    placeholder={tf.ingSubstitutePlaceholder}
                    ariaLabel={tf.ingSubstitutePlaceholder}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 재료 추가 버튼 */}
      <button
        onClick={onAddIngredients}
        className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-text-muted hover:border-accent-warm hover:text-accent-warm transition-all"
      >
        {tf.addIngredient}
      </button>
    </div>
  );
}

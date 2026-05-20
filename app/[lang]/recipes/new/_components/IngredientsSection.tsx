'use client';

import Image from 'next/image';
import type { TranslationKeys } from '@/lib/i18n/translations';
import { UNITS, type RecipeIngredient as Ingredient } from '@/lib/constants/recipe';
import RecipeIngredientInput from '@/components/Recipes/RecipeIngredientInput';
import type { IngredientItem } from '@/components/Ingredients/IngredientAutocompleteTypes';

/**
 * 레시피 작성 폼의 재료 준비 블록 (presentational).
 *
 * god-file(NewRecipePage) 분해 마무리 down-payment — [[TagsField]]·
 * [[NutritionFields]]·[[StepsSection]] 규약 동일:
 *  1. 상태(ingredients·이미지·드래그)·로직(add/remove/update/이미지/DnD)·ref·
 *     getPlaceholder 헬퍼는 전부 부모(page.tsx)가 소유. 이 컴포넌트는 값+콜백만.
 *  2. JSX 는 원본과 byte-identical (마크업·className·핸들러 시그니처 동일) → 행위 변경 0
 *  3. 검증: npm run build(strict props) + e2e/recipe-creation.spec.ts
 *     ("UI 회귀: 단계/재료/태그 동적 추가" 가 재료 add/update 를 실제로 exercise)
 *
 * recipes/new 섹션 중 가장 결합도 높다(이미지 업로드+DnD+ref+가변 단위 input).
 * 로직은 일절 옮기지 않고 부모 클로저/ref 를 그대로 props 로 전달만 한다(위험 최소화).
 * 부모는 <section>·h2·hint 를 유지, 이 컴포넌트는 "통합 재료 준비 영역" div 만 책임.
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
  onUpdateIngredient: (index: number, field: keyof Ingredient, value: string | boolean) => void;
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

      {/* 재료 입력 테이블 */}
      <div className="space-y-2">
        {/* Header */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_100px_70px_1fr_32px] gap-2 text-xs text-text-muted pb-2 border-b border-white/10">
        <span>{tf.ingName} *</span>
        <span>{tf.ingQuantity}</span>
        <span>{tf.ingUnit}</span>
        <span>{tf.ingNotes}</span>
        <span></span>
      </div>

      {/* Ingredient Rows */}
      {ingredients.map((ing, index) => {
        const standardUnits = ['선택', 'g', 'kg', 'ml', 'L', '개', '큰술', '작은술', '컵', '줌', '꼬집', '조각', '장', '포기', '대', '모', '마리'];
        const isCustomUnit = ing.unit === '' || !standardUnits.includes(ing.unit);

        return (
          <div key={index} className="space-y-2">
            {/* Row 1: Main ingredient info (always visible) */}
            <div className="grid grid-cols-[1fr_80px_60px_32px] sm:grid-cols-[1fr_100px_70px_1fr_32px] gap-2 items-center">
              {/* 재료명 입력 — 자동완성 */}
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
                      // 다음 렌더링 후 input에 자동 포커스
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
              {/* Notes - Desktop only (in grid) */}
              <input
                type="text"
                value={ing.notes}
                onChange={(e) => onUpdateIngredient(index, 'notes', e.target.value)}
                className="hidden sm:block w-full rounded-lg bg-background-tertiary px-3 py-2 text-sm text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                placeholder={getPlaceholder(index, 'notes')}
              />
              <button
                onClick={() => onRemoveIngredient(index)}
                disabled={ingredients.length <= 5}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  ingredients.length <= 5
                    ? 'text-text-muted opacity-30'
                    : 'text-error hover:bg-error/10'
                }`}
              >
                ×
              </button>
            </div>

            {/* Row 2: Notes on mobile (full width below) */}
            <div className="sm:hidden">
              <input
                type="text"
                value={ing.notes}
                onChange={(e) => onUpdateIngredient(index, 'notes', e.target.value)}
                className="w-full rounded-lg bg-background-tertiary px-3 py-2 text-sm text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                placeholder={tf.ingNotesPlaceholder}
              />
            </div>
          </div>
        );
      })}
      </div>

      {/* 재료 추가 버튼 — 1개씩 (빈 5행 압도감 줄임) */}
      <button
        onClick={onAddIngredients}
        className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-text-muted hover:border-accent-warm hover:text-accent-warm transition-all"
      >
        {tf.addIngredient}
      </button>
    </div>
  );
}

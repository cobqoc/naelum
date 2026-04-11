'use client';

import { useState, useEffect, useRef } from 'react';
import { IngredientItem } from './IngredientAutocompleteTypes';
import IngredientCategoryFilter from './IngredientCategoryFilter';
import IngredientPickerGrid from './IngredientPickerGrid';
import { useIngredientPicker } from '@/lib/hooks/useIngredientPicker';

interface Ingredient {
  ingredient_name: string;
  quantity: string;
  unit: string;
  notes: string;
  is_optional: boolean;
}

interface IngredientPickerInlineProps {
  onSelect: (ingredient: IngredientItem) => void;
  allowAddNew?: boolean;
  onAddNew?: () => void;
  maxHeight?: string;
  selectedIngredients?: Ingredient[];
  onRemoveIngredient?: (index: number) => void;
  onUpdateIngredient?: (index: number, field: keyof Ingredient, value: string | boolean) => void;
}

const STANDARD_UNITS = ['선택', 'g', 'kg', 'ml', 'L', '개', '큰술', '작은술', '컵', '줌', '꼬집', '조각', '장', '포기', '대', '모', '마리'];

export default function IngredientPickerInline({
  onSelect,
  allowAddNew = false,
  onAddNew,
  maxHeight = '600px',
  selectedIngredients = [],
  onRemoveIngredient,
  onUpdateIngredient,
}: IngredientPickerInlineProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategories,
    setSelectedCategories,
    ingredients,
    loading,
    page,
    hasMore,
    loadMoreRef,
    showAddNewButton,
  } = useIngredientPicker();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  return (
    <div className="w-full rounded-2xl bg-background-secondary border border-white/10 shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">재료 선택</h3>

        {/* Selected ingredients dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background-tertiary hover:bg-white/10 transition-colors"
          >
            <span className="text-sm text-text-primary">
              선택된 재료 {selectedIngredients.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-accent-warm text-background-primary text-xs font-bold">
                  {selectedIngredients.length}
                </span>
              )}
            </span>
            <svg
              className={`w-4 h-4 text-text-muted transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <SelectedIngredientsDropdown
              ingredients={selectedIngredients}
              onClose={() => setShowDropdown(false)}
              onRemove={onRemoveIngredient}
              onUpdate={onUpdateIngredient}
              unitInputRefs={unitInputRefs}
            />
          )}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="p-4 space-y-3 border-b border-white/10">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="재료 검색..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-tertiary border border-white/10 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-warm/50 focus:ring-2 focus:ring-2 focus:ring-accent-warm/20 transition-all text-sm"
          />
        </div>

        <IngredientCategoryFilter
          selectedCategories={selectedCategories}
          onChange={setSelectedCategories}
        />
      </div>

      {/* Grid (scrollable) */}
      <div
        className="overflow-y-auto p-4"
        style={{ maxHeight }}
      >
        <IngredientPickerGrid
          ingredients={ingredients}
          onSelect={onSelect}
          loading={loading && page === 1}
        />

        {hasMore && !loading && ingredients.length > 0 && (
          <div ref={loadMoreRef} className="h-16 flex items-center justify-center mt-4">
            <div className="text-sm text-text-muted">스크롤하여 더 보기...</div>
          </div>
        )}

        {loading && page > 1 && (
          <div className="flex items-center justify-center py-6">
            <div className="w-6 h-6 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {showAddNewButton(allowAddNew) && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-5xl mb-3">📝</div>
            <h3 className="text-base font-medium text-text-primary mb-2">
              찾는 재료가 없나요?
            </h3>
            <p className="text-sm text-text-muted mb-4">
              직접 추가하면 모든 사용자가 사용할 수 있어요
            </p>
            <button
              onClick={onAddNew}
              className="px-5 py-2.5 rounded-lg bg-accent-warm text-background-primary font-medium hover:bg-accent-hover transition-colors shadow-lg shadow-accent-warm/20 text-sm"
            >
              + 새 재료 추가하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Extracted sub-component for the selected ingredients dropdown */
function SelectedIngredientsDropdown({
  ingredients,
  onClose,
  onRemove,
  onUpdate,
  unitInputRefs,
}: {
  ingredients: Ingredient[];
  onClose: () => void;
  onRemove?: (index: number) => void;
  onUpdate?: (index: number, field: keyof Ingredient, value: string | boolean) => void;
  unitInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}) {
  if (ingredients.length === 0) {
    return (
      <div className="absolute right-0 mt-2 w-96 max-h-[500px] overflow-y-auto rounded-xl bg-background-primary border border-white/10 shadow-2xl z-10">
        <div className="p-8 text-center">
          <div className="text-4xl mb-3">🍳</div>
          <p className="text-text-muted text-sm">선택된 재료가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 mt-2 w-96 max-h-[500px] overflow-y-auto rounded-xl bg-background-primary border border-white/10 shadow-2xl z-10">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-text-primary">선택한 재료 목록</h4>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {ingredients.map((ing, index) => {
          const isCustomUnit = ing.unit === '' || !STANDARD_UNITS.includes(ing.unit);

          return (
            <div key={index} className="rounded-xl bg-background-secondary p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-text-primary text-sm">{ing.ingredient_name}</div>
                <button
                  type="button"
                  onClick={() => onRemove?.(index)}
                  className="text-error hover:text-error/80 transition-colors"
                  aria-label="재료 삭제"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={ing.quantity}
                  onChange={(e) => onUpdate?.(index, 'quantity', e.target.value)}
                  className="w-full rounded-lg bg-background-tertiary px-2 py-1.5 text-xs text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                  placeholder="양"
                />
                {isCustomUnit ? (
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => onUpdate?.(index, 'unit', e.target.value)}
                    ref={(el) => { unitInputRefs.current[index] = el; }}
                    className="w-full rounded-lg bg-background-tertiary px-2 py-1.5 text-xs text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                    placeholder="단위 입력"
                  />
                ) : (
                  <select
                    value={ing.unit}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        onUpdate?.(index, 'unit', '');
                        setTimeout(() => unitInputRefs.current[index]?.focus(), 0);
                      } else {
                        onUpdate?.(index, 'unit', e.target.value);
                      }
                    }}
                    className="w-full rounded-lg bg-background-tertiary px-2 py-1.5 text-xs text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                  >
                    {STANDARD_UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                    <option value="custom">+ 직접 입력</option>
                  </select>
                )}
              </div>

              <input
                type="text"
                value={ing.notes}
                onChange={(e) => onUpdate?.(index, 'notes', e.target.value)}
                className="w-full rounded-lg bg-background-tertiary px-2 py-1.5 text-xs text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                placeholder="메모 (예: 깍둑썰기)"
              />

              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={ing.is_optional}
                  onChange={(e) => onUpdate?.(index, 'is_optional', e.target.checked)}
                  className="rounded border-white/20 bg-background-tertiary text-accent-warm focus:ring-2 focus:ring-accent-warm focus:ring-offset-0"
                />
                선택사항
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

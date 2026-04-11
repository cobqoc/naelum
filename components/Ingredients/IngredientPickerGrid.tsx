'use client';

import { IngredientItem } from './IngredientAutocompleteTypes';
import IngredientPickerCard, { IngredientPickerCardSkeleton } from './IngredientPickerCard';

interface IngredientPickerGridProps {
  /** 표시할 재료 목록 */
  ingredients: IngredientItem[];

  /** 재료 선택 핸들러 */
  onSelect: (ingredient: IngredientItem) => void;

  /** 로딩 상태 */
  loading?: boolean;

  /** 선택된 재료 ID */
  selectedId?: string;
}

/**
 * 재료 그리드 레이아웃 컴포넌트
 * 반응형: 2열 (모바일), 3열 (태블릿), 4열 (데스크탑)
 *
 * @example
 * ```tsx
 * <IngredientPickerGrid
 *   ingredients={filteredIngredients}
 *   onSelect={handleSelect}
 *   loading={loading}
 * />
 * ```
 */
export default function IngredientPickerGrid({
  ingredients,
  onSelect,
  loading = false,
  selectedId,
}: IngredientPickerGridProps) {
  // 재료가 없고 로딩 중이 아닐 때
  if (ingredients.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h3 className="text-base font-medium text-text-primary mb-1">
          검색 결과가 없습니다
        </h3>
        <p className="text-sm text-text-muted">
          다른 검색어를 시도하거나 새로운 재료를 추가해보세요
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {/* 재료 카드들 */}
      {ingredients.map((ingredient) => (
        <IngredientPickerCard
          key={ingredient.id}
          ingredient={ingredient}
          onClick={() => onSelect(ingredient)}
          isSelected={ingredient.id === selectedId}
        />
      ))}

      {/* 로딩 스켈레톤 */}
      {loading && <IngredientPickerCardSkeleton count={8} />}
    </div>
  );
}

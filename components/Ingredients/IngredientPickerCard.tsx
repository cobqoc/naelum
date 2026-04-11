'use client';

import { IngredientItem, getCategoryIcon } from './IngredientAutocompleteTypes';

interface IngredientPickerCardProps {
  /** 재료 정보 */
  ingredient: IngredientItem;

  /** 클릭 핸들러 */
  onClick: () => void;

  /** 선택 여부 */
  isSelected?: boolean;
}

/**
 * 재료 선택 모달용 카드 컴포넌트
 * 모달 그리드에서 개별 재료를 표시
 *
 * @example
 * ```tsx
 * <IngredientPickerCard
 *   ingredient={ingredient}
 *   onClick={() => handleSelect(ingredient)}
 * />
 * ```
 */
export default function IngredientPickerCard({
  ingredient,
  onClick,
  isSelected = false,
}: IngredientPickerCardProps) {
  return (
    <div
      onClick={onClick}
      data-testid="ingredient-card"
      className={`relative rounded-xl border bg-background-secondary p-4 transition-all cursor-pointer group
        ${
          isSelected
            ? 'border-accent-warm bg-accent-warm/10 shadow-lg scale-105'
            : 'border-white/10 hover:bg-white/5 hover:border-white/20'
        }`}
    >
      {/* 아이콘 - 크기 감소 */}
      <div className="text-xl text-center mb-3">
        {ingredient.icon || getCategoryIcon(ingredient.category)}
      </div>

      {/* 재료명 - 크기 증가 */}
      <div className="text-center space-y-1">
        <div className="font-bold text-base text-text-primary">
          {ingredient.name}
        </div>
        {ingredient.name_en && (
          <div className="text-xs text-text-muted truncate">
            {ingredient.name_en}
          </div>
        )}
      </div>

      {/* 사용 횟수 배지 */}
      {ingredient.search_count !== undefined && ingredient.search_count > 0 && (
        <div className="absolute top-2 right-2 text-xs bg-accent-warm/10 text-accent-warm px-2 py-1 rounded-full font-medium">
          {ingredient.search_count}회
        </div>
      )}

      {/* 호버 체크 표시 */}
      <div
        className={`absolute inset-0 flex items-center justify-center bg-accent-warm/20 transition-opacity rounded-xl
          ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <svg
          className="w-8 h-8 text-accent-warm"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * 로딩 스켈레톤 컴포넌트
 */
export function IngredientPickerCardSkeleton({ count = 12 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-white/10 bg-background-secondary p-4 animate-pulse"
        >
          {/* 아이콘 스켈레톤 */}
          <div className="w-12 h-12 mx-auto mb-2 bg-white/10 rounded-full" />

          {/* 텍스트 스켈레톤 */}
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded mx-auto w-20" />
            <div className="h-3 bg-white/10 rounded mx-auto w-16" />
          </div>
        </div>
      ))}
    </>
  );
}

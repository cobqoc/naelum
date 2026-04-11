'use client';

import IngredientAutocompleteV2 from '../Ingredients/IngredientAutocompleteV2';
import { IngredientItem } from '../Ingredients/IngredientAutocompleteTypes';

interface RecipeIngredientInputProps {
  /** 현재 입력값 */
  value: string;

  /** 입력값 변경 핸들러 */
  onChange: (value: string) => void;

  /**
   * 재료 선택 핸들러
   * 재료를 선택하면 자동완성에서 제공하는 추가 정보도 함께 전달
   */
  onSelect: (ingredient: IngredientItem) => void;

  /** Placeholder 텍스트 */
  placeholder?: string;

  /** 카테고리 필터 활성화 (기본값: true) */
  enableCategoryFilter?: boolean;

  /** 최근 선택 재료 활성화 (기본값: true) */
  enableRecentItems?: boolean;

  /** 커스텀 재료 직접 추가 허용 (기본값: true) */
  allowCustomIngredient?: boolean;

  /** 비활성화 */
  disabled?: boolean;

  /** 추가 클래스명 */
  className?: string;
}

/**
 * 레시피 작성용 재료 입력 컴포넌트
 * IngredientAutocompleteV2를 래핑하여 레시피 작성에 최적화된 설정 제공
 *
 * @example
 * ```tsx
 * <RecipeIngredientInput
 *   value={ingredient.ingredient_name}
 *   onChange={(value) => updateIngredient(index, 'ingredient_name', value)}
 *   onSelect={(ingredient) => {
 *     updateIngredient(index, 'ingredient_name', ingredient.name);
 *     // 단위 자동 설정
 *     if (ingredient.common_units?.[0]) {
 *       updateIngredient(index, 'unit', ingredient.common_units[0]);
 *     }
 *   }}
 *   placeholder="재료 이름"
 * />
 * ```
 */
export default function RecipeIngredientInput({
  value,
  onChange,
  onSelect,
  placeholder = '재료 이름',
  enableCategoryFilter = true,
  enableRecentItems = true,
  allowCustomIngredient = true,
  disabled = false,
  className,
}: RecipeIngredientInputProps) {
  return (
    <IngredientAutocompleteV2
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      placeholder={placeholder}
      enableCategoryFilter={enableCategoryFilter}
      enableRecentItems={enableRecentItems}
      allowCustomIngredient={allowCustomIngredient}
      disabled={disabled}
      className={className}
    />
  );
}

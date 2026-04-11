'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Autocomplete from '../Common/Autocomplete';
import IngredientCategoryFilter from './IngredientCategoryFilter';
import AddIngredientDialog from './AddIngredientDialog';
import {
  IngredientItem,
  IngredientAutocompleteV2Props,
  IngredientAutocompleteResponse,
  convertToIngredientItem,
} from './IngredientAutocompleteTypes';
import {
  getRecentIngredients,
  addRecentIngredient,
  clearRecentIngredients,
  RecentIngredient,
} from '@/lib/utils/recentIngredients';

/**
 * 재료 자동완성 V2 컴포넌트
 * - 범용 Autocomplete 컴포넌트 활용
 * - 카테고리 필터링
 * - 최근 선택 재료
 * - 커스텀 재료 추가
 *
 * @example
 * ```tsx
 * <IngredientAutocompleteV2
 *   value={ingredientName}
 *   onChange={setIngredientName}
 *   onSelect={handleSelect}
 *   enableCategoryFilter
 *   enableRecentItems
 *   allowCustomIngredient
 * />
 * ```
 */
export default function IngredientAutocompleteV2({
  value,
  onChange,
  onSelect,
  placeholder = '재료 이름을 입력하세요',
  enableCategoryFilter = false,
  selectedCategories: externalSelectedCategories,
  onCategoryChange: externalOnCategoryChange,
  enableRecentItems = false,
  maxRecentItems = 10,
  allowCustomIngredient = false,
  onCustomIngredient,
  className,
  disabled,
}: IngredientAutocompleteV2Props) {
  // ===== 상태 관리 =====
  const [internalSelectedCategories, setInternalSelectedCategories] = useState<string[]>([]);
  const [recentItems, setRecentItems] = useState<IngredientItem[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // 카테고리 상태: 외부 제공 또는 내부 관리
  const selectedCategories = externalSelectedCategories !== undefined
    ? externalSelectedCategories
    : internalSelectedCategories;

  const handleCategoryChange = useCallback((categories: string[]) => {
    if (externalOnCategoryChange) {
      externalOnCategoryChange(categories);
    } else {
      setInternalSelectedCategories(categories);
    }
  }, [externalOnCategoryChange]);

  // ===== 최근 선택 재료 로드 =====
  useEffect(() => {
    if (!enableRecentItems) return;

    const loadRecentItems = () => {
      const recent = getRecentIngredients();
      const items = recent.slice(0, maxRecentItems).map((item): IngredientItem => ({
        id: item.id,
        name: item.name,
        name_en: item.name_en,
        category: item.category,
        common_units: [],
        label: item.name,
        secondaryLabel: item.name_en || undefined,
        icon: getCategoryIcon(item.category),
        badge: item.category || undefined,
      }));
      setRecentItems(items);
    };

    loadRecentItems();

    // localStorage 변경 감지 (다른 탭에서 변경 시)
    window.addEventListener('storage', loadRecentItems);
    return () => window.removeEventListener('storage', loadRecentItems);
  }, [enableRecentItems, maxRecentItems]);

  // ===== API 호출 함수 =====
  const fetchIngredientSuggestions = useCallback(
    async (query: string): Promise<IngredientItem[]> => {
      try {
        // 쿼리 파라미터 구성
        const params = new URLSearchParams({
          q: query,
          limit: '8',
        });

        // 카테고리 필터 추가
        if (selectedCategories.length > 0) {
          params.append('categories', selectedCategories.join(','));
        }

        const response = await fetch(`/api/ingredients/autocomplete?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data: IngredientAutocompleteResponse = await response.json();
        return data.suggestions.map(convertToIngredientItem);
      } catch (error) {
        console.error('Error fetching ingredient suggestions:', error);
        return [];
      }
    },
    [selectedCategories]
  );

  // ===== 재료 선택 핸들러 =====
  const handleSelectIngredient = useCallback(
    (ingredient: IngredientItem) => {
      // 부모 컴포넌트에 알림
      onSelect(ingredient);

      // 최근 선택 재료에 추가
      if (enableRecentItems) {
        addRecentIngredient({
          id: ingredient.id,
          name: ingredient.name,
          name_en: ingredient.name_en,
          category: ingredient.category,
        });

        // 최근 항목 즉시 업데이트
        const recent = getRecentIngredients();
        const items = recent.slice(0, maxRecentItems).map(convertRecentToIngredientItem);
        setRecentItems(items);
      }
    },
    [onSelect, enableRecentItems, maxRecentItems]
  );

  // ===== 커스텀 재료 추가 핸들러 =====
  const handleCustomIngredient = useCallback(
    (name: string) => {
      if (onCustomIngredient) {
        onCustomIngredient(name);
      } else {
        // 기본 동작: AddIngredientDialog 열기
        setShowAddDialog(true);
      }
    },
    [onCustomIngredient]
  );

  // ===== 다이얼로그 성공 핸들러 =====
  const handleDialogSuccess = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiIngredient: any) => {
      // API 응답을 IngredientItem으로 변환
      const ingredient = convertToIngredientItem(apiIngredient);

      // 재료 선택 처리
      handleSelectIngredient(ingredient);

      // 다이얼로그 닫기
      setShowAddDialog(false);

      // 성공 메시지 (선택사항 - 토스트 시스템이 있다면 활성화)
      // toast.success(`"${ingredient.name}" 재료가 추가되었습니다!`);
    },
    [handleSelectIngredient]
  );

  // ===== 최근 항목 전체 삭제 =====
  const handleClearRecentItems = useCallback(() => {
    clearRecentIngredients();
    setRecentItems([]);
  }, []);

  // ===== 카테고리 필터 컴포넌트 =====
  const filterComponent = enableCategoryFilter ? (
    <IngredientCategoryFilter
      selectedCategories={selectedCategories}
      onChange={handleCategoryChange}
    />
  ) : undefined;

  // ===== 최근 선택 재료 항목 =====
  const recentItemsToShow = enableRecentItems ? recentItems : [];

  return (
    <>
      <Autocomplete<IngredientItem>
        value={value}
        onChange={onChange}
        onSelect={handleSelectIngredient}
        placeholder={placeholder}
        fetchSuggestions={fetchIngredientSuggestions}
        minQueryLength={2}
        debounceMs={300}
        allowCustomInput={allowCustomIngredient}
        onCustomInput={handleCustomIngredient}
        recentItems={recentItemsToShow}
        onRecentItemsClear={enableRecentItems ? handleClearRecentItems : undefined}
        filterComponent={filterComponent}
        renderItem={renderIngredientItem}
        className={className}
        disabled={disabled}
        ariaLabel="재료 검색"
      />

      {/* 커스텀 재료 추가 다이얼로그 */}
      <AddIngredientDialog
        isOpen={showAddDialog}
        initialName={value}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleDialogSuccess}
      />
    </>
  );
}

/**
 * RecentIngredient를 IngredientItem으로 변환
 */
function convertRecentToIngredientItem(recent: RecentIngredient): IngredientItem {
  return {
    id: recent.id,
    name: recent.name,
    name_en: recent.name_en,
    category: recent.category,
    common_units: [],
    label: recent.name,
    secondaryLabel: recent.name_en || undefined,
    icon: getCategoryIcon(recent.category),
    badge: recent.category || undefined,
    metadata: {
      count: recent.count,
      timestamp: recent.timestamp,
    },
  };
}

/**
 * 카테고리 아이콘 매핑 (AutocompleteTypes에서 중복 방지)
 */
function getCategoryIcon(categoryId: string | null): string {
  const iconMap: Record<string, string> = {
    veggie: '🥬',
    fruit: '🍎',
    meat: '🥩',
    seafood: '🐟',
    grain: '🌾',
    dairy: '🧀',
    seasoning: '🧂',
    condiment: '🫙',
    other: '📦',
  };
  return categoryId ? iconMap[categoryId] || '📦' : '📦';
}

/**
 * 재료 항목 렌더링 컴포넌트
 */
const IngredientItemRenderer: React.FC<{ item: IngredientItem; isSelected: boolean }> = React.memo(
  ({ item, isSelected }) => {
    const hasCount = item.metadata?.count !== undefined && typeof item.metadata.count === 'number';
    const count = hasCount ? item.metadata!.count as number : 0;

    return (
      <div className="flex items-center gap-3">
        <span className="text-2xl">{item.icon || '📦'}</span>

        <div className="flex-1 min-w-0">
          <div
            className={`font-medium truncate ${
              isSelected ? 'text-text-primary' : 'text-text-primary'
            }`}
          >
            {item.name}
          </div>
          {item.name_en && (
            <div className="text-sm text-text-muted truncate">{item.name_en}</div>
          )}
        </div>

        {hasCount && (
          <span className="text-xs px-2 py-1 rounded-full bg-accent-warm/10 text-accent-warm">
            {count}회
          </span>
        )}

        {!hasCount && item.badge && typeof item.badge === 'string' && (
          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-text-secondary">
            {item.badge}
          </span>
        )}
      </div>
    );
  }
);

IngredientItemRenderer.displayName = 'IngredientItemRenderer';

/**
 * 재료 항목 렌더링 래퍼 함수
 */
function renderIngredientItem(item: IngredientItem, isSelected: boolean): React.ReactNode {
  return <IngredientItemRenderer item={item} isSelected={isSelected} /> as React.ReactNode;
}

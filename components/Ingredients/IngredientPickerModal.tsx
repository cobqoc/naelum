'use client';

import { useEffect } from 'react';
import { IngredientItem } from './IngredientAutocompleteTypes';
import IngredientCategoryFilter from './IngredientCategoryFilter';
import IngredientPickerGrid from './IngredientPickerGrid';
import { useIngredientPicker } from '@/lib/hooks/useIngredientPicker';

interface IngredientPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (ingredient: IngredientItem) => void;
  allowAddNew?: boolean;
  onAddNew?: () => void;
}

export default function IngredientPickerModal({
  isOpen,
  onClose,
  onSelect,
  allowAddNew = false,
  onAddNew,
}: IngredientPickerModalProps) {
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
  } = useIngredientPicker({ enabled: isOpen });

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSelect = (ingredient: IngredientItem) => {
    onSelect(ingredient);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full h-dvh md:h-[90vh] md:max-w-4xl md:rounded-2xl bg-background-primary border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-text-primary">재료 선택</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search + Filter */}
        <div className="p-6 space-y-4 border-b border-white/10">
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
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-background-secondary border border-white/10 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-warm/50 focus:ring-2 focus:ring-2 focus:ring-accent-warm/20 transition-all"
              autoFocus
            />
          </div>

          <IngredientCategoryFilter
            selectedCategories={selectedCategories}
            onChange={setSelectedCategories}
          />
        </div>

        {/* Grid (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          <IngredientPickerGrid
            ingredients={ingredients}
            onSelect={handleSelect}
            loading={loading && page === 1}
          />

          {hasMore && !loading && ingredients.length > 0 && (
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
              <div className="text-sm text-text-muted">스크롤하여 더 보기...</div>
            </div>
          )}

          {loading && page > 1 && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {showAddNewButton(allowAddNew) && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                찾는 재료가 없나요?
              </h3>
              <p className="text-sm text-text-muted mb-6">
                직접 추가하면 모든 사용자가 사용할 수 있어요
              </p>
              <button
                onClick={onAddNew}
                className="px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-medium hover:bg-accent-hover transition-colors shadow-lg shadow-accent-warm/20"
              >
                + 새 재료 추가하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

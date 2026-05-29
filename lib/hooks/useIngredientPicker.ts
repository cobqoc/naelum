import { useState, useEffect, useRef, useCallback } from 'react';
import { IngredientItem } from '@/components/Ingredients/IngredientAutocompleteTypes';

const PAGE_SIZE = 50;

interface UseIngredientPickerOptions {
  /** Whether the picker is active/visible (controls fetching) */
  enabled?: boolean;
}

interface UseIngredientPickerReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  ingredients: IngredientItem[];
  loading: boolean;
  page: number;
  hasMore: boolean;
  /** Attach this ref to the sentinel element for infinite scroll */
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  /** Whether to show the "add new" button */
  showAddNewButton: (allowAddNew: boolean) => boolean;
}

/**
 * Shared logic for ingredient picker components (Modal & Inline).
 * Handles fetching, search, category filtering, and infinite scroll.
 */
export function useIngredientPicker(
  options: UseIngredientPickerOptions = {}
): UseIngredientPickerReturn {
  const { enabled = true } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchIngredients = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      setLoading(true);

      // V2 (2026-05-29): 빈 검색 + 단일 카테고리 또는 전체 → quick-add (개인+글로벌 인기)
      // 검색어 있으면 → browse (search)
      const hasSearchQuery = searchQuery.trim().length > 0;

      let response: Response;
      if (!hasSearchQuery && pageNum === 1) {
        // 빈 상태 — V2 개인화/인기도 API
        const cat = selectedCategories.length === 1 ? selectedCategories[0] : 'all';
        const qaParams = new URLSearchParams({ category: cat, limit: PAGE_SIZE.toString() });
        response = await fetch(`/api/ingredients/quick-add?${qaParams.toString()}`);
      } else {
        // 검색·페이지네이션 — 기존 browse
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: PAGE_SIZE.toString(),
          q: searchQuery,
          categories: selectedCategories.join(','),
          sort: 'search_count',
        });
        response = await fetch(`/api/ingredients/browse?${params.toString()}`);
      }

      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }

      const data = await response.json();
      // quick-add 응답은 { items, total }, browse 응답은 { ingredients, ... }
      // 정규화 — items 또는 ingredients 모두 처리
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: IngredientItem[] = (data.items ?? data.ingredients ?? []) as any;

      if (reset) {
        setIngredients(items);
      } else {
        setIngredients((prev) => {
          const existingIds = new Set(prev.map((item: IngredientItem) => item.id));
          const uniqueNew = items.filter((item: IngredientItem) => !existingIds.has(item.id));
          return [...prev, ...uniqueNew];
        });
      }

      setHasMore(items.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategories]);

  // Reset and fetch on search/category change
  useEffect(() => {
    if (!enabled) return;
    setPage(1);
    fetchIngredients(1, true);
  }, [enabled, searchQuery, selectedCategories, fetchIngredients]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!enabled || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => {
            const nextPage = prev + 1;
            fetchIngredients(nextPage, false);
            return nextPage;
          });
        }
      },
      { threshold: 0.5 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [enabled, hasMore, loading, fetchIngredients]);

  const showAddNewButton = (allowAddNew: boolean) =>
    allowAddNew && !!searchQuery && ingredients.length === 0 && !loading;

  return {
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
  };
}

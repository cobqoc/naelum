'use client';

import { useState, useEffect, useRef } from 'react';
import { INGREDIENT_CATEGORIES, IngredientItem } from './IngredientAutocompleteTypes';
import { getIngredientEmoji } from '@/lib/utils/ingredientEmoji';

interface FrequentItem {
  id: string;
  name: string;
  category: string | null;
}

interface PopularItemLite {
  name: string;
  category: string;
  icon: string;
}

interface IngredientBrowserProps {
  onSelect: (ingredient: IngredientItem) => void;
  selectedNames: string[];
  /** 사용자 최근 사용 재료 — "자주" 탭에 우선 노출 */
  frequentItems?: FrequentItem[];
  /** 신규 사용자용 인기 재료 프리셋 — frequentItems가 적으면 보충 */
  popularItems?: PopularItemLite[];
}

const ALL_CATEGORY = { id: 'all', name: '전체', icon: '🍽️' };
const FREQUENT_CATEGORY = { id: 'frequent', name: '자주', icon: '⭐' };

export default function IngredientBrowser({
  onSelect,
  selectedNames,
  frequentItems = [],
  popularItems = [],
}: IngredientBrowserProps) {
  // 자주 쓰는 재료/인기 프리셋이 있으면 첫 탭을 "자주"로, 없으면 "전체".
  const hasFrequent = frequentItems.length > 0 || popularItems.length > 0;
  const CATEGORIES = hasFrequent
    ? [FREQUENT_CATEGORY, ALL_CATEGORY, ...INGREDIENT_CATEGORIES]
    : [ALL_CATEGORY, ...INGREDIENT_CATEGORIES];

  const [activeCategory, setActiveCategory] = useState(hasFrequent ? 'frequent' : 'all');
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(!hasFrequent);

  const tabsRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = tabsRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    updateArrows();
    const el = tabsRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('scroll', updateArrows);
      el.removeEventListener('wheel', onWheel);
      observer.disconnect();
    };
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    tabsRef.current?.scrollBy({ left: dir === 'right' ? 150 : -150, behavior: 'smooth' });
  };

  useEffect(() => {
    // "자주" 탭: API 호출 없이 prop으로 받은 frequent + popular 조합 표시.
    if (activeCategory === 'frequent') {
      const merged: IngredientItem[] = [];
      const seen = new Set<string>();

      // 1) 사용자 최근 사용 재료 우선 (최대 20개)
      for (const f of frequentItems.slice(0, 20)) {
        if (seen.has(f.name)) continue;
        seen.add(f.name);
        merged.push({
          id: f.id,
          name: f.name,
          name_en: null,
          category: f.category,
          common_units: [],
          label: f.name,
          icon: getIngredientEmoji(f.name, f.category || 'other'),
        });
      }

      // 2) 부족하면 POPULAR_ITEMS 프리셋으로 보충 (중복 제외)
      for (const p of popularItems) {
        if (seen.has(p.name)) continue;
        seen.add(p.name);
        merged.push({
          id: `preset-${p.name}`,
          name: p.name,
          name_en: null,
          category: p.category,
          common_units: [],
          label: p.name,
          icon: p.icon,
        });
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect -- prop 기반 파생 리스트 갱신 (cascading render 허용 범위)
      setIngredients(merged);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    // 일반 카테고리 탭: 서버 API 호출
    const params = new URLSearchParams({ limit: '60', sort: 'search_count' });
    if (activeCategory !== 'all') params.set('categories', activeCategory);

    fetch(`/api/ingredients/browse?${params}`)
      .then(r => r.json())
      .then(data => {
        const items: IngredientItem[] = (data.ingredients || []).map((ing: {
          id: string; name: string; name_en: string | null;
          category: string | null; common_units: string[];
          search_count?: number; subcategory?: string | null; image_url?: string | null;
        }) => ({
          id: ing.id,
          name: ing.name,
          name_en: ing.name_en,
          category: ing.category,
          subcategory: ing.subcategory,
          image_url: ing.image_url,
          common_units: ing.common_units || [],
          search_count: ing.search_count,
          label: ing.name,
          secondaryLabel: ing.name_en || undefined,
          icon: getIngredientEmoji(ing.name, ing.category || 'other'),
          badge: ing.category || undefined,
        }));
        setIngredients(items);
      })
      .catch(() => setIngredients([]))
      .finally(() => setLoading(false));
  }, [activeCategory, frequentItems, popularItems]);

  return (
    <div className="space-y-3">
      {/* 카테고리 탭 */}
      <div className="flex items-center gap-1">
        {/* 왼쪽 화살표 */}
        {canLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-background-secondary text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all text-sm"
          >
            ‹
          </button>
        )}

        {/* 스크롤 영역 */}
        <div className="relative flex-1 min-w-0">
          <div
            ref={tabsRef}
            className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
            onScroll={updateArrows}
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setLoading(true); setActiveCategory(cat.id); }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-accent-warm text-background-primary'
                    : 'bg-background-secondary text-text-secondary hover:bg-white/8'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
          {/* 오른쪽 페이드 */}
          {canRight && (
            <div
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-8"
              style={{ background: 'linear-gradient(to left, var(--background-primary), transparent)' }}
            />
          )}
        </div>

        {/* 오른쪽 화살표 */}
        {canRight && (
          <button
            type="button"
            onClick={() => scroll('right')}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-background-secondary text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all text-sm"
          >
            ›
          </button>
        )}
      </div>

      {/* 재료 그리드 */}
      <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto scrollbar-hide">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-8 w-16 rounded-xl bg-white/5 animate-pulse" />
            ))
          : ingredients.map(ing => {
              const isSelected = selectedNames.includes(ing.name);
              return (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => !isSelected && onSelect(ing)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-accent-warm/20 text-accent-warm ring-1 ring-accent-warm/40 cursor-default'
                      : 'bg-background-secondary text-text-primary hover:bg-white/10'
                  }`}
                >
                  <span className="text-base leading-none">{getIngredientEmoji(ing.name, ing.category || 'other')}</span>
                  <span>{ing.name}</span>
                  {isSelected && <span className="text-[10px]">✓</span>}
                </button>
              );
            })
        }
      </div>
    </div>
  );
}

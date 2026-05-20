'use client';

import { useState, useEffect, useRef } from 'react';
import { MODAL_INGREDIENT_CATEGORIES, IngredientItem } from './IngredientAutocompleteTypes';
import { useI18n } from '@/lib/i18n/context';

interface FrequentItem {
  id: string;
  name: string;
  category: string | null;
  emoji?: string | null;
}

interface PopularItemLite {
  name: string;
  category: string;
  emoji: string | null;
}

interface IngredientBrowserProps {
  onSelect: (ingredient: IngredientItem) => void;
  selectedNames: string[];
  /** 사용자 최근 사용 재료 — "자주" 탭에 우선 노출 */
  frequentItems?: FrequentItem[];
  /** 신규 사용자용 인기 재료 프리셋 — frequentItems가 적으면 보충 */
  popularItems?: PopularItemLite[];
  /** 이미 냉장고에 있는 재료 이름 목록 — 칩에 보유 중 표시 */
  ownedNames?: string[];
}

export default function IngredientBrowser({
  onSelect,
  selectedNames,
  frequentItems = [],
  popularItems = [],
  ownedNames,
}: IngredientBrowserProps) {
  const { t } = useI18n();

  const FREQUENT_CATEGORY = { id: 'frequent', name: t.ingredient.categoryFrequent, icon: '⭐' };

  // 자주 쓰는 재료/인기 프리셋이 있으면 첫 탭을 "자주", 없으면 첫 카테고리(채소).
  // "전체" 탭은 2026-05-20 제거 (인기 60개만 보여 거짓말. 검색·자주·카테고리로 대체)
  const hasFrequent = frequentItems.length > 0 || popularItems.length > 0;
  const categoryTabs = MODAL_INGREDIENT_CATEGORIES.map(c => ({
    ...c,
    name: (t.ingredient.categoryLabels as Record<string, string>)[c.id] ?? c.id,
  }));
  const CATEGORIES = hasFrequent
    ? [FREQUENT_CATEGORY, ...categoryTabs]
    : categoryTabs;

  const [activeCategory, setActiveCategory] = useState(hasFrequent ? 'frequent' : categoryTabs[0].id);
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

      // 1) 사용자 최근 사용 재료 우선 (최대 40개 — 2026-05-20 20→40)
      for (const f of frequentItems.slice(0, 40)) {
        if (seen.has(f.name)) continue;
        seen.add(f.name);
        merged.push({
          id: f.id,
          name: f.name,
          name_en: null,
          category: f.category,
          common_units: [],
          label: f.name,
          icon: f.emoji ?? undefined,
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
          icon: p.emoji ?? undefined,
        });
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect -- prop 기반 파생 리스트 갱신 (cascading render 허용 범위)
      setIngredients(merged);
      setLoading(false);
      return;
    }

    // 일반 카테고리 탭: 서버 API 호출 (categories 항상 명시 — 전체 탭 제거됨)
    const params = new URLSearchParams({ limit: '60', sort: 'search_count', categories: activeCategory });

    fetch(`/api/ingredients/browse?${params}`)
      .then(r => r.json())
      .then(data => {
        const items: IngredientItem[] = (data.ingredients || []).map((ing: {
          id: string; name: string; name_en: string | null;
          category: string | null; common_units: string[];
          search_count?: number; subcategory?: string | null; image_url?: string | null;
          emoji?: string | null;
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
          icon: ing.emoji ?? undefined,
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

      {/* 재료 그리드 — 내부 스크롤 제거 (모달 자체 스크롤로 통합, 이중 스크롤 방지) */}
      <div className="flex flex-wrap gap-2">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-8 w-16 rounded-xl bg-white/5 animate-pulse" />
            ))
          : ingredients.map(ing => {
              const isSelected = selectedNames.includes(ing.name);
              const isOwned = !isSelected && (ownedNames?.includes(ing.name) ?? false);
              return (
                <div
                  key={ing.id}
                  className={`inline-flex items-center rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-accent-warm text-background-primary'
                      : isOwned
                      ? 'bg-background-secondary text-text-primary hover:bg-white/10 ring-1 ring-emerald-500/40'
                      : 'bg-background-secondary text-text-primary hover:bg-white/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(ing)}
                    className="group/chip flex items-center gap-1.5 pl-3 pr-3 py-1.5"
                  >
                    <span className="text-base leading-none">{ing.icon}</span>
                    <span>{ing.name}</span>
                    {isSelected && (
                      <>
                        {/* 기본: ✓, hover 시: ✕ — 재클릭하면 제거됨을 암시 */}
                        <svg className="group-hover/chip:hidden" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <svg className="hidden group-hover/chip:block" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </>
                    )}
                    {isOwned && (
                      <svg width="11" height="11" className="text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

'use client';

import { useRef, useState, useEffect } from 'react';
import { INGREDIENT_CATEGORIES } from './IngredientAutocompleteTypes';

const CATEGORY_COLORS: Record<string, string> = {
  veggie:    '#22c55e',
  fruit:     '#f97316',
  meat:      '#ef4444',
  seafood:   '#3b82f6',
  grain:     '#84cc16',
  dairy:     '#f59e0b',
  seasoning: '#a855f7',
  condiment: '#14b8a6',
  other:     '#6b7280',
};

interface IngredientCategoryFilterProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  className?: string;
}

export default function IngredientCategoryFilter({
  selectedCategories,
  onChange,
  className = '',
}: IngredientCategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [scrollPct, setScrollPct] = useState(0);

  const updateScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft < maxScroll - 2);
    setScrollPct(maxScroll > 0 ? el.scrollLeft / maxScroll : 0);
  };

  useEffect(() => {
    updateScroll();
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateScroll);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // PC: 마우스 휠 → 가로 스크롤 변환
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollBy({ left: e.deltaY * 1.5, behavior: 'auto' });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const allItems = [
    { id: '__all__', name: '전체', icon: '🌐', color: '#ff9966' },
    ...INGREDIENT_CATEGORIES.map(c => ({ ...c, color: CATEGORY_COLORS[c.id] ?? '#6b7280' })),
  ];

  return (
    <div className={`py-2 ${className}`}>
      <div className="relative">
        {/* 왼쪽 페이드 + 화살표 (데스크탑) */}
        {canLeft && <>
          <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-background-primary to-transparent z-10" />
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
            className="hidden md:flex absolute left-0.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-background-secondary/90 border border-white/10 text-text-secondary hover:text-text-primary shadow-lg transition-all hover:scale-110 text-lg leading-none"
          >‹</button>
        </>}

        {/* 오른쪽 페이드 + 화살표 (데스크탑) */}
        {canRight && <>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-background-primary to-transparent z-10" />
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
            className="hidden md:flex absolute right-0.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-background-secondary/90 border border-white/10 text-text-secondary hover:text-text-primary shadow-lg transition-all hover:scale-110 text-lg leading-none"
          >›</button>
        </>}

        {/* 스크롤 컨테이너 */}
        <div ref={scrollRef} onScroll={updateScroll} className="overflow-x-auto scrollbar-hide pr-8">
          <div className="flex gap-2 w-max">
            {allItems.map(item => {
              const isAll = item.id === '__all__';
              const selected = isAll
                ? selectedCategories.length === 0
                : selectedCategories.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (isAll) {
                      onChange([]);
                    } else if (selectedCategories.includes(item.id)) {
                      onChange(selectedCategories.filter(c => c !== item.id));
                    } else {
                      onChange([...selectedCategories, item.id]);
                    }
                  }}
                  className="w-[64px] h-[72px] md:w-[72px] md:h-[80px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
                  style={{
                    background: selected
                      ? `linear-gradient(135deg, ${item.color}44 0%, ${item.color}11 100%)`
                      : `linear-gradient(135deg, ${item.color}22 0%, transparent 100%)`,
                    borderColor: selected ? `${item.color}88` : 'rgba(255,255,255,0.1)',
                    boxShadow: selected ? `0 0 14px ${item.color}44` : 'none',
                  }}
                  onMouseEnter={e => {
                    if (selected) return;
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = `${item.color}55`;
                    el.style.boxShadow = `0 0 14px ${item.color}33`;
                  }}
                  onMouseLeave={e => {
                    if (selected) return;
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(255,255,255,0.1)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  <span className="text-xl leading-none">{item.icon}</span>
                  <span className={`text-[10px] font-medium leading-tight text-center px-1 ${selected ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 스크롤 진행 바 */}
      <div className="mt-2 h-0.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-warm/50 transition-all duration-150"
          style={{ width: `${Math.max(20, scrollPct * 100)}%` }}
        />
      </div>

      {selectedCategories.length > 0 && (
        <div className="mt-1.5 text-xs text-text-muted">
          {selectedCategories.length}개 카테고리 선택됨
        </div>
      )}
    </div>
  );
}

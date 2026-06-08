'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from '@/components/Common/LocalizedLink';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import RecipeCard from '@/components/RecipeCard';
import SafeImage from '@/components/Common/SafeImage';
import { RecipeCardGridSkeleton } from '@/components/Common/Skeleton';
import EmptyState from '@/components/Common/EmptyState';
import IngredientRecsView from './_components/IngredientRecsView';
import { type RecipeWithMatch } from '@/lib/types/recipe';
import { useI18n } from '@/lib/i18n/context';
import { useScrollCache } from '@/lib/hooks/useScrollCache';
import { CUISINE_TYPES, DISH_TYPES } from '@/lib/constants/recipe';

import {
  CUISINE_ICONS,
  CUISINE_COLORS,
  CUISINE_IMAGES,
  DISH_ICONS,
  DISH_COLORS,
} from '@/lib/constants/categoryIcons';

const RECIPES_PER_PAGE = 20;
const CACHE_KEY = 'scroll_cache_recipes';
const MAX_RECIPES_AUTO = 120; // 이 개수 이후엔 수동 버튼으로 전환 (DOM 누적 방지)

interface RecipesCache {
  recipes: RecipeWithMatch[];
  page: number;
  hasMore: boolean;
  sortBy: 'latest' | 'rating' | 'views';
}

export default function AllRecipesPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const cuisineFilter = searchParams.get('cuisine_type');
  const dishFilter = searchParams.get('dish_type');
  const hasFilter = !!(cuisineFilter || dishFilter);

  const { save, load, clear } = useScrollCache<RecipesCache>(CACHE_KEY);
  // 필터 적용 시 캐시 무시
  const initialCache = hasFilter ? null : load();

  // 카테고리 탭 — URL 필터가 활성이면 강제, 없으면 유저의 수동 선택 유지.
  // setState-in-effect 패턴을 피하기 위해 render time에 파생.
  const [manualCategoryTab, setManualCategoryTab] = useState<'cuisine' | 'dish' | null>(null);

  // 전체 | 재료 기반 탭 — 초기값은 ?tab= deep-link (홈 냉장고 pill → ?tab=ingredient)
  const [activeTab, setActiveTab] = useState<'all' | 'ingredient'>(
    searchParams.get('tab') === 'ingredient' ? 'ingredient' : 'all',
  );

  // 이번 주 인기 — 필터 없을 때만 상단에 가로 스크롤 스트립으로 노출.
  const [trending, setTrending] = useState<RecipeWithMatch[]>([]);
  const categoryTab: 'cuisine' | 'dish' = dishFilter
    ? 'dish'
    : cuisineFilter
      ? 'cuisine'
      : (manualCategoryTab ?? 'cuisine');

  const [recipes, setRecipes] = useState<RecipeWithMatch[]>(initialCache?.data.recipes ?? []);
  const [loading, setLoading] = useState(!initialCache);
  const [hasMore, setHasMore] = useState(initialCache?.data.hasMore ?? true);
  const [page, setPage] = useState(initialCache?.data.page ?? 0);
  // 정렬 — URL `?sort=` 우선, 없으면 캐시, 없으면 latest. 변경 시 URL 동기 (이슈 #6 공유 시 컨텍스트 유지).
  const sortParam = searchParams.get('sort');
  const isValidSort = (s: string | null): s is 'latest' | 'rating' | 'views' =>
    s === 'latest' || s === 'rating' || s === 'views';
  const [sortBy, setSortBy] = useState<'latest' | 'rating' | 'views'>(
    isValidSort(sortParam) ? sortParam : (initialCache?.data.sortBy ?? 'latest')
  );
  const updateSortUrl = (s: 'latest' | 'rating' | 'views') => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (s === 'latest') url.searchParams.delete('sort'); else url.searchParams.set('sort', s);
    window.history.replaceState(null, '', url.toString());
  };
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isRestoredRef = useRef(!!initialCache);
  const latestStateRef = useRef<RecipesCache>({ recipes: [], page: 0, hasMore: true, sortBy: 'latest' });
  const cuisineFilterRef = useRef(cuisineFilter);
  const dishFilterRef = useRef(dishFilter);

  useEffect(() => {
    cuisineFilterRef.current = cuisineFilter;
    dishFilterRef.current = dishFilter;
  }, [cuisineFilter, dishFilter]);

  const scrollYRef = useRef(0);
  const isLeavingRef = useRef(false);

  // 최신 state 추적 (unmount cleanup 클로저 문제 해결)
  useEffect(() => {
    latestStateRef.current = { recipes, page, hasMore, sortBy };
  }, [recipes, page, hasMore, sortBy]);

  // scrollY 추적 - 링크 클릭 후엔 Next.js가 scroll reset하므로 떠나기 전 값을 고정
  useEffect(() => {
    const handleScroll = () => {
      if (!isLeavingRef.current) scrollYRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 데이터 계층 이전(docs/DATA_LAYER.md): 직접 read(recipes·cooking_sessions) + 클라 fridge match
  // → GET /api/recipes/browse (서버가 페이지네이션·냉장고 match·has_cooked 모두 처리).
  const fetchRecipes = useCallback(async (pageNum: number, sort: string, reset = false) => {
    const params = new URLSearchParams({ sort, page: String(pageNum) });
    if (cuisineFilterRef.current) params.set('cuisine_type', cuisineFilterRef.current);
    if (dishFilterRef.current) params.set('dish_type', dishFilterRef.current);

    let data: RecipeWithMatch[] | null = null;
    try {
      const res = await fetch(`/api/recipes/browse?${params.toString()}`);
      if (res.ok) data = (await res.json()).recipes as RecipeWithMatch[];
    } catch {
      // 네트워크 실패 — 아래 null 가드가 로딩 종료 처리.
    }
    if (!data) {
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (reset) {
      setRecipes(data);
    } else {
      setRecipes(prev => [...prev, ...data]);
    }

    setHasMore(data.length === RECIPES_PER_PAGE);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  // mount 1회: 캐시 복원 시 스크롤 위치 복원, 아니면 신규 fetch
  useEffect(() => {
    const cached = hasFilter ? null : load();
    if (cached) {
      setTimeout(() => window.scrollTo({ top: cached.scrollY, behavior: 'instant' }), 150);
    } else {
      fetchRecipes(0, 'latest', true); // eslint-disable-line react-hooks/set-state-in-effect -- setState calls are all after await
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 트렌딩 레시피 (이번 주 인기 = views_count 상위 4개) — 필터 적용 시 중복·혼란이라 스킵.
  // 데이터 계층 이전(docs/DATA_LAYER.md): 직접 read + fridge match → GET /api/recipes/trending.
  useEffect(() => {
    if (hasFilter) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/recipes/trending');
        if (cancelled || !res.ok) return;
        setTrending((await res.json()).recipes as RecipeWithMatch[]);
      } catch {
        // 트렌딩 실패 무시 — 스트립 미노출(원본도 data 없으면 미노출).
      }
    })();
    return () => { cancelled = true; };
  }, [hasFilter]);

  // sortBy / 카테고리 필터 변경 시 재조회 (캐시 복원 직후 첫 실행은 스킵).
  // cuisineFilter/dishFilter는 ref update effect(위)가 먼저 돌아야 fetchRecipes 내부에서 최신값을 읽는다.
  // Hook 선언 순서 = effect 실행 순서이므로 이 effect는 ref update effect보다 뒤에 있어야 함 (현재 배치 OK).
  useEffect(() => {
    if (isRestoredRef.current) {
      isRestoredRef.current = false;
      return;
    }
    clear();
    fetchRecipes(0, sortBy, true); // eslint-disable-line react-hooks/set-state-in-effect -- setState calls are all after await
  }, [sortBy, cuisineFilter, dishFilter, fetchRecipes, clear]);

  // unmount 시 현재 state 저장
  useEffect(() => {
    return () => {
      const { recipes, page, hasMore, sortBy } = latestStateRef.current;
      if (recipes.length === 0) return;
      save({ recipes, page, hasMore, sortBy }, scrollYRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecipes(nextPage, sortBy);
  }, [loadingMore, hasMore, page, sortBy, fetchRecipes]);

  useEffect(() => {
    if (loading || !hasMore || recipes.length >= MAX_RECIPES_AUTO) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, loadMore, hasMore, recipes.length]);

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />

      <main className="pt-20 md:pt-24 pb-24 md:pb-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* 제목은 sr-only — 화면엔 탭이 곧 제목. h1 요소는 SEO·스크린리더용 유지 */}
          <h1 className="sr-only">{t.recipe.allRecipes}</h1>

          {/* 전체 레시피 | 재료 기반 탭 */}
          <div role="tablist" aria-label={t.recipe.allRecipes} className="flex gap-2 mb-6">
            <button
              role="tab"
              id="recipes-tab-all"
              aria-selected={activeTab === 'all'}
              aria-controls="recipes-panel-all"
              tabIndex={activeTab === 'all' ? 0 : -1}
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-accent-warm text-background-primary'
                  : 'bg-background-secondary text-text-muted hover:text-text-primary'
              }`}
            >
              {t.recipe.allRecipes}
            </button>
            <button
              role="tab"
              id="recipes-tab-ingredient"
              aria-selected={activeTab === 'ingredient'}
              aria-controls="recipes-panel-ingredient"
              tabIndex={activeTab === 'ingredient' ? 0 : -1}
              onClick={() => setActiveTab('ingredient')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === 'ingredient'
                  ? 'bg-accent-warm text-background-primary'
                  : 'bg-background-secondary text-text-muted hover:text-text-primary'
              }`}
            >
              <span>🥬</span>
              {t.recommendations.byIngredients}
            </button>
          </div>

          {activeTab === 'ingredient' ? (
            <div role="tabpanel" id="recipes-panel-ingredient" aria-labelledby="recipes-tab-ingredient">
              <IngredientRecsView />
            </div>
          ) : (
          <div role="tabpanel" id="recipes-panel-all" aria-labelledby="recipes-tab-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              {hasFilter && (
                <p className="text-sm text-text-muted mt-0.5">
                  {cuisineFilter && `${t.home.filterCuisineLabel}: ${CUISINE_TYPES.find(c => c.value === cuisineFilter)?.label ?? cuisineFilter}`}
                  {dishFilter && `${t.home.filterDishLabel}: ${DISH_TYPES.find(d => d.value === dishFilter)?.label ?? dishFilter}`}
                  <Link href="/recipes" className="ml-2 text-accent-warm text-xs hover:underline">
                    {t.home.clearFilter}
                  </Link>
                </p>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => {
                const next = e.target.value as 'latest' | 'rating' | 'views';
                setLoading(true);
                setPage(0);
                setSortBy(next);
                updateSortUrl(next);
              }}
              className="bg-background-secondary border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none cursor-pointer"
            >
              <option value="latest">{t.recipe.sortLatest}</option>
              <option value="rating">{t.recipe.sortRating}</option>
              <option value="views">{t.recipe.sortViews}</option>
            </select>
          </div>

          {/* 카테고리 칩 — 국가별/요리별 tab toggle + 가로 스크롤 */}
          <section aria-label={t.home.categoryTitle} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-text-secondary">{t.home.categoryTitle}</h2>
              <div className="flex gap-1 bg-background-secondary rounded-full p-0.5">
                <button
                  onClick={() => setManualCategoryTab('cuisine')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    categoryTab === 'cuisine'
                      ? 'bg-accent-warm text-background-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {t.home.categoryByCuisine}
                </button>
                <button
                  onClick={() => setManualCategoryTab('dish')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    categoryTab === 'dish'
                      ? 'bg-accent-warm text-background-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {t.home.categoryByDish}
                </button>
              </div>
            </div>

            <div className="-mx-4 md:mx-0 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 px-4 md:px-0 pb-1">
                {(categoryTab === 'cuisine' ? CUISINE_TYPES : DISH_TYPES).map(({ value, label }) => {
                  const color = categoryTab === 'cuisine' ? CUISINE_COLORS[value] : DISH_COLORS[value];
                  const icon = categoryTab === 'cuisine' ? CUISINE_ICONS[value] : DISH_ICONS[value];
                  const isActive = categoryTab === 'cuisine'
                    ? cuisineFilter === value
                    : dishFilter === value;
                  // 현재 활성 칩을 다시 누르면 필터 해제(/recipes로).
                  const href = isActive
                    ? '/recipes'
                    : categoryTab === 'cuisine'
                      ? `/recipes?cuisine_type=${value}`
                      : `/recipes?dish_type=${value}`;
                  return (
                    <Link
                      key={value}
                      href={href}
                      className={`w-20 h-20 md:w-[88px] md:h-[88px] rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 ${
                        isActive ? 'border-accent-warm' : 'border-white/10'
                      }`}
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, ${color}44 0%, ${color}11 100%)`
                          : `linear-gradient(135deg, ${color}22 0%, transparent 100%)`,
                        boxShadow: isActive ? `0 0 14px ${color}44` : undefined,
                      }}
                    >
                      {categoryTab === 'cuisine' && CUISINE_IMAGES[value] ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden">
                          <SafeImage src={CUISINE_IMAGES[value]!} alt={label} width={40} height={40} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <span className="text-2xl leading-none">{icon}</span>
                      )}
                      <span className="text-[11px] font-medium text-text-secondary leading-tight text-center px-1">
                        {label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 이번 주 인기 — 필터 없을 때만 노출. 아래 전체 그리드와 구분하려 가로 스크롤 스트립 형식. */}
          {!hasFilter && trending.length > 0 && (
            <section aria-label={t.home.sectionTrending} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold">{t.home.sectionTrending}</h2>
                <button
                  onClick={() => { setLoading(true); setPage(0); setSortBy('views'); updateSortUrl('views'); }}
                  className="text-xs text-accent-warm hover:underline"
                >
                  {t.common.viewAll} →
                </button>
              </div>
              <div className="-mx-4 md:mx-0 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 px-4 md:px-0 pb-1">
                  {trending.map(recipe => (
                    <div key={recipe.id} className="w-40 md:w-48 flex-shrink-0">
                      <RecipeCard recipe={recipe} showAuthor fridgeRowMode="positive" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {loading ? (
            <RecipeCardGridSkeleton count={10} />
          ) : recipes.length === 0 ? (
            <EmptyState icon="🍳" message={t.home.noRecipes} />
          ) : (
            <>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('a')) isLeavingRef.current = true;
                }}
              >
                {recipes.map((recipe, index) => (
                  <RecipeCard key={recipe.id} recipe={recipe} showAuthor priority={index < 4} fridgeRowMode="positive" />
                ))}
              </div>

              <div ref={sentinelRef} className="mt-8 flex flex-col items-center gap-4">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                    <div className="w-4 h-4 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                    <span>{t.recipe.loadMore}</span>
                  </div>
                )}
                {hasMore && recipes.length >= MAX_RECIPES_AUTO && !loadingMore && (
                  <button
                    onClick={loadMore}
                    className="px-6 py-2.5 rounded-full border border-white/10 text-sm text-text-secondary hover:border-accent-warm/50 hover:text-accent-warm transition-colors"
                  >
                    {t.recipe.loadMore}
                  </button>
                )}
              </div>
            </>
          )}
          </div>
          )}
        </div>
      </main>

      <Footer />

      <BottomNav />
    </div>
  );
}

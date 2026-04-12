'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import RecipeCard from '@/components/RecipeCard';
import { RecipeCardGridSkeleton } from '@/components/Common/Skeleton';
import EmptyState from '@/components/Common/EmptyState';
import { createClient } from '@/lib/supabase/client';
import { type Recipe } from '@/lib/types/recipe';
import { useI18n } from '@/lib/i18n/context';
import { useScrollCache } from '@/lib/hooks/useScrollCache';

const RECIPES_PER_PAGE = 20;
const CACHE_KEY = 'scroll_cache_recipes';
const MAX_RECIPES_AUTO = 120; // 이 개수 이후엔 수동 버튼으로 전환 (DOM 누적 방지)

interface RecipesCache {
  recipes: Recipe[];
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

  const [recipes, setRecipes] = useState<Recipe[]>(initialCache?.data.recipes ?? []);
  const [loading, setLoading] = useState(!initialCache);
  const [hasMore, setHasMore] = useState(initialCache?.data.hasMore ?? true);
  const [page, setPage] = useState(initialCache?.data.page ?? 0);
  const [sortBy, setSortBy] = useState<'latest' | 'rating' | 'views'>(initialCache?.data.sortBy ?? 'latest');
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

  const fetchRecipes = useCallback(async (pageNum: number, sort: string, reset = false) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('recipes')
      .select('id, title, thumbnail_url, prep_time_minutes, cook_time_minutes, difficulty_level, average_rating, views_count, author:profiles(username), created_at')
      .eq('status', 'published');

    if (cuisineFilterRef.current) query = query.eq('cuisine_type', cuisineFilterRef.current);
    if (dishFilterRef.current) query = query.eq('dish_type', dishFilterRef.current);

    if (sort === 'latest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'rating') {
      query = query.order('average_rating', { ascending: false });
    } else if (sort === 'views') {
      query = query.order('views_count', { ascending: false });
    }

    const from = pageNum * RECIPES_PER_PAGE;
    query = query.range(from, from + RECIPES_PER_PAGE - 1);

    const { data } = await query;
    if (!data) return;

    let processedRecipes: Recipe[] = data.map(r => ({
      ...r,
      author: Array.isArray(r.author) ? r.author[0] : r.author
    }));

    if (user && processedRecipes.length > 0) {
      const recipeIds = processedRecipes.map(r => r.id);
      const { data: cookedSessions } = await supabase
        .from('cooking_sessions')
        .select('recipe_id')
        .eq('user_id', user.id)
        .in('recipe_id', recipeIds)
        .not('completed_at', 'is', null);

      const cookedRecipeIds = new Set(cookedSessions?.map(s => s.recipe_id) || []);
      processedRecipes = processedRecipes.map(r => ({
        ...r,
        has_cooked: cookedRecipeIds.has(r.id)
      }));
    }

    if (reset) {
      setRecipes(processedRecipes);
    } else {
      setRecipes(prev => [...prev, ...processedRecipes]);
    }

    setHasMore(processedRecipes.length === RECIPES_PER_PAGE);
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

  // sortBy 변경 시 (캐시 복원 직후 첫 실행은 스킵)
  useEffect(() => {
    if (isRestoredRef.current) {
      isRestoredRef.current = false;
      return;
    }
    clear();
    fetchRecipes(0, sortBy, true); // eslint-disable-line react-hooks/set-state-in-effect -- setState calls are all after await
  }, [sortBy, fetchRecipes, clear]);

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{t.recipe.allRecipes}</h1>
              {hasFilter && (
                <p className="text-sm text-text-muted mt-0.5">
                  {cuisineFilter && `국가: ${cuisineFilter}`}
                  {dishFilter && `요리: ${dishFilter}`}
                  <span className="ml-2 text-accent-warm text-xs cursor-pointer hover:underline"
                    onClick={() => { window.location.href = '/recipes'; }}>
                    필터 해제
                  </span>
                </p>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => { setLoading(true); setPage(0); setSortBy(e.target.value as 'latest' | 'rating' | 'views'); }}
              className="bg-background-secondary border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none cursor-pointer"
            >
              <option value="latest">{t.recipe.sortLatest}</option>
              <option value="rating">{t.recipe.sortRating}</option>
              <option value="views">{t.recipe.sortViews}</option>
            </select>
          </div>

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
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} showAuthor />
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
                    더 보기
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      <BottomNav />
    </div>
  );
}

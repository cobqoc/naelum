'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useScrollCache } from '@/lib/hooks/useScrollCache';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import SafeImage from '@/components/Common/SafeImage';
import { createClient } from '@/lib/supabase/client';
import { type Recipe } from '@/lib/types/recipe';
import { useI18n } from '@/lib/i18n/context';
import BottomNav from '@/components/BottomNav';

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  recipes_count: number;
}

interface SearchResults {
  recipes?: { data: Recipe[]; total: number };
  users?: { data: User[]; total: number };
  ingredients?: { data: Recipe[]; total: number };
}

interface Suggestion {
  type: string;
  value: string;
}

function SearchContent() {
  const { t } = useI18n();

  const CUISINE_OPTIONS = [
    { value: '', label: t.cuisines.all },
    { value: 'korean', label: t.cuisines.korean },
    { value: 'chinese', label: t.cuisines.chinese },
    { value: 'japanese', label: t.cuisines.japanese },
    { value: 'western', label: t.cuisines.western },
    { value: 'italian', label: t.cuisines.italian },
  ];

  const DIFFICULTY_OPTIONS = [
    { value: '', label: t.search.allDifficulties },
    { value: 'easy', label: t.recipe.easy },
    { value: 'medium', label: t.recipe.medium },
    { value: 'hard', label: t.recipe.hard },
  ];

  const TIME_OPTIONS = [
    { value: '', label: t.search.allTimes },
    { value: '15', label: t.search.within15 },
    { value: '30', label: t.search.within30 },
    { value: '60', label: t.search.within60 },
  ];
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'recipes' | 'users' | 'ingredients'>('recipes');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<{ id: string; search_query: string }[]>([]);
  const [pages, setPages] = useState({ recipes: 1, users: 1, ingredients: 1 });
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Filters
  const [cuisine, setCuisine] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [maxTime, setMaxTime] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  interface SearchCache {
    query: string;
    results: SearchResults;
    activeTab: 'recipes' | 'users' | 'ingredients';
    pages: { recipes: number; users: number; ingredients: number };
    cuisine: string;
    difficulty: string;
    maxTime: string;
  }
  const cacheKey = `scroll_cache_search_${initialQuery}`;
  const { save, load, clear: clearCache } = useScrollCache<SearchCache>(cacheKey);
  const isRestoredRef = useRef(false);
  const scrollYRef = useRef(0);
  const isLeavingRef = useRef(false);
  const latestStateRef = useRef<SearchCache>({
    query: initialQuery, results: {}, activeTab: 'recipes',
    pages: { recipes: 1, users: 1, ingredients: 1 },
    cuisine: '', difficulty: '', maxTime: '',
  });

  useEffect(() => {
    latestStateRef.current = { query, results, activeTab, pages, cuisine, difficulty, maxTime };
  }, [query, results, activeTab, pages, cuisine, difficulty, maxTime]);

  // scrollY 추적 - 링크 클릭 후엔 Next.js가 scroll reset하므로 떠나기 전 값을 고정
  useEffect(() => {
    const handleScroll = () => {
      if (!isLeavingRef.current) scrollYRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch search history
  useEffect(() => {
    fetch('/api/search/history')
      .then(res => res.json())
      .then(data => setSearchHistory(data.history || []))
      .catch(() => {});
  }, []);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (searchInput.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(searchInput)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // 검색 공통 fetch
  const fetchSearch = useCallback(async (searchQuery: string, page: number) => {
    const params = new URLSearchParams({
      q: searchQuery,
      type: 'all',
      page: String(page),
      limit: '20',
      ...(cuisine && { cuisine }),
      ...(difficulty && { difficulty }),
      ...(maxTime && { maxTime }),
    });
    const res = await fetch(`/api/search?${params}`);
    if (!res.ok) return {};
    const data = await res.json();
    return data.results || {};
  }, [cuisine, difficulty, maxTime]);

  // 검색 실행 (첫 페이지)
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({});
      return;
    }
    setLoading(true);
    setPages({ recipes: 1, users: 1, ingredients: 1 });
    try {
      const searchResults = await fetchSearch(searchQuery, 1);

      // 만들어봄 여부 추가
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const allIds = [
          ...(searchResults.recipes?.data.map((r: Recipe) => r.id) || []),
          ...(searchResults.ingredients?.data.map((r: Recipe) => r.id) || []),
        ];
        if (allIds.length > 0) {
          const { data: cooked } = await supabase
            .from('cooking_sessions')
            .select('recipe_id')
            .eq('user_id', user.id)
            .in('recipe_id', allIds)
            .not('completed_at', 'is', null);
          const cookedSet = new Set(cooked?.map(s => s.recipe_id) || []);
          if (searchResults.recipes?.data)
            searchResults.recipes.data = searchResults.recipes.data.map((r: Recipe) => ({ ...r, has_cooked: cookedSet.has(r.id) }));
          if (searchResults.ingredients?.data)
            searchResults.ingredients.data = searchResults.ingredients.data.map((r: Recipe) => ({ ...r, has_cooked: cookedSet.has(r.id) }));
        }
      }

      setResults(searchResults);
    } catch {
      setResults({});
    } finally {
      setLoading(false);
    }
  }, [fetchSearch]);

  // 더 보기
  const loadMore = useCallback(async () => {
    if (!query || loadingMore) return;
    const currentResult = results[activeTab];
    if (!currentResult || currentResult.data.length >= currentResult.total) return;
    const nextPage = pages[activeTab] + 1;
    setLoadingMore(true);
    try {
      const more = await fetchSearch(query, nextPage);
      setPages(prev => ({ ...prev, [activeTab]: nextPage }));
      setResults(prev => ({
        ...prev,
        [activeTab]: {
          total: more[activeTab]?.total ?? prev[activeTab]?.total ?? 0,
          data: [...(prev[activeTab]?.data || []), ...(more[activeTab]?.data || [])],
        },
      }));
    } catch {
      // 에러 발생 시 현재 결과 유지, 에러 바운더리로 전파하지 않음
    } finally {
      setLoadingMore(false);
    }
  }, [query, loadingMore, pages, activeTab, fetchSearch, results]);

  useEffect(() => {
    if (loading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, loadMore]);

  // mount 1회: 캐시 복원 또는 신규 검색
  useEffect(() => {
    if (!initialQuery) return;
    const cached = load();
    if (cached && cached.data.query === initialQuery) {
      isRestoredRef.current = true;
      setResults(cached.data.results);
      setActiveTab(cached.data.activeTab);
      setPages(cached.data.pages);
      setCuisine(cached.data.cuisine);
      setDifficulty(cached.data.difficulty);
      setMaxTime(cached.data.maxTime);
      setQuery(cached.data.query);
      setTimeout(() => window.scrollTo({ top: cached.scrollY, behavior: 'instant' }), 150);
    } else {
      performSearch(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // unmount 시 저장
  useEffect(() => {
    return () => {
      const s = latestStateRef.current;
      const hasData =
        (s.results.recipes?.data.length ?? 0) > 0 ||
        (s.results.users?.data.length ?? 0) > 0 ||
        (s.results.ingredients?.data.length ?? 0) > 0;
      if (!hasData) return;
      save(s, scrollYRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      clearCache();
      setQuery(searchInput.trim());
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      performSearch(searchInput.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (value: string) => {
    clearCache();
    setSearchInput(value.replace('@', ''));
    setQuery(value.replace('@', ''));
    router.push(`/search?q=${encodeURIComponent(value.replace('@', ''))}`);
    performSearch(value.replace('@', ''));
    setShowSuggestions(false);
  };

  const handleHistoryClick = (historyQuery: string) => {
    clearCache();
    setSearchInput(historyQuery);
    setQuery(historyQuery);
    router.push(`/search?q=${encodeURIComponent(historyQuery)}`);
    performSearch(historyQuery);
  };

  const clearHistory = async () => {
    await fetch('/api/search/history', { method: 'DELETE' });
    setSearchHistory([]);
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'easy': return t.recipe.easy;
      case 'medium': return t.recipe.medium;
      case 'hard': return t.recipe.hard;
      default: return level;
    }
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-secondary/90 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center gap-3">
            {/* 낼름 로고 */}
            <Link
              href="/"
              className="flex-shrink-0 text-xl font-bold text-accent-warm hover:text-accent-hover transition-colors"
            >
              낼름
            </Link>

            {/* 검색창 - 홈페이지와 동일한 디자인 */}
            <form onSubmit={handleSearch} className="relative flex-1">
              <div className={`relative w-full flex items-center gap-0 overflow-hidden bg-background-secondary transition-all duration-300 rounded-xl md:rounded-2xl [&>*]:!border-0 [&>*]:!border-l-0 [&>*]:!border-r-0 ${
                showSuggestions
                  ? 'ring-2 ring-accent-warm shadow-[0_0_20px_rgba(255,153,102,0.3)]'
                  : 'ring-1 ring-white/10 shadow-[0_0_10px_rgba(255,153,102,0.15)]'
              }`} style={{ border: 'none' }}>
                <span className="pl-3 md:pl-4 text-base text-text-muted !border-0" style={{ border: 'none', borderLeft: 'none', borderRight: 'none' }}>🔍</span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={t.search.searchPlaceholderFull}
                  className="w-full bg-transparent px-2 md:px-4 py-3 md:py-4 text-sm md:text-base text-text-primary placeholder-text-muted !outline-none !border-0 !border-none"
                  style={{ border: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none' }}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="flex-shrink-0 mr-1 text-text-muted hover:text-text-primary px-2 !border-0"
                    style={{ border: 'none', borderLeft: 'none', borderRight: 'none' }}
                  >
                    ✕
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-shrink-0 mr-2 md:mr-3 px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl bg-accent-warm font-semibold text-xs md:text-base text-background-primary transition-all hover:bg-accent-hover active:scale-95 !outline-none !border-0"
                  style={{ border: 'none', borderLeft: 'none', borderRight: 'none' }}
                >
                  {t.search.searchButton}
                </button>
              </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && !query && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-background-secondary border border-white/10 shadow-2xl overflow-hidden z-50">
                {suggestions.length > 0 ? (
                  <div className="p-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSuggestionClick(s.value)}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 rounded-lg flex items-center gap-3"
                      >
                        <span className="text-text-muted">
                          {s.type === 'recipe' ? '📖' : s.type === 'ingredient' ? '🥬' : '👤'}
                        </span>
                        <span>{s.value}</span>
                      </button>
                    ))}
                  </div>
                ) : searchHistory.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-sm text-text-muted">{t.search.recentSearches}</span>
                      <button
                        type="button"
                        onClick={clearHistory}
                        className="text-xs text-text-muted hover:text-accent-warm"
                      >
                        {t.search.deleteAll}
                      </button>
                    </div>
                    {searchHistory.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => handleHistoryClick(h.search_query)}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 rounded-lg flex items-center gap-3"
                      >
                        <span className="text-text-muted">🕒</span>
                        <span>{h.search_query}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-3 text-sm text-text-muted hover:text-accent-warm flex items-center gap-2"
          >
            <span>🎛️</span> {showFilters ? t.search.filterHide : t.search.filterShow}
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-3">
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="rounded-lg bg-background-tertiary px-4 py-2 text-sm outline-none"
              >
                {CUISINE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="rounded-lg bg-background-tertiary px-4 py-2 text-sm outline-none"
              >
                {DIFFICULTY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value)}
                className="rounded-lg bg-background-tertiary px-4 py-2 text-sm outline-none"
              >
                {TIME_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {(cuisine || difficulty || maxTime) && (
                <button
                  onClick={() => {
                    setCuisine('');
                    setDifficulty('');
                    setMaxTime('');
                  }}
                  className="text-sm text-accent-warm"
                >
                  {t.search.reset}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Results */}
      <div className="container mx-auto max-w-4xl px-6 py-6">
        {query && (
          <>
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-white/10">
              {[
                { key: 'recipes', label: t.search.tabRecipes, count: results.recipes?.total || 0 },
                { key: 'users', label: t.search.tabUsers, count: results.users?.total || 0 },
                { key: 'ingredients', label: t.search.tabIngredients, count: results.ingredients?.total || 0 },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'recipes' | 'users' | 'ingredients')}
                  className={`pb-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.key
                      ? 'border-accent-warm text-accent-warm'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div onClick={(e) => {
              if ((e.target as HTMLElement).closest('a')) isLeavingRef.current = true;
            }}>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-bounce text-2xl">🔍</div>
              </div>
            ) : (
              <>
                {/* Recipes */}
                {activeTab === 'recipes' && (
                  <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.recipes?.data.map((recipe) => (
                      <Link
                        key={recipe.id}
                        href={`/recipes/${recipe.id}`}
                        className="group rounded-2xl bg-background-secondary overflow-hidden hover:ring-2 hover:ring-accent-warm/50 transition-all"
                      >
                        <div className="relative h-40">
                          {recipe.display_image ? (
                            <SafeImage
                              src={recipe.display_image}
                              alt={recipe.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              fallback={<div className="w-full h-full flex items-center justify-center bg-background-tertiary"><span className="text-5xl">🍽️</span></div>}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-background-tertiary">
                              <span className="text-5xl">🍽️</span>
                            </div>
                          )}
                          {/* 만들어봄 배지 */}
                          {recipe.has_cooked && (
                            <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-accent-warm text-background-primary text-xs font-bold shadow-lg">
                              ✓ {t.recipe.cooked}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold mb-1 group-hover:text-accent-warm transition-colors">{recipe.title}</h3>
                          <p className="text-sm text-text-muted line-clamp-2 mb-2">{recipe.description}</p>
                          <div className="flex items-center gap-3 text-xs text-text-muted">
                            <span>⭐ {(recipe.average_rating ?? 0).toFixed(1)}</span>
                            <span>🍳 {recipe.cooked_count ?? 0}</span>
                            <span>👁️ {recipe.views_count ?? 0}</span>
                            {recipe.difficulty_level && <span>{getDifficultyLabel(recipe.difficulty_level)}</span>}
                          </div>
                        </div>
                      </Link>
                    ))}
                    {results.recipes?.data.length === 0 && (
                      <p className="col-span-2 text-center text-text-muted py-10">{t.search.noResults}</p>
                    )}
                  </div>
                  </>
                )}

                {/* Users */}
                {activeTab === 'users' && (
                  <>
                  <div className="space-y-3">
                    {results.users?.data.map((user) => (
                      <Link
                        key={user.id}
                        href={`/@${user.username}`}
                        className="flex items-center gap-4 p-4 rounded-xl bg-background-secondary hover:bg-white/5 transition-all"
                      >
                        <div className="w-14 h-14 rounded-full bg-background-tertiary overflow-hidden">
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt={user.username}
                              width={56}
                              height={56}
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold">@{user.username}</h3>
                          {user.bio && <p className="text-sm text-text-muted line-clamp-1">{user.bio}</p>}
                          <div className="flex gap-4 text-xs text-text-muted mt-1">
                            <span>{t.profile.recipes} {user.recipes_count}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {results.users?.data.length === 0 && (
                      <p className="text-center text-text-muted py-10">{t.search.noResults}</p>
                    )}
                  </div>
                  </>
                )}

                {/* Ingredients */}
                {activeTab === 'ingredients' && (
                  <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.ingredients?.data.map((recipe) => (
                      <Link
                        key={recipe.id}
                        href={`/recipes/${recipe.id}`}
                        className="group rounded-2xl bg-background-secondary overflow-hidden hover:ring-2 hover:ring-accent-warm/50 transition-all"
                      >
                        <div className="relative h-40">
                          {recipe.display_image ? (
                            <SafeImage
                              src={recipe.display_image}
                              alt={recipe.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-background-tertiary">
                              <span className="text-5xl">🍽️</span>
                            </div>
                          )}
                          {/* 만들어봄 배지 */}
                          {recipe.has_cooked && (
                            <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-accent-warm text-background-primary text-xs font-bold shadow-lg">
                              ✓ {t.recipe.cooked}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold mb-1 group-hover:text-accent-warm transition-colors">{recipe.title}</h3>
                          <p className="text-sm text-text-muted line-clamp-2">{recipe.description}</p>
                        </div>
                      </Link>
                    ))}
                    {results.ingredients?.data.length === 0 && (
                      <p className="col-span-2 text-center text-text-muted py-10">{t.search.noResultsIngredients}</p>
                    )}
                  </div>
                  </>
                )}

                {/* 무한 스크롤 sentinel */}
                <div ref={sentinelRef} className="mt-6 flex justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                      <div className="w-4 h-4 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                      <span>불러오는 중...</span>
                    </div>
                  )}
                </div>
              </>
            )}
            </div>
          </>
        )}

        {/* Empty State */}
        {!query && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-bold mb-2">{t.search.emptyTitle}</h2>
            <p className="text-text-muted">{t.search.emptySub}</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="animate-bounce text-2xl text-accent-warm">🔍</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

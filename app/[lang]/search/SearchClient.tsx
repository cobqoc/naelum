'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { hasSupabaseSessionCookie } from '@/lib/supabase/hasSessionCookie';
import { useScrollCache } from '@/lib/hooks/useScrollCache';
import { useSearchParams } from 'next/navigation';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import Link from '@/components/Common/LocalizedLink';
import Image from 'next/image';
import RecipeCard from '@/components/RecipeCard';
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
    // 비로그인(세션 쿠키 없음)은 서버가 항상 빈 히스토리로 응답 → 초기 state([]) 그대로. 요청 자체를 생략 (perf 2026-09-27).
    if (!hasSupabaseSessionCookie()) return;
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
    // 2026-10-04 [PHR-26] 드롭다운은 `!query` 일 때만 렌더되고 query 는 첫 검색 후 다시 비지 않는다 → 그동안 받은
    // 제안은 화면에 쓰이지 않으면서 타이핑마다 자동완성 API(검색 레이트리밋 공유)를 호출했다. 표시 조건과 같은 조건으로 요청만 생략(화면 동일).
    if (query) return;

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
  }, [searchInput, query]);

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

  // 2026-10-04 [PHR-25] 검색 세대 — 새 검색(질의·필터 변경)이 시작되면 그 전에 보낸 검색·더보기 응답은 버린다
  // (늦게 온 옛 필터 결과/페이지가 새 결과를 덮거나 뒤에 섞여 붙던 경쟁 차단). 요청 1개뿐인 정상 경로는 동일.
  const searchSeqRef = useRef(0);

  // 검색 실행 (첫 페이지). 데이터 계층 이전(docs/DATA_LAYER.md): has_cooked·냉장고 match 는
  // 이제 GET /api/search 가 서버에서 부착(클라 cooked read + fridge match 제거).
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({});
      return;
    }
    const seq = ++searchSeqRef.current;
    setLoading(true);
    setPages({ recipes: 1, users: 1, ingredients: 1 });
    try {
      const next = await fetchSearch(searchQuery, 1);
      if (seq === searchSeqRef.current) setResults(next);
    } catch {
      if (seq === searchSeqRef.current) setResults({});
    } finally {
      if (seq === searchSeqRef.current) setLoading(false);
    }
  }, [fetchSearch]);

  // 더 보기
  const loadMore = useCallback(async () => {
    if (!query || loadingMore) return;
    const currentResult = results[activeTab];
    if (!currentResult || currentResult.data.length >= currentResult.total) return;
    const nextPage = pages[activeTab] + 1;
    const seq = searchSeqRef.current; // [PHR-25] 이 더보기가 속한 검색 세대
    setLoadingMore(true);
    try {
      // 추가 페이지도 GET /api/search 가 has_cooked·냉장고 match 부착(서버). 클라 enrich 제거.
      const more = await fetchSearch(query, nextPage);
      if (seq !== searchSeqRef.current) return; // 그 사이 새 검색 시작 — 옛 세대 페이지는 붙이지 않음
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

  // [PHR-25] 필터(요리종류·난이도·시간) 변경 시 현재 질의로 재검색 — 옛 코드는 필터 state 만 바뀌고 결과는 그대로였고
  // 다음 "더보기" 만 새 필터로 받아 무필터 1페이지 뒤에 섞어 붙였다("초기화" 버튼도 결과 무반응).
  // 직전 필터 값과 비교해 실제로 바뀐 때만 실행 → 첫 마운트·StrictMode 재실행·질의만 바뀐 렌더는 건너뜀.
  // 캐시 복원은 아래 mount effect 가 이 ref 를 복원 필터로 맞춰 재검색하지 않게 한다(복원 결과 유지).
  const prevFiltersRef = useRef({ cuisine, difficulty, maxTime });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.cuisine === cuisine && prev.difficulty === difficulty && prev.maxTime === maxTime) return;
    prevFiltersRef.current = { cuisine, difficulty, maxTime };
    if (query) performSearch(query);
  }, [cuisine, difficulty, maxTime, query, performSearch]);

  // mount 1회: 캐시 복원 또는 신규 검색
  useEffect(() => {
    if (!initialQuery) return;
    const cached = load();
    if (cached && cached.data.query === initialQuery) {
      isRestoredRef.current = true;
      setResults(cached.data.results);
      // ingredients 탭 제거 후엔 cache에 'ingredients'가 남아있어도 'recipes'로 fallback (빈 화면 방지)
      setActiveTab(cached.data.activeTab === 'ingredients' ? 'recipes' : cached.data.activeTab);
      setPages(cached.data.pages);
      // [PHR-25] 복원 필터를 "직전 필터" 로 기록 — 필터 변경 effect 가 복원을 사용자 변경으로 오인해 재검색하지 않게
      prevFiltersRef.current = { cuisine: cached.data.cuisine, difficulty: cached.data.difficulty, maxTime: cached.data.maxTime };
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
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={t.search.searchPlaceholderFull}
                  className="w-full bg-transparent pl-4 md:pl-5 pr-2 md:pr-4 py-3 md:py-4 text-base md:text-lg text-text-primary placeholder-text-muted !outline-none !border-0 !border-none"
                  style={{ border: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none' }}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    aria-label={t.common.close}
                    className="flex-shrink-0 mr-1 text-text-muted hover:text-text-primary px-2 !border-0"
                    style={{ border: 'none', borderLeft: 'none', borderRight: 'none' }}
                  >
                    ✕
                  </button>
                )}
                <button
                  type="submit"
                  aria-label={t.search.searchButton}
                  className="flex-shrink-0 mr-2 md:mr-3 w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-accent-warm font-semibold text-background-primary transition-all hover:bg-accent-hover active:scale-95 !outline-none !border-0 flex items-center justify-center"
                  style={{ border: 'none', borderLeft: 'none', borderRight: 'none' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
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
              {(() => {
                // recipes 탭에 ingredient 매칭 레시피까지 통합 (사용자가 "양파" 검색 → 양파 들어간 레시피 한 곳에서 보게).
                // ingredients 탭은 제거 — 같은 데이터가 두 곳에 분산되는 UX 혼란 해소.
                const recipeIds = new Set((results.recipes?.data ?? []).map((r: { id: string }) => r.id));
                const extra = (results.ingredients?.data ?? []).filter((r: { id: string }) => !recipeIds.has(r.id));
                const mergedTotal = (results.recipes?.data?.length ?? 0) + extra.length;
                return [
                  { key: 'recipes', label: t.search.tabRecipes, count: mergedTotal },
                  { key: 'users', label: t.search.tabUsers, count: results.users?.total || 0 },
                ];
              })().map(tab => (
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
                {/* Recipes — recipes(title/description 매치) + ingredients(재료 매치) 통합 dedup */}
                {activeTab === 'recipes' && (() => {
                  const recipeIds = new Set((results.recipes?.data ?? []).map((r: { id: string }) => r.id));
                  const extra = (results.ingredients?.data ?? []).filter((r: { id: string }) => !recipeIds.has(r.id));
                  const mergedRecipes = [...(results.recipes?.data ?? []), ...extra];
                  return (
                  <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {mergedRecipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} showAuthor fridgeRowMode="positive" />
                    ))}
                    {mergedRecipes.length === 0 && (
                      <div className="col-span-2 sm:col-span-3 md:col-span-4 text-center py-12">
                        <div className="text-5xl mb-3">🔍</div>
                        <p className="text-text-muted mb-2">{t.search.noResults}</p>
                        <p className="text-sm text-text-muted mb-4">{t.search.noResultsHelp}</p>
                        <Link
                          href="/recipes"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent-warm text-background-primary text-sm font-medium hover:bg-accent-hover transition-colors"
                        >
                          {t.search.browseAll} →
                        </Link>
                      </div>
                    )}
                  </div>
                  </>
                  );
                })()}

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
                      <div className="text-center py-12">
                        <div className="text-5xl mb-3">🔍</div>
                        <p className="text-text-muted mb-2">{t.search.noResults}</p>
                        <p className="text-sm text-text-muted">{t.search.noResultsHelp}</p>
                      </div>
                    )}
                  </div>
                  </>
                )}

                {/* 2026-10-04 [PHR-26] 'ingredients' 탭 JSX 제거 — 탭 버튼은 recipes·users 뿐이고 캐시 복원도 'recipes' 로 치환해
                    setActiveTab('ingredients') 경로가 없는 도달 불가 분기였음(재료 매칭 결과는 위 recipes 탭에 통합 표시). */}

                {/* 무한 스크롤 sentinel */}
                <div ref={sentinelRef} className="mt-6 flex justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                      <div className="w-4 h-4 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                      <span>{t.common.loading}</span>
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

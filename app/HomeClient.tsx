'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import SearchBar from "@/components/SearchBar";
import RecipeCard from "@/components/RecipeCard";
import FridgeRecipeCard from "@/components/FridgeRecipeCard";
import Link from "next/link";
import Footer from "@/components/Footer";
import SafeImage from "@/components/Common/SafeImage";
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { CUISINE_TYPES, DISH_TYPES } from '@/lib/constants/recipe';
import dynamic from 'next/dynamic';

// 비로그인 유저용 정적 냉장고는 서버에서 즉시 렌더되도록 정적 import.
// (홈에서는 로그인 유저에게도 InteractiveFridge를 쓰지 않고 fridge recommendation 섹션을 사용)
import StaticAnonymousFridge from '@/components/Fridge/StaticAnonymousFridge';
import WaitlistForm from '@/components/WaitlistForm';

const OnboardingWizard = dynamic(() => import('@/components/Onboarding/OnboardingWizard'), {
  ssr: false,
});

const BG_EMOJIS = [
  { e: '🍳', top: '8%',  left: '7%',  size: '1.4rem', op: 0.07, dur: '28s', delay: '0s'  },
  { e: '🥕', top: '12%', left: '82%', size: '1.1rem', op: 0.06, dur: '33s', delay: '4s'  },
  { e: '🌿', top: '22%', left: '15%', size: '1.0rem', op: 0.05, dur: '38s', delay: '8s'  },
  { e: '🍜', top: '30%', left: '90%', size: '1.5rem', op: 0.06, dur: '25s', delay: '2s'  },
  { e: '🫐', top: '40%', left: '3%',  size: '1.0rem', op: 0.05, dur: '31s', delay: '6s'  },
  { e: '🧄', top: '48%', left: '75%', size: '1.2rem', op: 0.07, dur: '36s', delay: '10s' },
  { e: '🍖', top: '58%', left: '20%', size: '1.3rem', op: 0.06, dur: '29s', delay: '3s'  },
  { e: '🥦', top: '65%', left: '88%', size: '1.1rem', op: 0.05, dur: '34s', delay: '7s'  },
  // ↑ 8개: 모바일에서는 여기까지만 표시
  { e: '🍅', top: '72%', left: '10%', size: '1.4rem', op: 0.07, dur: '27s', delay: '5s'  },
  { e: '🧅', top: '80%', left: '60%', size: '1.0rem', op: 0.05, dur: '32s', delay: '9s'  },
  { e: '🫑', top: '18%', left: '50%', size: '1.2rem', op: 0.06, dur: '30s', delay: '1s'  },
  { e: '🍄', top: '35%', left: '40%', size: '1.1rem', op: 0.05, dur: '35s', delay: '11s' },
  { e: '🥚', top: '52%', left: '55%', size: '1.0rem', op: 0.06, dur: '26s', delay: '13s' },
  { e: '🧂', top: '88%', left: '30%', size: '1.3rem', op: 0.07, dur: '37s', delay: '15s' },
  { e: '🫒', top: '92%', left: '78%', size: '1.1rem', op: 0.05, dur: '29s', delay: '2s'  },
  { e: '🍋', top: '5%',  left: '40%', size: '1.2rem', op: 0.06, dur: '33s', delay: '7s'  },
  { e: '🥩', top: '75%', left: '45%', size: '1.4rem', op: 0.05, dur: '31s', delay: '12s' },
  { e: '🌶️', top: '45%', left: '28%', size: '1.0rem', op: 0.06, dur: '28s', delay: '4s'  },
] as const;

const CUISINE_IMAGES: Partial<Record<string, string>> = {
  korean: '/images/categories/korean.svg',
  chinese: '/images/categories/chinese.svg',
  italian: '/images/categories/italian.svg',
};

const CUISINE_ICONS: Record<string, string> = {
  korean: '🇰🇷',
  chinese: '🥢',
  japanese: '🍣',
  western: '🥩',
  italian: '🍝',
  french: '🥐',
  mexican: '🌮',
  indian: '🍛',
  thai: '🌶️',
  vietnamese: '🍜',
  other: '🍽️',
};

const CUISINE_COLORS: Record<string, string> = {
  korean: '#ef4444',
  chinese: '#f59e0b',
  japanese: '#ec4899',
  western: '#3b82f6',
  italian: '#22c55e',
  french: '#a855f7',
  mexican: '#f97316',
  indian: '#eab308',
  thai: '#84cc16',
  vietnamese: '#10b981',
  other: '#6b7280',
};

const DISH_ICONS: Record<string, string> = {
  main: '🍖',
  soup: '🍲',
  side: '🍱',
  noodle: '🍜',
  rice: '🍚',
  dessert: '🍰',
  beverage: '☕',
  snack: '🍿',
  salad: '🥗',
  baking: '🍞',
  other: '🍽️',
};

const DISH_COLORS: Record<string, string> = {
  main: '#ef4444',
  soup: '#f97316',
  side: '#22c55e',
  noodle: '#f59e0b',
  rice: '#84cc16',
  dessert: '#ec4899',
  beverage: '#3b82f6',
  snack: '#a855f7',
  salad: '#34d399',
  baking: '#d97706',
  other: '#6b7280',
};

export interface RecipeItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  display_image?: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  difficulty_level: string | null;
  views_count?: number;
  likes_count?: number;
  cooked_count?: number;
  average_rating?: number;
  author?: { username: string; avatar_url?: string | null };
  matchRate?: number;
  matchedCount?: number;
  totalIngredients?: number;
  missingIngredientNames?: string[];
}

export interface TipItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  category: string;
  duration_minutes: number | null;
  author?: { username: string } | null;
}

export type FeedItem =
  | { type: 'recipe' } & RecipeItem
  | { type: 'tip' } & TipItem;

function CardSkeleton() {
  return <div className="rounded-2xl bg-background-secondary animate-pulse aspect-[4/3]" />;
}

interface HomeClientProps {
  initialFeed: FeedItem[];
  initialTrending: RecipeItem[];
  /** 서버에서 fetch한 로그인 유저의 냉장고 기반 추천 (미로그인/냉장고 비어있음 시 빈 배열) */
  initialFridgeRecs: RecipeItem[];
  initialFeedOffset: number;
  /** 서버에서 fetch한 로그인 유저의 onboarding_step (미로그인/미fetch 시 null) */
  onboardingStep: number | null;
  /** 서버에서 확인한 로그인 상태 — useAuth 초기 상태 대기 없이 즉시 판단 가능 */
  isAuthenticated: boolean;
}

export default function HomeClient({
  initialFeed,
  initialTrending,
  initialFridgeRecs,
  initialFeedOffset,
  onboardingStep,
  isAuthenticated,
}: HomeClientProps) {
  const { t } = useI18n();

  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const isLoggedIn = !!user;

  // 임시 username 패턴: handle_new_user 트리거가 생성하는 user_<12hex>
  // 예: user_1f764c544d92 (UUID 앞 12자리)
  const hasTempUsername = !!authProfile?.username && /^user_[a-f0-9]{12}$/.test(authProfile.username);

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [categoryTab, setCategoryTab] = useState<'cuisine' | 'dish'>('cuisine');
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [catScrollLeft, setCatScrollLeft] = useState(false);
  const [catScrollRight, setCatScrollRight] = useState(true);
  const [catScrollPct, setCatScrollPct] = useState(0);

  const updateCatScroll = () => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCatScrollLeft(el.scrollLeft > 0);
    setCatScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    setCatScrollPct(maxScroll > 0 ? el.scrollLeft / maxScroll : 0);
  };

  // PC: 마우스 휠 → 가로 스크롤 변환
  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollBy({ left: e.deltaY * 1.5, behavior: 'auto' });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // 탭 변경 시 스크롤 초기화 + 화살표 상태 재계산
  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    requestAnimationFrame(updateCatScroll);
  }, [categoryTab]);

  // SSR/클라이언트 hydration 불일치 방지 + 모바일 감지
  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
  }, []);

  const [feedItems, setFeedItems] = useState<FeedItem[]>(initialFeed);
  const [feedLoading, setFeedLoading] = useState(initialFeed.length === 0);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const feedOffsetRef = useRef(initialFeedOffset);
  const isFetchingFeedRef = useRef(false);
  const feedSentinelRef = useRef<HTMLDivElement>(null);

  const [trendingItems, setTrendingItems] = useState<RecipeItem[]>(initialTrending);
  const [trendingLoading, setTrendingLoading] = useState(initialTrending.length === 0);

  // 서버에서 이미 fetch한 fridge 추천을 초기값으로 사용 → lazy load effect 불필요
  const [fridgeRecs] = useState<RecipeItem[]>(initialFridgeRecs);
  const [fridgeLoading] = useState(false);
  const hasFridgeItems = fridgeRecs.length > 0;

  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // 서버에서 초기 데이터를 로드했는지 추적 (첫 번째 effect 실행 시 fetch 스킵용)
  const skipInitialFetchRef = useRef(initialFeed.length > 0);
  // auth 상태 변화(undefined→userId)로 인한 불필요한 re-fetch 방지
  const feedInitializedRef = useRef(false);

  // 온보딩 / 임시 유저명 배너 표시 여부 결정
  // - 미들웨어가 이미 onboarding_completed를 서버에서 검증하므로 여기선 "나중에 하기"로
  //   스킵한 유저의 배너 표시만 판단
  // - onboarding_step < 4 이거나, handle_new_user 트리거가 만든 임시 username을 아직 쓰고 있으면 노출
  useEffect(() => {
    if (!user) return;
    const needsOnboarding = onboardingStep != null && onboardingStep < 4;
    if (!needsOnboarding && !hasTempUsername) return;
    const dismissed = localStorage.getItem(`naelum_onboarding_banner_${user.id}`);
    if (!dismissed) setShowOnboardingBanner(true);
  }, [user, onboardingStep, hasTempUsername]);

  // 스크롤 감지
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 이번 주 인기 레시피 — 서버에서 로드하지 못한 경우에만 클라이언트에서 fetch
  useEffect(() => {
    if (initialTrending.length > 0) return; // 서버에서 이미 로드함
    const load = () => {
      fetch('/api/recommendations?type=trending&limit=4')
        .then(r => r.json())
        .then(data => setTrendingItems(data.recommendations || []))
        .catch(() => {})
        .finally(() => setTrendingLoading(false));
    };
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(load, { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(load, 500);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 최신 레시피 + 팁 혼합 피드 (무한 스크롤)
  const RECIPES_PER_PAGE = 8;
  const TIPS_PER_PAGE = 4;
  const FEED_AUTO_LIMIT = 100; // 이 개수 이후엔 수동 버튼으로 전환

  const fetchFeedPage = useCallback(async (reset = false) => {
    if (isFetchingFeedRef.current) return;
    isFetchingFeedRef.current = true;

    if (reset) {
      feedOffsetRef.current = 0;
      setFeedItems([]);
      setFeedHasMore(true);
      setFeedLoading(true);
    }

    const offset = feedOffsetRef.current;

    try {
      const supabase = createClient();
      const tipOffset = Math.floor(offset / 2);

      const [{ data: recipes }, tipRes] = await Promise.all([
        supabase
          .from('recipes')
          .select('id, title, thumbnail_url, prep_time_minutes, cook_time_minutes, difficulty_level, views_count, likes_count, average_rating, author:profiles!recipes_author_id_fkey(username)')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(offset, offset + RECIPES_PER_PAGE - 1),
        fetch(`/api/tip?limit=${TIPS_PER_PAGE}&offset=${tipOffset}`)
          .then(r => r.json())
          .catch(() => ({ tips: [] })),
      ]);

      const recipeFeed: FeedItem[] = (recipes || []).map(r => ({
        type: 'recipe' as const,
        ...r,
        author: Array.isArray(r.author) ? r.author[0] : r.author,
      }));

      const tipFeed: FeedItem[] = (tipRes.tips || []).map((tip: TipItem) => ({
        type: 'tip' as const,
        ...tip,
      }));

      // 레시피 2개마다 팁 1개 끼워넣기
      const mixed: FeedItem[] = [];
      let ri = 0, ti = 0;
      while (ri < recipeFeed.length || ti < tipFeed.length) {
        if (ri < recipeFeed.length) mixed.push(recipeFeed[ri++]);
        if (ri < recipeFeed.length) mixed.push(recipeFeed[ri++]);
        if (ti < tipFeed.length) mixed.push(tipFeed[ti++]);
      }

      if (reset) {
        setFeedItems(mixed);
      } else {
        setFeedItems(prev => [...prev, ...mixed]);
      }

      feedOffsetRef.current = offset + RECIPES_PER_PAGE;
      setFeedHasMore((recipes?.length ?? 0) >= RECIPES_PER_PAGE);
    } catch {
      // ignore
    } finally {
      isFetchingFeedRef.current = false;
      setFeedLoading(false);
    }
  }, []);

  // 피드 로드 — 서버에서 초기 데이터를 받은 경우 첫 번째 fetch 스킵
  // auth 상태 변화(undefined→userId) 시 SSR 데이터를 버리지 않도록 feedInitializedRef로 보호
  useEffect(() => {
    if (feedInitializedRef.current) return; // 이미 초기화 완료 — auth 변화로 인한 재실행 무시
    feedInitializedRef.current = true;

    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return; // 서버 pre-fetch 데이터 유지
    }
    fetchFeedPage(true);
  }, [user?.id, fetchFeedPage]);

  // 무한 스크롤 - sentinel이 보이면 다음 페이지 로드 (100개 미만일 때만)
  useEffect(() => {
    const sentinel = feedSentinelRef.current;
    if (!sentinel || !feedHasMore || feedItems.length >= FEED_AUTO_LIMIT) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchFeedPage(false);
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [feedHasMore, fetchFeedPage, feedItems.length]);

  // 냉장고 추천은 서버에서 이미 fetch됨 (app/page.tsx의 fetchFridgeRecommendations).
  // 따로 useEffect 불필요 — fridgeRecs가 initialFridgeRecs로 초기화돼 즉시 렌더.

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      {mounted && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          {(isMobile ? BG_EMOJIS.slice(0, 8) : BG_EMOJIS).map((item, i) => (
            <span
              key={i}
              className="absolute select-none"
              style={{
                top: item.top,
                left: item.left,
                fontSize: item.size,
                opacity: item.op,
                animation: isMobile ? 'none' : `food-float ${item.dur} ease-in-out infinite`,
                animationDelay: isMobile ? undefined : item.delay,
              }}
            >
              {item.e}
            </span>
          ))}
        </div>
      )}
      <Header />

      {/* 온보딩 미완료 / 임시 유저명 배너 */}
      {showOnboardingBanner && (
        <div className="sticky top-16 md:top-[68px] z-30 w-full bg-accent-warm/10 border-b border-accent-warm/20 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
            <p className="text-sm text-text-secondary truncate">
              {hasTempUsername ? (
                <>
                  아직 기본 이름 <span className="font-mono text-accent-warm">@{authProfile?.username}</span>을 쓰고 있어요. <span className="text-accent-warm font-medium">진짜 이름</span>으로 바꿔볼까요?
                </>
              ) : (
                <>
                  <span className="text-accent-warm font-medium">프로필을 완성</span>하면 더 정확한 맞춤 레시피 추천을 받을 수 있어요!
                </>
              )}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowOnboardingModal(true)}
                className="text-xs font-medium text-accent-warm hover:underline whitespace-nowrap"
              >
                완성하기 →
              </button>
              <button
                onClick={() => {
                  if (user) localStorage.setItem(`naelum_onboarding_banner_${user.id}`, '1');
                  setShowOnboardingBanner(false);
                }}
                className="text-text-muted hover:text-text-primary transition-colors"
                aria-label="닫기"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 온보딩 위자드 (배너에서 열기) */}
      {showOnboardingModal && (
        <OnboardingWizard
          isOpen={showOnboardingModal}
          onClose={() => setShowOnboardingModal(false)}
          onComplete={() => {
            setShowOnboardingModal(false);
            setShowOnboardingBanner(false);
          }}
        />
      )}

      <main id="main-content" className="relative flex min-h-screen flex-col items-center px-4 md:px-6 pt-16 md:pt-20 pb-24 md:pb-12">
        {/* 배경 장식 */}
        <div className="absolute top-1/4 -left-20 h-48 w-48 md:h-64 md:w-64 rounded-full bg-accent-warm/5 md:bg-accent-warm/10 blur-[80px] md:blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 h-48 w-48 md:h-64 md:w-64 rounded-full bg-accent-warm/3 md:bg-accent-warm/5 blur-[80px] md:blur-[100px]" />

        {/* Hero */}
        <div className={`w-full max-w-2xl mt-4 md:mt-8 transition-all duration-500 ${
          isScrolled && !searchFocused ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
        } z-10`}>

          {/* 비로그인 유저용 value proposition — 첫 유저가 "뭐 하는 앱인지" 0.5초 안에 이해하도록 */}
          {!isAuthenticated && (
            <div className="text-center mb-6 px-4">
              <h1 className="text-2xl md:text-4xl font-bold text-text-primary leading-tight">
                {t.home?.tagline || '냉장고 열고 바로 만드는 한식 레시피'}
              </h1>
              <p className="mt-2 md:mt-3 text-sm md:text-base text-text-muted">
                {t.home?.taglineSub || '보유한 재료로 만들 수 있는 요리를 추천해드려요'}
              </p>
            </div>
          )}

          {/* 비로그인: 서버에서 확인 후 정적 컴포넌트로 즉시 렌더 (JS 로드/하이드레이션 대기 없음) */}
          {!isAuthenticated && (
            <>
              <div className="flex justify-center mb-6">
                <StaticAnonymousFridge />
              </div>
              {/* 이메일 수집 — 런칭 전/후 초기 유저 유치용. 검색바 아래 배치. */}
              <div className="flex justify-center mb-6">
                <WaitlistForm source="home_hero" compact />
              </div>
            </>
          )}

          <div onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}>
            <SearchBar />
          </div>
        </div>

        <div className="w-full max-w-5xl mt-4 md:mt-8 space-y-10">

          {/* 1. 카테고리 탐색 */}
          <section aria-label={t.home?.categoryTitle || '카테고리'}>
            {/* 탭 토글 */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">{t.home?.categoryTitle || '카테고리'}</h2>
              <div className="flex gap-1 bg-background-secondary rounded-full p-0.5">
                <button
                  onClick={() => setCategoryTab('cuisine')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    categoryTab === 'cuisine'
                      ? 'bg-accent-warm text-background-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {t.home?.categoryByCuisine || '국가별'}
                </button>
                <button
                  onClick={() => setCategoryTab('dish')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    categoryTab === 'dish'
                      ? 'bg-accent-warm text-background-primary'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {t.home?.categoryByDish || '요리별'}
                </button>
              </div>
            </div>

            {/* 1행 가로 스크롤 카드 */}
            <div className="relative -mx-4 overflow-hidden">
              {/* 왼쪽 페이드 + 화살표 */}
              {catScrollLeft && <>
                <div className="pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-background-primary to-transparent z-10" />
                <button
                  onClick={() => categoryScrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
                  className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-background-secondary/90 border border-white/10 text-text-secondary hover:text-text-primary shadow-lg transition-all hover:scale-110 text-lg leading-none"
                >‹</button>
              </>}
              {/* 오른쪽 페이드 + 화살표 */}
              {catScrollRight && <>
                <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-background-primary to-transparent z-10" />
                <button
                  onClick={() => categoryScrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
                  className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-background-secondary/90 border border-white/10 text-text-secondary hover:text-text-primary shadow-lg transition-all hover:scale-110 text-lg leading-none"
                >›</button>
              </>}

              {/* 스크롤 컨테이너 — 오른쪽에 반 카드 여백을 남겨 "더 있음" 암시 */}
              <div ref={categoryScrollRef} onScroll={updateCatScroll} className="overflow-x-auto scrollbar-hide px-4 pr-10">
                <div className="flex gap-2 w-max">
                  {(categoryTab === 'cuisine' ? CUISINE_TYPES : DISH_TYPES).map(({ value, label }) => {
                    const color = categoryTab === 'cuisine' ? CUISINE_COLORS[value] : DISH_COLORS[value];
                    const icon = categoryTab === 'cuisine' ? CUISINE_ICONS[value] : DISH_ICONS[value];
                    // i18n 번역 사용 — CUISINE_TYPES/DISH_TYPES의 하드코딩 한국어 label은 fallback.
                    // 이걸로 다국어 유저가 자기 언어로 카테고리를 봄 (wedge 전략 핵심).
                    const tCuisine = (t as unknown as { cuisineLabels?: Record<string, string> }).cuisineLabels;
                    const tDish = (t as unknown as { dishLabels?: Record<string, string> }).dishLabels;
                    const localizedLabel = categoryTab === 'cuisine'
                      ? (tCuisine?.[value] ?? label)
                      : (tDish?.[value] ?? label);
                    const href = categoryTab === 'cuisine'
                      ? `/recipes?cuisine_type=${value}`
                      : `/recipes?dish_type=${value}`;
                    return (
                      <Link
                        key={value}
                        href={href}
                        className="w-20 h-20 md:w-[88px] md:h-[88px] rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${color}22 0%, transparent 100%)` }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.borderColor = `${color}55`;
                          el.style.boxShadow = `0 0 14px ${color}33`;
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.borderColor = '';
                          el.style.boxShadow = '';
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
                          {localizedLabel}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 스크롤 진행 바 — 모바일/데스크탑 모두 표시 */}
            <div className="mt-2 h-0.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-warm/50 transition-all duration-150"
                style={{ width: `${Math.max(20, catScrollPct * 100)}%` }}
              />
            </div>
          </section>

          {/* 2. 냉장고 추천 (로그인 사용자) */}
          {isLoggedIn && (
            <section aria-label="냉장고 추천">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold flex items-center gap-1.5">
                    <svg width="18" height="18" viewBox="0 0 90 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="4" width="60" height="92" rx="6" fill="#5BA8B5" stroke="#111" strokeWidth="5"/>
                      <rect x="4" y="4" width="28" height="62" rx="6" fill="#4A8F9C"/>
                      <rect x="4" y="66" width="60" height="4" fill="#111"/>
                      <rect x="9" y="14" width="17" height="10" rx="2" fill="#F5C842" stroke="#111" strokeWidth="2.5"/>
                      <rect x="32" y="4" width="32" height="62" fill="#A8DDE8"/>
                      <rect x="55" y="12" width="3" height="16" rx="1" fill="#111" opacity="0.4"/>
                      <rect x="59" y="12" width="3" height="16" rx="1" fill="#111" opacity="0.4"/>
                      <ellipse cx="47" cy="30" rx="7" ry="5" fill="#C8925A" stroke="#111" strokeWidth="2"/>
                      <path d="M42 42 L52 42 L50 50 L44 50 Z" fill="#B07840" stroke="#111" strokeWidth="2"/>
                      <rect x="42" y="52" width="4" height="8" rx="1" fill="#E07070" stroke="#111" strokeWidth="2"/>
                      <rect x="48" y="52" width="4" height="8" rx="1" fill="#E07070" stroke="#111" strokeWidth="2"/>
                      <rect x="64" y="4" width="20" height="62" rx="4" fill="#5BA8B5" stroke="#111" strokeWidth="4"/>
                      <rect x="68" y="18" width="10" height="3" rx="1.5" fill="#111" opacity="0.3"/>
                      <rect x="68" y="26" width="10" height="3" rx="1.5" fill="#111" opacity="0.3"/>
                      <rect x="68" y="34" width="10" height="3" rx="1.5" fill="#111" opacity="0.3"/>
                      <rect x="28" y="20" width="8" height="14" rx="4" fill="#111"/>
                      <rect x="28" y="42" width="8" height="14" rx="4" fill="#111"/>
                      <rect x="4" y="70" width="60" height="26" rx="6" fill="#5BA8B5"/>
                      <rect x="28" y="80" width="12" height="6" rx="3" fill="#111"/>
                    </svg>
                    냉장고 재료로 만들 수 있어요
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">보유한 재료와 가장 잘 맞는 레시피</p>
                </div>
                {hasFridgeItems && (
                  <Link href="/recommendations" className="px-3 py-1 rounded-full bg-accent-warm/10 text-accent-warm text-xs font-medium hover:bg-accent-warm/20 transition-colors flex-shrink-0">더 보기 →</Link>
                )}
              </div>
              {fridgeLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : hasFridgeItems ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {fridgeRecs.map((recipe, i) => (
                    <FridgeRecipeCard key={recipe.id} recipe={recipe} priority={i === 0} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-background-secondary border border-white/5 px-6 py-8 text-center">
                  <div className="flex justify-center mb-3">
                    <svg width="52" height="52" viewBox="0 0 90 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="4" width="60" height="92" rx="6" fill="#5BA8B5" stroke="#111" strokeWidth="5"/>
                      <rect x="4" y="4" width="28" height="62" rx="6" fill="#4A8F9C"/>
                      <rect x="4" y="66" width="60" height="4" fill="#111"/>
                      <rect x="9" y="14" width="17" height="10" rx="2" fill="#F5C842" stroke="#111" strokeWidth="2.5"/>
                      <rect x="32" y="4" width="32" height="62" fill="#A8DDE8"/>
                      <rect x="55" y="12" width="3" height="16" rx="1" fill="#111" opacity="0.4"/>
                      <rect x="59" y="12" width="3" height="16" rx="1" fill="#111" opacity="0.4"/>
                      <ellipse cx="47" cy="30" rx="7" ry="5" fill="#C8925A" stroke="#111" strokeWidth="2"/>
                      <path d="M42 42 L52 42 L50 50 L44 50 Z" fill="#B07840" stroke="#111" strokeWidth="2"/>
                      <rect x="42" y="52" width="4" height="8" rx="1" fill="#E07070" stroke="#111" strokeWidth="2"/>
                      <rect x="48" y="52" width="4" height="8" rx="1" fill="#E07070" stroke="#111" strokeWidth="2"/>
                      <rect x="64" y="4" width="20" height="62" rx="4" fill="#5BA8B5" stroke="#111" strokeWidth="4"/>
                      <rect x="68" y="18" width="10" height="3" rx="1.5" fill="#111" opacity="0.3"/>
                      <rect x="68" y="26" width="10" height="3" rx="1.5" fill="#111" opacity="0.3"/>
                      <rect x="68" y="34" width="10" height="3" rx="1.5" fill="#111" opacity="0.3"/>
                      <rect x="28" y="20" width="8" height="14" rx="4" fill="#111"/>
                      <rect x="28" y="42" width="8" height="14" rx="4" fill="#111"/>
                      <rect x="4" y="70" width="60" height="26" rx="6" fill="#5BA8B5"/>
                      <rect x="28" y="80" width="12" height="6" rx="3" fill="#111"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-text-primary mb-1">냉장고가 비어있어요</p>
                  <p className="text-xs text-text-muted mb-4">재료를 등록하면 지금 바로 만들 수 있는 레시피를 추천해드려요!</p>
                  <Link
                    href="/fridge-home"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent-warm text-background-primary text-sm font-medium hover:bg-accent-hover transition-colors"
                  >
                    재료 등록하기
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* 3. 이번 주 인기 */}
          <section aria-label={t.home?.sectionTrending || '🔥 이번 주 인기'}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold">{t.home?.sectionTrending || '🔥 이번 주 인기'}</h2>
                <p className="text-xs text-text-muted mt-0.5">{t.home?.sectionTrendingSub || '가장 많이 만들어진 레시피'}</p>
              </div>
              <Link href="/recipes?sort=trending" className="px-3 py-2 min-h-[36px] flex items-center rounded-full bg-accent-warm/10 text-accent-warm text-xs font-medium hover:bg-accent-warm/20 transition-colors flex-shrink-0">더 보기 →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {trendingLoading
                ? [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
                : trendingItems.length === 0
                  ? <p className="col-span-2 md:col-span-4 text-sm text-text-muted text-center py-8">아직 데이터가 없습니다</p>
                  : trendingItems.map((recipe, i) => (
                      <RecipeCard key={recipe.id} recipe={recipe} showAuthor priority={i < 4} />
                    ))
              }
            </div>
          </section>

          {/* 4. 최신 레시피 & 팁 혼합 (무한 스크롤) */}
          <section aria-label={t.home?.sectionLatest || '✨ 최신 레시피 & 팁'}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">{t.home?.sectionLatest || '✨ 최신 레시피 & 팁'}</h2>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href="/recipes" className="px-3 py-2 min-h-[36px] flex items-center rounded-full bg-accent-warm/10 text-accent-warm text-xs font-medium hover:bg-accent-warm/20 transition-colors">레시피 전체 →</Link>
                <Link href="/tip" className="px-3 py-2 min-h-[36px] flex items-center rounded-full bg-accent-warm/10 text-accent-warm text-xs font-medium hover:bg-accent-warm/20 transition-colors">팁 전체 →</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {feedLoading && feedItems.length === 0
                ? [...Array(8)].map((_, i) => <CardSkeleton key={i} />)
                : feedItems.length === 0
                  ? <p className="col-span-2 md:col-span-3 lg:col-span-4 text-sm text-text-muted text-center py-8">{t.home.noRecipes}</p>
                  : feedItems.map((item, i) =>
                      item.type === 'recipe' ? (
                        <RecipeCard key={`r-${item.id}`} recipe={item} showAuthor priority={i < 4} />
                      ) : (
                        <Link key={`t-${item.id}`} href={`/tip/${item.id}`} className="block group">
                          <div className="rounded-2xl bg-background-secondary overflow-hidden border border-white/5 transition-all group-hover:border-accent-warm/50 group-hover:shadow-lg group-hover:shadow-accent-warm/10">
                            <div className="aspect-[4/3] w-full relative">
                              {item.thumbnail_url ? (
                                <SafeImage
                                  src={item.thumbnail_url}
                                  alt={item.title}
                                  fill
                                  className="object-cover transition-transform group-hover:scale-105"
                                  sizes="(max-width: 640px) 50vw, 33vw"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-background-tertiary flex items-center justify-center text-4xl">💡</div>
                              )}
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent-warm/90 text-background-primary text-[10px] font-bold backdrop-blur-sm">팁</div>
                            </div>
                            <div className="p-3">
                              <h3 className="font-bold text-sm truncate">{item.title}</h3>
                              {item.author && (
                                <p className="text-[11px] text-text-muted mt-1">@{item.author.username}</p>
                              )}
                              <p className="text-xs text-text-muted mt-0.5">
                                {item.category}{item.duration_minutes ? ` · ${item.duration_minutes}분` : ''}
                              </p>
                            </div>
                          </div>
                        </Link>
                      )
                    )
              }
              {/* 추가 로딩 중 skeleton */}
              {feedLoading && feedItems.length > 0 &&
                [...Array(3)].map((_, i) => <CardSkeleton key={`more-${i}`} />)
              }
            </div>

            {/* 100개 미만: 자동 로드 sentinel */}
            {feedHasMore && feedItems.length < FEED_AUTO_LIMIT && (
              <div ref={feedSentinelRef} className="h-4" />
            )}
            {/* 100개 이상: 수동 더 보기 버튼 */}
            {feedHasMore && feedItems.length >= FEED_AUTO_LIMIT && (
              <div className="flex justify-center pt-6 pb-2">
                <button
                  onClick={() => fetchFeedPage(false)}
                  disabled={feedLoading}
                  className="px-6 py-2.5 rounded-full border border-white/10 text-sm text-text-secondary hover:border-accent-warm/50 hover:text-accent-warm transition-colors disabled:opacity-50"
                >
                  {feedLoading ? '불러오는 중...' : '더 보기'}
                </button>
              </div>
            )}
            {!feedHasMore && feedItems.length > 0 && (
              <p className="text-center text-xs text-text-muted pt-6 pb-2">모든 레시피 & 팁을 불러왔습니다</p>
            )}
          </section>

        </div>
      </main>

      <Footer />

      <BottomNav />
    </div>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from '@/components/Common/LocalizedLink';
import { useScrollCache } from '@/lib/hooks/useScrollCache';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import TipCard, { TIP_CATEGORY_ICONS } from '@/components/TipCard';
import { RecipeCardGridSkeleton } from '@/components/Common/Skeleton';
import EmptyState from '@/components/Common/EmptyState';
import { useI18n } from '@/lib/i18n/context';


// 카테고리 — DB 저장 한글 값(고정 enum). '전체'는 필터 미적용 sentinel.
const CATEGORIES = ['전체', '손질법', '보관법', '조리법', '도구 사용법', '계량법', '기타'];
// 카테고리 탭 아이콘 — 6개 카테고리는 TipCard 와 단일 출처, '전체'(✨)만 추가.
const CATEGORY_ICONS: Record<string, string> = { '전체': '✨', ...TIP_CATEGORY_ICONS };

const LIMIT = 20;
const CACHE_KEY = 'scroll_cache_tips';

interface TipsCache {
  tips: TipItem[];
  offset: number;
  hasMore: boolean;
  category: string;
}

interface TipItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  category: string;
  duration_minutes: number | null;
  views_count: number;
  created_at: string;
  author: { username: string } | null;
}

export default function TipListPage() {
  const { t } = useI18n();
  const [tips, setTips] = useState<TipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [category, setCategory] = useState('전체');
  const [offset, setOffset] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { save, load, clear } = useScrollCache<TipsCache>(CACHE_KEY);
  const isRestoredRef = useRef(false);
  const latestStateRef = useRef<TipsCache>({ tips: [], offset: 0, hasMore: false, category: '전체' });
  const scrollYRef = useRef(0);
  const isLeavingRef = useRef(false);

  useEffect(() => {
    latestStateRef.current = { tips, offset, hasMore, category };
  }, [tips, offset, hasMore, category]);

  // scrollY 추적 - 링크 클릭 후엔 Next.js가 scroll reset하므로 떠나기 전 값을 고정
  useEffect(() => {
    const handleScroll = () => {
      if (!isLeavingRef.current) scrollYRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchTips = useCallback(async (cat: string, off: number, append = false) => {
    if (off === 0) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) });
      if (cat !== '전체') params.set('category', cat);
      const res = await fetch(`/api/tip?${params}`);
      const data = await res.json();
      const items: TipItem[] = data.tips || [];
      setTips(prev => append ? [...prev, ...items] : items);
      setHasMore(data.hasMore ?? false);
      setOffset(off + items.length);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // mount 1회: 캐시 복원 또는 신규 fetch
  useEffect(() => {
    const cached = load();
    if (cached) {
      isRestoredRef.current = true;
      setTips(cached.data.tips);
      setOffset(cached.data.offset);
      setHasMore(cached.data.hasMore);
      setCategory(cached.data.category);
      setLoading(false);
      setTimeout(() => window.scrollTo({ top: cached.scrollY, behavior: 'instant' }), 150);
    } else {
      fetchTips('전체', 0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // category 변경 시 (복원 직후 첫 실행 스킵)
  useEffect(() => {
    if (isRestoredRef.current) { isRestoredRef.current = false; return; }
    clear();
    setOffset(0);
    fetchTips(category, 0);
  }, [category, fetchTips, clear]);

  // unmount 시 저장
  useEffect(() => {
    return () => {
      const s = latestStateRef.current;
      if (s.tips.length === 0) return;
      save(s, scrollYRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchTips(category, offset, true);
  }, [loadingMore, hasMore, category, offset, fetchTips]);

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

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />
      <main className="container mx-auto max-w-6xl px-4 pt-20 pb-24">
        {/* 헤더 */}
        <div className="flex items-center justify-between py-6">
          <h1 className="text-2xl font-bold">{t.tip.pageTitle}</h1>
          <Link
            href="/tip/new"
            className="px-4 py-2 rounded-xl bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover transition-colors"
          >
            {t.tip.writeButton}
          </Link>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-accent-warm text-background-primary'
                  : 'bg-background-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              {CATEGORY_ICONS[cat]} {cat === '전체' ? t.tip.categoryAll : cat}
            </button>
          ))}
        </div>

        {/* 목록 */}
        {loading ? (
          <RecipeCardGridSkeleton count={8} />
        ) : tips.length === 0 ? (
          <EmptyState
            icon="💡"
            message={t.tip.emptyTitle}
            subMessage={t.tip.emptySubtitle}
            actionLabel={t.tip.emptyAction}
            actionHref="/tip/new"
          />
        ) : (
          <>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('a')) isLeavingRef.current = true;
              }}
            >
              {tips.map((tip, index) => (
                <TipCard key={tip.id} tip={tip} showAuthor priority={index < 4} />
              ))}
            </div>

            <div ref={sentinelRef} className="mt-8 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                  <div className="w-4 h-4 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                  <span>{t.common.loading}</span>
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

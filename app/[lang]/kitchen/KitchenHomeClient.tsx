'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useLocalizedRouter } from '@/lib/i18n/useLocalizedRouter';
import Link from '@/components/Common/LocalizedLink';
import KitchenViewTabs from './_components/KitchenViewTabs';

/**
 * 부엌 도감 메인 — 카테고리 카드 그리드 (V2, 2026-05-29).
 *
 * 도감의 본질: *세상의 모든 재료·도구·기법 정보* 카탈로그.
 *  - 부엌 메타포 X (그건 홈/내 냉장고 영역) — 분류 카탈로그 위주.
 *  - 한눈에 모든 카테고리 + 풍부함 시그널 (카운트·미리보기·색상 톤).
 *
 * 흐름:
 *  1. 카테고리 카드 그리드 (재료 카테고리 ~10개 + 도구·기법 "준비 중")
 *  2. 카드 클릭 → /kitchen?category=X 로 이동 (기존 그리드 페이지)
 *  3. 상단 검색바 → 입력 시 /kitchen?q=X 로 이동
 *
 * 데이터: /api/kitchen/summary 한 번 호출로 모든 카테고리 정보.
 */

interface PreviewItem {
  id: string;
  name: string;
  emoji: string | null;
}

interface CategorySummary {
  category: string;
  count: number;
  preview: PreviewItem[];
}

interface CategoryMeta {
  label: string;
  emoji: string;
  /** Tailwind 색상 톤 — 카드 배경·테두리 */
  tone: string;
}

// 카테고리 이름·이모지·색상 톤. status='pending' 카테고리는 메인에 노출 X.
const CATEGORY_META: Record<string, CategoryMeta> = {
  veggie:     { label: '채소',         emoji: '🥬', tone: 'from-green-500/10 to-green-500/5 border-green-500/30' },
  meat:       { label: '육류',         emoji: '🥩', tone: 'from-red-500/10 to-red-500/5 border-red-500/30' },
  seafood:    { label: '해산물',       emoji: '🦐', tone: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/30' },
  egg:        { label: '달걀류',       emoji: '🥚', tone: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/30' },
  dairy:      { label: '유제품',       emoji: '🥛', tone: 'from-blue-500/10 to-blue-500/5 border-blue-500/30' },
  grain:      { label: '곡류·면',      emoji: '🌾', tone: 'from-amber-500/10 to-amber-500/5 border-amber-500/30' },
  legume:     { label: '콩·견과',      emoji: '🥜', tone: 'from-orange-700/10 to-orange-700/5 border-orange-700/30' },
  fruit:      { label: '과일',         emoji: '🍎', tone: 'from-pink-500/10 to-pink-500/5 border-pink-500/30' },
  seasoning:  { label: '양념&소스',    emoji: '🥫', tone: 'from-orange-500/10 to-orange-500/5 border-orange-500/30' },
  spice:      { label: '향신료',       emoji: '🌶️', tone: 'from-red-600/10 to-red-600/5 border-red-600/30' },
  condiment:  { label: '조미료',       emoji: '🧂', tone: 'from-purple-500/10 to-purple-500/5 border-purple-500/30' },
  oil:        { label: '유지·기름',     emoji: '🫗', tone: 'from-yellow-600/10 to-yellow-600/5 border-yellow-600/30' },
  sweetener:  { label: '당류·감미료',   emoji: '🍯', tone: 'from-rose-400/10 to-rose-400/5 border-rose-400/30' },
  fermented:  { label: '발효식품',     emoji: '🍶', tone: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/30' },
  bakery:     { label: '빵·베이커리',  emoji: '🍞', tone: 'from-amber-700/10 to-amber-700/5 border-amber-700/30' },
  beverage:   { label: '음료',         emoji: '🥤', tone: 'from-sky-500/10 to-sky-500/5 border-sky-500/30' },
  snack:      { label: '간식·디저트',  emoji: '🍪', tone: 'from-rose-500/10 to-rose-500/5 border-rose-500/30' },
  processed:  { label: '가공식품',     emoji: '📦', tone: 'from-gray-500/10 to-gray-500/5 border-gray-500/30' },
  other:      { label: '기타',         emoji: '✨', tone: 'from-slate-500/10 to-slate-500/5 border-slate-500/30' },
};

export default function KitchenHomeClient() {
  const localizedRouter = useLocalizedRouter();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/kitchen/summary')
      .then(r => r.json())
      .then((data: { ingredient_categories?: CategorySummary[] }) => {
        setCategories(data.ingredient_categories ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    localizedRouter.push(`/kitchen?q=${encodeURIComponent(q)}`);
  };

  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="min-h-screen bg-background-primary">
      <Header />
      <main className="container mx-auto max-w-5xl px-4 pt-20 pb-24 md:pb-12">
        {/* 뷰 전환 탭 — 카드 그리드 / 가나다순 */}
        <div className="mb-4">
          <KitchenViewTabs active="grid" />
        </div>

        {/* 페이지 서브타이틀 — Header 에 이미 "부엌 도감" 표시 있어 중복 방지. 설명만. */}
        <p className="text-sm text-text-secondary mb-6 md:mb-8">
          세상의 모든 재료·도구·기법을 한곳에서. 사용자 입력으로 자라는 카탈로그.
        </p>

        {/* 검색바 — 도감의 핵심 사용 흐름 */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="재료·도구·기법 검색…"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-background-secondary border border-white/10 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-warm/50 focus:ring-2 focus:ring-accent-warm/20 transition-all"
            />
          </div>
        </form>

        {/* 재료 섹션 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
              🥬 재료
              <span className="text-sm font-medium text-text-muted">
                {loading ? '...' : `${totalCount}개`}
              </span>
            </h2>
            <span className="text-xs text-text-muted">사용자 입력으로 자라는 중</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-background-secondary animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center">
              <p className="text-text-secondary mb-2">아직 등록된 재료가 없어요</p>
              <Link href="/" className="text-accent-warm hover:underline text-sm">
                냉장고에서 첫 재료를 추가해보세요 →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {categories.map((cat) => {
                const meta = CATEGORY_META[cat.category] ?? CATEGORY_META.other;
                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => localizedRouter.push(`/kitchen?category=${encodeURIComponent(cat.category)}`)}
                    className={`group relative rounded-2xl border bg-gradient-to-br ${meta.tone} p-4 md:p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]`}
                  >
                    {/* 헤더 — 이모지 + 라벨 + 카운트 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl md:text-3xl" aria-hidden>{meta.emoji}</span>
                        <span className="font-bold text-base md:text-lg">{meta.label}</span>
                      </div>
                      <span className="text-2xl md:text-3xl font-extrabold tabular-nums leading-none">
                        {cat.count}
                      </span>
                    </div>

                    {/* 미리보기 이모지 — 카테고리 풍부함 시그널 */}
                    <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
                      {cat.preview.slice(0, 8).map((item) => (
                        <span
                          key={item.id}
                          className="text-lg md:text-xl"
                          title={item.name}
                          aria-label={item.name}
                        >
                          {item.emoji ?? item.name.slice(0, 1)}
                        </span>
                      ))}
                    </div>

                    {/* 화살표 — 호버 시 강조 */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted">
                      →
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 조리 도구 섹션 (준비 중) */}
        <section className="mb-8">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 mb-4">
            🍳 조리 도구·기법
            <span className="text-sm font-medium text-text-muted">준비 중</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div className="rounded-2xl border border-dashed border-white/15 bg-background-secondary/30 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl md:text-3xl opacity-50" aria-hidden>🍳</span>
                <span className="font-bold text-base md:text-lg text-text-muted">조리 도구</span>
              </div>
              <p className="text-xs text-text-muted">냄비·팬·칼·계량컵 등. 곧 추가 예정</p>
            </div>
            <div className="rounded-2xl border border-dashed border-white/15 bg-background-secondary/30 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl md:text-3xl opacity-50" aria-hidden>🔥</span>
                <span className="font-bold text-base md:text-lg text-text-muted">조리 기법</span>
              </div>
              <p className="text-xs text-text-muted">끓이기·볶기·튀기기 등. 곧 추가 예정</p>
            </div>
            <div className="rounded-2xl border border-dashed border-white/15 bg-background-secondary/30 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl md:text-3xl opacity-50" aria-hidden>📏</span>
                <span className="font-bold text-base md:text-lg text-text-muted">단위 변환</span>
              </div>
              <p className="text-xs text-text-muted">큰술↔ml↔g, 인분 조절</p>
            </div>
          </div>
        </section>

        {/* 안내 */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-background-secondary/30 p-4 text-sm text-text-muted">
          <p className="leading-relaxed">
            💡 도감은 사용자가 입력한 재료로 자랍니다. 자동완성에 없는 재료는 신규로 추가할 수 있어요.
            <br />
            관리자가 카테고리·알레르겐 검수 후 도감에 노출됩니다.
          </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

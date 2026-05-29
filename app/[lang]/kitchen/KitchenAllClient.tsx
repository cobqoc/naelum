'use client';

import { useEffect, useState } from 'react';
import Link from '@/components/Common/LocalizedLink';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useLocalizedRouter } from '@/lib/i18n/useLocalizedRouter';

/**
 * 부엌 도감 — 전체 가나다순 사전 뷰 (V2, 2026-05-29).
 *
 * 사전형 인덱스: 한글 초성(ㄱ,ㄴ,ㄷ...) 그룹화 + 영문(A-Z) 그룹화.
 * 사용자가 *전체 카탈로그* 한눈에 + *발견 흐름*에 가치.
 *
 * 라우트: /kitchen?view=all
 *
 * 데이터: /api/kitchen/all (한 번 호출로 모든 approved 재료)
 */

interface IngredientItem {
  id: string;
  name: string;
  category: string;
  emoji: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  veggie: '채소', meat: '육류', seafood: '해산물', egg: '달걀류',
  dairy: '유제품', grain: '곡류·면', legume: '콩·견과', fruit: '과일',
  seasoning: '장·양념', spice: '향신료', condiment: '소스·드레싱',
  fermented: '발효식품', bakery: '빵·베이커리', beverage: '음료',
  snack: '간식·디저트', processed: '가공식품', other: '기타',
};

/**
 * 한글 초성 추출 — 가나다 그룹화용.
 * 한글 외 문자는 'A-Z' 또는 '#' 으로 분류.
 */
function getInitialGroup(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '#';
  const c = trimmed[0];
  const code = c.charCodeAt(0);

  // 한글 음절 (가-힣)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const idx = Math.floor((code - 0xac00) / 588);
    return CHO[idx] ?? '#';
  }

  // 영문
  if (/[a-zA-Z]/.test(c)) return c.toUpperCase();

  return '#';
}

/** 정렬 우선순위 — 한글(ㄱ-ㅎ) → 영문(A-Z) → 기타(#) */
const GROUP_ORDER: string[] = [
  ...['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'],
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  '#',
];

function groupSort(a: string, b: string): number {
  const ai = GROUP_ORDER.indexOf(a);
  const bi = GROUP_ORDER.indexOf(b);
  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
}

export default function KitchenAllClient() {
  const localizedRouter = useLocalizedRouter();
  const [items, setItems] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/kitchen/all')
      .then(r => r.json())
      .then((data: { items?: IngredientItem[] }) => {
        setItems(data.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  // 그룹화 + 정렬
  const grouped = new Map<string, IngredientItem[]>();
  for (const item of items) {
    const g = getInitialGroup(item.name);
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(item);
  }
  const sortedGroups = Array.from(grouped.entries())
    .map(([group, list]) => ({
      group,
      list: list.sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    }))
    .sort((a, b) => groupSort(a.group, b.group));

  const activeGroups = sortedGroups.map(g => g.group);

  const scrollTo = (group: string) => {
    const el = document.getElementById(`group-${group}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background-primary">
      <Header />
      <main className="container mx-auto max-w-5xl px-4 pt-6 pb-24 md:pb-12">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg md:text-xl font-bold">📖 가나다순 전체 보기</h2>
            <p className="text-xs text-text-muted mt-1">
              {loading ? '...' : `총 ${items.length}개`}
            </p>
          </div>
          <Link
            href="/kitchen"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← 카드 그리드
          </Link>
        </div>

        {/* 초성 인덱스 — sticky */}
        {!loading && activeGroups.length > 0 && (
          <div className="sticky top-2 z-10 mb-6 rounded-2xl bg-background-secondary/95 backdrop-blur border border-white/10 p-2 shadow-lg">
            <div className="flex flex-wrap gap-1 justify-center">
              {activeGroups.map(group => (
                <button
                  key={group}
                  type="button"
                  onClick={() => scrollTo(group)}
                  className="px-2 py-1 rounded-md text-sm font-medium text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors min-w-[2rem]"
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 그룹별 섹션 */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-background-secondary animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center">
            <p className="text-text-secondary mb-2">아직 등록된 재료가 없어요</p>
            <Link href="/" className="text-accent-warm hover:underline text-sm">
              냉장고에서 첫 재료를 추가해보세요 →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedGroups.map(({ group, list }) => (
              <section
                key={group}
                id={`group-${group}`}
                className="scroll-mt-20"
              >
                <h3 className="text-2xl md:text-3xl font-extrabold text-accent-warm mb-3 sticky top-16 z-[5] bg-background-primary/80 backdrop-blur py-1">
                  {group}
                  <span className="text-sm font-medium text-text-muted ml-2">{list.length}개</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {list.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => localizedRouter.push(`/kitchen?category=${encodeURIComponent(item.category)}&highlight=${item.id}`)}
                      className="flex items-center gap-2 p-2 md:p-3 rounded-xl border border-white/10 bg-background-secondary hover:bg-white/5 transition-all text-left group"
                    >
                      <span className="text-xl md:text-2xl flex-shrink-0" aria-hidden>
                        {item.emoji ?? '🍽️'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm md:text-base font-medium truncate group-hover:text-accent-warm transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[10px] md:text-xs text-text-muted truncate">
                          {CATEGORY_LABEL[item.category] ?? item.category}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

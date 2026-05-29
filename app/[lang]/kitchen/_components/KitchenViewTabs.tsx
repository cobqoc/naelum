'use client';

import Link from '@/components/Common/LocalizedLink';

/**
 * 부엌 도감 — 카드/가나다순 뷰 전환 탭 (V2, 2026-05-29).
 *
 * KitchenHomeClient(카드 그리드) 와 KitchenAllClient(가나다순) 양쪽에서 공통 사용.
 * 같은 URL `/kitchen` + ?view=all 로 분기.
 */

interface KitchenViewTabsProps {
  active: 'home' | 'all';
}

export default function KitchenViewTabs({ active }: KitchenViewTabsProps) {
  return (
    <nav
      className="inline-flex rounded-xl bg-background-secondary border border-white/10 p-1"
      role="tablist"
      aria-label="부엌 도감 뷰 전환"
    >
      <Link
        href="/kitchen"
        role="tab"
        aria-selected={active === 'home'}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          active === 'home'
            ? 'bg-accent-warm text-background-primary'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        📚 카테고리
      </Link>
      <Link
        href="/kitchen?view=all"
        role="tab"
        aria-selected={active === 'all'}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          active === 'all'
            ? 'bg-accent-warm text-background-primary'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        📖 가나다순
      </Link>
    </nav>
  );
}

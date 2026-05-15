'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';

interface Restaurant {
  id: string;
  name: string;
  is_open: boolean;
  delivery_fee: number;
  min_order_price: number;
  avg_cook_time_min: number;
  rating: number;
  rating_count: number;
}

interface Stats {
  orderCount: number;
  revenue: number;
  pendingCount: number;
  preparingCount: number;
}

interface Props {
  lang: string;
  restaurant: Restaurant;
  stats: Stats;
}

function formatPrice(n: number, lang: string): string {
  return new Intl.NumberFormat(lang).format(n);
}

export default function MerchantDashboardClient({ lang, restaurant, stats }: Props) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(restaurant.is_open);
  const [toggling, setToggling] = useState(false);

  async function toggleOpen() {
    if (toggling) return;
    setToggling(true);
    const next = !isOpen;
    const supabase = createClient();
    const { error } = await supabase
      .from('delivery_restaurants')
      .update({ is_open: next })
      .eq('id', restaurant.id);
    if (!error) setIsOpen(next);
    setToggling(false);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t.merchant.title}</h1>
          <p className="text-text-muted text-sm">{restaurant.name}</p>
        </div>
        <button
          type="button"
          onClick={toggleOpen}
          disabled={toggling}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
            isOpen
              ? 'bg-success/20 text-success hover:bg-success/30'
              : 'bg-text-muted/20 text-text-muted hover:bg-text-muted/30'
          }`}
          data-testid="toggle-open"
        >
          {isOpen ? `🟢 ${t.merchant.isOpen}` : `⚪ ${t.merchant.isClosed}`}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-background-secondary border border-white/10">
          <div className="text-xs text-text-muted mb-1">{t.merchant.todayOrders}</div>
          <div className="text-2xl font-bold" data-testid="stat-orders">{stats.orderCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-background-secondary border border-white/10">
          <div className="text-xs text-text-muted mb-1">{t.merchant.todayRevenue}</div>
          <div className="text-2xl font-bold" data-testid="stat-revenue">
            {formatPrice(stats.revenue, lang)}원
          </div>
        </div>
        <div className="p-4 rounded-xl bg-background-secondary border border-white/10">
          <div className="text-xs text-text-muted mb-1">{t.merchant.pendingOrders}</div>
          <div className="text-2xl font-bold text-warning" data-testid="stat-pending">
            {stats.pendingCount}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-background-secondary border border-white/10">
          <div className="text-xs text-text-muted mb-1">{t.merchant.preparingOrders}</div>
          <div className="text-2xl font-bold text-info" data-testid="stat-preparing">
            {stats.preparingCount}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Link
          href={`/${lang}/merchant/orders`}
          className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-3"
        >
          <span className="text-2xl">🛵</span>
          <div>
            <div className="font-bold">{t.merchant.navOrders}</div>
            {stats.pendingCount > 0 && (
              <div className="text-xs text-warning">{stats.pendingCount} {t.merchant.newOrders}</div>
            )}
          </div>
        </Link>
        <Link
          href={`/${lang}/merchant/menu`}
          className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-3"
        >
          <span className="text-2xl">📋</span>
          <div className="font-bold">{t.merchant.navMenu}</div>
        </Link>
        <Link
          href={`/${lang}/merchant/restaurant`}
          className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-3"
        >
          <span className="text-2xl">🏪</span>
          <div className="font-bold">{t.merchant.navRestaurant}</div>
        </Link>
      </div>
    </div>
  );
}

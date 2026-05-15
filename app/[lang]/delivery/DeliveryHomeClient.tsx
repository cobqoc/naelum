'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import DeliveryFloatingNav from './DeliveryFloatingNav';

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  cuisine_types: string[];
  address: string | null;
  delivery_fee: number;
  min_order_price: number;
  avg_cook_time_min: number;
  rating: number;
  rating_count: number;
  is_open: boolean;
  thumbnail_url: string | null;
}

// cuisine_types DB 값(한글 카테고리명) → i18n 키 매핑. DB는 한글 유지하되 표시는 locale별.
type CuisineKey = 'cuisineKorean' | 'cuisineChinese' | 'cuisineJapanese' | 'cuisineWestern' | 'cuisineSnack' | 'cuisineVegan';
const CUISINE_LABEL: Record<string, CuisineKey> = {
  '한식': 'cuisineKorean',
  '중식': 'cuisineChinese',
  '일식': 'cuisineJapanese',
  '양식': 'cuisineWestern',
  '분식': 'cuisineSnack',
  '비건': 'cuisineVegan',
};

const FILTER_CUISINES = ['한식', '중식', '일식', '양식', '분식', '비건'];

function formatPrice(n: number, lang: string): string {
  return new Intl.NumberFormat(lang).format(n);
}

export default function DeliveryHomeClient() {
  const supabase = createClient();
  const { t, language } = useI18n();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('delivery_restaurants')
        .select(
          'id, name, description, cuisine_types, address, delivery_fee, min_order_price, avg_cook_time_min, rating, rating_count, is_open, thumbnail_url'
        )
        .eq('is_active', true)
        .order('is_open', { ascending: false })
        .order('rating', { ascending: false });

      if (cancelled) return;
      if (!error && data) setRestaurants(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filtered = useMemo(() => {
    let list = restaurants;
    if (cuisineFilter) {
      list = list.filter((r) => r.cuisine_types.includes(cuisineFilter));
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description ?? '').toLowerCase().includes(q) ||
          r.cuisine_types.some((c) => c.toLowerCase().includes(q))
      );
    }
    return list;
  }, [restaurants, query, cuisineFilter]);

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-24">
      <DeliveryFloatingNav />
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{t.delivery.title}</h1>
          <p className="text-text-muted text-sm">{t.delivery.subtitle}</p>
        </header>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.delivery.searchPlaceholder}
            className="w-full px-4 py-3 rounded-xl bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none transition-colors"
          />
        </div>

        {/* Cuisine filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          <button
            onClick={() => setCuisineFilter(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm transition-colors ${
              cuisineFilter === null
                ? 'bg-accent-warm text-background-primary font-bold'
                : 'bg-background-secondary text-text-secondary hover:bg-white/10'
            }`}
          >
            {t.delivery.filterAll}
          </button>
          {FILTER_CUISINES.map((c) => {
            const labelKey = CUISINE_LABEL[c];
            const label = labelKey ? t.delivery[labelKey] : c;
            return (
              <button
                key={c}
                onClick={() => setCuisineFilter((prev) => (prev === c ? null : c))}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm transition-colors ${
                  cuisineFilter === c
                    ? 'bg-accent-warm text-background-primary font-bold'
                    : 'bg-background-secondary text-text-secondary hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Restaurant list */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            {t.delivery.noRestaurants}
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/${language}/delivery/restaurants/${r.id}`}
                  className="block rounded-xl bg-background-secondary border border-white/10 hover:border-accent-warm/40 transition-colors overflow-hidden"
                >
                  <div className="relative aspect-[16/9] bg-background-tertiary flex items-center justify-center text-5xl">
                    {r.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.thumbnail_url} alt={r.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>🍽️</span>
                    )}
                    <span
                      className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold ${
                        r.is_open
                          ? 'bg-success/20 text-success'
                          : 'bg-text-muted/20 text-text-muted'
                      }`}
                    >
                      {r.is_open ? t.delivery.open : t.delivery.closed}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg leading-tight">{r.name}</h3>
                      <div className="flex items-center gap-1 text-sm shrink-0 ml-3">
                        <span className="text-accent-warm">★</span>
                        <span className="font-semibold">{r.rating.toFixed(1)}</span>
                        <span className="text-text-muted text-xs">({r.rating_count})</span>
                      </div>
                    </div>
                    {r.description && (
                      <p className="text-sm text-text-muted mb-3 line-clamp-2">{r.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {r.cuisine_types.map((c) => {
                        const labelKey = CUISINE_LABEL[c];
                        const label = labelKey ? t.delivery[labelKey] : c;
                        return (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded-full text-xs bg-background-tertiary text-text-secondary"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span>
                        {t.delivery.deliveryFee}{' '}
                        <span className="text-text-primary font-medium">
                          {r.delivery_fee === 0
                            ? t.delivery.free
                            : `${formatPrice(r.delivery_fee, language)}${t.delivery.won}`}
                        </span>
                      </span>
                      <span>·</span>
                      <span>
                        {t.delivery.minOrder}{' '}
                        <span className="text-text-primary font-medium">
                          {formatPrice(r.min_order_price, language)}
                          {t.delivery.won}
                        </span>
                      </span>
                      <span>·</span>
                      <span>
                        {r.avg_cook_time_min}
                        {t.delivery.minutes}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

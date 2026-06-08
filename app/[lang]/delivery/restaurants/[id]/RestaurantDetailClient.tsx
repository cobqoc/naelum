'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { addToCart } from '@/lib/delivery/cart';
import type { Restaurant, MenuCategory, MenuItem } from '@/lib/delivery/types';
import DeliveryFloatingNav from '../../DeliveryFloatingNav';
import ConfirmDialog from '@/components/Common/ConfirmDialog';

interface Props {
  restaurantId: string;
}

function formatPrice(n: number, lang: string): string {
  return new Intl.NumberFormat(lang).format(n);
}

export default function RestaurantDetailClient({ restaurantId }: Props) {
  const router = useRouter();
  const { t, language } = useI18n();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // 다른 식당 카트 교체 확인 — handleAddToCart 흐름이 사용자 확인 후 force=true로 재시도해야 함.
  // pendingReplace 에 메뉴 항목 + 기존 식당명 보관하고 ConfirmDialog 로 분기.
  const [pendingReplace, setPendingReplace] = useState<{ menuItem: MenuItem; existingRestaurantName: string } | null>(null);

  useEffect(() => {
    // 데이터 계층 이전(docs/DATA_LAYER.md): 직접 supabase read 3개 → 공개 엔드포인트 1회
    // (식당 + 메뉴 카테고리/항목을 서버에서 Promise.all 병렬·컬럼명시로 묶어 반환).
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/delivery/restaurants/${restaurantId}`);
      if (cancelled) return;
      if (!res.ok) {
        // 미존재(404)·로드 실패 → notFound (원본: restData null → notFound 와 동일).
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { restaurant: restData, categories: catData, items: itemData } = await res.json();
      if (cancelled) return;
      setRestaurant(restData);
      setCategories(catData ?? []);
      setItems(itemData ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const groupedItems = useMemo(() => {
    const groups: { category: MenuCategory | null; items: MenuItem[] }[] = [];
    for (const cat of categories) {
      const list = items.filter((i) => i.category_id === cat.id);
      if (list.length > 0) groups.push({ category: cat, items: list });
    }
    const uncategorized = items.filter((i) => !i.category_id);
    if (uncategorized.length > 0) groups.push({ category: null, items: uncategorized });
    return groups;
  }, [categories, items]);

  function showAddedToast() {
    setToast(t.delivery.cart.addedToCart);
    window.setTimeout(() => setToast(null), 1500);
  }

  function handleAddToCart(menuItem: MenuItem) {
    if (!restaurant) return;
    const result = addToCart(restaurant, menuItem, 1, false);
    if (!result.ok && result.reason === 'different_restaurant') {
      // 사용자 확인이 필요 — ConfirmDialog 띄우고, onConfirm 에서 force=true 로 재시도.
      setPendingReplace({ menuItem, existingRestaurantName: result.existingRestaurantName ?? '' });
      return;
    }
    showAddedToast();
  }

  function confirmReplace() {
    if (!restaurant || !pendingReplace) return;
    addToCart(restaurant, pendingReplace.menuItem, 1, true);
    setPendingReplace(null);
    showAddedToast();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !restaurant) {
    return (
      <div className="min-h-screen bg-background-primary text-text-primary p-6">
        <Link href={`/${language}/delivery`} className="text-accent-warm">
          ← {t.delivery.backToList}
        </Link>
        <p className="mt-8 text-center text-text-muted">{t.delivery.noRestaurants}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-24">
      <DeliveryFloatingNav />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Link href={`/${language}/delivery`} className="text-accent-warm text-sm">
          ← {t.delivery.backToList}
        </Link>

        {/* Header */}
        <header className="mt-4 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1" data-testid="restaurant-name">
                {restaurant.name}
              </h1>
              {restaurant.description && (
                <p className="text-text-muted text-sm mb-3">{restaurant.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <span className="text-accent-warm">★</span>
                  <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
                  <span className="text-text-muted text-xs">({restaurant.rating_count})</span>
                </span>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted">
                  {t.delivery.deliveryFee}{' '}
                  <span className="text-text-primary font-medium">
                    {restaurant.delivery_fee === 0
                      ? t.delivery.free
                      : `${formatPrice(restaurant.delivery_fee, language)}${t.delivery.won}`}
                  </span>
                </span>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted">
                  {t.delivery.minOrder}{' '}
                  <span className="text-text-primary font-medium">
                    {formatPrice(restaurant.min_order_price, language)}
                    {t.delivery.won}
                  </span>
                </span>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted">
                  {restaurant.avg_cook_time_min}
                  {t.delivery.minutes}
                </span>
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                restaurant.is_open
                  ? 'bg-success/20 text-success'
                  : 'bg-text-muted/20 text-text-muted'
              }`}
            >
              {restaurant.is_open ? t.delivery.open : t.delivery.closed}
            </span>
          </div>
        </header>

        {/* Menu groups */}
        {groupedItems.length === 0 ? (
          <p className="text-center py-16 text-text-muted">{t.delivery.noMenu}</p>
        ) : (
          <div className="space-y-8">
            {groupedItems.map((group, idx) => (
              <section key={group.category?.id ?? `uncat-${idx}`}>
                {group.category && (
                  <h2 className="text-lg font-bold mb-3">{group.category.name}</h2>
                )}
                <ul className="divide-y divide-white/10 rounded-xl bg-background-secondary border border-white/10 overflow-hidden">
                  {group.items.map((m) => (
                    <li key={m.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{m.name}</h3>
                          {m.is_popular && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent-warm/20 text-accent-warm font-bold">
                              {t.delivery.popular}
                            </span>
                          )}
                        </div>
                        {m.description && (
                          <p className="text-sm text-text-muted line-clamp-2 mb-2">{m.description}</p>
                        )}
                        <div className="font-bold text-accent-warm">
                          {formatPrice(m.price, language)}
                          {t.delivery.won}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(m)}
                        disabled={!m.is_available || !restaurant.is_open}
                        className="shrink-0 px-4 py-2 rounded-lg bg-accent-warm text-background-primary font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-warm/90 transition-colors"
                        data-testid={`add-to-cart-${m.id}`}
                      >
                        {m.is_available ? t.delivery.addToCart : t.delivery.soldOut}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {/* Cart shortcut for desktop */}
        <div className="mt-8">
          <button
            type="button"
            onClick={() => router.push(`/${language}/delivery/cart`)}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-background-secondary border border-white/10 hover:border-accent-warm/40 transition-colors"
          >
            {t.delivery.cart.title}
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-accent-warm text-background-primary font-bold text-sm shadow-lg z-50"
            role="status"
            data-testid="cart-toast"
          >
            {toast}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={pendingReplace !== null}
        title={t.delivery.cart.differentRestaurantConfirm.replace('{name}', pendingReplace?.existingRestaurantName ?? '')}
        destructive
        onConfirm={confirmReplace}
        onCancel={() => setPendingReplace(null)}
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { fetchOrders } from '@/lib/delivery/api';
import { inferStatus } from '@/lib/delivery/orders';
import type { Order } from '@/lib/delivery/types';
import DeliveryFloatingNav from '../DeliveryFloatingNav';

function formatPrice(n: number, lang: string): string {
  return new Intl.NumberFormat(lang).format(n);
}

function formatDateTime(iso: string, lang: string): string {
  try {
    return new Intl.DateTimeFormat(lang, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function OrdersListClient() {
  const router = useRouter();
  const { t, language } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 비로그인 redirect
  useEffect(() => {
    if (!authLoading && !user) {
      const redirect = encodeURIComponent(`/${language}/delivery/orders`);
      router.replace(`/${language}/signin?redirect=${redirect}`);
    }
  }, [authLoading, user, router, language]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchOrders();
        if (!cancelled) {
          setOrders(list);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isEmpty = orders.length === 0;

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-24">
      <DeliveryFloatingNav />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Link href={`/${language}/delivery`} className="text-accent-warm text-sm">
          ← {t.delivery.backToList}
        </Link>

        <header className="mt-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">{t.delivery.order.listTitle}</h1>
        </header>

        {error && (
          <div className="text-sm text-error bg-error/10 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {isEmpty ? (
          <div className="text-center py-16">
            <p className="text-text-muted" data-testid="orders-empty">
              {t.delivery.order.noOrders}
            </p>
          </div>
        ) : (
          <ul className="space-y-3" data-testid="orders-list">
            {orders.map((o) => {
              const status = inferStatus(o);
              return (
                <li key={o.id}>
                  <Link
                    href={`/${language}/delivery/orders/${o.id}`}
                    className="block rounded-xl bg-background-secondary border border-white/10 hover:border-accent-warm/40 transition-colors p-4"
                    data-testid={`order-item-${o.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-bold">{o.restaurantName}</h3>
                        <div className="text-xs text-text-muted">
                          {formatDateTime(o.placedAt, language)} · {o.orderNumber}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                          status === 'delivered'
                            ? 'bg-success/20 text-success'
                            : status === 'cancelled'
                            ? 'bg-error/20 text-error'
                            : 'bg-accent-warm/20 text-accent-warm'
                        }`}
                      >
                        {t.delivery.status[status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted truncate mr-3">
                        {o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                      </span>
                      <span className="font-bold shrink-0">
                        {formatPrice(o.total, language)}
                        {t.delivery.won}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

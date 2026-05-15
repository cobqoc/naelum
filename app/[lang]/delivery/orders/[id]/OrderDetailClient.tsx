'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/client';
import { fetchOrder, cancelOrder } from '@/lib/delivery/api';
import { inferStatus } from '@/lib/delivery/orders';
import type { Order, OrderStatus } from '@/lib/delivery/types';
import DeliveryFloatingNav from '../../DeliveryFloatingNav';

interface Props {
  orderId: string;
}

const STATUS_FLOW: OrderStatus[] = ['paid', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered'];

function formatPrice(n: number, lang: string): string {
  return new Intl.NumberFormat(lang).format(n);
}

function formatDateTime(iso: string, lang: string): string {
  try {
    return new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// 데모용 — 15초마다 갱신되는 현재 시각을 외부 store로 노출 (상태 진행 시각화).
const _nowSubscribers = new Set<() => void>();
let _nowTimer: ReturnType<typeof setInterval> | null = null;
let _now = new Date();
function _ensureTimer() {
  if (_nowTimer || typeof window === 'undefined') return;
  _nowTimer = setInterval(() => {
    _now = new Date();
    _nowSubscribers.forEach((fn) => fn());
  }, 15_000);
}
function subscribeNow(cb: () => void): () => void {
  _ensureTimer();
  _nowSubscribers.add(cb);
  return () => {
    _nowSubscribers.delete(cb);
    if (_nowSubscribers.size === 0 && _nowTimer) {
      clearInterval(_nowTimer);
      _nowTimer = null;
    }
  };
}
function getNowSnapshot(): Date {
  return _now;
}
function getNowServerSnapshot(): Date {
  return new Date(0);
}

export default function OrderDetailClient({ orderId }: Props) {
  const router = useRouter();
  const { t, language } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const now = useSyncExternalStore(subscribeNow, getNowSnapshot, getNowServerSnapshot);

  // 비로그인 시 로그인 페이지로
  useEffect(() => {
    if (!authLoading && !user) {
      const redirect = encodeURIComponent(`/${language}/delivery/orders/${orderId}`);
      router.replace(`/${language}/login?redirect=${redirect}`);
    }
  }, [authLoading, user, router, language, orderId]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const o = await fetchOrder(createClient(), orderId);
        if (!cancelled) {
          setOrder(o);
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
  }, [user, orderId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // useEffect가 redirect
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background-primary text-text-primary p-6">
        <Link href={`/${language}/delivery/orders`} className="text-accent-warm">
          ← {t.delivery.order.listTitle}
        </Link>
        <p className="mt-8 text-center text-text-muted" data-testid="order-not-found">
          {error ?? t.delivery.order.notFound}
        </p>
      </div>
    );
  }

  const currentStatus: OrderStatus = inferStatus(order, now);
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);
  const isCancelled = order.status === 'cancelled' || currentStatus === 'cancelled';

  async function handleCancel() {
    if (!order) return;
    // eslint-disable-next-line no-alert
    if (!confirm(t.delivery.order.cancelConfirm)) return;
    try {
      await cancelOrder(createClient(), order.id);
      setOrder({ ...order, status: 'cancelled' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    }
  }

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-24">
      <DeliveryFloatingNav />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Link href={`/${language}/delivery/orders`} className="text-accent-warm text-sm">
          ← {t.delivery.order.listTitle}
        </Link>

        <header className="mt-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="order-detail-title">
            {t.delivery.order.detailTitle}
          </h1>
          <div className="text-text-muted text-sm mt-1" data-testid="order-number">
            {t.delivery.order.orderNumber}: {order.orderNumber}
          </div>
        </header>

        {/* Status stepper */}
        <section className="rounded-xl bg-background-secondary border border-white/10 p-4 mb-6">
          <div className="flex items-center justify-between text-xs mb-3">
            <span data-testid="current-status" className="font-bold text-accent-warm">
              {t.delivery.status[currentStatus]}
            </span>
            <span className="text-text-muted">
              {t.delivery.order.estimatedDelivery}: {formatDateTime(order.estimatedDeliveryAt, language)}
            </span>
          </div>
          {isCancelled ? (
            <p className="text-error text-sm">{t.delivery.status.cancelled}</p>
          ) : (
            <ol className="flex items-center justify-between">
              {STATUS_FLOW.map((s, idx) => {
                const passed = idx <= currentIdx;
                return (
                  <li key={s} className="flex flex-col items-center text-center flex-1 relative">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        passed ? 'bg-accent-warm' : 'bg-background-tertiary'
                      }`}
                    />
                    <span
                      className={`text-[10px] mt-1 ${
                        passed ? 'text-text-primary font-medium' : 'text-text-muted'
                      }`}
                    >
                      {t.delivery.status[s]}
                    </span>
                    {idx < STATUS_FLOW.length - 1 && (
                      <span
                        className={`absolute top-1.5 left-1/2 w-full h-0.5 ${
                          idx < currentIdx ? 'bg-accent-warm' : 'bg-background-tertiary'
                        }`}
                        style={{ zIndex: -1 }}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Items */}
        <section className="rounded-xl bg-background-secondary border border-white/10 p-4 mb-6">
          <h2 className="font-bold mb-3">{t.delivery.order.itemsLabel}</h2>
          <div className="text-sm text-text-muted mb-3">
            {t.delivery.order.restaurantLabel}: <span className="text-text-primary font-medium">{order.restaurantName}</span>
          </div>
          <ul className="space-y-1 text-sm">
            {order.items.map((i) => (
              <li key={i.menuItemId} className="flex items-center justify-between">
                <span>
                  {i.name} <span className="text-text-muted">× {i.quantity}</span>
                </span>
                <span>
                  {formatPrice(i.price * i.quantity, language)}
                  {t.delivery.won}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-white/10 mt-3 pt-3 flex items-center justify-between font-bold">
            <span>{t.delivery.order.totalAmount}</span>
            <span data-testid="order-total">
              {formatPrice(order.total, language)}
              {t.delivery.won}
            </span>
          </div>
        </section>

        {/* Address */}
        <section className="rounded-xl bg-background-secondary border border-white/10 p-4 mb-6 text-sm space-y-1">
          <h2 className="font-bold mb-2 text-base">{t.delivery.order.addressLabel}</h2>
          <div>
            <span className="text-text-muted">{t.delivery.checkout.recipientName}:</span>{' '}
            {order.address.recipientName} ({order.address.recipientPhone})
          </div>
          <div>
            <span className="text-text-muted">{t.delivery.checkout.roadAddress}:</span>{' '}
            {order.address.roadAddress} {order.address.detail}
          </div>
          {order.requestNote && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <span className="text-text-muted">{t.delivery.order.requestNoteLabel}:</span>{' '}
              {order.requestNote}
            </div>
          )}
        </section>

        {/* Cancel — paid/accepted/preparing 단계까지만 */}
        {!isCancelled && (currentStatus === 'paid' || currentStatus === 'accepted' || currentStatus === 'preparing') && (
          <button
            type="button"
            onClick={handleCancel}
            className="w-full px-6 py-3 rounded-xl bg-error/10 text-error font-bold hover:bg-error/20 transition-colors"
            data-testid="cancel-order"
          >
            {t.delivery.order.cancelOrder}
          </button>
        )}

        <div className="mt-4">
          <Link
            href={`/${language}/delivery/orders`}
            className="block w-full text-center px-6 py-3 rounded-xl bg-background-secondary border border-white/10 hover:bg-white/5 transition-colors"
          >
            {t.delivery.order.goToOrderList}
          </Link>
        </div>
      </div>
    </div>
  );
}

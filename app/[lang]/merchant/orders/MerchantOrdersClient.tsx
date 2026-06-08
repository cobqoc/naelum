'use client';

import { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { updateOrderStatus } from '@/lib/delivery/api';
import type { OrderStatus } from '@/lib/delivery/types';

interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  address_snapshot: { recipientName?: string; roadAddress?: string; detail?: string; recipientPhone?: string };
  request_note: string | null;
  placed_at: string;
  items: { name: string; quantity: number }[];
}

interface Props {
  restaurantName: string;
}

function formatPrice(n: number, lang: string): string {
  return new Intl.NumberFormat(lang).format(n);
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function MerchantOrdersClient({ restaurantName }: Props) {
  const { t, language } = useI18n();
  const supabase = createClient();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 계층 이전(docs/DATA_LAYER.md): 직접 supabase read 2개 → 서버 엔드포인트.
  // 소유 식당은 owner_id 로 서버가 재유도하므로 restaurantId 전달 불필요.
  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery/merchant/orders');
      if (!res.ok) {
        const msg = await res.json().then((b) => b.error).catch(() => String(res.status));
        setError(msg ?? 'Failed');
        setLoading(false);
        return;
      }
      const { orders: data } = await res.json();
      setOrders(data as OrderRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 30초 polling으로 자동 갱신. 초기 로드는 setTimeout(0)으로 effect body 외부로 이동해
    // react-hooks/set-state-in-effect 회피.
    const initial = window.setTimeout(() => load(), 0);
    const timer = window.setInterval(() => load(), 30_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  async function changeStatus(orderId: string, newStatus: OrderStatus) {
    try {
      await updateOrderStatus(supabase, orderId, newStatus);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  const buckets = {
    paid: orders.filter((o) => o.status === 'paid'),
    accepted: orders.filter((o) => o.status === 'accepted'),
    preparing: orders.filter((o) => o.status === 'preparing'),
    ready: orders.filter((o) => o.status === 'ready'),
    other: orders.filter((o) =>
      !['paid', 'accepted', 'preparing', 'ready'].includes(o.status)
    ),
  };

  function StatusActions({ order }: { order: OrderRow }) {
    if (order.status === 'paid') {
      return (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => changeStatus(order.id, 'accepted')}
            className="px-3 py-1.5 rounded-lg bg-accent-warm text-background-primary text-xs font-bold"
            data-testid={`accept-${order.id}`}
          >
            {t.merchant.orderActionAccept}
          </button>
          <button
            type="button"
            onClick={() => changeStatus(order.id, 'cancelled')}
            className="px-3 py-1.5 rounded-lg bg-error/10 text-error text-xs"
            data-testid={`reject-${order.id}`}
          >
            {t.merchant.orderActionReject}
          </button>
        </div>
      );
    }
    if (order.status === 'accepted') {
      return (
        <button
          type="button"
          onClick={() => changeStatus(order.id, 'preparing')}
          className="px-3 py-1.5 rounded-lg bg-info text-white text-xs font-bold"
          data-testid={`start-${order.id}`}
        >
          {t.merchant.orderActionStartCooking}
        </button>
      );
    }
    if (order.status === 'preparing') {
      return (
        <button
          type="button"
          onClick={() => changeStatus(order.id, 'ready')}
          className="px-3 py-1.5 rounded-lg bg-success text-white text-xs font-bold"
          data-testid={`ready-${order.id}`}
        >
          {t.merchant.orderActionReady}
        </button>
      );
    }
    return null;
  }

  function OrderCard({ order }: { order: OrderRow }) {
    return (
      <li className="rounded-xl bg-background-secondary border border-white/10 p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-xs text-text-muted">
              {order.order_number} · {formatTime(order.placed_at)}
            </div>
            <div className="font-bold">
              {formatPrice(order.total, language)}원
            </div>
          </div>
          <span className="px-2 py-1 rounded text-xs font-bold bg-accent-warm/20 text-accent-warm">
            {t.delivery.status[order.status]}
          </span>
        </div>
        <ul className="text-sm space-y-0.5 mb-2">
          {order.items.map((i, idx) => (
            <li key={idx}>
              {i.name} × {i.quantity}
            </li>
          ))}
        </ul>
        <div className="text-xs text-text-muted mb-2">
          {order.address_snapshot?.recipientName} ({order.address_snapshot?.recipientPhone}) ·{' '}
          {order.address_snapshot?.roadAddress} {order.address_snapshot?.detail}
        </div>
        {order.request_note && (
          <div className="text-xs text-warning bg-warning/10 rounded p-2 mb-2">
            📝 {order.request_note}
          </div>
        )}
        <StatusActions order={order} />
      </li>
    );
  }

  return (
    <div className="max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t.merchant.navOrders}</h1>
        <p className="text-text-muted text-sm">{restaurantName}</p>
      </header>

      {error && (
        <div className="text-sm text-error bg-error/10 rounded-lg p-3 mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-text-muted py-16" data-testid="merchant-orders-empty">
          {t.merchant.emptyOrders}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* paid - 신규 */}
          <div data-testid="bucket-paid">
            <h2 className="text-xs font-bold text-text-muted uppercase mb-2">
              {t.delivery.status.paid} ({buckets.paid.length})
            </h2>
            <ul className="space-y-3">
              {buckets.paid.map((o) => <OrderCard key={o.id} order={o} />)}
            </ul>
          </div>
          {/* accepted */}
          <div data-testid="bucket-accepted">
            <h2 className="text-xs font-bold text-text-muted uppercase mb-2">
              {t.delivery.status.accepted} ({buckets.accepted.length})
            </h2>
            <ul className="space-y-3">
              {buckets.accepted.map((o) => <OrderCard key={o.id} order={o} />)}
            </ul>
          </div>
          {/* preparing */}
          <div data-testid="bucket-preparing">
            <h2 className="text-xs font-bold text-text-muted uppercase mb-2">
              {t.delivery.status.preparing} ({buckets.preparing.length})
            </h2>
            <ul className="space-y-3">
              {buckets.preparing.map((o) => <OrderCard key={o.id} order={o} />)}
            </ul>
          </div>
          {/* ready - 픽업 대기 */}
          <div data-testid="bucket-ready">
            <h2 className="text-xs font-bold text-text-muted uppercase mb-2">
              {t.delivery.status.ready} ({buckets.ready.length})
            </h2>
            <ul className="space-y-3">
              {buckets.ready.map((o) => <OrderCard key={o.id} order={o} />)}
            </ul>
          </div>
          {/* other 상태 */}
          {buckets.other.length > 0 && (
            <div className="md:col-span-2 lg:col-span-4">
              <h2 className="text-xs font-bold text-text-muted uppercase mb-2">기타</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {buckets.other.map((o) => <OrderCard key={o.id} order={o} />)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

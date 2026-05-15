'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { updateOrderStatus } from '@/lib/delivery/api';

interface RiderProfile {
  user_id: string;
  status: string; // offline | online | busy
  vehicle_type: string | null;
  total_deliveries: number;
  rating: number;
}

interface AvailableOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  delivery_fee: number;
  address_snapshot: { roadAddress?: string; detail?: string };
  placed_at: string;
  restaurant: { name: string; address: string | null } | null;
}

interface CurrentOrder extends AvailableOrder {
  request_note: string | null;
}

interface Props {
  lang: string;
  userId: string;
  userEmail: string;
  initialProfile: RiderProfile | null;
}

const VEHICLE_OPTIONS: { value: string; labelKey: 'vehicleMotorcycle' | 'vehicleBicycle' | 'vehicleCar' | 'vehicleWalk'; emoji: string }[] = [
  { value: 'motorcycle', labelKey: 'vehicleMotorcycle', emoji: '🏍️' },
  { value: 'bicycle', labelKey: 'vehicleBicycle', emoji: '🚲' },
  { value: 'car', labelKey: 'vehicleCar', emoji: '🚗' },
  { value: 'walk', labelKey: 'vehicleWalk', emoji: '🚶' },
];

export default function RiderHomeClient({ lang, userId, userEmail, initialProfile }: Props) {
  const { t } = useI18n();
  const supabase = createClient();
  const [profile, setProfile] = useState<RiderProfile | null>(initialProfile);
  const [available, setAvailable] = useState<AvailableOrder[]>([]);
  const [current, setCurrent] = useState<CurrentOrder | null>(null);
  const [loading, setLoading] = useState(!!initialProfile);
  const [error, setError] = useState<string | null>(null);

  const refreshOrders = useCallback(async () => {
    if (!profile) return;
    // 1) 본인이 배차받은 진행 중인 주문
    const { data: myOrder } = await supabase
      .from('delivery_orders')
      .select('id, order_number, status, total, delivery_fee, address_snapshot, request_note, placed_at, restaurant:delivery_restaurants(name, address)')
      .eq('rider_id', userId)
      .in('status', ['ready', 'picked_up'])
      .order('placed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setCurrent((myOrder as unknown as CurrentOrder) ?? null);

    // 2) 배차 가능한 ready 상태 주문 (라이더 미배정)
    if (!myOrder && profile.status === 'online') {
      const { data: openOrders } = await supabase
        .from('delivery_orders')
        .select('id, order_number, status, total, delivery_fee, address_snapshot, placed_at, restaurant:delivery_restaurants(name, address)')
        .eq('status', 'ready')
        .is('rider_id', null)
        .order('placed_at', { ascending: true })
        .limit(20);
      setAvailable((openOrders as unknown as AvailableOrder[]) ?? []);
    } else {
      setAvailable([]);
    }
  }, [supabase, userId, profile]);

  useEffect(() => {
    if (!profile) return;
    // 초기 로드 + 15초 polling. setState-in-effect 회피하려 setTimeout으로 effect body 외부로.
    const initial = window.setTimeout(() => {
      refreshOrders().finally(() => setLoading(false));
    }, 0);
    const timer = window.setInterval(refreshOrders, 15_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [profile, refreshOrders]);

  async function setupProfile(vehicle: string) {
    const { data, error: err } = await supabase
      .from('delivery_rider_profiles')
      .insert({ user_id: userId, vehicle_type: vehicle, status: 'offline' })
      .select('*')
      .single();
    if (err) setError(err.message);
    else setProfile(data as RiderProfile);
  }

  async function toggleOnline() {
    if (!profile) return;
    const next = profile.status === 'offline' ? 'online' : 'offline';
    const { error: err } = await supabase
      .from('delivery_rider_profiles')
      .update({ status: next, last_seen_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (err) setError(err.message);
    else setProfile({ ...profile, status: next });
  }

  async function acceptDispatch(orderId: string) {
    // 라이더 배차 — orders.rider_id 설정 + status는 ready 유지 (배달 시작 시 picked_up)
    const { error: err } = await supabase
      .from('delivery_orders')
      .update({ rider_id: userId })
      .eq('id', orderId)
      .is('rider_id', null); // race condition 방어
    if (err) {
      setError(err.message);
    } else {
      refreshOrders();
    }
  }

  async function markPickedUp(orderId: string) {
    try {
      await updateOrderStatus(supabase, orderId, 'picked_up');
      refreshOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function markDelivered(orderId: string) {
    try {
      await updateOrderStatus(supabase, orderId, 'delivered');
      refreshOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  // Setup 화면 — 라이더 프로필 없을 때
  if (!profile) {
    return (
      <div className="min-h-screen bg-background-primary text-text-primary p-6">
        <div className="max-w-md mx-auto mt-12">
          <Link href={`/${lang}/admin`} className="text-accent-warm text-sm">
            ← Admin
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-2">{t.rider.setupTitle}</h1>
          <p className="text-text-muted text-sm mb-6">{t.rider.setupSubtitle}</p>
          {error && <div className="text-sm text-error bg-error/10 rounded-lg p-3 mb-4">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            {VEHICLE_OPTIONS.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setupProfile(v.value)}
                className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:border-accent-warm/40 transition-colors text-center"
                data-testid={`vehicle-${v.value}`}
              >
                <div className="text-3xl mb-2">{v.emoji}</div>
                <div className="text-sm font-bold">{t.rider[v.labelKey]}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary text-text-primary p-4 md:p-6">
      <header className="max-w-3xl mx-auto mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <Link href={`/${lang}/admin`} className="text-accent-warm text-sm">
              ← Admin
            </Link>
            <h1 className="text-2xl font-bold mt-1">{t.rider.title}</h1>
            <div className="text-xs text-text-muted">
              {userEmail} ·{' '}
              {VEHICLE_OPTIONS.find((v) => v.value === profile.vehicle_type)?.emoji}
              {profile.vehicle_type && t.rider[VEHICLE_OPTIONS.find((v) => v.value === profile.vehicle_type)!.labelKey]}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleOnline}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-colors ${
              profile.status === 'online'
                ? 'bg-success text-white hover:bg-success/90'
                : 'bg-background-secondary border border-white/10 text-text-secondary hover:bg-white/5'
            }`}
            data-testid="rider-toggle"
          >
            {profile.status === 'online' ? `🟢 ${t.rider.statusOnline}` : `⚪ ${t.rider.statusOffline}`}
          </button>
        </div>
      </header>

      {error && (
        <div className="max-w-3xl mx-auto text-sm text-error bg-error/10 rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* 진행 중인 배달 */}
        <section>
          <h2 className="text-sm font-bold text-text-muted uppercase mb-2">{t.rider.myCurrentDelivery}</h2>
          {current ? (
            <div className="rounded-xl bg-background-secondary border border-accent-warm/40 p-4" data-testid="current-order">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs text-text-muted">{current.order_number}</div>
                  <div className="font-bold">{current.restaurant?.name}</div>
                </div>
                <span className="px-2 py-1 rounded text-xs font-bold bg-accent-warm text-background-primary">
                  {current.status === 'ready' ? '픽업 대기' : '배달 중'}
                </span>
              </div>
              <div className="text-sm space-y-1 mb-3">
                <div>
                  <span className="text-text-muted">{t.rider.pickupAddress}:</span> {current.restaurant?.address ?? '-'}
                </div>
                <div>
                  <span className="text-text-muted">{t.rider.deliveryAddress}:</span>{' '}
                  {current.address_snapshot?.roadAddress} {current.address_snapshot?.detail}
                </div>
                {current.request_note && (
                  <div className="text-xs text-warning bg-warning/10 rounded p-2 mt-2">
                    📝 {current.request_note}
                  </div>
                )}
              </div>
              {current.status === 'ready' ? (
                <button
                  type="button"
                  onClick={() => markPickedUp(current.id)}
                  className="w-full px-4 py-3 rounded-lg bg-accent-warm text-background-primary font-bold"
                  data-testid="pickup-button"
                >
                  {t.rider.pickedUp}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => markDelivered(current.id)}
                  className="w-full px-4 py-3 rounded-lg bg-success text-white font-bold"
                  data-testid="complete-button"
                >
                  {t.rider.completeDelivery}
                </button>
              )}
            </div>
          ) : (
            <p className="text-text-muted text-sm" data-testid="no-current">
              {t.rider.noActiveDelivery}
            </p>
          )}
        </section>

        {/* 배차 대기 주문 */}
        {!current && (
          <section>
            <h2 className="text-sm font-bold text-text-muted uppercase mb-2">{t.rider.pendingDispatches}</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
              </div>
            ) : available.length === 0 ? (
              <p className="text-text-muted text-sm" data-testid="no-dispatches">
                {profile.status === 'offline' ? t.rider.statusOffline : t.rider.noDispatches}
              </p>
            ) : (
              <ul className="space-y-3">
                {available.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-xl bg-background-secondary border border-white/10 p-4"
                    data-testid={`available-${o.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs text-text-muted">{o.order_number}</div>
                        <div className="font-bold">{o.restaurant?.name}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-bold text-accent-warm">
                          +{new Intl.NumberFormat('ko').format(o.delivery_fee)}원
                        </div>
                        <div className="text-xs text-text-muted">배달비</div>
                      </div>
                    </div>
                    <div className="text-sm space-y-1 mb-3">
                      <div className="text-text-muted">{o.restaurant?.address ?? '-'}</div>
                      <div>→ {o.address_snapshot?.roadAddress} {o.address_snapshot?.detail}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => acceptDispatch(o.id)}
                      className="w-full px-4 py-2 rounded-lg bg-accent-warm text-background-primary font-bold text-sm"
                      data-testid={`accept-dispatch-${o.id}`}
                    >
                      {t.rider.acceptDispatch}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* 통계 */}
        <section className="rounded-xl bg-background-secondary border border-white/10 p-4">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-xs text-text-muted">{t.rider.totalDeliveries}</div>
              <div className="text-xl font-bold">{profile.total_deliveries}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted">{t.delivery.rating}</div>
              <div className="text-xl font-bold">
                ★ {profile.rating.toFixed(1)}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

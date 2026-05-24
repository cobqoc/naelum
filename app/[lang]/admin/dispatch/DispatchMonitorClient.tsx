'use client';

import { useI18n } from '@/lib/i18n/context';

interface RiderRow {
  user_id: string;
  status: string;
  vehicle_type: string | null;
  total_deliveries: number;
  rating: number;
  last_seen_at: string | null;
  profile: { username: string | null; email: string | null } | null;
}

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  rider_id: string | null;
  placed_at: string;
  restaurant: { name: string } | null;
}

interface Props {
  riders: RiderRow[];
  activeOrders: OrderRow[];
}

const VEHICLE_EMOJI: Record<string, string> = {
  motorcycle: '🏍️',
  bicycle: '🚲',
  car: '🚗',
  walk: '🚶',
};

function formatTime(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', month: '2-digit', day: '2-digit' });
  } catch {
    return iso;
  }
}

export default function DispatchMonitorClient({ riders, activeOrders }: Props) {
  const { t } = useI18n();

  const online = riders.filter((r) => r.status === 'online').length;
  const busy = riders.filter((r) => r.status === 'busy').length;

  return (
    <div className="space-y-6 max-w-6xl">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">{t.rider.monitoringTitle}</h1>
        <p className="text-text-muted text-sm">{t.rider.monitoringSubtitle}</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-background-secondary border border-white/10">
          <div className="text-xs text-text-muted mb-1">{t.rider.activeRiders}</div>
          <div className="text-2xl font-bold text-success">{online + busy}</div>
        </div>
        <div className="p-4 rounded-xl bg-background-secondary border border-white/10">
          <div className="text-xs text-text-muted mb-1">온라인</div>
          <div className="text-2xl font-bold">{online}</div>
        </div>
        <div className="p-4 rounded-xl bg-background-secondary border border-white/10">
          <div className="text-xs text-text-muted mb-1">배달 중</div>
          <div className="text-2xl font-bold text-info">{busy}</div>
        </div>
        <div className="p-4 rounded-xl bg-background-secondary border border-white/10">
          <div className="text-xs text-text-muted mb-1">{t.rider.activeOrders}</div>
          <div className="text-2xl font-bold text-warning">{activeOrders.length}</div>
        </div>
      </div>

      {/* 라이더 리스트 */}
      <section>
        <h2 className="text-lg font-bold mb-3">라이더</h2>
        <div className="rounded-xl bg-background-secondary border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-text-muted text-left border-b border-white/10">
                <th className="p-3">상태</th>
                <th className="p-3">유저</th>
                <th className="p-3">이동수단</th>
                <th className="p-3">총 배달</th>
                <th className="p-3">평점</th>
                <th className="p-3">최근 활동</th>
              </tr>
            </thead>
            <tbody>
              {riders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-text-muted">
                    라이더 없음
                  </td>
                </tr>
              ) : (
                riders.map((r) => (
                  <tr key={r.user_id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          r.status === 'online'
                            ? 'bg-success/20 text-success'
                            : r.status === 'busy'
                            ? 'bg-info/20 text-info'
                            : 'bg-text-muted/20 text-text-muted'
                        }`}
                      >
                        {r.status === 'online' ? t.rider.statusOnline : r.status === 'busy' ? t.rider.statusBusy : t.rider.statusOffline}
                      </span>
                    </td>
                    <td className="p-3">{r.profile?.username ?? r.user_id.slice(0, 8)}</td>
                    <td className="p-3">
                      {r.vehicle_type ? VEHICLE_EMOJI[r.vehicle_type] ?? r.vehicle_type : '-'}
                    </td>
                    <td className="p-3">{r.total_deliveries}</td>
                    <td className="p-3">★ {r.rating.toFixed(1)}</td>
                    <td className="p-3 text-text-muted text-xs">{formatTime(r.last_seen_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 활성 주문 리스트 */}
      <section>
        <h2 className="text-lg font-bold mb-3">{t.rider.activeOrders}</h2>
        <div className="rounded-xl bg-background-secondary border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-text-muted text-left border-b border-white/10">
                <th className="p-3">주문 번호</th>
                <th className="p-3">식당</th>
                <th className="p-3">상태</th>
                <th className="p-3">배차</th>
                <th className="p-3">주문 시각</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-text-muted">
                    활성 주문 없음
                  </td>
                </tr>
              ) : (
                activeOrders.map((o) => (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 font-mono text-xs">{o.order_number}</td>
                    <td className="p-3">{o.restaurant?.name ?? '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded text-xs bg-accent-warm/20 text-accent-warm">
                        {t.delivery.status[o.status as keyof typeof t.delivery.status]}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-text-muted">
                      {o.rider_id ? '✓ 배차됨' : '대기'}
                    </td>
                    <td className="p-3 text-xs text-text-muted">{formatTime(o.placed_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

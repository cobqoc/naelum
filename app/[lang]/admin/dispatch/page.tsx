import { createClient, createAdminClient } from '@/lib/supabase/server';
import DispatchMonitorClient from './DispatchMonitorClient';

export const dynamic = 'force-dynamic';

export default async function DispatchMonitorPage() {
  // admin layout이 이미 권한 체크 (app/[lang]/admin/layout.tsx).
  const supabase = await createClient();

  // 라이더 이메일 — email 은 authenticated SELECT 권한 밖이라 service-role (AG2-18). 권한 확인은 admin layout.
  const [{ data: riders }, { data: activeOrders }] = await Promise.all([
    createAdminClient()
      .from('delivery_rider_profiles')
      .select('user_id, status, vehicle_type, total_deliveries, rating, last_seen_at, profile:profiles(username, email)')
      .order('status'),
    supabase
      .from('delivery_orders')
      .select('id, order_number, status, rider_id, placed_at, restaurant:delivery_restaurants(name)')
      .in('status', ['paid', 'accepted', 'preparing', 'ready', 'picked_up'])
      .order('placed_at', { ascending: false })
      .limit(50),
  ]);

  return (
    <DispatchMonitorClient
      riders={(riders as unknown as RiderRow[]) ?? []}
      activeOrders={(activeOrders as unknown as OrderRow[]) ?? []}
    />
  );
}

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

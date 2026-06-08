import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { toClientOrder, type DbOrder, type DbOrderItem } from '@/lib/delivery/orderMapping';

// GET /api/delivery/orders — 본인 주문 목록 (쿠키 인증)
// 데이터 계층 이전(docs/DATA_LAYER.md): lib/delivery/api.ts 의 fetchOrders 직접 read 2개를 서버로.
export async function GET() {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { data: ordersData, error: ordersErr } = await supabase
    .from('delivery_orders')
    .select('*, restaurant:delivery_restaurants(name)')
    .eq('user_id', user!.id)
    .order('placed_at', { ascending: false });

  if (ordersErr) {
    return NextResponse.json({ error: ordersErr.message }, { status: 500 });
  }
  if (!ordersData || ordersData.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  const orderIds = (ordersData as DbOrder[]).map((o) => o.id);
  const { data: itemsData, error: itemsErr } = await supabase
    .from('delivery_order_items')
    .select('*')
    .in('order_id', orderIds);

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  const itemsByOrder: Record<string, DbOrderItem[]> = {};
  for (const it of (itemsData as DbOrderItem[]) ?? []) {
    (itemsByOrder[it.order_id] ??= []).push(it);
  }

  const orders = (ordersData as DbOrder[]).map((o) => toClientOrder(o, itemsByOrder[o.id] ?? []));
  return NextResponse.json({ orders });
}

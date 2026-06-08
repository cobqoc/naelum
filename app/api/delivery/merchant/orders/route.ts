import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// 사장님 주문 목록 — 본인 소유 식당의 주문(쿠키 인증).
// 데이터 계층 이전(docs/DATA_LAYER.md): MerchantOrdersClient 직접 read 2개를 서버로 + 컬럼 명시.
// 소유 식당을 owner_id 로 서버에서 재유도 — 클라가 넘긴 restaurantId 를 신뢰하지 않음(IDOR 차단).
const ORDER_COLS =
  'id, order_number, status, subtotal, delivery_fee, total, address_snapshot, request_note, placed_at';

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  address_snapshot: unknown;
  request_note: string | null;
  placed_at: string;
}

interface ItemRow {
  order_id: string;
  name_snapshot: string;
  quantity: number;
}

export async function GET() {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { data: restaurant, error: restErr } = await supabase
    .from('delivery_restaurants')
    .select('id')
    .eq('owner_id', user!.id)
    .maybeSingle();

  if (restErr) {
    return NextResponse.json({ error: restErr.message }, { status: 500 });
  }
  if (!restaurant) {
    // 소유 식당 없음 — 빈 목록(페이지 게이트가 onboarding 으로 보내므로 통상 도달 안 함).
    return NextResponse.json({ orders: [] });
  }

  const { data: orderData, error: ordersErr } = await supabase
    .from('delivery_orders')
    .select(ORDER_COLS)
    .eq('restaurant_id', restaurant.id)
    .order('placed_at', { ascending: false })
    .limit(50);

  if (ordersErr) {
    return NextResponse.json({ error: ordersErr.message }, { status: 500 });
  }
  if (!orderData || orderData.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  const orderIds = (orderData as OrderRow[]).map((o) => o.id);
  const { data: itemsData, error: itemsErr } = await supabase
    .from('delivery_order_items')
    .select('order_id, name_snapshot, quantity')
    .in('order_id', orderIds);

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  const itemsByOrder: Record<string, { name: string; quantity: number }[]> = {};
  for (const it of (itemsData as ItemRow[]) ?? []) {
    (itemsByOrder[it.order_id] ??= []).push({ name: it.name_snapshot, quantity: it.quantity });
  }

  const orders = (orderData as OrderRow[]).map((o) => ({
    ...o,
    items: itemsByOrder[o.id] ?? [],
  }));

  return NextResponse.json({ orders });
}

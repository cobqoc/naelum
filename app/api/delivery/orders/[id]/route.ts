import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { toClientOrder, type DbOrder, type DbOrderItem } from '@/lib/delivery/orderMapping';

// GET /api/delivery/orders/[id] — 단일 주문 (쿠키 인증 + RLS 로 본인 주문만 반환)
// 데이터 계층 이전(docs/DATA_LAYER.md): lib/delivery/api.ts 의 fetchOrder 직접 read 2개를 서버로.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  // 인증만 게이트(requireAuth 가 미인증 401). 본인 주문 필터는 RLS 가 .eq('id') 위에서 처리.
  const { error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { data: orderRow, error: orderErr } = await supabase
    .from('delivery_orders')
    .select('*, restaurant:delivery_restaurants(name)')
    .eq('id', id)
    .maybeSingle();

  if (orderErr) {
    return NextResponse.json({ error: orderErr.message }, { status: 500 });
  }
  // RLS 상 본인 주문 아니면 null → 404 (원본 fetchOrder 의 null 반환과 동일 의미).
  if (!orderRow) {
    return NextResponse.json({ order: null }, { status: 404 });
  }

  const { data: itemsData, error: itemsErr } = await supabase
    .from('delivery_order_items')
    .select('*')
    .eq('order_id', id);

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  return NextResponse.json({
    order: toClientOrder(orderRow as DbOrder, (itemsData as DbOrderItem[]) ?? []),
  });
}

import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// 라이더 주문 — 본인 진행 배달(current) + 배차 대기(available). 쿠키 인증, rider_id 는 서버가 user 로 재유도.
// 데이터 계층 이전(docs/DATA_LAYER.md): RiderHomeClient refreshOrders 직접 read 2개를 서버로.
// ?online=1 — 온라인일 때만 미배정 ready 주문 노출(클라 토글 상태 그대로 반영, 원본 로직 보존).
const CURRENT_COLS =
  'id, order_number, status, total, delivery_fee, address_snapshot, request_note, placed_at, restaurant:delivery_restaurants(name, address)';
const AVAILABLE_COLS =
  'id, order_number, status, total, delivery_fee, address_snapshot, placed_at, restaurant:delivery_restaurants(name, address)';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  // 1) 본인이 배차받은 진행 중 주문
  const { data: current, error: curErr } = await supabase
    .from('delivery_orders')
    .select(CURRENT_COLS)
    .eq('rider_id', user!.id)
    .in('status', ['ready', 'picked_up'])
    .order('placed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (curErr) {
    return NextResponse.json({ error: curErr.message }, { status: 500 });
  }

  // 2) 배차 가능한 ready 주문(라이더 미배정) — 온라인 + 진행 주문 없을 때만
  const online = request.nextUrl.searchParams.get('online') === '1';
  let available: unknown[] = [];
  if (!current && online) {
    const { data: openOrders, error: openErr } = await supabase
      .from('delivery_orders')
      .select(AVAILABLE_COLS)
      .eq('status', 'ready')
      .is('rider_id', null)
      .order('placed_at', { ascending: true })
      .limit(20);

    if (openErr) {
      return NextResponse.json({ error: openErr.message }, { status: 500 });
    }
    available = openOrders ?? [];
  }

  return NextResponse.json({ current: current ?? null, available });
}

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// 배달 식당 목록 — 공개 read(비로그인 접근 가능, RLS 가 is_active 식당만).
// 데이터 계층 이전(docs/DATA_LAYER.md): DeliveryHomeClient 직접 read 1개를 서버로 + 컬럼 명시.
// ⚠️ /api/delivery/nearby 는 bbox 필수·지도용 shape(camelCase, delivery_fee 등 미포함)라 재사용 불가 → 목록 전용 신설.
const RESTAURANT_COLS =
  'id, name, description, cuisine_types, address, delivery_fee, min_order_price, avg_cook_time_min, rating, rating_count, is_open, thumbnail_url';

export async function GET() {
  const supabase = await createClient();

  // 병목/정합성: 비페이지네이션 목록이라 PostgREST 1000행 silent cap 방지 + 과대 fetch 차단.
  // nearby 라우트(MAX_ROWS 500)와 동일 취지. 홈 목록 상한 200(현 6개, 충분한 헤드룸).
  const { data, error } = await supabase
    .from('delivery_restaurants')
    .select(RESTAURANT_COLS)
    .eq('is_active', true)
    .order('is_open', { ascending: false })
    .order('rating', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ restaurants: data ?? [] });
}

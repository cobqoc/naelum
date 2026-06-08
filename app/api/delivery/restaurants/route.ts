import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

// 배달 식당 목록 — 공개 read(비로그인 접근 가능, RLS 가 is_active 식당만).
// 데이터 계층 이전(docs/DATA_LAYER.md): DeliveryHomeClient 직접 read 1개를 서버로 + 컬럼 명시.
// ⚠️ /api/delivery/nearby 는 bbox 필수·지도용 shape(camelCase, delivery_fee 등 미포함)라 재사용 불가 → 목록 전용 신설.
const RESTAURANT_COLS =
  'id, name, description, cuisine_types, address, delivery_fee, min_order_price, avg_cook_time_min, rating, rating_count, is_open, thumbnail_url';

// 병목: 사용자 무관 공개 목록 → 공유 캐시(cookieless anon, RLS is_active). 모든 요청이 동일 응답이라
// 매 요청 DB 히트 불필요. 식당 변동은 드물어 시간 무효화(120s)로 충분.
// 정합성: 비페이지네이션이라 .limit(200) 으로 PostgREST 1000행 silent cap 방지(nearby MAX_ROWS 취지).
const getCachedRestaurants = unstable_cache(
  async (): Promise<{ rows: unknown[] | null; error: string | null }> => {
    const anon = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data, error } = await anon
      .from('delivery_restaurants')
      .select(RESTAURANT_COLS)
      .eq('is_active', true)
      .order('is_open', { ascending: false })
      .order('rating', { ascending: false })
      .limit(200);
    return { rows: data ?? null, error: error?.message ?? null };
  },
  ['delivery-restaurants-active'],
  { revalidate: 120 }
);

export async function GET() {
  const { rows, error } = await getCachedRestaurants();
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json({ restaurants: rows ?? [] });
}

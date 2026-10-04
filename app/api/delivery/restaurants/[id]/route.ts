import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// 식당 상세 + 메뉴 — 공개 read(비로그인 접근 가능, RLS 가 is_active 식당만).
// 데이터 계층 이전(docs/DATA_LAYER.md): RestaurantDetailClient 직접 read 3개를 서버로 + 컬럼 명시.
const RESTAURANT_COLS =
  'id, name, description, cuisine_types, address, delivery_fee, min_order_price, avg_cook_time_min, rating, rating_count, is_open, thumbnail_url';
const CATEGORY_COLS = 'id, restaurant_id, name, sort_order';
const ITEM_COLS =
  'id, restaurant_id, category_id, name, description, price, image_url, is_available, is_popular, sort_order';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  // 2026-10-04 AG2-45: 식당·카테고리·메뉴 read 는 모두 id 파라미터만 의존 → 3개 동시 시작(이전: 식당 확인 후 2개).
  // 판정 순서(식당 오류 500 → 없음 404 → 200)·응답은 그대로, 404/500 이면 카테고리·메뉴 결과는 버린다.
  const [{ data: restaurant, error: restErr }, { data: categories }, { data: items }] = await Promise.all([
    supabase
      .from('delivery_restaurants')
      .select(RESTAURANT_COLS)
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('delivery_menu_categories')
      .select(CATEGORY_COLS)
      .eq('restaurant_id', id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('delivery_menu_items')
      .select(ITEM_COLS)
      .eq('restaurant_id', id)
      .order('sort_order', { ascending: true }),
  ]);

  if (restErr) {
    return NextResponse.json({ error: restErr.message }, { status: 500 });
  }
  if (!restaurant) {
    return NextResponse.json({ restaurant: null, categories: [], items: [] }, { status: 404 });
  }

  return NextResponse.json({
    restaurant,
    categories: categories ?? [],
    items: items ?? [],
  });
}

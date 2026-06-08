import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// 사장님 메뉴(카테고리·아이템) 목록 — 본인 소유 식당(쿠키 인증).
// 데이터 계층 이전(docs/DATA_LAYER.md): MenuManagerClient 직접 read 2개(select('*')) → 서버 + 컬럼 명시.
// 소유 식당을 owner_id 로 서버에서 재유도 — 클라 restaurantId 불신(IDOR 차단). 쓰기(insert/update/delete)는 클라 유지.
const CATEGORY_COLS = 'id, name, sort_order';
const ITEM_COLS = 'id, category_id, name, description, price, is_available, is_popular, sort_order';

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
    return NextResponse.json({ categories: [], items: [] });
  }

  const [{ data: categories, error: catErr }, { data: items, error: itemErr }] = await Promise.all([
    supabase
      .from('delivery_menu_categories')
      .select(CATEGORY_COLS)
      .eq('restaurant_id', restaurant.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('delivery_menu_items')
      .select(ITEM_COLS)
      .eq('restaurant_id', restaurant.id)
      .order('sort_order', { ascending: true }),
  ]);

  if (catErr || itemErr) {
    return NextResponse.json({ error: (catErr ?? itemErr)!.message }, { status: 500 });
  }

  return NextResponse.json({ categories: categories ?? [], items: items ?? [] });
}

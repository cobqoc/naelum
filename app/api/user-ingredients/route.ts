import { createClient } from '@/lib/supabase/server';
import { inferStorageLocation } from '@/lib/ingredients/storageMap';
import { resolveExactIngredientId } from '@/lib/ingredients/resolveIngredientId';
import { NextRequest, NextResponse } from 'next/server';

const SELECT_COLS =
  'id,user_id,ingredient_name,quantity,unit,category,expiry_date,' +
  'storage_location,purchase_date,notes,expiry_alert,created_at';

// GET /api/user-ingredients — 로그인 사용자 냉장고 전체 조회
// 정렬: expiry_date asc nullslast (KMP FridgeRepositoryImpl 과 동일)
// ?withMaster=1 — 도감 메타(emoji·shelf_life_days) 조인해 평탄화(홈 useFridgeItems 용).
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const withMaster = request.nextUrl.searchParams.get('withMaster') === '1';
  const cols = withMaster
    ? `${SELECT_COLS},ingredients_master!ingredient_id(emoji, shelf_life_days)`
    : SELECT_COLS;

  const { data, error } = await supabase
    .from('user_ingredients')
    .select(cols)
    .eq('user_id', user.id)
    .order('expiry_date', { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!withMaster) {
    return NextResponse.json({ items: data ?? [] });
  }

  // 도감 조인 평탄화 — emoji·shelf_life_days 를 최상위로, 중첩 ingredients_master 제거.
  const items = (data ?? []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const master = (row as any).ingredients_master;
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(row as any),
      emoji: master?.emoji ?? null,
      shelf_life_days: master?.shelf_life_days ?? null,
      ingredients_master: undefined,
    };
  });
  return NextResponse.json({ items });
}

// POST /api/user-ingredients — 냉장고 항목 추가
// body: { ingredient_name, quantity?, unit?, category?, expiry_date? }
// storage_location 서버 자동 추론 (add-to-ingredients 와 동일 로직)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: {
    ingredient_name?: string;
    quantity?: number | null;
    unit?: string | null;
    category?: string | null;
    expiry_date?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const name = (body.ingredient_name ?? '').trim();
  if (!name) {
    return NextResponse.json({ error: 'ingredient_name이 필요합니다.' }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  // ingredient_id 해석 — 추천 FK 매칭(정확도 최우선)에 필요.
  // 레시피 저장과 동일한 결정적 해석(정확/별칭/공백무시, 추측 0)으로 통일.
  const ingredientId = await resolveExactIngredientId(name, supabase);
  const { data, error } = await supabase
    .from('user_ingredients')
    .insert({
      user_id: user.id,
      ingredient_name: name,
      ingredient_id: ingredientId,
      quantity: body.quantity ?? null,
      unit: body.unit ?? null,
      category: body.category ?? null,
      expiry_date: body.expiry_date ?? null,
      storage_location: inferStorageLocation(name, body.category ?? null),
      expiry_alert: true,
      purchase_date: today,
    })
    .select(SELECT_COLS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}

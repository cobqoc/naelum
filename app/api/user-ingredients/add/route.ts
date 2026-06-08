import { createClient } from '@/lib/supabase/server';
import { resolveExactIngredientId } from '@/lib/ingredients/resolveIngredientId';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/user-ingredients/add — 모달 추가(add-or-merge). 데이터 계층 이전(docs/DATA_LAYER.md):
// HomeClient 이 클라에서 하던 "같은 이름+만료일+보관위치 매치 검색(read) → 수량합치기 or 삽입"을
// 서버에서 atomic 하게. read-then-write 가 한 요청 안에서 끝나 옵티미스틱 race 가 사라진다.
const SELECT_COLS =
  'id,user_id,ingredient_name,quantity,unit,category,expiry_date,' +
  'storage_location,purchase_date,notes,expiry_alert,created_at';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const name = typeof body.ingredient_name === 'string' ? body.ingredient_name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'ingredient_name이 필요합니다.' }, { status: 400 });
  }
  const expiry = (body.expiry_date as string | null) ?? null;
  const storage = (body.storage_location as string | null) ?? null;
  const addQty = typeof body.quantity === 'number'
    ? body.quantity
    : (body.quantity ? parseFloat(String(body.quantity)) : 1);
  const qty = Number.isNaN(addQty) ? 1 : addQty;

  // 같은 이름 + 만료일·보관위치 동일 항목 검색 (서버에서 — 클라 state stale·race 없음)
  let q = supabase
    .from('user_ingredients')
    .select('id, quantity')
    .eq('user_id', user.id)
    .ilike('ingredient_name', name);
  q = expiry === null ? q.is('expiry_date', null) : q.eq('expiry_date', expiry);
  q = storage === null ? q.is('storage_location', null) : q.eq('storage_location', storage);
  const { data: matches, error: matchErr } = await q.limit(1);
  if (matchErr) {
    return NextResponse.json({ error: matchErr.message }, { status: 500 });
  }
  const mergeTarget = matches?.[0];

  if (mergeTarget) {
    // 만료일·보관위치 같음 → 수량 합치기 (정보 손실 없음)
    const nextQty = (mergeTarget.quantity ?? 0) + qty;
    const { data, error } = await supabase
      .from('user_ingredients')
      .update({ quantity: nextQty })
      .eq('id', mergeTarget.id)
      .eq('user_id', user.id)
      .select(SELECT_COLS)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ item: data, merged: true });
  }

  // 신규 삽입 — ingredient_id 결정적 해석(이름 기반, 추측 0; 레시피 저장과 동일)
  let ingredientId = (body.ingredient_id as string | null) ?? null;
  if (!ingredientId) {
    ingredientId = await resolveExactIngredientId(name, supabase);
  }
  const insertRow = {
    user_id: user.id,
    ingredient_name: name,
    quantity: qty,
    unit: (body.unit as string | null) ?? null,
    category: (body.category as string | null) ?? null,
    expiry_date: expiry,
    storage_location: storage,
    purchase_date: (body.purchase_date as string | null) ?? null,
    notes: (body.notes as string | null) ?? null,
    ingredient_id: ingredientId,
  };
  const { data, error } = await supabase
    .from('user_ingredients')
    .insert(insertRow)
    .select(SELECT_COLS)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data, merged: false }, { status: 201 });
}

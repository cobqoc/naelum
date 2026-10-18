import { createClient } from '@/lib/supabase/server';
import { resolveExactIngredientId } from '@/lib/ingredients/resolveIngredientId';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/user-ingredients/[id] — 냉장고 항목 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  // 2026-10-04 AG2-49: 형식 오류 JSON·null 본문은 500 이었다 → 400.
  let body: Record<string, unknown> | null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }
  const { ingredient_name, quantity, unit, category, expiry_date, storage_location, purchase_date, notes, expiry_alert } = body;

  const updates: Record<string, unknown> = {};
  if (ingredient_name !== undefined) updates.ingredient_name = ingredient_name;
  if (quantity !== undefined) updates.quantity = quantity;
  if (unit !== undefined) updates.unit = unit;
  if (category !== undefined) updates.category = category;
  if (expiry_date !== undefined) updates.expiry_date = expiry_date || null;
  if (storage_location !== undefined) updates.storage_location = storage_location;
  if (purchase_date !== undefined) updates.purchase_date = purchase_date || null;
  if (notes !== undefined) updates.notes = notes;
  if (expiry_alert !== undefined) updates.expiry_alert = !!expiry_alert;

  // 2026-10-04 AG2-12: 이름이 *실제로 바뀐* 경우에만 ingredient_id 를 새 이름으로 재해석(add 경로와 같은
  // resolveExactIngredientId). 이전엔 "양파"→"대파" 로 바꿔도 옛 FK 가 남아 재료 기반 추천(FK 매칭)이 계속
  // 옛 재료로 매칭됐다. KMP 는 매 수정마다 같은 이름을 다시 보내므로 이름이 같으면 id 는 건드리지 않는다.
  if (typeof ingredient_name === 'string') {
    const { data: current, error: currentError } = await supabase
      .from('user_ingredients')
      .select('ingredient_name')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (currentError) {
      return NextResponse.json({ error: currentError.message }, { status: 500 });
    }
    if (!current) {
      return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 });
    }
    if (current.ingredient_name !== ingredient_name) {
      updates.ingredient_id = await resolveExactIngredientId(ingredient_name, supabase);
    }
  }

  // 2026-10-04 AG2-12: .single() 은 0행(없는/타인 id)이면 PGRST116 error 라 500 이었고 아래 404 분기는 죽어 있었다
  // → maybeSingle(0행 = data null, error null)로 404 를 살린다. 1행 결과는 동일.
  const { data: item, error } = await supabase
    .from('user_ingredients')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!item) {
    return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ item });
}

// DELETE /api/user-ingredients/[id] — 냉장고 항목 삭제
// user_id 교차검증으로 타인의 항목 삭제 방지
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const { error, count } = await supabase
    .from('user_ingredients')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (count === 0) {
    return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

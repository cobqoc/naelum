import { createClient } from '@/lib/supabase/server';
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
  const body = await request.json();
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

  const { data: item, error } = await supabase
    .from('user_ingredients')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

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

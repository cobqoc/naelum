import { createClient } from '@/lib/supabase/server';
import { inferStorageLocation } from '@/lib/ingredients/storageMap';
import { NextRequest, NextResponse } from 'next/server';

const SELECT_COLS =
  'id,user_id,ingredient_name,quantity,unit,category,expiry_date,' +
  'storage_location,purchase_date,notes,expiry_alert,created_at';

// GET /api/user-ingredients — 로그인 사용자 냉장고 전체 조회
// 정렬: expiry_date asc nullslast (KMP FridgeRepositoryImpl 과 동일)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_ingredients')
    .select(SELECT_COLS)
    .eq('user_id', user.id)
    .order('expiry_date', { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
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
  const { data, error } = await supabase
    .from('user_ingredients')
    .insert({
      user_id: user.id,
      ingredient_name: name,
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

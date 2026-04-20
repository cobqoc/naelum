import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { inferStorageLocation } from '@/lib/ingredients/storageMap';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { items } = await request.json() as {
    items: { ingredient_name: string; category: string; quantity: number | null; unit: string | null }[];
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: '항목이 필요합니다.' }, { status: 400 });
  }

  // 큐레이션 맵 기반 자동 분류 (lookupStorageByName 매칭, 없으면 카테고리 fallback).
  // 재료 수동 추가 플로우와 동일한 로직 적용 — 일관성 유지.
  const ingredientsToAdd = items.map(item => ({
    user_id: user.id,
    ingredient_name: item.ingredient_name,
    category: item.category || 'other',
    quantity: item.quantity,
    unit: item.unit,
    storage_location: inferStorageLocation(item.ingredient_name, item.category),
    expiry_alert: true,
  }));

  const { error } = await supabase
    .from('user_ingredients')
    .insert(ingredientsToAdd);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, added: items.length });
}

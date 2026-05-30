import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { inferStorageLocation } from '@/lib/ingredients/storageMap';
import { resolveExactIngredientIds } from '@/lib/ingredients/resolveIngredientId';

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

  // ingredients_master에서 ingredient_id 일괄 조회 — 결정적(정확/별칭/공백무시, 추측 0).
  // 레시피 저장과 동일 해석으로 통일.
  const names = items.map(i => i.ingredient_name)
  const nameToId = await resolveExactIngredientIds(names, supabase)

  // 큐레이션 맵 기반 자동 분류 (lookupStorageByName 매칭, 없으면 카테고리 fallback).
  // purchase_date 오늘 자동 설정 — 모달 경로(IngredientForm)와 일관성 유지 +
  // 만료일 미설정 시에도 N일째 라벨이 정상 표시되도록.
  const today = new Date().toISOString().slice(0, 10);
  const ingredientsToAdd = items.map(item => ({
    user_id: user.id,
    ingredient_name: item.ingredient_name,
    category: item.category || 'other',
    quantity: item.quantity,
    unit: item.unit,
    storage_location: inferStorageLocation(item.ingredient_name, item.category),
    expiry_alert: true,
    ingredient_id: nameToId.get(item.ingredient_name) ?? null,
    purchase_date: today,
  }));

  const { error } = await supabase
    .from('user_ingredients')
    .insert(ingredientsToAdd);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, added: items.length });
}

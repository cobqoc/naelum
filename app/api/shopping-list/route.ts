import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 사용자의 기본 장보기 리스트를 가져오거나, 없으면 생성합니다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreateDefaultList(supabase: any, userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('shopping_lists')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('shopping_lists')
    .insert({ user_id: userId, list_name: '기본 장보기 리스트' })
    .select('id')
    .single();

  if (error || !created) throw new Error('장보기 리스트 생성에 실패했습니다.');
  return created.id;
}

// GET: 장보기 리스트 조회
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // 클라이언트가 실제로 쓰는 필드만 선택 — SELECT * 대비 ~40% 응답 크기 감소.
  const { data, error } = await supabase
    .from('shopping_list_items')
    .select('id, ingredient_name, category, quantity, unit, recipe_id, recipe_title, is_checked, is_owned')
    .eq('user_id', user.id)
    .order('is_checked', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}

// POST: 레시피에서 재료 추가
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: { recipeId: string; recipeTitle: string; ingredients: { ingredient_name: string; quantity?: string; unit?: string; category?: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }
  const { recipeId, recipeTitle, ingredients } = body as {
    recipeId: string;
    recipeTitle: string;
    ingredients: { ingredient_name: string; quantity?: string; unit?: string; category?: string }[];
  };

  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json({ error: '재료가 필요합니다.' }, { status: 400 });
  }

  // 기본 장보기 리스트 가져오기 (없으면 생성)
  let shoppingListId: string;
  try {
    shoppingListId = await getOrCreateDefaultList(supabase, user.id);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // 보유 재료 + 기존 장보기 항목 병렬 조회
  const [{ data: ownedIngredients }, { data: existingItems }] = await Promise.all([
    supabase.from('user_ingredients').select('ingredient_name').eq('user_id', user.id),
    supabase.from('shopping_list_items').select('ingredient_name').eq('user_id', user.id).eq('is_checked', false),
  ]);

  const ownedNames = new Set((ownedIngredients || []).map(i => i.ingredient_name.toLowerCase()));
  const existingNames = new Set((existingItems || []).map(i => i.ingredient_name.toLowerCase()));

  const itemsToAdd = ingredients
    .filter(i => !existingNames.has(i.ingredient_name.toLowerCase()))
    .map(i => ({
      user_id: user.id,
      shopping_list_id: shoppingListId,
      ingredient_name: i.ingredient_name,
      category: i.category || 'other',
      quantity: i.quantity ? parseFloat(i.quantity) : null,
      unit: i.unit && i.unit !== '선택' ? i.unit : null,
      recipe_id: recipeId,
      recipe_title: recipeTitle,
      is_owned: ownedNames.has(i.ingredient_name.toLowerCase()),
      is_checked: false,
    }));

  if (itemsToAdd.length === 0) {
    return NextResponse.json({ message: '추가할 새 재료가 없습니다.', added: 0 });
  }

  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert(itemsToAdd)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data, added: data.length });
}

// PATCH: 항목 체크/해제 또는 수량 업데이트
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: { id: string; is_checked?: boolean; quantity?: number | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }
  const { id, is_checked, quantity } = body;

  const updates: { is_checked?: boolean; quantity?: number | null } = {};
  if (typeof is_checked === 'boolean') updates.is_checked = is_checked;
  if (quantity !== undefined) updates.quantity = quantity;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '업데이트할 필드가 없습니다.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('shopping_list_items')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE: 항목 삭제
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const clearChecked = searchParams.get('clearChecked');

  if (clearChecked === 'true') {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('user_id', user.id)
      .eq('is_checked', true);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (id) {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // 전체 삭제
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { isFundamental } from '@/lib/recommendations/matchV2';
import { parseQuantity, mergeQuantity } from '@/lib/shopping-list/quantity';

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

  // 장보기 항목 + 현재 보유 재료 병렬 조회.
  // is_owned 는 *담을 때 스냅샷*(POST 시점 저장값)이 아니라 *현재 냉장고*로 재계산 —
  // 냉장고가 바뀌면 "이미 있음" 배지도 즉시 따라온다 (stale snapshot 버그 fix, 2026-05-29).
  const [{ data, error }, { data: owned }] = await Promise.all([
    supabase
      .from('shopping_list_items')
      .select('id, ingredient_name, category, quantity, unit, recipe_id, recipe_title, is_checked, note, ingredients_master!ingredient_id(emoji)')
      .eq('user_id', user.id)
      .order('is_checked', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('user_ingredients')
      .select('ingredient_name')
      .eq('user_id', user.id),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ownedNames = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (owned || []).map((i: any) => (i.ingredient_name as string).toLowerCase()),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data || []).map((row: any) => {
    const { ingredients_master: master, ...rest } = row;
    return {
      ...rest,
      // 보유 = 현재 냉장고에 있음 OR 기본 재료(물 등 — 누구나 가진 걸로 간주)
      is_owned: ownedNames.has((rest.ingredient_name as string).toLowerCase()) || isFundamental(rest.ingredient_name as string),
      emoji: master?.emoji ?? null,
    };
  });

  return NextResponse.json({ items });
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

  // 보유 재료 + 기존 장보기 항목 + ingredients_master 병렬 조회
  const names = ingredients.map(i => i.ingredient_name);
  const [{ data: ownedIngredients }, { data: existingItems }, { data: masterRows }] = await Promise.all([
    supabase.from('user_ingredients').select('ingredient_name').eq('user_id', user.id),
    supabase.from('shopping_list_items').select('id, ingredient_name, quantity').eq('user_id', user.id).eq('is_checked', false),
    supabase.from('ingredients_master').select('id, name, category').in('name', names),
  ]);
  // 이름 → 마스터 {id, category}. 이름 정확일치 시 카테고리를 마스터 값으로 보정(단일 출처).
  const nameToMaster = new Map(
    (masterRows ?? []).map(r => [r.name, { id: r.id as string, category: r.category as string | null }]),
  );

  const ownedNames = new Set((ownedIngredients || []).map(i => i.ingredient_name.toLowerCase()));
  const existingByName = new Map(
    (existingItems || []).map(i => [i.ingredient_name.toLowerCase(), { id: i.id as string, quantity: i.quantity as number | null }])
  );

  // 1) 같은 이름이 이미 있으면 quantity 병합 (UPDATE)
  // 2) 새 이름이면 INSERT
  // 수량 파싱·병합은 lib/shopping-list/quantity 의 순수 함수로 위임 —
  // "약간"·"적당량" 같은 비숫자 수량이 NaN→null 로 *기존 누적을 파괴*하던
  // 버그(C7)를 거기서 차단한다. 미상값(null)은 기존 값을 절대 덮어쓰지 않음.
  const toUpdate: { id: string; quantity: number | null }[] = [];
  const toInsert: Array<Record<string, unknown>> = [];

  for (const i of ingredients) {
    // 기본 재료(물 등)는 장보기에 안 담음 — 누구나 가진 걸로 간주 (수돗물 살 일 없음).
    if (isFundamental(i.ingredient_name)) continue;
    const key = i.ingredient_name.toLowerCase();
    const newQty = parseQuantity(i.quantity);
    const existing = existingByName.get(key);
    if (existing) {
      const merged = mergeQuantity(existing.quantity, newQty);
      // 병합 결과가 기존과 같으면(= 새 수량 미상) 불필요한 쓰기·파괴 위험 회피 → 스킵
      if (merged !== existing.quantity) {
        toUpdate.push({ id: existing.id, quantity: merged });
      }
    } else {
      toInsert.push({
        user_id: user.id,
        shopping_list_id: shoppingListId,
        ingredient_name: i.ingredient_name,
        // 이름이 마스터와 일치하면 마스터 카테고리 우선 (정합성), 아니면 넘어온 값/기타
        category: nameToMaster.get(i.ingredient_name)?.category || i.category || 'other',
        quantity: newQty,
        unit: i.unit && i.unit !== '선택' ? i.unit : null,
        recipe_id: recipeId,
        recipe_title: recipeTitle,
        is_owned: ownedNames.has(key),
        is_checked: false,
        ingredient_id: nameToMaster.get(i.ingredient_name)?.id ?? null,
      });
    }
  }

  // UPDATE는 행 단위로 (Supabase는 batch update가 까다로워 Promise.all로 처리).
  // Supabase 는 RLS 거부·제약 위반 시 throw 안 하고 { error } 반환 →
  // CLAUDE.md 규율대로 .error 명시 체크 후 실패 표면화 (silent 데이터유실 방지).
  if (toUpdate.length > 0) {
    const updateResults = await Promise.all(
      toUpdate.map(u =>
        supabase
          .from('shopping_list_items')
          .update({ quantity: u.quantity })
          .eq('id', u.id)
          .eq('user_id', user.id)
      )
    );
    const failed = updateResults.find(r => r.error);
    if (failed?.error) {
      return NextResponse.json({ error: failed.error.message }, { status: 500 });
    }
  }

  let insertedData: unknown[] = [];
  if (toInsert.length > 0) {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert(toInsert)
      .select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    insertedData = data ?? [];
  }

  return NextResponse.json({
    items: insertedData,
    added: toInsert.length,
    merged: toUpdate.length,
  });
}

// PATCH: 항목 체크/해제 또는 수량 업데이트
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: { id: string; is_checked?: boolean; quantity?: number | null; unit?: string | null; note?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }
  const { id, is_checked, quantity, unit, note } = body;

  const updates: { is_checked?: boolean; quantity?: number | null; unit?: string | null; note?: string | null } = {};
  if (typeof is_checked === 'boolean') updates.is_checked = is_checked;
  if (quantity !== undefined) updates.quantity = quantity;
  if (unit !== undefined) updates.unit = unit;
  if (note !== undefined) {
    if (typeof note === 'string' && note.length > 200) {
      return NextResponse.json({ error: '메모는 200자 이하여야 합니다.' }, { status: 400 });
    }
    updates.note = note === '' ? null : note;
  }

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

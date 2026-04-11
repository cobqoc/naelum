import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

  const CATEGORY_STORAGE: Record<string, string> = {
    veggie:    '냉장',
    meat:      '냉장',
    seafood:   '냉장',
    dairy:     '냉장',
    fruit:     '냉장',
    grain:     '상온',
    seasoning: '상온',
    condiment: '상온',
    other:     '상온',
  };

  const ingredientsToAdd = items.map(item => ({
    user_id: user.id,
    ingredient_name: item.ingredient_name,
    category: item.category || 'other',
    quantity: item.quantity,
    unit: item.unit,
    storage_location: CATEGORY_STORAGE[item.category] || '냉장',
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

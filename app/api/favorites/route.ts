import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/favorites?limit=N — 사용자 즐겨찾기·자주 사는 재료 조회
// 정렬: is_starred DESC → add_count DESC → last_added_at DESC
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 30), 100);

  const { data, error } = await supabase
    .from('user_favorites_ingredients')
    .select('ingredient_name, category, is_starred, add_count, last_added_at')
    .eq('user_id', user.id)
    .order('is_starred', { ascending: false })
    .order('add_count', { ascending: false })
    .order('last_added_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

// PATCH /api/favorites — ⭐ 토글
// body: { ingredient_name: string, is_starred: boolean, category?: string }
// 행이 없으면 새로 생성(즐겨찾기 의도라 add_count는 0으로 시작)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: { ingredient_name?: string; is_starred?: boolean; category?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const name = (body.ingredient_name ?? '').trim();
  if (!name || typeof body.is_starred !== 'boolean') {
    return NextResponse.json({ error: 'ingredient_name과 is_starred가 필요합니다.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_favorites_ingredients')
    .upsert(
      {
        user_id: user.id,
        ingredient_name: name,
        category: body.category ?? null,
        is_starred: body.is_starred,
      },
      { onConflict: 'user_id,ingredient_name' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

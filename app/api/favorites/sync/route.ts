import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/favorites/sync — localStorage의 자주 사용 재료를 DB로 일괄 upsert
// 처음 로그인 시 한 번 호출. 이후 클라이언트가 localStorage 클리어.
// body: { items: [{ ingredient_name, category?, count? }] }
// 같은 ingredient_name 행이 있으면 add_count += count, last_added_at = greater(현재, NOW())
// 없으면 새로 insert (add_count = count, is_starred = false)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: { items?: { ingredient_name?: string; category?: string | null; count?: number }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ synced: 0 });
  }
  if (items.length > 50) {
    return NextResponse.json({ error: '한 번에 최대 50개까지 동기화할 수 있습니다.' }, { status: 400 });
  }

  // 기존 행 조회 후 add_count 합산
  const names = items.map(i => (i.ingredient_name ?? '').trim()).filter(Boolean);
  if (names.length === 0) return NextResponse.json({ synced: 0 });

  const { data: existing } = await supabase
    .from('user_favorites_ingredients')
    .select('ingredient_name, add_count')
    .eq('user_id', user.id)
    .in('ingredient_name', names);

  const existingMap = new Map((existing ?? []).map(e => [e.ingredient_name, e.add_count as number]));

  const rows = items
    .map(i => {
      const name = (i.ingredient_name ?? '').trim();
      if (!name) return null;
      const count = Math.max(1, Math.min(1000, Number(i.count ?? 1)));
      const existingCount = existingMap.get(name) ?? 0;
      return {
        user_id: user.id,
        ingredient_name: name,
        category: i.category ?? null,
        add_count: existingCount + count,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return NextResponse.json({ synced: 0 });

  const { error } = await supabase
    .from('user_favorites_ingredients')
    .upsert(rows, { onConflict: 'user_id,ingredient_name' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ synced: rows.length });
}

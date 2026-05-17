import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/favorites?limit=N — 사용자 자주 쓰는 재료 조회
// Stage 2: user_ingredients 직접 집계 → score = recent_30day × 2 + total
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 30), 100);

  const { data: rows, error } = await supabase
    .from('user_ingredients')
    .select('ingredient_name, category, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 재료별 score 집계: 최근 30일 추가 횟수 × 2 + 전체 추가 횟수
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const scoreMap = new Map<string, { category: string | null; total: number; recent: number; lastAdded: string }>();

  for (const row of rows ?? []) {
    const existing = scoreMap.get(row.ingredient_name);
    if (!existing) {
      scoreMap.set(row.ingredient_name, {
        category: row.category ?? null,
        total: 1,
        recent: new Date(row.created_at) > thirtyDaysAgo ? 1 : 0,
        lastAdded: row.created_at,
      });
    } else {
      existing.total++;
      if (new Date(row.created_at) > thirtyDaysAgo) existing.recent++;
      if (row.created_at > existing.lastAdded) existing.lastAdded = row.created_at;
    }
  }

  const scored = Array.from(scoreMap.entries())
    .map(([name, { category, total, recent, lastAdded }]) => ({
      ingredient_name: name,
      category,
      score: recent * 2 + total,
      last_added_at: lastAdded,
    }))
    .sort((a, b) => b.score - a.score || (a.last_added_at < b.last_added_at ? 1 : -1))
    .slice(0, limit);

  // ingredients_master에서 emoji 보강 — DB 단일 소스
  const names = scored.map(d => d.ingredient_name);
  let nameToEmoji = new Map<string, string | null>();
  if (names.length > 0) {
    const { data: masterRows } = await supabase
      .from('ingredients_master')
      .select('name, emoji')
      .in('name', names);
    nameToEmoji = new Map((masterRows ?? []).map(r => [r.name, r.emoji ?? null]));
  }

  const items = scored.map(d => ({
    ...d,
    emoji: nameToEmoji.get(d.ingredient_name) ?? null,
  }));

  return NextResponse.json({ items });
}

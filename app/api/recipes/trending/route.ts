import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { attachFridgeMatch } from '@/lib/recommendations/fridgeMatch';
import type { RecipeWithMatch } from '@/lib/types/recipe';

// 이번 주 인기(조회수 상위 4) — AllRecipesClient 트렌딩 스트립. 냉장고 match 부착.
// 데이터 계층 이전(docs/DATA_LAYER.md): 클라 직접 read + fridge match 를 서버로.
const RECIPE_COLS =
  'id, title, thumbnail_url, prep_time_minutes, cook_time_minutes, difficulty_level, average_rating, views_count, author:profiles!recipes_author_id_fkey(username), created_at';

export async function GET() {
  const supabase = await createClient();

  const [{ data: { user } }, { data }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('recipes')
      .select(RECIPE_COLS)
      .eq('status', 'published')
      .order('views_count', { ascending: false })
      .limit(4),
  ]);

  if (!data) {
    return NextResponse.json({ recipes: [] });
  }

  const processed: RecipeWithMatch[] = data.map((r) => ({
    ...r,
    author: Array.isArray(r.author) ? r.author[0] : r.author,
  }));

  const recipes = await attachFridgeMatch(supabase, user?.id ?? null, processed);
  return NextResponse.json({ recipes });
}

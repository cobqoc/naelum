import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';
import { attachFridgeMatch } from '@/lib/recommendations/fridgeMatch';
import type { RecipeWithMatch } from '@/lib/types/recipe';

// 이번 주 인기(조회수 상위 4) — AllRecipesClient 트렌딩 스트립. 냉장고 match 부착.
// 데이터 계층 이전(docs/DATA_LAYER.md): 클라 직접 read + fridge match 를 서버로.
const RECIPE_COLS =
  'id, title, thumbnail_url, prep_time_minutes, cook_time_minutes, difficulty_level, average_rating, views_count, author:profiles!recipes_author_id_fkey(username), created_at';

// 병목: top-4 published 목록은 *만인 동일* → 공유 캐시. cookieless anon(RLS published-only,
// 캐시에 비공개 유출 0). 조회수 기반이라 신규 레시피(0뷰)는 어차피 미진입 → 시간 무효화로 충분.
// fridge-match(사용자별)는 캐시 밖 라이브. recipeDetail.ts 패턴.
const getCachedTrending = unstable_cache(
  async () => {
    const anon = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data } = await anon
      .from('recipes')
      .select(RECIPE_COLS)
      .eq('status', 'published')
      .order('views_count', { ascending: false })
      .limit(4);
    return data ?? [];
  },
  ['recipes-trending-top4'],
  { revalidate: 120 }
);

export async function GET() {
  const supabase = await createClient();

  const [{ data: { user } }, data] = await Promise.all([
    supabase.auth.getUser(),
    getCachedTrending(),
  ]);

  if (!data || data.length === 0) {
    return NextResponse.json({ recipes: [] });
  }

  const processed: RecipeWithMatch[] = data.map((r) => ({
    ...r,
    author: Array.isArray(r.author) ? r.author[0] : r.author,
  }));

  const recipes = await attachFridgeMatch(supabase, user?.id ?? null, processed);
  return NextResponse.json({ recipes });
}

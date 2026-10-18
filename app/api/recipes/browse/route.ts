import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { attachFridgeMatch } from '@/lib/recommendations/fridgeMatch';
import type { RecipeWithMatch } from '@/lib/types/recipe';
// 2026-10-04 API1-39: 카드 컬럼(trending 과 바이트 동일)·author 정규화·has_cooked 조회 → lib/queries/recipeCards 단일 출처
import { RECIPE_LIST_CARD_COLS, firstOfEmbed, fetchCookedRecipeIds } from '@/lib/queries/recipeCards';

// 전체 레시피 페이지(AllRecipesClient) 목록 — 페이지네이션 + 냉장고 match + has_cooked.
// 데이터 계층 이전(docs/DATA_LAYER.md): AllRecipesClient 의 직접 read(recipes·cooking_sessions)와
// 클라 fridge match 를 서버로. attachFridgeMatch 는 client/server 공용(같은 V2 매칭, 단일 출처).
const RECIPES_PER_PAGE = 20;
const RECIPE_COLS = RECIPE_LIST_CARD_COLS;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const sp = request.nextUrl.searchParams;

  const sortParam = sp.get('sort');
  const sort = sortParam === 'rating' || sortParam === 'views' ? sortParam : 'latest';
  const cuisine = sp.get('cuisine_type');
  const dish = sp.get('dish_type');
  const pageNum = Math.max(0, Number(sp.get('page')) || 0);

  let query = supabase.from('recipes').select(RECIPE_COLS).eq('status', 'published');
  if (cuisine) query = query.eq('cuisine_type', cuisine);
  if (dish) query = query.eq('dish_type', dish);
  if (sort === 'latest') query = query.order('created_at', { ascending: false });
  else if (sort === 'rating') query = query.order('average_rating', { ascending: false });
  else if (sort === 'views') query = query.order('views_count', { ascending: false });
  const from = pageNum * RECIPES_PER_PAGE;
  query = query.range(from, from + RECIPES_PER_PAGE - 1);

  // getUser 와 recipes 쿼리는 독립 → 병렬(원본 클라 동작 보존).
  const [{ data: { user } }, { data, error }] = await Promise.all([
    supabase.auth.getUser(),
    query,
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ recipes: [] });
  }

  let processed: RecipeWithMatch[] = data.map((r) => ({
    ...r,
    author: firstOfEmbed(r.author),
  }));

  if (user && processed.length > 0) {
    const recipeIds = processed.map((r) => r.id);
    // cooked 조회와 냉장고 match 는 독립 → 병렬.
    const [cookedIds, fridgeMatched] = await Promise.all([
      fetchCookedRecipeIds(supabase, user.id, recipeIds),
      attachFridgeMatch(supabase, user.id, processed),
    ]);
    processed = fridgeMatched.map((r) => ({ ...r, has_cooked: cookedIds.has(r.id) }));
  } else {
    processed = await attachFridgeMatch(supabase, user?.id ?? null, processed);
  }

  return NextResponse.json({ recipes: processed });
}

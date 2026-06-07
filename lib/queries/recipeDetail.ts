import 'server-only';
import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Recipe } from '@/app/[lang]/recipes/[id]/RecipeDetailClient';

/**
 * 레시피 상세 화면의 데이터 접근 계층 (단일 출처).
 * docs/DATA_LAYER.md 의 레퍼런스 슬라이스. page.tsx 는 이 함수들만 호출(얇게).
 *
 * 2026-06-08 이전: page.tsx 에 흩어져 있던 read 를 여기로 모음 (행위보존 — 쿼리 동일).
 */

// 레시피 본문 SELECT — 캐시 경로(anon)와 폴백 경로(authed)가 동일 shape 보장 위해 단일 출처.
const RECIPE_BODY_SELECT = `
      *,
      author:profiles!recipes_author_id_fkey(username, avatar_url, bio),
      ingredients:recipe_ingredients(*),
      steps:recipe_steps(*)
    `;

/**
 * 공개(published) 레시피 본문만 공유 캐시.
 *  - cookieless anon 클라이언트 → RLS 상 published 만 반환(+ 명시 status 필터로 이중 안전).
 *    절대 비공개/draft 를 캐시에 담지 않음 → 비공개 유출 0.
 *  - 사용자별 데이터·비공개 작성자 게이트는 캐시 밖 라이브 경로에서 처리.
 *  - revalidate 30s: 발행 레시피 수정/언발행이 최대 30초 stale (force-dynamic 0초 대비 trade-off).
 *    prod 공개 레시피는 admin 소유로 거의 안 바뀌어 허용 범위. 무효화는 시간 기반만(수동 X).
 */
const getCachedPublishedRecipeBody = unstable_cache(
  async (id: string) => {
    // 원본 authed 경로(createClient, 제네릭 없음)와 동일하게 untyped → recipeData spread/Recipe 캐스트 호환.
    const anon = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data } = await anon
      .from('recipes')
      .select(RECIPE_BODY_SELECT)
      .eq('id', id)
      .eq('status', 'published')
      .maybeSingle();
    return data ?? null;
  },
  ['recipe-detail-published-body'],
  { revalidate: 30 }
);

export interface RecipeDetailData {
  recipe: Recipe;
  currentUserId: string | null;
  initialUserIngredients: string[];
  initialUserIngredientIds: string[];
  initialUserIngredientQtys: { id: string; name: string; quantity: number | null; unit: string | null }[];
  initialIsSaved: boolean;
  initialSaveNotes: string | null;
  initialIsLiked: boolean;
  initialLikesCount: number;
  initialHasCooked: boolean;
  initialHasReviewed: boolean;
}

/**
 * 레시피 상세 데이터를 fetch한다.
 * - 비로그인: recipe + cooked count
 * - 로그인: recipe + cooked count + user_ingredients + recipe_saves + recipe_likes
 *           + cooking_sessions(hasCooked) + recipe_posts(hasReviewed)
 * 미존재/비공개(작성자 아님)면 null.
 */
export async function getRecipeDetailData(id: string): Promise<RecipeDetailData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. 레시피 본문 (가장 큰 쿼리)
  //    공개 레시피는 공유 캐시에서(사용자 무관). 캐시 미스(비공개/draft/미존재)면
  //    authed 라이브 조회로 폴백 후 작성자 게이트 적용.
  let recipeData = await getCachedPublishedRecipeBody(id);

  if (!recipeData) {
    const { data: liveData, error: liveErr } = await supabase
      .from('recipes')
      .select(RECIPE_BODY_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (liveErr || !liveData) {
      return null;
    }
    // 비공개 레시피 접근 권한 체크 — 작성자만 열람 가능
    if (liveData.status !== 'published') {
      if (!user || liveData.author_id !== user.id) {
        return null;
      }
    }
    recipeData = liveData;
  }

  // 2. 병렬 쿼리: cooked count + 유저 전용 데이터
  const cookedCountPromise = supabase
    .from('cooking_sessions')
    .select('user_id', { count: 'exact', head: true })
    .eq('recipe_id', id)
    .not('completed_at', 'is', null);

  if (user) {
    const [
      { count: cookedCount },
      { data: userIngData },
      { data: saveData },
      { data: cookingData },
      { data: likeData },
      { data: reviewData },
    ] = await Promise.all([
      cookedCountPromise,
      supabase
        .from('user_ingredients')
        .select('ingredient_name, ingredient_id, quantity, unit')
        .eq('user_id', user.id),
      supabase
        .from('recipe_saves')
        .select('id, notes')
        .eq('recipe_id', id)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('cooking_sessions')
        .select('id')
        .eq('recipe_id', id)
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .maybeSingle(),
      supabase
        .from('recipe_likes')
        .select('id')
        .eq('recipe_id', id)
        .eq('user_id', user.id)
        .maybeSingle(),
      // 내가 이미 별점 리뷰를 남겼는지(top-level + rating 있음) → 재방문 별점 prompt 노출 판단
      supabase
        .from('recipe_posts')
        .select('id')
        .eq('recipe_id', id)
        .eq('user_id', user.id)
        .is('parent_id', null)
        .not('rating', 'is', null)
        .maybeSingle(),
    ]);

    const recipe: Recipe = { ...recipeData, cooked_count: cookedCount || 0 };

    return {
      recipe,
      currentUserId: user.id,
      initialUserIngredients: (userIngData || []).map(i => i.ingredient_name),
      initialUserIngredientIds: (userIngData || [])
        .map(i => i.ingredient_id)
        .filter((x): x is string => !!x),
      // 양 매칭(Phase 2) — id 보유 재료의 수량·단위 (부족분 표시용)
      // name 동봉: id→name 매핑은 반드시 이 행 단위 구조에서 파생(이름·id 평행배열 zip 금지 — H5)
      initialUserIngredientQtys: (userIngData || [])
        .filter(i => i.ingredient_id)
        .map(i => ({ id: i.ingredient_id as string, name: i.ingredient_name, quantity: i.quantity ?? null, unit: i.unit ?? null })),
      initialIsSaved: !!saveData,
      initialSaveNotes: saveData?.notes ?? null,
      initialIsLiked: !!likeData,
      initialLikesCount: recipe.likes_count ?? 0,
      initialHasCooked: !!cookingData,
      initialHasReviewed: !!reviewData,
    };
  }

  // 비로그인
  const { count: cookedCount } = await cookedCountPromise;
  const recipe: Recipe = { ...recipeData, cooked_count: cookedCount || 0 };

  return {
    recipe,
    currentUserId: null,
    initialUserIngredients: [],
    initialUserIngredientIds: [],
    initialUserIngredientQtys: [],
    initialIsSaved: false,
    initialSaveNotes: null,
    initialIsLiked: false,
    initialLikesCount: recipe.likes_count ?? 0,
    initialHasCooked: false,
    initialHasReviewed: false,
  };
}

/**
 * generateMetadata 용 레시피 메타 row (published 게이트는 호출부에서 status 체크).
 * 포맷팅(title/og 구성)은 표현 관심사라 page.tsx 에 남긴다.
 */
export async function getRecipeMetadata(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('recipes')
    .select('title, description, thumbnail_url, status, show_source, attributed_chef, source_channel, prep_time_minutes, cook_time_minutes, difficulty_level, average_rating, servings, author:profiles!recipes_author_id_fkey(username)')
    .eq('id', id)
    .maybeSingle();
  return data;
}

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import RecipeJsonLd from '@/components/RecipeJsonLd';
import RecipeDetailClient, { type Recipe } from './RecipeDetailClient';

// 로그인 유저에 따라 개인화 데이터가 달라지므로 정적 캐싱 불가
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * 레시피 상세 데이터를 한 번의 round-trip으로 병렬 fetch한다.
 * - 비로그인: recipe + cooked count
 * - 로그인: recipe + cooked count + user_ingredients + recipe_saves + recipe_likes
 *           + cooking_sessions(hasCooked) + rating API(userRating/userReview)
 */
async function fetchRecipePageData(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. 레시피 본문 (가장 큰 쿼리)
  const { data: recipeData, error: recipeError } = await supabase
    .from('recipes')
    .select(`
      *,
      author:profiles!recipes_author_id_fkey(username, avatar_url, bio),
      ingredients:recipe_ingredients(*),
      steps:recipe_steps(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (recipeError || !recipeData) {
    return null;
  }

  // 2. 비공개 레시피 접근 권한 체크 — 작성자만 열람 가능
  if (recipeData.status !== 'published') {
    if (!user || recipeData.author_id !== user.id) {
      return null;
    }
  }

  // 3. 병렬 쿼리: cooked count + 유저 전용 데이터
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
    ] = await Promise.all([
      cookedCountPromise,
      supabase
        .from('user_ingredients')
        .select('ingredient_name')
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
    ]);

    // 리뷰 데이터는 hasCooked한 유저만
    let userRating: number | null = null;
    let userReview: string | null = null;
    if (cookingData) {
      const { data: ratingRow } = await supabase
        .from('recipe_ratings')
        .select('rating, review')
        .eq('recipe_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (ratingRow) {
        userRating = ratingRow.rating ?? null;
        userReview = ratingRow.review ?? null;
      }
    }

    const recipe: Recipe = { ...recipeData, cooked_count: cookedCount || 0 };

    return {
      recipe,
      currentUserId: user.id,
      initialUserIngredients: (userIngData || []).map(i => i.ingredient_name),
      initialIsSaved: !!saveData,
      initialSaveNotes: saveData?.notes ?? null,
      initialIsLiked: !!likeData,
      initialLikesCount: recipe.likes_count ?? 0,
      initialHasCooked: !!cookingData,
      initialUserRating: userRating,
      initialUserReview: userReview,
    };
  }

  // 비로그인
  const { count: cookedCount } = await cookedCountPromise;
  const recipe: Recipe = { ...recipeData, cooked_count: cookedCount || 0 };

  return {
    recipe,
    currentUserId: null,
    initialUserIngredients: [],
    initialIsSaved: false,
    initialSaveNotes: null,
    initialIsLiked: false,
    initialLikesCount: recipe.likes_count ?? 0,
    initialHasCooked: false,
    initialUserRating: null,
    initialUserReview: null,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from('recipes')
    .select('title, description, thumbnail_url, status, show_source, attributed_chef, source_channel')
    .eq('id', id)
    .maybeSingle();

  if (!recipe || recipe.status !== 'published') {
    return {
      title: '레시피를 찾을 수 없습니다 · 낼름',
    };
  }

  // layout.tsx의 title template("%s | 낼름")이 자동으로 suffix를 붙여준다
  const title = recipe.title;
  const description = recipe.description?.slice(0, 150) || `${recipe.title} 레시피`;
  const fullTitleForOG = `${recipe.title} | 낼름`;

  // 일부 레거시 레시피의 thumbnail_url이 http://로 시작 (foodsafetykorea.go.kr 등).
  // HTTPS-only 환경의 SNS 미리보기에서 차단되므로 https로 강제 변환하거나 폴백 사용.
  const ogImage = recipe.thumbnail_url
    ? recipe.thumbnail_url.replace(/^http:\/\//, 'https://')
    : '/icons/icon-512.png';

  return {
    title,
    description,
    openGraph: {
      title: fullTitleForOG,
      description,
      images: [ogImage],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitleForOG,
      description,
      images: [ogImage],
    },
  };
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchRecipePageData(id);

  if (!data) {
    notFound();
  }

  const { recipe } = data;

  return (
    <>
      <RecipeJsonLd
        title={recipe.title}
        description={recipe.description}
        imageUrl={recipe.thumbnail_url}
        authorName={recipe.show_source && recipe.attributed_chef ? recipe.attributed_chef : (recipe.author?.username || 'anonymous')}
        prepTime={recipe.prep_time_minutes}
        cookTime={recipe.cook_time_minutes}
        servings={recipe.servings}
        rating={recipe.average_rating}
        ratingsCount={recipe.ratings_count}
        ingredients={recipe.ingredients.map(i => `${i.ingredient_name} ${i.quantity} ${i.unit}`.trim())}
        steps={recipe.steps.map(s => s.instruction)}
      />
      <RecipeDetailClient
        recipe={data.recipe}
        currentUserId={data.currentUserId}
        initialUserIngredients={data.initialUserIngredients}
        initialIsSaved={data.initialIsSaved}
        initialSaveNotes={data.initialSaveNotes}
        initialIsLiked={data.initialIsLiked}
        initialLikesCount={data.initialLikesCount}
        initialHasCooked={data.initialHasCooked}
        initialUserRating={data.initialUserRating}
        initialUserReview={data.initialUserReview}
      />
    </>
  );
}

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import RecipeJsonLd from '@/components/RecipeJsonLd';
import RecipeDetailClient, { type Recipe } from './RecipeDetailClient';
import { DIFFICULTY_LABELS } from '@/lib/types/recipe';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://naelum.app';

// 로그인 유저에 따라 개인화 데이터가 달라지므로 정적 캐싱 불가
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * 레시피 상세 데이터를 한 번의 round-trip으로 병렬 fetch한다.
 * - 비로그인: recipe + cooked count
 * - 로그인: recipe + cooked count + user_ingredients + recipe_saves + recipe_likes
 *           + cooking_sessions(hasCooked)
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
 * 단일 generateMetadata — 이전엔 layout.tsx 와 함께 *DB 쿼리 2번* 발생 (옛 audit 지적).
 * 2026-05-27 통합: layout.tsx 의 generateMetadata 흡수 후 layout.tsx 삭제. 단일 출처.
 *
 * page.tsx 정책 (유지):
 *  - status='published' 가드 + 미발견 시 절대 title 처리
 *  - title.absolute 로 "레시피명 | 낼름" format ([lang]/layout 의 title.absolute 부모 template 미전달 우회)
 *  - http→https 강제 변환 (legacy foodsafetykorea.go.kr 등 SNS 미리보기 차단 회피)
 *
 * 흡수 (layout.tsx → page.tsx):
 *  - SELECT: prep/cook_time·difficulty·rating·servings·author username
 *  - description fallback: "title - X분 - 난이도 - X인분" descParts (recipe.description NULL 시)
 *  - originalAuthor: attributed_chef 우선, fallback author.username
 *  - `other.recipe:*` OG meta (recipe vertical 비표준이지만 일부 SNS 활용)
 *  - DIFFICULTY_LABELS 공유 상수 (옛 layout 하드코딩 '초급/중급/고급' → 통일 '쉬움/보통/어려움')
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from('recipes')
    .select('title, description, thumbnail_url, status, show_source, attributed_chef, source_channel, prep_time_minutes, cook_time_minutes, difficulty_level, average_rating, servings, author:profiles!recipes_author_id_fkey(username)')
    .eq('id', id)
    .maybeSingle();

  if (!recipe || recipe.status !== 'published') {
    return {
      title: { absolute: '레시피를 찾을 수 없습니다 · 낼름' },
    };
  }

  const fullTitleForOG = `${recipe.title} | 낼름`;
  const title = { absolute: fullTitleForOG };

  // description fallback (layout 흡수): description NULL 시 시간·난이도·인분으로 채움
  const totalTime = (recipe.prep_time_minutes != null || recipe.cook_time_minutes != null)
    ? (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)
    : null;
  const difficulty = recipe.difficulty_level
    ? (DIFFICULTY_LABELS[recipe.difficulty_level] || recipe.difficulty_level)
    : null;
  const descParts = [
    recipe.title,
    totalTime != null ? `${totalTime}분` : null,
    difficulty,
    recipe.servings ? `${recipe.servings}인분` : null,
  ].filter(Boolean).join(' - ');
  const description = recipe.description?.slice(0, 150) || descParts;

  const ogImage = recipe.thumbnail_url
    ? recipe.thumbnail_url.replace(/^http:\/\//, 'https://')
    : '/icons/icon-512.png';

  const author = Array.isArray(recipe.author) ? recipe.author[0] : recipe.author;
  const originalAuthor = recipe.attributed_chef ?? author?.username ?? null;

  return {
    title,
    description,
    ...(originalAuthor && { authors: [{ name: originalAuthor }] }),
    openGraph: {
      title: fullTitleForOG,
      description,
      images: [ogImage],
      type: 'article',
      url: `${BASE_URL}/recipes/${id}`,
      ...(originalAuthor && { authors: [originalAuthor] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitleForOG,
      description,
      images: [ogImage],
    },
    ...(totalTime != null && {
      other: {
        ...(recipe.prep_time_minutes != null && { 'recipe:prep_time': `PT${recipe.prep_time_minutes}M` }),
        ...(recipe.cook_time_minutes != null && { 'recipe:cook_time': `PT${recipe.cook_time_minutes}M` }),
        'recipe:total_time': `PT${totalTime}M`,
      },
    }),
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
        ingredients={recipe.ingredients.map(i => {
          const displayUnit = (i.unit && i.unit !== '선택') ? i.unit : '';
          return `${i.ingredient_name} ${i.quantity} ${displayUnit}`.trim();
        })}
        steps={recipe.steps.map(s => s.instruction)}
      />
      <RecipeDetailClient
        recipe={data.recipe}
        currentUserId={data.currentUserId}
        initialUserIngredients={data.initialUserIngredients}
        initialUserIngredientIds={data.initialUserIngredientIds}
        initialUserIngredientQtys={data.initialUserIngredientQtys}
        initialIsSaved={data.initialIsSaved}
        initialSaveNotes={data.initialSaveNotes}
        initialIsLiked={data.initialIsLiked}
        initialLikesCount={data.initialLikesCount}
        initialHasCooked={data.initialHasCooked}
        initialHasReviewed={data.initialHasReviewed}
      />
    </>
  );
}

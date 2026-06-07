import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import RecipeJsonLd from '@/components/RecipeJsonLd';
import RecipeDetailClient from './RecipeDetailClient';
import { DIFFICULTY_LABELS } from '@/lib/types/recipe';
import { getRecipeDetailData, getRecipeMetadata } from '@/lib/queries/recipeDetail';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://naelum.app';

// 로그인 유저에 따라 개인화 데이터(저장·좋아요·냉장고·만든기록)가 달라지고 비공개 레시피
// 게이트가 있으므로 페이지 자체는 force-dynamic 유지(캐싱 시 사용자 상태 유출·비공개 유출 위험).
// read 는 전부 lib/queries/recipeDetail 데이터 계층으로 이전됨(docs/DATA_LAYER.md 레퍼런스 슬라이스).
// 공개 본문은 그 안에서 unstable_cache 로 공유 캐시.
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
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
  const recipe = await getRecipeMetadata(id);

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
  const data = await getRecipeDetailData(id);

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

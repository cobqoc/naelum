import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://naelum.app';

const DIFFICULTY_MAP: Record<string, string> = {
  easy: '초급',
  medium: '중급',
  hard: '고급',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from('recipes')
    .select('title, description, thumbnail_url, prep_time_minutes, cook_time_minutes, difficulty_level, average_rating, servings, author:profiles!recipes_author_id_fkey(username)')
    .eq('id', id)
    .single();

  if (!recipe) {
    return { title: '레시피를 찾을 수 없습니다' };
  }

  const author = Array.isArray(recipe.author) ? recipe.author[0] : recipe.author;
  const totalTime = (recipe.prep_time_minutes != null || recipe.cook_time_minutes != null)
    ? (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)
    : null;
  const difficulty = recipe.difficulty_level ? (DIFFICULTY_MAP[recipe.difficulty_level] || recipe.difficulty_level) : null;
  const descParts = [recipe.title, totalTime != null ? `${totalTime}분` : null, difficulty, recipe.servings ? `${recipe.servings}인분` : null].filter(Boolean).join(' - ');
  const description = recipe.description || descParts;

  return {
    title: recipe.title,
    description,
    openGraph: {
      title: recipe.title,
      description,
      type: 'article',
      url: `${BASE_URL}/recipes/${id}`,
      ...(recipe.thumbnail_url && {
        images: [{ url: recipe.thumbnail_url, width: 1200, height: 630, alt: recipe.title }],
      }),
      authors: author?.username ? [`@${author.username}`] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: recipe.title,
      description,
      ...(recipe.thumbnail_url && { images: [recipe.thumbnail_url] }),
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

export default function RecipeLayout({ children }: { children: React.ReactNode }) {
  return children;
}

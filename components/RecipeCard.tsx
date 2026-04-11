'use client';

import { memo } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/Common/SafeImage';
import { getDifficultyLabel, getTotalTime } from '@/lib/types/recipe';
import { useI18n } from '@/lib/i18n/context';

interface RecipeCardRecipe {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  display_image?: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  difficulty_level: string | null;
  views_count?: number;
  likes_count?: number;
  cooked_count?: number;
  average_rating?: number;
  has_cooked?: boolean;
  author?: { username: string; avatar_url?: string | null };
}

interface RecipeCardProps {
  recipe: RecipeCardRecipe;
  showAuthor?: boolean;
  priority?: boolean;
}

export default memo(function RecipeCard({ recipe, showAuthor = false, priority = false }: RecipeCardProps) {
  const { t } = useI18n();
  const imageUrl = recipe.thumbnail_url || recipe.display_image;

  return (
    <Link href={`/recipes/${recipe.id}`} className="block group">
      <div className="rounded-2xl bg-background-secondary overflow-hidden border border-white/5 transition-all group-hover:border-accent-warm/50 group-hover:shadow-lg group-hover:shadow-accent-warm/10">
        <div className="aspect-[4/3] w-full relative">
          {imageUrl ? (
            <SafeImage
              src={imageUrl}
              alt={recipe.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 bg-background-tertiary flex items-center justify-center text-4xl">
              🍳
            </div>
          )}
          {recipe.has_cooked && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-accent-warm text-background-primary text-xs font-bold shadow-lg">
              ✓ {t.recipe.cooked}
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-bold text-sm truncate">{recipe.title}</h3>
          {showAuthor && recipe.author && (
            <p className="text-[11px] text-text-muted mt-1">
              @{recipe.author.username}
            </p>
          )}
          {(getTotalTime(recipe) != null || getDifficultyLabel(recipe.difficulty_level) != null) && (
            <p className="text-xs text-text-muted mt-0.5">
              {[
                getTotalTime(recipe) != null ? `${getTotalTime(recipe)}${t.recipe.minuteUnit}` : null,
                getDifficultyLabel(recipe.difficulty_level, { easy: t.recipe.easy, medium: t.recipe.medium, hard: t.recipe.hard }),
              ].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
            {recipe.average_rating != null && recipe.average_rating > 0 && (
              <span className="text-accent-warm font-medium">★ {recipe.average_rating.toFixed(1)}</span>
            )}
            <span>👁 {recipe.views_count ?? 0}</span>
            {(recipe.likes_count ?? 0) > 0 && (
              <span>❤️ {recipe.likes_count}</span>
            )}
            {(recipe.cooked_count ?? 0) > 0 && (
              <span>🍳 {recipe.cooked_count}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
})

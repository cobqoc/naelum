'use client';

import { memo } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/Common/SafeImage';
import { getDifficultyLabel, getTotalTime } from '@/lib/types/recipe';
import { useI18n } from '@/lib/i18n/context';

interface FridgeRecipe {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  display_image?: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  difficulty_level: string | null;
  dish_type?: string | null;
  author?: { username: string; avatar_url?: string | null } | null;
  has_cooked?: boolean;
  matchRate?: number;
  matchedCount?: number;
  totalIngredients?: number;
  missingIngredientNames?: string[];
}

const DISH_TYPE_EMOJI: Record<string, string> = {
  side: '🥗',
  main: '🍖',
  rice: '🍚',
  soup: '🍲',
  dessert: '🍰',
  noodle: '🍜',
  snack: '🍿',
  brunch: '🥞',
  beverage: '🥤',
};

interface FridgeRecipeCardProps {
  recipe: FridgeRecipe;
  priority?: boolean;
}

function getMatchStyle(rate: number) {
  if (rate >= 80) return { bg: 'bg-match-high', text: 'text-match-high-text', bar: 'bg-match-high' };
  if (rate >= 50) return { bg: 'bg-match-mid', text: 'text-match-mid-text', bar: 'bg-match-mid' };
  return { bg: 'bg-match-low', text: 'text-match-low-text', bar: 'bg-match-low' };
}

export default memo(function FridgeRecipeCard({ recipe, priority = false }: FridgeRecipeCardProps) {
  const { t } = useI18n();
  const imageUrl = recipe.thumbnail_url || recipe.display_image;
  const totalTime = getTotalTime(recipe);
  const difficultyLabel = getDifficultyLabel(recipe.difficulty_level, t.difficulty);
  const hasMatch = recipe.matchRate !== undefined;
  const matchStyle = hasMatch ? getMatchStyle(recipe.matchRate!) : null;
  const missing = recipe.missingIngredientNames ?? [];

  return (
    <Link href={`/recipes/${recipe.id}`} className="block group">
      <div className="rounded-2xl bg-background-secondary overflow-hidden border border-white/5 transition-all group-hover:border-accent-warm/50 group-hover:shadow-lg group-hover:shadow-accent-warm/10">
        {/* 이미지 */}
        <div className="aspect-[4/3] w-full relative">
          {imageUrl ? (
            <SafeImage
              src={imageUrl}
              alt={recipe.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 33vw"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 bg-background-tertiary flex items-center justify-center text-4xl">
              {(recipe.dish_type && DISH_TYPE_EMOJI[recipe.dish_type]) || '🍳'}
            </div>
          )}

          {/* 매칭률 뱃지 */}
          {hasMatch && (
            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${matchStyle!.bg} shadow`}>
              {recipe.matchRate}% {t.recipeCard.matchedLabel}
            </div>
          )}

          {/* 만들어봤어요 뱃지 */}
          {recipe.has_cooked && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-accent-warm text-background-primary text-[10px] font-bold shadow">
              ✓ {t.recipeCard.cookedLabel}
            </div>
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="p-3 space-y-1.5">
          <h3 className="font-bold text-sm truncate">{recipe.title}</h3>

          {/* 매칭 정보 */}
          {hasMatch && (
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="flex-1 h-1 bg-background-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${matchStyle!.bar}`}
                    style={{ width: `${recipe.matchRate}%` }}
                  />
                </div>
                <span className={`text-[10px] font-semibold flex-shrink-0 ${matchStyle!.text}`}>
                  {recipe.matchedCount}/{recipe.totalIngredients}{t.recipeCard.heldSuffix}
                </span>
              </div>
              {missing.length > 0 ? (
                <p className="text-[11px] truncate">
                  <span className="text-accent-warm font-bold">🛒 {t.recipeCard.missingLabel}:</span>
                  <span className="ml-1 text-text-secondary">
                    {missing.slice(0, 2).join(', ')}
                    {missing.length > 2 && ` +${missing.length - 2}`}
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-match-high-text font-bold">✓ {t.recipeCard.allHeldLabel}</p>
              )}
            </div>
          )}

          {/* 시간 · 난이도 */}
          {(totalTime || difficultyLabel) && (
            <p className="text-[10px] text-text-muted">
              {totalTime && `⏱ ${totalTime}${t.recipeCard.minutesSuffix}`}
              {totalTime && difficultyLabel && ' · '}
              {difficultyLabel}
            </p>
          )}

          {/* 작성자 */}
          {recipe.author && (
            <p className="text-[10px] text-text-muted">@{recipe.author.username}</p>
          )}
        </div>
      </div>
    </Link>
  );
});

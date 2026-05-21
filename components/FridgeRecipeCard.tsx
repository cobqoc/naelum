'use client';

import { memo, useState } from 'react';
import Link from '@/components/Common/LocalizedLink';
import SafeImage from '@/components/Common/SafeImage';
import RecipeFridgeModal from '@/components/Recipes/RecipeFridgeModal';
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
  average_rating?: number;
  matchRate?: number;
  matchedCount?: number;
  totalIngredients?: number;
  ownedIngredientNames?: string[];
  missingIngredientNames?: string[];
}

// dish_type 카테고리 → 대표 이모지 (사진 없는 레시피의 placeholder).
// 카테고리 1개당 1개라 모든 레시피와 맞을 순 없음 — 가장 덜 빗나가는 것으로.
const DISH_TYPE_EMOJI: Record<string, string> = {
  side: '🥘',
  main: '🍖',
  rice: '🍚',
  soup: '🍲',
  dessert: '🍰',
  noodle: '🍜',
  snack: '🍟',
  brunch: '🥞',
  beverage: '🥤',
};

interface FridgeRecipeCardProps {
  recipe: FridgeRecipe;
  priority?: boolean;
}

// 부족 재료 개수 기반 뱃지 색 — 0개=초록(바로 가능), 1~3개=주황, 4개↑=빨강.
// 매칭률 %는 양념 때문에 부풀려져 쓰지 않음 — 부족 개수가 정직한 지표.
function getMissingStyle(missingCount: number) {
  if (missingCount === 0) return 'bg-match-high';
  if (missingCount <= 3) return 'bg-match-mid';
  return 'bg-match-low';
}

export default memo(function FridgeRecipeCard({ recipe, priority = false }: FridgeRecipeCardProps) {
  const { t } = useI18n();
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const imageUrl = recipe.thumbnail_url || recipe.display_image;
  const totalTime = getTotalTime(recipe);
  const difficultyLabel = getDifficultyLabel(recipe.difficulty_level, t.difficulty);
  const hasMatch = recipe.matchRate !== undefined;
  const missing = recipe.missingIngredientNames ?? [];
  const missingCount = missing.length;

  return (
    <>
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

          {/* 부족 재료 뱃지 — % 대신 부족 개수 (양념 부풀림 없는 정직한 표시) */}
          {hasMatch && (
            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${getMissingStyle(missingCount)} shadow`}>
              {missingCount === 0
                ? `🔥 ${t.recommendations.modeReadyLabel}`
                : t.recipeCard.missingCountBadge.replace('{count}', String(missingCount))}
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
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm truncate flex-1">{recipe.title}</h3>
            {/* 냉장고 아이콘 — 탭하면 보유/없는 재료 모달 (카드 이동 막음) */}
            {hasMatch && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFridgeOpen(true); }}
                aria-label={t.recipe.fridgeModalTitle}
                className="shrink-0 flex items-center justify-center w-7 h-7 -mr-1 rounded-full bg-background-tertiary text-text-secondary hover:bg-accent-warm/20 hover:text-accent-warm transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="5" y1="9" x2="19" y2="9" />
                  <line x1="9" y1="5" x2="9" y2="6.5" />
                  <line x1="9" y1="12" x2="9" y2="14" />
                </svg>
              </button>
            )}
          </div>

          {/* 부족 재료 목록 — % 진행바·분수 제거, 무엇이 부족한지만 표시 */}
          {hasMatch && (
            missingCount > 0 ? (
              <p className="text-[11px] truncate">
                <span className="text-text-muted font-semibold">{t.recipeCard.missingLabel}:</span>
                <span className="ml-1 text-text-secondary">
                  {missing.slice(0, 2).join(', ')}
                  {missing.length > 2 && ` +${missing.length - 2}`}
                </span>
              </p>
            ) : (
              <p className="text-[11px] text-match-high-text font-bold">✓ {t.recipeCard.allHeldLabel}</p>
            )
          )}

          {/* 시간 · 난이도 · 평점 */}
          {(totalTime || difficultyLabel || (recipe.average_rating && recipe.average_rating > 0)) && (
            <p className="text-[10px] text-text-muted flex items-center gap-1 flex-wrap">
              {totalTime && <span>⏱ {totalTime}{t.recipeCard.minutesSuffix}</span>}
              {totalTime && difficultyLabel && <span>·</span>}
              {difficultyLabel && <span>{difficultyLabel}</span>}
              {recipe.average_rating != null && recipe.average_rating > 0 && (
                <>
                  {(totalTime || difficultyLabel) && <span>·</span>}
                  <span className="text-accent-warm font-semibold">★ {recipe.average_rating.toFixed(1)}</span>
                </>
              )}
            </p>
          )}

          {/* 작성자 */}
          {recipe.author && (
            <p className="text-[10px] text-text-muted">@{recipe.author.username}</p>
          )}
        </div>
      </div>
    </Link>

    {/* 냉장고 모달 — Link 바깥(형제)으로 렌더해 모달 클릭이 카드 이동 안 되게 */}
    {fridgeOpen && (
      <RecipeFridgeModal
        onClose={() => setFridgeOpen(false)}
        ownedNames={recipe.ownedIngredientNames ?? []}
        missingNames={missing}
      />
    )}
    </>
  );
});

'use client';

import { memo, useState } from 'react';
import Link from '@/components/Common/LocalizedLink';
import SafeImage from '@/components/Common/SafeImage';
import RecipeFridgeModal from '@/components/Recipes/RecipeFridgeModal';
import FridgeIcon from '@/components/icons/FridgeIcon';
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
  average_rating?: number;
  has_cooked?: boolean;
  author?: { username: string; avatar_url?: string | null } | null;
  // 재료 매칭 — 추천 페이지처럼 match 데이터가 있을 때만 채워짐. 있으면 냉장고 보유 줄을 띄운다.
  matchRate?: number;
  totalIngredients?: number;
  ownedIngredientNames?: string[];
  substitutableIngredients?: { ingredient: string; via: string }[];
  missingIngredientNames?: string[];
}

interface RecipeCardProps {
  recipe: RecipeCardRecipe;
  showAuthor?: boolean;
  priority?: boolean;
  /** 'full' = N/N 보유 3색(추천) · 'positive' = 바로 가능할 때만 초록 라벨(전체·검색) */
  fridgeRowMode?: 'full' | 'positive';
}

// 냉장고 상태 색 — 아이콘 원 배경(bg) + "N/N 보유" 텍스트(text)를 같은 색으로.
// 레시피 상세 페이지와 같은 팔레트: 0개=초록(바로 가능), 1~3개=주황(거의), 4개↑=빨강.
function fridgeStatusColor(missingCount: number): { bg: string; text: string } {
  if (missingCount === 0) return { bg: 'bg-success', text: 'text-success' };
  if (missingCount <= 3) return { bg: 'bg-warning', text: 'text-warning' };
  return { bg: 'bg-error', text: 'text-error' };
}

/**
 * 레시피 카드 — 전체 레시피·추천·검색 공용 단일 컴포넌트.
 * `recipe`에 match 데이터(matchRate 등)가 있으면 냉장고 보유 줄을 추가로 띄운다(추천 페이지).
 * 없으면 그 줄만 빠지고 나머지는 동일 — 모든 화면에서 카드가 구조적으로 일치한다.
 */
export default memo(function RecipeCard({ recipe, showAuthor = false, priority = false, fridgeRowMode = 'full' }: RecipeCardProps) {
  const { t } = useI18n();
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const imageUrl = recipe.thumbnail_url || recipe.display_image;
  const totalTime = getTotalTime(recipe);
  const difficultyLabel = getDifficultyLabel(recipe.difficulty_level, t.difficulty);
  const rating = recipe.average_rating ?? 0;

  // 재료 매칭 데이터가 있을 때만 냉장고 보유 줄을 표시.
  const hasMatch = recipe.matchRate !== undefined;
  const missing = recipe.missingIngredientNames ?? [];
  const missingCount = missing.length;
  const ownedCount = recipe.ownedIngredientNames?.length ?? 0;
  const totalCount = recipe.totalIngredients ?? 0;

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
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
          ) : (
            // 사진 없는 레시피 fallback — 빈약한 회색 대신 따뜻한 gradient + 큰 emoji + 제목 일부.
            <div className="absolute inset-0 bg-gradient-to-br from-accent-warm/20 via-background-tertiary to-background-secondary flex flex-col items-center justify-center gap-2 p-3">
              <span className="text-5xl md:text-6xl opacity-60" aria-hidden="true">🍳</span>
              <span className="text-xs md:text-sm font-bold text-text-secondary text-center line-clamp-2 leading-tight">
                {recipe.title}
              </span>
            </div>
          )}
          {recipe.has_cooked && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-accent-warm text-background-primary text-xs font-bold shadow-lg">
              ✓ {t.recipe.cooked}
            </div>
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="p-3 space-y-1">
          <h3 className="font-bold text-sm truncate">{recipe.title}</h3>

          {/* 냉장고 보유 줄 — match 데이터가 있을 때만. 줄 전체 탭 → 보유/대체/없는 모달.
              full(추천): N/N 보유 3색 + 🔄 대체 마커 · positive(전체·검색): 바로 가능할 때만 초록 라벨 */}
          {hasMatch && (() => {
            const substituteCount = recipe.substitutableIngredients?.length ?? 0;
            const isReadyToCook = totalCount > 0 && missingCount === 0;

            // positive 모드 — 바로 만들 수 있을 때만 노출. 빨간 벽 방지(둘러보기 화면).
            if (fridgeRowMode === 'positive') {
              if (!isReadyToCook) return null;
              return (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFridgeOpen(true); }}
                  aria-label={t.recipe.fridgeModalTitle}
                  className="flex items-center gap-1.5 group/fridge"
                >
                  <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-success transition-transform group-hover/fridge:scale-110">
                    <FridgeIcon size={16} />
                  </span>
                  <span className="text-[11px] font-semibold text-success">
                    ✓ {t.recipe.canMakeNow}{substituteCount > 0 ? ' 🔄' : ''}
                  </span>
                </button>
              );
            }

            // full 모드 — N/N 보유(정밀 카운트) + 상태색. 대체로 메워진 경우 🔄 마커로 카운트≠상태 설명.
            const fc = fridgeStatusColor(missingCount);
            return (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFridgeOpen(true); }}
                aria-label={t.recipe.fridgeModalTitle}
                className="flex items-center gap-1.5 group/fridge"
              >
                <span className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-full transition-transform group-hover/fridge:scale-110 ${fc.bg}`}>
                  <FridgeIcon size={16} />
                </span>
                <span className={`text-[11px] font-semibold ${fc.text}`}>
                  {ownedCount}/{totalCount} {t.recipe.ownedSuffix}
                </span>
                {substituteCount > 0 && (
                  <span className="text-[11px] text-text-muted">🔄 {substituteCount}</span>
                )}
              </button>
            );
          })()}

          {/* 메타 — 시간 · 난이도 · 평점. flex-wrap 으로 좁은 카드에서 넘침 대신 줄바꿈 */}
          {(totalTime != null || difficultyLabel || rating > 0) && (
            <p className="text-xs text-text-muted flex items-center gap-1 flex-wrap">
              {totalTime != null && <span>⏱ {totalTime}{t.recipe.minuteUnit}</span>}
              {totalTime != null && difficultyLabel && <span aria-hidden="true">·</span>}
              {difficultyLabel && <span>{difficultyLabel}</span>}
              {rating > 0 && (
                <>
                  {(totalTime != null || difficultyLabel) && <span aria-hidden="true">·</span>}
                  <span className="text-accent-warm font-semibold">★ {rating.toFixed(1)}</span>
                </>
              )}
            </p>
          )}

          {/* 작성자 */}
          {showAuthor && recipe.author && (
            <p className="text-[11px] text-text-muted truncate">@{recipe.author.username}</p>
          )}
        </div>
      </div>
    </Link>

    {/* 냉장고 모달 — Link 바깥(형제)으로 렌더해 모달 클릭이 카드 이동 안 되게 */}
    {fridgeOpen && (
      <RecipeFridgeModal
        onClose={() => setFridgeOpen(false)}
        ownedNames={recipe.ownedIngredientNames ?? []}
        substituteItems={recipe.substitutableIngredients ?? []}
        missingNames={missing}
      />
    )}
    </>
  );
});

'use client';

import { memo, useState } from 'react';
import Link from '@/components/Common/LocalizedLink';
import SafeImage from '@/components/Common/SafeImage';
import RecipeFridgeModal from '@/components/Recipes/RecipeFridgeModal';
import FridgeIcon from '@/components/icons/FridgeIcon';
import { getDifficultyLabel, getTotalTime } from '@/lib/types/recipe';
import { getFridgeBadge } from '@/lib/recommendations/fridgeBadge';
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
  // 재료 매칭 — 추천 페이지처럼 match 데이터가 있을 때만 채워짐. 있으면 냉장고 배지를 띄운다.
  matchRate?: number;
  totalIngredients?: number;
  ownedIngredientNames?: string[];
  substitutableIngredients?: { ingredient: string; via: string }[];
  missingIngredientNames?: string[];
  /** 배지 카운트의 단일 출처(매칭 레이어가 계산). 부재 시 배지 숨김 — 이름배열 length 추정 금지. */
  missingCount?: number;
}

interface RecipeCardProps {
  recipe: RecipeCardRecipe;
  showAuthor?: boolean;
  priority?: boolean;
  /** 'full' = 항상 배지 표시(추천) · 'positive' = 바로 가능할 때만 배지(전체·검색) */
  fridgeRowMode?: 'full' | 'positive';
}

// 냉장고 매칭 상태색 — 배지 배경. 레시피 상세 페이지와 같은 팔레트:
// 0개 부족=초록(바로 가능), 1~3개=주황(거의), 4개↑=빨강.
function fridgeStatusBg(missingCount: number): string {
  if (missingCount === 0) return 'bg-success';
  if (missingCount <= 3) return 'bg-warning';
  return 'bg-error';
}

/**
 * 레시피 카드 — 전체 레시피·추천·검색 공용 단일 컴포넌트.
 * `recipe`에 match 데이터(matchRate 등)가 있으면 썸네일 좌상단에 냉장고 매칭
 * 배지를 띄운다(추천 페이지). 없으면 그 배지만 빠지고 나머지는 동일.
 *
 * 배지는 분수("8/12") 대신 판정어("바로 가능"/"N개 부족")를 쓴다 — 색이
 * 글랜스 판정을 하므로 글자는 답을 말로. 만들어봤어요 배지와 같은 모서리에
 * 세로로 스택해 좁은 카드에서도 겹치지 않는다.
 */
export default memo(function RecipeCard({ recipe, showAuthor = false, priority = false, fridgeRowMode = 'full' }: RecipeCardProps) {
  const { t } = useI18n();
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const imageUrl = recipe.thumbnail_url || recipe.display_image;
  const totalTime = getTotalTime(recipe);
  const difficultyLabel = getDifficultyLabel(recipe.difficulty_level, t.difficulty);
  const rating = recipe.average_rating ?? 0;

  // 모달용 이름 배열. (배지 카운트는 아래 getFridgeBadge 가 명시 missingCount 만 신뢰)
  const missing = recipe.missingIngredientNames ?? [];

  // 냉장고 매칭 배지 — 썸네일 좌상단 오버레이. 줄 전체 탭 → 보유/대체/없는 모달.
  // 데이터 불완전 시 null(배지 없음) — "모름 → 바로 가능(초록)" 오판을 구조적으로 차단.
  // 판정 로직은 순수 함수(테스트됨): lib/recommendations/fridgeBadge.
  const badge = getFridgeBadge(recipe, fridgeRowMode);
  const fridgeBadge = badge ? (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFridgeOpen(true); }}
      aria-label={t.recipe.fridgeModalTitle}
      className={`flex items-center gap-1 pl-0.5 pr-2 py-0.5 rounded-full shadow-lg transition-transform hover:scale-105 ${fridgeStatusBg(badge.missingCount)}`}
    >
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white shrink-0">
        <FridgeIcon size={14} />
      </span>
      <span className="text-[11px] font-bold text-white whitespace-nowrap">
        {badge.isReady
          ? t.recipe.fridgeBadgeReady
          : t.recipe.fridgeBadgeMissing.replace('{n}', String(badge.missingCount))}
      </span>
    </button>
  ) : null;

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

          {/* 좌상단 오버레이 — 냉장고 매칭 배지 + 만들어봤어요. 세로 스택이라
              좁은 카드에서도 가로로 겹치지 않는다. 보통은 배지 1개(냉장고)만. */}
          {(fridgeBadge || recipe.has_cooked) && (
            <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
              {fridgeBadge}
              {recipe.has_cooked && (
                <span className="px-2 py-0.5 rounded-full bg-accent-warm text-background-primary text-xs font-bold shadow-lg">
                  ✓ {t.recipe.cooked}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 콘텐츠 — 제목 · 메타 · 작성자 (냉장고 매칭은 썸네일 오버레이로 분리) */}
        <div className="p-3 space-y-1">
          <h3 className="font-bold text-sm truncate">{recipe.title}</h3>

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

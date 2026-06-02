'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import SafeImage from '@/components/Common/SafeImage';
import Link from '@/components/Common/LocalizedLink';
import ShareButton from './Recipes/ShareButton';
import { useToast } from '@/lib/toast/context';
import { useUnitConversion } from '@/lib/hooks/useUnitConversion';
import { useCookingMode } from '@/lib/hooks/useCookingMode';
import { useRecipeFridgeMatch } from '@/lib/hooks/useRecipeFridgeMatch';
import { useCartFromRecipe } from '@/lib/hooks/useCartFromRecipe';
import { useI18n } from '@/lib/i18n/context';
import CartIcon from '@/components/icons/CartIcon';
import CookTimerPanel from '@/components/cook/CookTimerPanel';
import CustomTimerSetup from '@/components/cook/CustomTimerSetup';
import RecipeFridgeModal from '@/components/Recipes/RecipeFridgeModal';
import IngredientsTab from '@/components/Recipes/_browse/IngredientsTab';
import StepsTab from '@/components/Recipes/_browse/StepsTab';

const ContactModal = dynamic(() => import('./ContactModal'), { loading: () => null });
const ReportModal = dynamic(() => import('./Common/ReportModal'), { loading: () => null });

interface RecipeIngredient {
  ingredient_name: string;
  ingredient_id?: string | null;
  quantity: string;
  unit: string;
  notes?: string;
  is_optional?: boolean;
  // legacy DB rows: string[] / 신규: { name; note? }[] — normalize 후 후자로 사용.
  substitutes?: (string | { name?: string; note?: string })[] | null;
}

interface RecipeStep {
  title?: string;
  instruction: string;
  step_number: number;
  timer_minutes?: number | null;
  tip?: string;
  image_url?: string | null;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  difficulty_level: string | null;
  servings: number | null;
  average_rating: number;
  ratings_count: number;
  cooked_count?: number;
  likes_count?: number;
  author: { username: string; avatar_url: string | null; bio: string | null } | null;
  thumbnail_url: string | null;
  ingredients_image_url?: string | null;
  video_url?: string | null;
  show_source?: boolean | null;
  source_url?: string | null;
  attributed_chef?: string | null;
  source_channel?: string | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  // 영양 정보
  calories?: number | null;
  protein_grams?: number | null;
  carbs_grams?: number | null;
  fat_grams?: number | null;
  fiber_grams?: number | null;
  sodium_mg?: number | null;
}

interface RecipeBrowseViewProps {
  recipe: Recipe;
  userIngredients: string[];
  userIngredientIds: string[];
  userIngredientQtys?: { id: string; name: string; quantity: number | string | null; unit: string | null }[];
  isSaved: boolean;
  saveNotes: string | null;
  onToggleSave: () => void;
  onUpdateMemo: (notes: string) => void;
  actionLoading: boolean;
  hasCooked: boolean;
  isLiked?: boolean;
  likesCount?: number;
  onToggleLike?: () => void;
  likeLoading?: boolean;
  /** 본인 콘텐츠 여부 — true 시 🚨 신고 버튼 숨김 (자기 자기 신고 UX 부자연스러움 해소) */
  isAuthor?: boolean;
  /** 조리순서 끝 "다 만들었어요" 클릭 — 부모가 MadeItModal 오픈 */
  onMadeIt?: () => void;
  /** 로그인 여부 — false 면 장보기 버튼이 onRequireCartLogin 호출(서버 401 raw 한글 토스트 방지) */
  isLoggedIn?: boolean;
  /** 비로그인 장보기 클릭 시 부모가 번역된 로그인 유도 토스트 노출 (like/save와 동일 패턴) */
  onRequireCartLogin?: () => void;
}

export default function RecipeBrowseView({
  recipe,
  userIngredients,
  userIngredientIds,
  userIngredientQtys,
  isSaved,
  saveNotes,
  onToggleSave,
  onUpdateMemo,
  actionLoading,
  hasCooked,
  isLiked = false,
  likesCount = 0,
  onToggleLike,
  likeLoading = false,
  isAuthor = false,
  onMadeIt,
  isLoggedIn = true,
  onRequireCartLogin,
}: RecipeBrowseViewProps) {
  const toast = useToast();
  const unitConv = useUnitConversion();
  const { t } = useI18n();
  // 요리 모드 hook — completedSteps·timerSetup·multiTimer·voice 통합 ([[project-god-file-phase2]]).
  const cook = useCookingMode(recipe.steps || []);
  // 인분 조절 — 양 매칭 스케일에 필요해 매칭 hook 앞에 선언.
  const baseServings = Math.max(1, recipe.servings ?? 1);
  const [currentServings, setCurrentServings] = useState(baseServings);
  // 양 매칭(Phase 2) — 보유 재료 양 맵 (id → {quantity, unit})
  const userQtyMap = useMemo(
    () => new Map((userIngredientQtys ?? []).map(u => [u.id, { quantity: u.quantity, unit: u.unit }])),
    [userIngredientQtys],
  );
  // 냉장고 매칭 hook — 재료 탭·냉장고 모달·cart 보유 제외 3 곳 단일 출처.
  // 양 매칭: 보유 양 맵 + 인분 배수(현재/기본) → 부족분(shortBy) 계산.
  const match = useRecipeFridgeMatch(
    recipe.ingredients, userIngredients, userIngredientIds, userQtyMap, currentServings / baseServings,
  );
  // 카트 추가 hook — V2: ingredient_id 기반 매칭.
  const cart = useCartFromRecipe({
    recipe: {
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.ingredients.map(i => ({
        ingredient_id: i.ingredient_id ?? null,
        ingredient_name: i.ingredient_name,
        quantity: i.quantity,
        unit: i.unit,
      })),
    },
    isIngredientOwned: match.isIngredientOwned,
    ownedCount: match.ownedCount,
    toast,
    locale: {
      cartAllOwned: t.recipe.cartAllOwned,
      cartAddedSimple: t.recipe.cartAddedSimple,
      cartAddedWithSkip: t.recipe.cartAddedWithSkip,
      cartAddFailed: t.recipe.cartAddFailed,
    },
  });

  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoText, setMemoText] = useState(saveNotes || '');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // 냉장고 재료 비교 모달 — 재료 탭·"N/N 보유"와 같은 isIngredientOwned 사용
  const [showFridgeModal, setShowFridgeModal] = useState(false);

  // 매칭 결과는 match.* 로 접근. JSX 에서 사용하는 destructure 만.
  const { ownedCount, totalIngredients, ingredientStatus, summary } = match;

  // V2: id → name 매핑 (chip 표시·모달용). 반드시 행 단위 userIngredientQtys 에서 파생 —
  // userIngredients(전체 행 이름)·userIngredientIds(id-null 제외 행)는 길이/순서가 달라
  // index zip 하면 엉뚱한 보유재료명이 매핑됨(H5). qtys 는 id 기준 행이라 (id,name) 정렬 보장.
  const userIngredientNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of userIngredientQtys ?? []) m.set(u.id, u.name ?? '');
    return m;
  }, [userIngredientQtys]);

  // 재료 양 배율 계산
  const scaleQty = (qty: string): string => {
    if (currentServings === baseServings || !qty) return qty;
    const num = parseFloat(qty);
    if (isNaN(num)) return qty;
    const scaled = num * (currentServings / baseServings);
    return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
  };

  // is_optional 재료 목록 + substitutes — 단계 본문 자동 highlight 용.
  // substitutes 는 display 용 string[] 로 평탄화 (note 있으면 "name · note" 합쳐서).
  const optionalIngredients = recipe.ingredients
    .filter(i => i.is_optional)
    .map(i => ({
      name: i.ingredient_name,
      substitutes: Array.isArray(i.substitutes)
        ? i.substitutes
            .map(s => {
              if (typeof s === 'string') return s.trim();
              const name = (s?.name ?? '').trim();
              if (!name) return '';
              const note = (s?.note ?? '').trim();
              return note ? `${name} · ${note}` : name;
            })
            .filter(Boolean)
        : undefined,
    }));

  // useCookingMode 가 제공하지 않는 *display order* 정렬은 RBV 가 책임 (hook 은 카운트만).
  const sortedSteps = [...(recipe.steps || [])].sort((a, b) => a.step_number - b.step_number);

  // 카트 추가 액션은 cart.addToShoppingList; ingredientStatus 는 match.* 에서.

  const getDisplayImage = () => {
    if (recipe.thumbnail_url) return recipe.thumbnail_url;
    const stepsWithImage = recipe.steps?.filter(s => s.image_url);
    if (stepsWithImage && stepsWithImage.length > 0) {
      return stepsWithImage[stepsWithImage.length - 1].image_url;
    }
    if (recipe.ingredients_image_url) return recipe.ingredients_image_url;
    return null;
  };

  const displayImage = getDisplayImage();

  return (
    <div className="container mx-auto max-w-2xl px-6">
      {/* 히어로 이미지 */}
      {displayImage ? (
        <div className="mt-4">
          <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden">
            <SafeImage
              src={displayImage}
              alt={recipe.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
          {recipe.thumbnail_url?.includes('wikim.re.kr') && (
            <p className="mt-1 text-right text-xs text-text-muted">
              출처: 세계김치연구소 (공공누리 제1유형)
            </p>
          )}
        </div>
      ) : (
        <div className="w-full aspect-[16/10] rounded-2xl bg-background-secondary flex items-center justify-center text-6xl mt-4">
          🍳
        </div>
      )}

      {/* 작성자 */}
      {recipe.author && (
        <Link
          href={`/@${recipe.author.username}`}
          className="flex items-center gap-2 mt-4 group w-fit"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-background-secondary flex-shrink-0">
            {recipe.author.avatar_url ? (
              <Image
                src={recipe.author.avatar_url}
                alt={recipe.author.username}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm">👤</div>
            )}
          </div>
          <span className="text-sm font-semibold text-text-muted group-hover:text-text-primary transition-colors">
            @{recipe.author.username}
          </span>
        </Link>
      )}

      {/* 제목 */}
      <h1 className="text-2xl md:text-3xl font-extrabold mt-3">{recipe.title}</h1>

      {/* 만들어본 음식 배지 */}
      {hasCooked && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 rounded-full bg-accent-warm text-background-primary font-bold text-sm shadow-[0_0_15px_rgba(255,153,102,0.3)]">
          <span>✓</span>
          <span>{t.recipe.cookedBadge}</span>
        </div>
      )}

      {/* 메타 정보 바 */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <span className="text-accent-warm font-bold text-sm">⭐ {recipe.average_rating.toFixed(1)}</span>
        {(recipe.cooked_count ?? 0) > 0 && (
          <span className="text-text-secondary text-sm">🍳 {recipe.cooked_count}명</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ShareButton
            recipeId={recipe.id}
            title={recipe.title}
            description={recipe.description}
            imageUrl={recipe.thumbnail_url}
          />
          {!isAuthor && (
            <button
              onClick={() => setReportOpen(true)}
              aria-label={t.report.menuLabel}
              title={t.report.menuLabel}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-tertiary transition"
            >
              🚨
            </button>
          )}
          <button
            onClick={onToggleLike}
            disabled={likeLoading || !onToggleLike}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isLiked
                ? 'bg-red-500/20 text-red-400'
                : 'bg-background-tertiary text-text-primary hover:bg-background-secondary'
            }`}
          >
            {isLiked ? '❤️' : '🤍'} {likesCount > 0 ? likesCount : ''}
          </button>
          <button
            onClick={onToggleSave}
            disabled={actionLoading}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isSaved
                ? 'bg-accent-warm text-background-primary'
                : 'bg-background-tertiary text-text-primary hover:bg-background-secondary'
            }`}
          >
            {isSaved ? '👅 낼름함!' : '👅 낼름'}
          </button>
        </div>
      </div>

      {/* 개인 메모 (낼름한 레시피만) */}
      {isSaved && (
        <div className="mt-3">
          {memoOpen ? (
            <div className="p-4 rounded-xl bg-background-secondary border-2 border-accent-warm/30 shadow-[0_0_15px_rgba(255,153,102,0.1)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📝</span>
                <span className="text-sm font-bold text-text-primary">{t.recipe.memoTitle}</span>
              </div>
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder={t.recipe.memoPlaceholder}
                className="w-full bg-background-tertiary rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none resize-none min-h-[80px] focus:ring-1 focus:ring-2 focus:ring-accent-warm/50"
                maxLength={500}
                autoFocus
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-text-muted">{memoText.length}/500</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setMemoText(saveNotes || '');
                      setMemoOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg text-sm text-text-muted hover:bg-background-tertiary transition-all"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    onClick={() => {
                      onUpdateMemo(memoText);
                      setMemoOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover transition-all"
                  >
                    {t.common.save}
                  </button>
                </div>
              </div>
            </div>
          ) : saveNotes ? (
            <button
              onClick={() => {
                setMemoText(saveNotes);
                setMemoOpen(true);
              }}
              className="w-full p-3 rounded-xl bg-background-secondary border border-white/10 text-left hover:border-accent-warm/30 transition-all group"
            >
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5">📝</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-secondary line-clamp-3">{saveNotes}</p>
                  <p className="text-xs text-text-muted mt-1 group-hover:text-accent-warm transition-colors">{t.common.edit}</p>
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                setMemoText('');
                setMemoOpen(true);
              }}
              className="w-full p-3 rounded-xl border-2 border-dashed border-white/15 hover:border-accent-warm/40 transition-all group flex items-center justify-center gap-2"
            >
              <span className="text-lg">📝</span>
              <span className="text-sm font-medium text-text-muted group-hover:text-accent-warm transition-colors">{t.recipe.memoAdd}</span>
            </button>
          )}
        </div>
      )}

      {/* 설명 */}
      <p className="text-text-secondary leading-relaxed mt-4">{recipe.description}</p>

      {/* 출처 블록 */}
      {recipe.show_source && (recipe.source_url || recipe.video_url) ? (
        <div className="mt-3 p-3 rounded-xl bg-background-secondary border border-white/10">
          <p className="text-xs text-text-muted mb-1">📺 {t.recipe.sourceLabel}</p>
          <p className="text-sm font-medium text-text-primary">
            {recipe.source_channel?.startsWith('@') ? (
              <a
                href={`https://www.youtube.com/${recipe.source_channel}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-accent-warm transition-colors"
              >
                {recipe.source_channel}
              </a>
            ) : (recipe.source_channel ?? recipe.attributed_chef ?? '')}
          </p>
          <a
            href={recipe.source_url ?? recipe.video_url ?? ''}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-xs text-accent-warm hover:text-accent-hover transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            {t.recipe.videoLinkText}
          </a>
        </div>
      ) : recipe.video_url ? (
        <a
          href={recipe.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          {t.recipe.sourceVideoText}
        </a>
      ) : null}

      {/* 레시피 정보 (조건부) */}
      {(() => {
        const totalTime = (recipe.prep_time_minutes != null || recipe.cook_time_minutes != null)
          ? (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)
          : null;
        const items = [
          totalTime != null ? { label: t.recipe.cookTimeLabel, value: `${totalTime}${t.recipe.minuteSuffix}` } : null,
          recipe.difficulty_level ? { label: t.recipe.difficultyLabel, value: recipe.difficulty_level === 'easy' ? t.difficulty.easy : recipe.difficulty_level === 'medium' ? t.difficulty.medium : t.difficulty.hard } : null,
          recipe.servings ? { label: t.recipe.servingsLabel, value: `${recipe.servings}${t.recipe.servingsSuffix}` } : null,
        ].filter(Boolean) as { label: string; value: string }[];

        if (items.length === 0) return null;

        return (
          <div className="flex gap-4 mt-4 py-4 border-y border-white/10">
            {items.map((item, idx) => (
              <div key={item.label} className={`text-center flex-1 ${idx > 0 ? 'border-l border-white/10' : ''}`}>
                <span className="block text-xs text-text-muted mb-1">{item.label}</span>
                <span className="font-bold text-accent-warm">{item.value}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* 재료 / 조리순서 — 모바일: 탭, PC: 2컬럼 */}
      <div className="mt-6">
        {/* 탭 바 — 모바일 전용 */}
        <div className="flex border-b border-white/10 md:hidden">
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all relative ${
              activeTab === 'ingredients' ? 'text-accent-warm' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.recipe.ingredientsLabel}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === 'ingredients' ? 'bg-accent-warm/20 text-accent-warm' : 'bg-white/10 text-text-muted'
            }`}>{recipe.ingredients.length}</span>
            {activeTab === 'ingredients' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-warm rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all relative ${
              activeTab === 'steps' ? 'text-accent-warm' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.recipe.stepsTitle}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === 'steps' ? 'bg-accent-warm/20 text-accent-warm' : 'bg-white/10 text-text-muted'
            }`}>{sortedSteps.length}</span>
            {activeTab === 'steps' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-warm rounded-full" />
            )}
          </button>
        </div>

        {/* 콘텐츠 — 모바일: 탭 전환, PC: 2컬럼 나란히 */}
        <div className="md:grid md:grid-cols-2 md:gap-8 md:items-start md:pt-6 md:border-t md:border-white/10">

          {/* 재료 패널 — 추출된 표현 컴포넌트 ([[project-god-file-phase2]]) */}
          <IngredientsTab
            activeTab={activeTab}
            ingredients={recipe.ingredients.map(i => ({
              ingredient_id: i.ingredient_id ?? null,
              ingredient_name: i.ingredient_name,
              quantity: i.quantity,
              unit: i.unit,
              notes: i.notes,
              is_optional: i.is_optional,
              substitutes: i.substitutes,
            }))}
            matchResults={summary.results}
            userIngredientNameById={userIngredientNameById}
            ownedCount={ownedCount}
            totalIngredients={totalIngredients}
            ingredientStatus={ingredientStatus}
            baseServings={baseServings}
            currentServings={currentServings}
            setCurrentServings={setCurrentServings}
            scaleQty={scaleQty}
            unitConv={unitConv}
            onShowFridgeModal={() => setShowFridgeModal(true)}
            t={t}
          />

          {/* 조리순서 패널 — 추출된 표현 컴포넌트 ([[project-god-file-phase2]]) */}
          <StepsTab
            activeTab={activeTab}
            sortedSteps={sortedSteps}
            completedSteps={cook.completedSteps}
            completedCount={cook.completedCount}
            stepProgress={cook.stepProgress}
            optionalIngredients={optionalIngredients}
            onToggleStep={cook.toggleStep}
            onOpenTimer={cook.openTimerForStep}
            getEffectiveTimers={cook.getEffectiveTimers}
            voice={cook.voice}
            showMadeIt={!isAuthor}
            onMadeIt={onMadeIt}
            t={t}
          />

        </div>
      </div>

      {/* 영양 정보 (조건부) */}
      {(recipe.calories || recipe.protein_grams || recipe.carbs_grams ||
        recipe.fat_grams || recipe.fiber_grams || recipe.sodium_mg) && (
        <div className="mt-8 py-6 border-t border-white/10">
          <h2 className="text-lg font-bold mb-4">{t.nutrition.title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recipe.calories && (
              <div className="text-center p-3 rounded-xl bg-background-secondary">
                <span className="block text-xs text-text-muted mb-1">{t.nutrition.calories}</span>
                <span className="text-xl font-bold text-accent-warm">{recipe.calories}</span>
                <span className="text-xs text-text-muted ml-1">kcal</span>
              </div>
            )}
            {recipe.protein_grams && (
              <div className="text-center p-3 rounded-xl bg-background-secondary">
                <span className="block text-xs text-text-muted mb-1">{t.nutrition.protein}</span>
                <span className="text-xl font-bold text-accent-warm">{recipe.protein_grams}</span>
                <span className="text-xs text-text-muted ml-1">g</span>
              </div>
            )}
            {recipe.carbs_grams && (
              <div className="text-center p-3 rounded-xl bg-background-secondary">
                <span className="block text-xs text-text-muted mb-1">{t.nutrition.carbs}</span>
                <span className="text-xl font-bold text-accent-warm">{recipe.carbs_grams}</span>
                <span className="text-xs text-text-muted ml-1">g</span>
              </div>
            )}
            {recipe.fat_grams && (
              <div className="text-center p-3 rounded-xl bg-background-secondary">
                <span className="block text-xs text-text-muted mb-1">{t.nutrition.fat}</span>
                <span className="text-xl font-bold text-accent-warm">{recipe.fat_grams}</span>
                <span className="text-xs text-text-muted ml-1">g</span>
              </div>
            )}
            {recipe.fiber_grams && (
              <div className="text-center p-3 rounded-xl bg-background-secondary">
                <span className="block text-xs text-text-muted mb-1">{t.nutrition.fiber}</span>
                <span className="text-xl font-bold text-accent-warm">{recipe.fiber_grams}</span>
                <span className="text-xs text-text-muted ml-1">g</span>
              </div>
            )}
            {recipe.sodium_mg && (
              <div className="text-center p-3 rounded-xl bg-background-secondary">
                <span className="block text-xs text-text-muted mb-1">{t.nutrition.sodium}</span>
                <span className="text-xl font-bold text-accent-warm">{recipe.sodium_mg}</span>
                <span className="text-xs text-text-muted ml-1">mg</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 면책 푸터 */}
      <div className="mt-8 space-y-1">
        {recipe.show_source && (
          <p className="text-xs text-text-muted leading-relaxed">
            * {t.recipe.videoSourceDisclaimer}
          </p>
        )}
        <p className="text-xs text-text-muted leading-relaxed">
          {t.recipe.allergyDisclaimer}
        </p>
      </div>

      {/* 하단 여백 */}
      <div className="h-20" />

      {/* 멀티 타이머 패널 */}
      <CookTimerPanel
        multiTimer={cook.multiTimer}
        showTimerPanel={cook.showTimerPanel}
        setShowTimerPanel={cook.setShowTimerPanel}
        t={t}
      />

      {/* 직접 타이머 설정 모달 */}
      {cook.timerSetup && (
        <CustomTimerSetup
          prefill={cook.timerSetup.prefill}
          onClose={cook.closeTimerSetup}
          onStart={(totalMinutes, checkpoints) => {
            const label = cook.timerSetup?.stepNumber
              ? t.cookMode.stepTimerLabel.replace('{n}', String(cook.timerSetup.stepNumber))
              : t.cookMode.customTimerOpen;
            cook.multiTimer.startTimer(totalMinutes, label, cook.timerSetup?.stepNumber, checkpoints);
            cook.setShowTimerPanel(true);
            cook.closeTimerSetup();
            toast.success(t.cookMode.timerStarted.replace('{minutes}', String(totalMinutes)));
          }}
        />
      )}

      {/* 냉장고 재료 비교 모달 — V2: matchResults 단일 출처 (재료 탭과 동일).
          is_optional 재료는 매칭에서 제외 (재료 탭의 ownedCount·totalIngredients와 일관). */}
      {showFridgeModal && (() => {
        const owned: string[] = [];
        const substituteItems: { ingredient: string; via: string }[] = [];
        const missing: string[] = [];
        recipe.ingredients.forEach((ing, idx) => {
          if (ing.is_optional) return;
          const result = summary.results[idx];
          if (!result) { missing.push(ing.ingredient_name); return; }
          if (result.kind === 'owned') { owned.push(ing.ingredient_name); return; }
          if (result.via) {
            const viaName = userIngredientNameById.get(result.via) ?? '';
            if (viaName) {
              substituteItems.push({ ingredient: ing.ingredient_name, via: viaName });
              return;
            }
          }
          missing.push(ing.ingredient_name);
        });
        return (
          <RecipeFridgeModal
            onClose={() => setShowFridgeModal(false)}
            ownedNames={owned}
            substituteItems={substituteItems}
            missingNames={missing}
            fridgeEmpty={userIngredients.length === 0}
          />
        );
      })()}

      {/* Fixed 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 z-10 pb-4 pt-2 bg-gradient-to-t from-background-primary via-background-primary to-transparent">
        <div className="container mx-auto max-w-2xl px-6">
          {ownedCount > 0 && (
            <label className="flex items-center gap-2 px-2 pb-2 text-xs text-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cart.excludeOwnedInCart}
                onChange={e => cart.setExcludeOwnedInCart(e.target.checked)}
                className="w-4 h-4 accent-accent-warm cursor-pointer"
              />
              <span>{t.recipe.cartExcludeOwnedLabel.replace('{count}', String(ownedCount))}</span>
            </label>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isLoggedIn && onRequireCartLogin) { onRequireCartLogin(); return; }
                cart.addToShoppingList();
              }}
              disabled={cart.addingToShoppingList}
              className="flex-1 py-4 rounded-2xl bg-accent-warm text-background-primary font-bold text-lg hover:bg-accent-hover transition-all shadow-[0_0_30px_rgba(255,153,102,0.3)] flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <CartIcon size={22} active />
              <span>{t.recipe.cartButton}</span>
            </button>
            <button
              onClick={() => setFeedbackOpen(true)}
              aria-label={t.contact.feedbackAria}
              className="py-4 px-4 rounded-2xl bg-background-secondary border border-white/10 text-text-secondary hover:text-text-primary hover:border-accent-warm/40 transition-all flex items-center gap-1.5 text-sm font-medium shrink-0"
            >
              <span className="text-base">💬</span>
              <span className="hidden sm:inline">{t.contact.feedbackButton}</span>
            </button>
          </div>
        </div>
      </div>

      <ContactModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        contentType="recipe"
        contentId={recipe.id}
      />
    </div>
  );
}

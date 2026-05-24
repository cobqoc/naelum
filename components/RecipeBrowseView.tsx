'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import SafeImage from '@/components/Common/SafeImage';
import Link from '@/components/Common/LocalizedLink';
import ShareButton from './Recipes/ShareButton';
import { useToast } from '@/lib/toast/context';
import { useUnitConversion } from '@/lib/hooks/useUnitConversion';
import { useMultiTimer } from '@/lib/hooks/useMultiTimer';
import { useVoiceGuide } from '@/lib/hooks/useVoiceGuide';
import { useI18n } from '@/lib/i18n/context';
import { isSameIngredient, isSubstituteFor, isFundamental } from '@/lib/recommendations/match';
import CartIcon from '@/components/icons/CartIcon';
import FridgeIcon from '@/components/icons/FridgeIcon';
import CookTimerPanel from '@/components/cook/CookTimerPanel';
import CustomTimerSetup from '@/components/cook/CustomTimerSetup';
import RecipeFridgeModal from '@/components/Recipes/RecipeFridgeModal';
import OptionalIngredientBadge from '@/components/Recipes/OptionalIngredientBadge';
import SubstituteIndicator from '@/components/Recipes/SubstituteIndicator';
import { parseAllTimers } from '@/lib/cook/parseTimers';
import { tokenizeStepText } from '@/lib/recipes/highlightOptionalIngredients';

const ContactModal = dynamic(() => import('./ContactModal'), { ssr: false });
const ReportModal = dynamic(() => import('./Common/ReportModal'), { ssr: false });

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
}

export default function RecipeBrowseView({
  recipe,
  userIngredients,
  userIngredientIds,
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
}: RecipeBrowseViewProps) {
  const toast = useToast();
  const unitConv = useUnitConversion();
  const multiTimer = useMultiTimer();
  const voice = useVoiceGuide();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoText, setMemoText] = useState(saveNotes || '');
  const [addingToShoppingList, setAddingToShoppingList] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [excludeOwnedInCart, setExcludeOwnedInCart] = useState(false);

  // 인분 조절
  const baseServings = Math.max(1, recipe.servings ?? 1);
  const [currentServings, setCurrentServings] = useState(baseServings);

  // 단계 완료 체크
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showTimerPanel, setShowTimerPanel] = useState(false);
  // 직접 타이머 설정 모달 — null=닫힘, 객체=열림(prefill 있으면 단계 본문 값으로 미리 채움)
  const [timerSetup, setTimerSetup] = useState<
    null | { prefill?: { totalMinutes: number; checkpointMinutes: number[] }; stepNumber?: number }
  >(null);
  // 냉장고 재료 비교 모달 — 재료 탭·"N/N 보유"와 같은 isIngredientOwned 사용
  const [showFridgeModal, setShowFridgeModal] = useState(false);

  // FK 매칭 — recipe 재료의 ingredient_id 가 user 보유 재료 id 와 일치하면 보유.
  // 이름이 messy 해도("양파(중)" 등) FK 로 정확히 잡는다(추천 API 와 동일 기준).
  const userIdSet = new Set(userIngredientIds);
  const fkOwnedNames = new Set(
    recipe.ingredients
      .filter(i => i.ingredient_id && userIdSet.has(i.ingredient_id))
      .map(i => i.ingredient_name),
  );

  // 보유 판정 — 물 등 기본 재료(isFundamental)는 항상 보유. FK 일치 또는
  // isSameIngredient(동의어). 까나리액젓을 가졌다고 멸치액젓을 "보유"로
  // 치지 않는다 — 그건 대체(findSubstitute) 영역.
  const isIngredientOwned = (name: string) =>
    isFundamental(name) || fkOwnedNames.has(name) || userIngredients.some(ui => isSameIngredient(ui, name));

  // 대체 — 보유는 아니지만 가진 재료로 바꿔 쓸 수 있음. via(가진 재료명) 반환.
  // ① 전역 INGREDIENT_SUBSTITUTES → ② recipe-specific(작성자가 적은 substitutes 배열) 순서.
  // recipeSpecific: legacy string[] / 신규 {name,note?}[] 양형식 지원 (note 무시, name 만 매칭).
  const findSubstitute = (name: string, recipeSpecific?: (string | { name?: string; note?: string })[] | null): string | null => {
    const globalVia = userIngredients.find(ui => isSubstituteFor(ui, name)) ?? null;
    if (globalVia) return globalVia;
    if (Array.isArray(recipeSpecific) && recipeSpecific.length > 0) {
      const subsLC = recipeSpecific
        .map(s => (typeof s === 'string' ? s : (s?.name ?? '')).toLowerCase().trim())
        .filter(Boolean);
      return userIngredients.find(ui => {
        const u = ui.toLowerCase().trim();
        return subsLC.some(s => s === u || isSameIngredient(u, s));
      }) ?? null;
    }
    return null;
  };

  // 매칭 카운트는 is_optional 재료를 제외하고 계산 ("선택" 재료는 보유 여부와 무관).
  const requiredIngredients = recipe.ingredients.filter(i => !i.is_optional);
  const ownedCount = requiredIngredients.filter(i => isIngredientOwned(i.ingredient_name)).length;
  const totalIngredients = requiredIngredients.length;

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

  const getEffectiveTimers = (step: RecipeStep): number[] => {
    const fromText = parseAllTimers(step.instruction);
    const dbVal = step.timer_minutes && step.timer_minutes >= 1 && step.timer_minutes <= 120
      ? step.timer_minutes : null;
    if (dbVal && !fromText.includes(dbVal)) {
      return [dbVal, ...fromText];
    }
    return fromText;
  };

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  };

  const sortedSteps = [...(recipe.steps || [])].sort((a, b) => a.step_number - b.step_number);
  const completedCount = sortedSteps.filter(s => completedSteps.has(s.step_number)).length;
  const stepProgress = sortedSteps.length > 0 ? (completedCount / sortedSteps.length) * 100 : 0;
  const isScaling = currentServings !== baseServings;

  const handleAddToShoppingList = async () => {
    setAddingToShoppingList(true);
    try {
      const ingredientsToSend = excludeOwnedInCart
        ? recipe.ingredients.filter(i => !isIngredientOwned(i.ingredient_name))
        : recipe.ingredients;

      if (ingredientsToSend.length === 0) {
        toast.info(t.recipe.cartAllOwned);
        setAddingToShoppingList(false);
        return;
      }

      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          ingredients: ingredientsToSend.map(i => ({
            ingredient_name: i.ingredient_name,
            quantity: i.quantity,
            unit: i.unit,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const added = data.added || 0;
        const skippedOwned = excludeOwnedInCart ? ownedCount : 0;
        toast.success(
          skippedOwned > 0
            ? t.recipe.cartAddedWithSkip.replace('{count}', String(added)).replace('{skip}', String(skippedOwned))
            : t.recipe.cartAddedSimple.replace('{count}', String(added))
        );
        window.dispatchEvent(new Event('shopping-list-updated'));
      } else {
        toast.error(data.error || t.recipe.cartAddFailed);
      }
    } catch {
      toast.error(t.recipe.cartAddFailed);
    }
    setAddingToShoppingList(false);
  };

  const ingredientStatus = totalIngredients === 0 ? 'none'
    : ownedCount === 0 ? 'none'
    : ownedCount === totalIngredients ? 'all'
    : 'partial';

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
          />
          <button
            onClick={() => setReportOpen(true)}
            aria-label={t.report.menuLabel}
            title={t.report.menuLabel}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-tertiary transition"
          >
            🚨
          </button>
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
          recipe.servings ? { label: t.recipe.servingsLabel, value: `${recipe.servings} ${t.recipe.servingsSuffix}` } : null,
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

          {/* 재료 패널 */}
          <div className={`${activeTab === 'ingredients' ? 'block' : 'hidden'} md:block`}>
            {/* 헤더 */}
            <div className="pt-4 md:pt-0 mb-3">
              <div className="flex items-center justify-between">
                <h2 className="hidden md:block text-lg font-bold">
                  {t.recipe.ingredientsLabel}
                  <span className="text-sm font-normal text-text-muted ml-2">{recipe.ingredients.length}</span>
                </h2>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={unitConv.toggleSystem}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      unitConv.isImperial
                        ? 'bg-info/20 text-info border border-info/30'
                        : 'bg-background-tertiary text-text-muted hover:bg-white/10'
                    }`}
                    title={`${t.recipe.metricLabel} ↔ ${t.recipe.imperialLabel}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    {unitConv.isImperial ? t.recipe.imperialLabel : t.recipe.metricLabel}
                  </button>
                  <button onClick={() => setShowFridgeModal(true)} className="flex flex-col items-center gap-1">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all animate-pulse ${
                      ingredientStatus === 'none'
                        ? 'bg-error text-white shadow-[0_0_12px_rgba(244,67,54,0.5)]'
                        : ingredientStatus === 'all'
                        ? 'bg-success text-white shadow-[0_0_12px_rgba(76,175,80,0.5)]'
                        : 'bg-warning text-white shadow-[0_0_12px_rgba(255,152,0,0.5)]'
                    }`}>
                      <FridgeIcon size={22} />
                    </div>
                    <span className={`text-[10px] font-medium ${
                      ingredientStatus === 'none' ? 'text-error'
                        : ingredientStatus === 'all' ? 'text-success'
                        : 'text-warning'
                    }`}>
                      {ownedCount}/{totalIngredients} {t.recipe.ownedSuffix}
                    </span>
                  </button>
                </div>
              </div>

              {/* 인분 조절 */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-text-muted">{t.recipe.servingsLabel}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentServings(s => Math.max(1, s - 1))}
                    className="w-7 h-7 rounded-full bg-background-tertiary flex items-center justify-center text-text-muted hover:bg-white/15 transition-all text-base font-bold leading-none"
                  >
                    −
                  </button>
                  <span className={`text-sm font-bold w-14 text-center ${isScaling ? 'text-accent-warm' : 'text-text-primary'}`}>
                    {currentServings}{t.recipe.servingsSuffix}
                  </span>
                  <button
                    onClick={() => setCurrentServings(s => Math.min(20, s + 1))}
                    className="w-7 h-7 rounded-full bg-background-tertiary flex items-center justify-center text-text-muted hover:bg-white/15 transition-all text-base font-bold leading-none"
                  >
                    +
                  </button>
                </div>
                {isScaling && (
                  <button
                    onClick={() => setCurrentServings(baseServings)}
                    className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                  >
                    ({t.common.reset})
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pb-4">
              {recipe.ingredients.map((ing, idx) => {
                const owned = isIngredientOwned(ing.ingredient_name);
                const subVia = owned ? null : findSubstitute(ing.ingredient_name, ing.substitutes);
                const scaledQty = scaleQty(ing.quantity);
                // unit '선택' sentinel 방어 — 옛 DB 행이 누수해도 화면에 노출 X
                const displayUnit = (ing.unit && ing.unit !== '선택') ? ing.unit : '';
                const converted = unitConv.convertIngredient(scaledQty, displayUnit);
                const scaled = isScaling && scaledQty !== ing.quantity;
                const isOptional = !!ing.is_optional;
                // optional 재료는 부족 빨강이 아니라 회색 중성 (있어도 없어도 OK).
                const borderClass = isOptional
                  ? 'border-text-muted/20'
                  : owned ? 'border-text-muted/30' : subVia ? 'border-warning/40' : 'border-error/30';
                const nameColor = isOptional
                  ? 'text-text-secondary'
                  : owned ? 'text-text-primary' : subVia ? 'text-warning' : 'text-error';
                // legacy string[] / 신규 {name,note}[] 어느 형식이든 display 문자열 배열로:
                // note 있으면 "멸치 다시다 · 1큰술", 없으면 "멸치 다시다".
                const recipeSubsList = (ing.substitutes ?? [])
                  .map(s => {
                    if (typeof s === 'string') return s.trim();
                    const name = (s?.name ?? '').trim();
                    if (!name) return '';
                    const note = (s?.note ?? '').trim();
                    return note ? `${name} · ${note}` : name;
                  })
                  .filter(Boolean);
                const hasSubs = recipeSubsList.length > 0;
                // ✓ 마커 정확성 — subVia 가 author list 의 *이름과 매칭* 될 때만 ✓ 부착.
                // 그렇지 않으면 사용자는 author 명시한 *다른 재료* 가 아닌 전역 매핑상 substitute 를
                // 보유한 것 — chip 의 author 이름 옆 ✓ 는 거짓 신호가 됨 (예: author=돼지고기,
                // user=삼겹살 (베이컨↔삼겹살 전역 매핑) → "또는 돼지고기 ✓" 잘못).
                // tooltip 인터폴레이션 용 — 원본 케이스 + note 제외 한 author 이름들.
                const authorSubNamesClean = recipeSubsList.map(s => s.split(' · ')[0].trim()).filter(Boolean);
                const authorSubNames = authorSubNamesClean.map(n => n.toLowerCase());
                const subViaInAuthorList = !!(subVia && authorSubNames.some(n =>
                  n === subVia.toLowerCase().trim() || isSameIngredient(n, subVia.toLowerCase().trim())
                ));
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border-2 bg-background-tertiary ${borderClass}`}
                  >
                    {/* 재료명 + 정책 부속어("빼도 돼요") + substitute chip.
                        - "빼도 돼요" 는 정책 신호 — 항상 재료명 옆 (수량 줄에 붙으면 의미상 어색).
                        - chip 표시: ① 작성자 명시(hasSubs) ② 전역 규칙 매칭(subVia 단독).
                        - chip 내부 whitespace-nowrap — 긴 substitute(예: "멸치 다시다 · 1/2큰술")는
                          chip 자체가 부모 flex-wrap 으로 다음 줄로 떨어짐 (chip 내부는 한 줄 유지). */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-sm font-medium ${nameColor}`}>
                        {ing.ingredient_name}
                      </span>
                      {isOptional && (
                        <span className="text-xs text-text-secondary font-medium">
                          · {t.recipe.ingredientOptional}
                        </span>
                      )}
                      {hasSubs && (
                        <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-xs whitespace-nowrap">
                          <SubstituteIndicator
                            owned={subViaInAuthorList}
                            names={subViaInAuthorList && subVia ? [subVia] : authorSubNamesClean}
                          />
                          <span className="text-text-muted/80">{t.recipe.ingredientSubstituteOr}</span>
                          <span className="font-medium text-warning">{recipeSubsList.join(', ')}</span>
                          {subViaInAuthorList && <span aria-hidden className="text-success font-bold ml-0.5">✓</span>}
                        </span>
                      )}
                      {/* subVia 가 author list 밖이거나 hasSubs 없는 경우 — 사용자 보유 대체재를 별도 chip 으로 분리.
                          (hasSubs && !subViaInAuthorList) = author 가 명시한 것과 *다른* substitute 를 사용자가 보유. */}
                      {subVia && !subViaInAuthorList && (
                        <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-xs whitespace-nowrap">
                          <SubstituteIndicator owned={true} names={[subVia]} />
                          <span aria-hidden className="text-success font-bold">✓</span>
                          <span className="font-medium text-success">{subVia}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {converted.isConverted ? (
                        <>
                          <span className="text-info font-medium">{converted.quantity} {converted.unit}</span>
                          <span className="text-text-muted/60 ml-1">({ing.quantity} {displayUnit})</span>
                        </>
                      ) : scaled ? (
                        <span className="text-accent-warm font-medium">{scaledQty} {displayUnit}</span>
                      ) : (
                        <>{ing.quantity} {displayUnit}</>
                      )}
                    </div>
                    {ing.notes && (
                      <div className="text-xs text-text-secondary italic mt-1">💡 {ing.notes}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 조리순서 패널 */}
          <div className={`${activeTab === 'steps' ? 'block' : 'hidden'} md:block`}>
            {/* PC 전용 헤더 (진행률 포함) */}
            <div className="hidden md:block mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-lg font-bold">
                  {t.recipe.stepsTitle}
                  <span className="text-sm font-normal text-text-muted ml-2">{sortedSteps.length}</span>
                </h2>
                {completedCount > 0 && (
                  <span className="text-xs text-text-muted">{completedCount}/{sortedSteps.length}</span>
                )}
              </div>
              {completedCount > 0 && (
                <div className="h-1.5 bg-background-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success transition-all duration-300 rounded-full"
                    style={{ width: `${stepProgress}%` }}
                  />
                </div>
              )}
            </div>

            {/* 모바일 진행률 */}
            {completedCount > 0 && (
              <div className="flex items-center gap-2 pt-3 pb-1 md:hidden">
                <div className="flex-1 h-1.5 bg-background-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success transition-all duration-300 rounded-full"
                    style={{ width: `${stepProgress}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted flex-shrink-0">{completedCount}/{sortedSteps.length}</span>
              </div>
            )}

            <div className="pt-4 md:pt-0 space-y-6 pb-4">
              {(() => {
                // 단계 간 첫 멘션 추적 — step1 의 "청양고추(선택)" → step2 의 "청양고추" 색만.
                // IIFE 로 mutable Set 을 .map 외부에 두지 않고 일회성 캡쳐.
                const alreadyMentioned = new Set<string>();
                return sortedSteps.map((step) => {
                const effectiveTimers = getEffectiveTimers(step);
                const isDone = completedSteps.has(step.step_number);
                const stepTokens = tokenizeStepText(step.instruction, optionalIngredients, alreadyMentioned);
                return (
                  <div key={step.step_number} className="flex gap-4">
                    {/* 단계 번호 — 클릭으로 완료 토글 */}
                    <button
                      onClick={() => toggleStep(step.step_number)}
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all active:scale-95 ${
                        isDone
                          ? 'bg-success text-white'
                          : 'bg-accent-warm text-background-primary hover:scale-105'
                      }`}
                      title={isDone ? t.cookMode.doneMark : t.cookMode.doneShort}
                    >
                      {isDone ? '✓' : step.step_number}
                    </button>
                    <div className={`flex-1 min-w-0 transition-opacity ${isDone ? 'opacity-50' : ''}`}>
                      {step.title && <h3 className="font-bold mb-1">{step.title}</h3>}
                      {step.image_url && (
                        <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-3">
                          <SafeImage
                            src={step.image_url}
                            alt={t.recipe.stepImageAlt.replace('{n}', String(step.step_number))}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 600px"
                          />
                        </div>
                      )}
                      <p className="text-text-secondary leading-relaxed">
                        {stepTokens.map((tok, i) =>
                          tok.type === 'text' ? (
                            <span key={i}>{tok.value}</span>
                          ) : (
                            // 재료명 자체를 underline + ⓘ 로 강조 (별도 배지 X) → 본문 흐름 자연.
                            // hover/tap 시 tooltip 으로 "없어도 OK" + substitutes 안내.
                            <OptionalIngredientBadge
                              key={i}
                              name={tok.matchedText}
                              substitutes={tok.substitutes}
                            />
                          )
                        )}
                      </p>

                      {/* 타이머 — 본문에 시간이 있는 단계에만. 그 단계 시간으로 prefill.
                          시간 없는 단계/즉흥 타이머는 하단 바의 ⏱ 타이머 버튼으로. */}
                      {effectiveTimers.length > 0 && (
                        <button
                          onClick={() => {
                            const sorted = [...effectiveTimers].sort((a, b) => a - b);
                            setTimerSetup({
                              stepNumber: step.step_number,
                              prefill: { totalMinutes: sorted[sorted.length - 1], checkpointMinutes: sorted.slice(0, -1) },
                            });
                          }}
                          className="mt-2 flex items-center gap-1.5 text-sm text-info font-medium hover:text-info/70 transition-colors"
                        >
                          <span>⏱️</span>
                          <span>{t.cookMode.customTimerOpen}</span>
                        </button>
                      )}

                      {/* 음성 읽기 */}
                      {voice.isSupported && (
                        <button
                          onClick={() => voice.speakStepDirect(step.step_number, step.instruction, step.tip)}
                          className="mt-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
                          title={t.cookMode.voiceOffTooltip}
                        >
                          🔊
                        </button>
                      )}

                      {step.tip && (() => {
                        // tip 본문도 instruction 과 같은 토크나이저로 optional 재료 highlight.
                        // alreadyMentioned Set 공유 — 같은 재료가 instruction·tip 양쪽 등장 시 첫 멘션만 ⓘ.
                        const tipTokens = tokenizeStepText(step.tip, optionalIngredients, alreadyMentioned);
                        return (
                          <div className="mt-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                            <p className="text-sm">
                              <span className="font-bold text-warning">💡 팁:</span>{' '}
                              <span className="text-text-secondary">
                                {tipTokens.map((tok, i) =>
                                  tok.type === 'text' ? (
                                    <span key={i}>{tok.value}</span>
                                  ) : (
                                    <OptionalIngredientBadge
                                      key={i}
                                      name={tok.matchedText}
                                      substitutes={tok.substitutes}
                                    />
                                  )
                                )}
                              </span>
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              });
              })()}
            </div>
          </div>

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
        multiTimer={multiTimer}
        showTimerPanel={showTimerPanel}
        setShowTimerPanel={setShowTimerPanel}
        t={t}
      />

      {/* 직접 타이머 설정 모달 */}
      {timerSetup && (
        <CustomTimerSetup
          prefill={timerSetup.prefill}
          onClose={() => setTimerSetup(null)}
          onStart={(totalMinutes, checkpoints) => {
            const label = timerSetup.stepNumber
              ? t.cookMode.stepTimerLabel.replace('{n}', String(timerSetup.stepNumber))
              : t.cookMode.customTimerOpen;
            multiTimer.startTimer(totalMinutes, label, timerSetup.stepNumber, checkpoints);
            setShowTimerPanel(true);
            setTimerSetup(null);
            toast.success(t.cookMode.timerStarted.replace('{minutes}', String(totalMinutes)));
          }}
        />
      )}

      {/* 냉장고 재료 비교 모달 — 재료 탭과 동일한 isIngredientOwned/findSubstitute 단일 판정.
          is_optional 재료는 매칭에서 제외 (재료 탭의 ownedCount·totalIngredients와 일관) */}
      {showFridgeModal && (() => {
        const owned: string[] = [];
        const substituteItems: { ingredient: string; via: string }[] = [];
        const missing: string[] = [];
        for (const ing of recipe.ingredients) {
          if (ing.is_optional) continue;
          if (isIngredientOwned(ing.ingredient_name)) { owned.push(ing.ingredient_name); continue; }
          const via = findSubstitute(ing.ingredient_name, ing.substitutes);
          if (via) substituteItems.push({ ingredient: ing.ingredient_name, via });
          else missing.push(ing.ingredient_name);
        }
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
                checked={excludeOwnedInCart}
                onChange={e => setExcludeOwnedInCart(e.target.checked)}
                className="w-4 h-4 accent-accent-warm cursor-pointer"
              />
              <span>{t.recipe.cartExcludeOwnedLabel.replace('{count}', String(ownedCount))}</span>
            </label>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToShoppingList}
              disabled={addingToShoppingList}
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

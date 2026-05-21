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
import CookTimerPanel from '@/components/cook/CookTimerPanel';
import CustomTimerSetup from '@/components/cook/CustomTimerSetup';
import RecipeFridgeModal from '@/components/Recipes/RecipeFridgeModal';

const ContactModal = dynamic(() => import('./ContactModal'), { ssr: false });
const ReportModal = dynamic(() => import('./Common/ReportModal'), { ssr: false });

interface RecipeIngredient {
  ingredient_name: string;
  quantity: string;
  unit: string;
  notes?: string;
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
    null | { prefill?: { totalMinutes: number; checkpointMinutes: number[] } }
  >(null);
  // 냉장고 재료 비교 모달 — 재료 탭·"N/N 보유"와 같은 isIngredientOwned 사용
  const [showFridgeModal, setShowFridgeModal] = useState(false);

  // 보유 판정 — 물 등 기본 재료(isFundamental)는 항상 보유. 그 외엔
  // isSameIngredient(동의어만)로 대조. 까나리액젓을 가졌다고 멸치액젓을
  // "보유"로 치지 않는다 — 그건 대체(findSubstitute) 영역.
  const isIngredientOwned = (name: string) =>
    isFundamental(name) || userIngredients.some(ui => isSameIngredient(ui, name));

  // 대체 — 보유는 아니지만 가진 재료로 바꿔 쓸 수 있음. via(가진 재료명) 반환.
  const findSubstitute = (name: string): string | null =>
    userIngredients.find(ui => isSubstituteFor(ui, name)) ?? null;

  const ownedCount = recipe.ingredients.filter(i => isIngredientOwned(i.ingredient_name)).length;
  const totalIngredients = recipe.ingredients.length;

  // 재료 양 배율 계산
  const scaleQty = (qty: string): string => {
    if (currentServings === baseServings || !qty) return qty;
    const num = parseFloat(qty);
    if (isNaN(num)) return qty;
    const scaled = num * (currentServings / baseServings);
    return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
  };

  // 조리 지시문에서 타이머 전체 파싱 — 중복 제거, 1~120분 범위만
  const parseAllTimers = (instruction: string): number[] => {
    const matches = [...instruction.matchAll(/(\d+)\s*분(?:간|동안|씩|정도|가량)?/g)];
    const seen = new Set<number>();
    return matches
      .map(m => parseInt(m[1], 10))
      .filter(m => m >= 1 && m <= 120 && !seen.has(m) && seen.add(m) !== undefined);
  };

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
                placeholder="예: 다음엔 소금 줄이기, 엄마가 좋아함, 주말 브런치용..."
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
                      <svg width="22" height="22" viewBox="0 0 90 100" fill="none">
                        <rect x="4" y="4" width="60" height="92" rx="6" fill="#e85a3a" stroke="#7a1810" strokeWidth="5"/>
                        <rect x="4" y="4" width="28" height="62" rx="6" fill="#c93820"/>
                        <rect x="4" y="66" width="60" height="4" fill="#7a1810"/>
                        <rect x="9" y="14" width="17" height="10" rx="2" fill="#f4c030" stroke="#7a1810" strokeWidth="2.5"/>
                        <rect x="32" y="4" width="32" height="62" fill="#e8f7ff"/>
                        <rect x="55" y="12" width="3" height="16" rx="1" fill="#7a1810" opacity="0.4"/>
                        <rect x="59" y="12" width="3" height="16" rx="1" fill="#7a1810" opacity="0.4"/>
                        <ellipse cx="47" cy="30" rx="7" ry="5" fill="#e09848" stroke="#7a3c10" strokeWidth="2"/>
                        <path d="M42 42 L52 42 L50 50 L44 50 Z" fill="#b07840" stroke="#7a1810" strokeWidth="2"/>
                        <rect x="42" y="52" width="4" height="8" rx="1" fill="#e85040" stroke="#7a1810" strokeWidth="2"/>
                        <rect x="48" y="52" width="4" height="8" rx="1" fill="#e85040" stroke="#7a1810" strokeWidth="2"/>
                        <rect x="64" y="4" width="20" height="62" rx="4" fill="#e85a3a" stroke="#7a1810" strokeWidth="4"/>
                        <rect x="68" y="18" width="10" height="3" rx="1.5" fill="#7a1810" opacity="0.35"/>
                        <rect x="68" y="26" width="10" height="3" rx="1.5" fill="#7a1810" opacity="0.35"/>
                        <rect x="68" y="34" width="10" height="3" rx="1.5" fill="#7a1810" opacity="0.35"/>
                        <rect x="28" y="20" width="8" height="14" rx="4" fill="#7a1810"/>
                        <rect x="28" y="42" width="8" height="14" rx="4" fill="#7a1810"/>
                        <rect x="4" y="70" width="60" height="26" rx="6" fill="#e85a3a"/>
                        <rect x="28" y="80" width="12" height="6" rx="3" fill="#7a1810"/>
                      </svg>
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
                const subVia = owned ? null : findSubstitute(ing.ingredient_name);
                const scaledQty = scaleQty(ing.quantity);
                const converted = unitConv.convertIngredient(scaledQty, ing.unit);
                const scaled = isScaling && scaledQty !== ing.quantity;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border-2 bg-background-tertiary ${
                      owned ? 'border-text-muted/30' : subVia ? 'border-warning/40' : 'border-error/30'
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      owned ? 'text-text-primary' : subVia ? 'text-warning' : 'text-error'
                    }`}>
                      {ing.ingredient_name}
                    </span>
                    {subVia && (
                      <div className="text-xs text-warning mt-0.5">🔄 {subVia}</div>
                    )}
                    <div className="text-xs text-text-muted mt-0.5">
                      {converted.isConverted ? (
                        <>
                          <span className="text-info font-medium">{converted.quantity} {converted.unit}</span>
                          <span className="text-text-muted/60 ml-1">({ing.quantity} {ing.unit})</span>
                        </>
                      ) : scaled ? (
                        <span className="text-accent-warm font-medium">{scaledQty} {ing.unit}</span>
                      ) : (
                        <>{ing.quantity} {ing.unit}</>
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

            {/* 직접 타이머 — 본문에 없는 시간·중간 알림이 필요할 때 */}
            <button
              onClick={() => setTimerSetup({})}
              className="mt-3 md:mt-1 flex items-center gap-1.5 text-sm text-info font-medium hover:text-info/70 transition-colors"
            >
              <span>⏱️</span>
              <span>{t.cookMode.customTimerOpen}</span>
            </button>

            <div className="pt-4 md:pt-0 space-y-6 pb-4">
              {sortedSteps.map((step) => {
                const effectiveTimers = getEffectiveTimers(step);
                const isDone = completedSteps.has(step.step_number);
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
                      <p className="text-text-secondary leading-relaxed">{step.instruction}</p>

                      {/* 타이머 버튼 — 복수 타이머 지원 */}
                      {effectiveTimers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {effectiveTimers.map((minutes) => (
                            <button
                              key={minutes}
                              onClick={() => {
                                multiTimer.startTimer(
                                  minutes,
                                  t.cookMode.stepTimerLabel.replace('{n}', String(step.step_number)),
                                  step.step_number
                                );
                                setShowTimerPanel(true);
                                toast.success(t.cookMode.timerStarted.replace('{minutes}', String(minutes)));
                              }}
                              className="flex items-center gap-1.5 text-sm text-info font-medium hover:text-info/70 transition-colors"
                            >
                              <span>⏱️</span>
                              <span>{minutes}{t.recipe.minuteSuffix}</span>
                            </button>
                          ))}
                          {/* 단계 타이머 — 시간 점이 2개+ 인 단계: 총 시간+중간 알림으로 묶기 */}
                          {effectiveTimers.length >= 2 && (
                            <button
                              onClick={() => {
                                const sorted = [...effectiveTimers].sort((a, b) => a - b);
                                setTimerSetup({
                                  prefill: {
                                    totalMinutes: sorted[sorted.length - 1],
                                    checkpointMinutes: sorted.slice(0, -1),
                                  },
                                });
                              }}
                              className="flex items-center gap-1.5 text-sm text-accent-warm font-medium hover:text-accent-warm/70 transition-colors"
                            >
                              <span>⏱️</span>
                              <span>{t.cookMode.customTimerStepButton}</span>
                            </button>
                          )}
                        </div>
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

                      {step.tip && (
                        <div className="mt-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                          <p className="text-sm">
                            <span className="font-bold text-warning">💡 팁:</span>{' '}
                            <span className="text-text-secondary">{step.tip}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
            multiTimer.startTimer(totalMinutes, t.cookMode.customTimerOpen, undefined, checkpoints);
            setShowTimerPanel(true);
            setTimerSetup(null);
            toast.success(t.cookMode.timerStarted.replace('{minutes}', String(totalMinutes)));
          }}
        />
      )}

      {/* 냉장고 재료 비교 모달 — 재료 탭과 동일한 isIngredientOwned/findSubstitute 단일 판정 */}
      {showFridgeModal && (() => {
        const owned: string[] = [];
        const substituteItems: { ingredient: string; via: string }[] = [];
        const missing: string[] = [];
        for (const ing of recipe.ingredients) {
          if (isIngredientOwned(ing.ingredient_name)) { owned.push(ing.ingredient_name); continue; }
          const via = findSubstitute(ing.ingredient_name);
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

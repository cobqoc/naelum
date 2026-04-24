'use client';

import { useState } from 'react';
import Image from 'next/image';
import SafeImage from '@/components/Common/SafeImage';
import Link from 'next/link';
import ShareButton from './Recipes/ShareButton';
import { useToast } from '@/lib/toast/context';
import { useUnitConversion } from '@/lib/hooks/useUnitConversion';

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
  onStartCooking: () => void;
  onShowFridge: () => void;
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
  onStartCooking,
  onShowFridge,
  isLiked = false,
  likesCount = 0,
  onToggleLike,
  likeLoading = false,
}: RecipeBrowseViewProps) {
  const toast = useToast();
  const unitConv = useUnitConversion();
  const [ingredientsExpanded, setIngredientsExpanded] = useState(true);
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoText, setMemoText] = useState(saveNotes || '');
  const [addingToShoppingList, setAddingToShoppingList] = useState(false);
  const handleAddToShoppingList = async () => {
    setAddingToShoppingList(true);
    try {
      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          ingredients: recipe.ingredients.map(i => ({
            ingredient_name: i.ingredient_name,
            quantity: i.quantity,
            unit: i.unit,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.added || 0}개 재료를 장보기에 담았어요!`);
        window.dispatchEvent(new Event('shopping-list-updated'));
      } else {
        toast.error(data.error || '추가에 실패했습니다.');
      }
    } catch {
      toast.error('장보기에 담지 못했어요.');
    }
    setAddingToShoppingList(false);
  };

  const isIngredientOwned = (name: string) =>
    userIngredients.some(ui => name.includes(ui) || ui.includes(name));

  const ownedCount = recipe.ingredients.filter(i => isIngredientOwned(i.ingredient_name)).length;
  const totalIngredients = recipe.ingredients.length;
  const ingredientStatus = totalIngredients === 0 ? 'none'
    : ownedCount === 0 ? 'none'
    : ownedCount === totalIngredients ? 'all'
    : 'partial';

  // 이미지 우선순위: 썸네일 → 마지막 단계 → 다른 단계 → 재료 이미지
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

  const sortedSteps = [...(recipe.steps || [])].sort(
    (a, b) => a.step_number - b.step_number
  );

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
          <span>만들어본 음식</span>
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
                <span className="text-sm font-bold text-text-primary">나만의 메모</span>
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
                    취소
                  </button>
                  <button
                    onClick={() => {
                      onUpdateMemo(memoText);
                      setMemoOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover transition-all"
                  >
                    저장
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
                  <p className="text-xs text-text-muted mt-1 group-hover:text-accent-warm transition-colors">수정하기</p>
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
              <span className="text-sm font-medium text-text-muted group-hover:text-accent-warm transition-colors">메모 남기기</span>
            </button>
          )}
        </div>
      )}

      {/* 설명 */}
      <p className="text-text-secondary leading-relaxed mt-4">{recipe.description}</p>

      {/* 출처 블록 */}
      {recipe.show_source && (recipe.source_url || recipe.video_url) ? (
        <div className="mt-3 p-3 rounded-xl bg-background-secondary border border-white/10">
          <p className="text-xs text-text-muted mb-1">📺 출처</p>
          <p className="text-sm font-medium text-text-primary">
            {recipe.attributed_chef ?? ''}
            {recipe.attributed_chef && recipe.source_channel ? ' | ' : ''}
            {recipe.source_channel ?? ''}
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
            원본 영상 보기 →
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
          출처 영상
        </a>
      ) : null}

      {/* 레시피 정보 (조건부) */}
      {(() => {
        const totalTime = (recipe.prep_time_minutes != null || recipe.cook_time_minutes != null)
          ? (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)
          : null;
        const items = [
          totalTime != null ? { label: '조리시간', value: `${totalTime}분` } : null,
          recipe.difficulty_level ? { label: '난이도', value: recipe.difficulty_level === 'easy' ? '초급' : recipe.difficulty_level === 'medium' ? '중급' : '고급' } : null,
          recipe.servings ? { label: '인분', value: `${recipe.servings}인분` } : null,
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

      {/* 재료 섹션 (접기/펼치기) */}
      <div className="mt-6">
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => setIngredientsExpanded(!ingredientsExpanded)}
            className="flex items-center gap-2 flex-1"
          >
            <h2 className="text-lg font-bold">
              재료
              <span className="text-sm font-normal text-text-muted ml-2">{recipe.ingredients.length}개</span>
            </h2>
            <svg
              className={`w-5 h-5 text-text-muted transition-transform duration-200 ${ingredientsExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* 단위 변환 토글 */}
          <button
            onClick={unitConv.toggleSystem}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all mr-2 ${
              unitConv.isImperial
                ? 'bg-info/20 text-info border border-info/30'
                : 'bg-background-tertiary text-text-muted hover:bg-white/10'
            }`}
            title="단위 전환 (미터법 ↔ 야드파운드법)"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {unitConv.isImperial ? 'Imperial' : '미터법'}
          </button>
          <button
            onClick={onShowFridge}
            className="flex flex-col items-center gap-1"
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all animate-pulse ${
              ingredientStatus === 'none'
                ? 'bg-error text-white shadow-[0_0_12px_rgba(244,67,54,0.5)]'
                : ingredientStatus === 'all'
                ? 'bg-success text-white shadow-[0_0_12px_rgba(76,175,80,0.5)]'
                : 'bg-warning text-white shadow-[0_0_12px_rgba(255,152,0,0.5)]'
            }`}>
              <svg width="22" height="22" viewBox="0 0 90 100" fill="none">
                <rect x="4" y="4" width="60" height="92" rx="6" fill="#5BA8B5" stroke="#111" strokeWidth="5"/>
                <rect x="4" y="4" width="28" height="62" rx="6" fill="#4A8F9C"/>
                <rect x="6" y="66" width="60" height="4" fill="#111"/>
                <rect x="9" y="14" width="17" height="10" rx="2" fill="#F5C842" stroke="#111" strokeWidth="2.5"/>
                <rect x="32" y="4" width="32" height="62" fill="#A8DDE8"/>
                <rect x="36" y="12" width="6" height="18" rx="3" fill="#5BA8B5"/>
                <rect x="46" y="12" width="6" height="18" rx="3" fill="#5BA8B5"/>
                <rect x="36" y="36" width="16" height="12" rx="3" fill="#5BA8B5"/>
                <rect x="36" y="52" width="10" height="8" rx="2" fill="#5BA8B5"/>
                <rect x="64" y="4" width="20" height="62" rx="4" fill="#5BA8B5" stroke="#111" strokeWidth="4"/>
                <rect x="28" y="20" width="8" height="14" rx="4" fill="#111"/>
                <rect x="28" y="42" width="8" height="14" rx="4" fill="#111"/>
                <rect x="4" y="70" width="60" height="26" rx="6" fill="#5BA8B5"/>
                <rect x="28" y="80" width="12" height="6" rx="3" fill="#111"/>
              </svg>
            </div>
            <span className={`text-[10px] font-medium ${
              ingredientStatus === 'none' ? 'text-error'
                : ingredientStatus === 'all' ? 'text-success'
                : 'text-warning'
            }`}>
              {ownedCount}/{totalIngredients} 보유
            </span>
          </button>
        </div>

        {ingredientsExpanded && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pb-4">
            {recipe.ingredients.map((ing, idx) => {
              const owned = isIngredientOwned(ing.ingredient_name);
              const converted = unitConv.convertIngredient(ing.quantity, ing.unit);
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border-2 ${
                    owned
                      ? 'bg-background-tertiary border-text-muted/30'
                      : 'bg-background-tertiary border-error/30'
                  }`}
                >
                  <span className={`text-sm font-medium ${owned ? 'text-text-primary' : 'text-error'}`}>
                    {ing.ingredient_name}
                  </span>
                  <div className="text-xs text-text-muted mt-0.5">
                    {converted.isConverted ? (
                      <>
                        <span className="text-info font-medium">{converted.quantity} {converted.unit}</span>
                        <span className="text-text-muted/60 ml-1">({ing.quantity} {ing.unit})</span>
                      </>
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
        )}
      </div>

      {/* 조리 순서 */}
      <div className="mt-6">
        <h2 className="text-lg font-bold mb-4">조리 순서</h2>
        <div className="space-y-6">
          {sortedSteps.map((step) => (
            <div key={step.step_number} className="flex gap-4">
              {/* 스텝 번호 */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-warm text-background-primary flex items-center justify-center font-bold">
                {step.step_number}
              </div>
              {/* 스텝 내용 */}
              <div className="flex-1 min-w-0">
                {step.title && (
                  <h3 className="font-bold mb-1">{step.title}</h3>
                )}
                {step.image_url && (
                  <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-3">
                    <SafeImage
                      src={step.image_url}
                      alt={`단계 ${step.step_number}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 600px"
                    />
                  </div>
                )}
                <p className="text-text-secondary leading-relaxed">{step.instruction}</p>
                {step.timer_minutes && (
                  <div className="mt-2 text-sm text-info font-medium">
                    ⏱️ {step.timer_minutes}분
                  </div>
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
          ))}
        </div>
      </div>

      {/* 영양 정보 (조건부) */}
      {(recipe.calories || recipe.protein_grams || recipe.carbs_grams ||
        recipe.fat_grams || recipe.fiber_grams || recipe.sodium_mg) && (
        <div className="mt-8 py-6 border-t border-white/10">
          <h2 className="text-lg font-bold mb-4">영양 정보</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recipe.calories && (
              <div className="text-center p-3 rounded-xl bg-background-secondary">
                <span className="block text-xs text-text-muted mb-1">칼로리</span>
                <span className="text-xl font-bold text-accent-warm">{recipe.calories}</span>
                <span className="text-xs text-text-muted ml-1">kcal</span>
              </div>
            )}
            {recipe.protein_grams && (
              <div className="text-center p-3 rounded-xl bg-background-secondary">
                <span className="block text-xs text-text-muted mb-1">단백질</span>
                <span className="text-xl font-bold text-accent-warm">{recipe.protein_grams}</span>
                <span className="text-xs text-text-muted ml-1">g</span>
              </div>
            )}
            {recipe.carbs_grams && (
              <div className="text-center p-3 rounded-xl bg-background-secondary">
                <span className="block text-xs text-text-muted mb-1">탄수화물</span>
                <span className="text-xl font-bold text-accent-warm">{recipe.carbs_grams}</span>
                <span className="text-xs text-text-muted ml-1">g</span>
              </div>
            )}
            {recipe.fat_grams && (
              <div className="text-center p-3 rounded-xl bg-background-secondary">
                <span className="block text-xs text-text-muted mb-1">지방</span>
                <span className="text-xl font-bold text-accent-warm">{recipe.fat_grams}</span>
                <span className="text-xs text-text-muted ml-1">g</span>
              </div>
            )}
            {recipe.fiber_grams && (
              <div className="text-center p-3 rounded-xl bg-background-secondary">
                <span className="block text-xs text-text-muted mb-1">식이섬유</span>
                <span className="text-xl font-bold text-accent-warm">{recipe.fiber_grams}</span>
                <span className="text-xs text-text-muted ml-1">g</span>
              </div>
            )}
            {recipe.sodium_mg && (
              <div className="text-center p-3 rounded-xl bg-background-secondary">
                <span className="block text-xs text-text-muted mb-1">나트륨</span>
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
            * 영상 기반으로 정리한 레시피입니다. 정확한 내용은 출처 영상을 참고해주세요.
          </p>
        )}
        <p className="text-xs text-text-muted leading-relaxed">
          * 알레르기 정보는 참고용입니다. 알레르기가 있으신 분은 재료를 직접 확인하세요.
        </p>
      </div>

      {/* 하단 여백 (sticky 버튼 공간 확보) */}
      <div className="h-20" />

      {/* Sticky 하단 버튼 */}
      <div className="sticky bottom-0 left-0 right-0 z-10 pb-4 pt-2 bg-gradient-to-t from-background-primary via-background-primary to-transparent">
        <div className="container mx-auto max-w-2xl flex gap-2">
          <button
            onClick={handleAddToShoppingList}
            disabled={addingToShoppingList}
            className="flex-shrink-0 py-4 px-5 rounded-2xl bg-background-secondary border border-white/10 text-text-primary font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="text-lg">🛒</span>
            <span className="text-sm">장보기</span>
          </button>
          <button
            onClick={onStartCooking}
            className="flex-1 py-4 rounded-2xl bg-accent-warm text-background-primary font-bold text-lg hover:bg-accent-hover transition-all shadow-[0_0_30px_rgba(255,153,102,0.3)] flex items-center justify-center gap-2"
          >
            <span className="text-xl">🍳</span>
            요리 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

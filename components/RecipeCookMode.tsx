'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture';
import { useKeyboardNavigation } from '@/lib/hooks/useKeyboardNavigation';
import { useVoiceGuide } from '@/lib/hooks/useVoiceGuide';
import { useMultiTimer } from '@/lib/hooks/useMultiTimer';
import { useUnitConversion } from '@/lib/hooks/useUnitConversion';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import CookVoicePanel from './cook/CookVoicePanel';
import CookIngredientsSheet from './cook/CookIngredientsSheet';
import CookTimerPanel from './cook/CookTimerPanel';
import CookCompletionModal from './cook/CookCompletionModal';

const RecipeReviewModal = dynamic(() => import('./RecipeReviewModal'), { ssr: false });

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
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

interface RecipeCookModeProps {
  recipe: Recipe;
  userIngredients: string[];
  userIngredientIds: string[];  // V2: id 기반 매칭
  preparedIngredients: Set<number>;
  completedSteps: Set<number>;
  onTogglePrepared: (index: number) => void;
  onToggleStepComplete: (stepNumber: number) => void;
  onStartTimer: (minutes: number) => void;
  timerActive: boolean;
  timerPaused?: boolean;
  timerSeconds: number;
  onToggleTimerPause?: () => void;
  onStopTimer?: () => void;
  onClose: () => void;
  hasCooked: boolean;
}

export default function RecipeCookMode({
  recipe,
  userIngredients,
  userIngredientIds,
  preparedIngredients,
  completedSteps,
  onTogglePrepared,
  onToggleStepComplete,
  onClose,
  hasCooked,
}: RecipeCookModeProps) {
  const sortedSteps = [...(recipe.steps || [])].sort(
    (a, b) => a.step_number - b.step_number
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completionPhoto, setCompletionPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showTimerPanel, setShowTimerPanel] = useState(false);
  const toast = useToast();
  const { t } = useI18n();
  const voice = useVoiceGuide();
  const multiTimer = useMultiTimer();
  const unitConv = useUnitConversion();

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const currentStep = sortedSteps[currentStepIndex];
  const progress = sortedSteps.length > 0 ? (completedSteps.size / sortedSteps.length) * 100 : 0;
  const isLastStep = currentStepIndex === sortedSteps.length - 1;

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < sortedSteps.length) {
      setCurrentStepIndex(index);
    }
  }, [sortedSteps.length]);

  const nextStep = useCallback(() => {
    goToStep(currentStepIndex + 1);
  }, [currentStepIndex, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(currentStepIndex - 1);
  }, [currentStepIndex, goToStep]);

  // Swipe & keyboard navigation
  const swipeHandlers = useSwipeGesture(nextStep, prevStep);
  useKeyboardNavigation(nextStep, prevStep);

  // Voice: auto-read step on change
  useEffect(() => {
    if (voice.isEnabled && currentStep) {
      voice.speakStep(currentStep.step_number, currentStep.instruction, currentStep.tip || undefined);
    }
    // voice.speakStep은 useCallback으로 안정화된 참조 (추가 시 lint가 voice 객체 전체를 요구해 매 렌더 실행됨)
    // currentStep은 currentStepIndex 변경 시에만 변경되므로 deps 중복
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, voice.isEnabled]);

  // 조리 단계가 없는 레시피에서 쿠킹 모드가 열린 경우 방어적 early return.
  // (호출부 RecipeDetailClient가 미리 검증해 토스트를 띄우지만, 여기서도 한 번 더 막음)
  // 주의: 모든 hook 호출 이후에 배치해야 React Hook 규칙 위반 아님.
  if (sortedSteps.length === 0 || !currentStep) {
    return (
      <div className="fixed inset-0 z-50 bg-background-primary text-text-primary flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🍳</div>
          <h2 className="text-xl font-bold mb-2">{t.cookMode.noStepsTitle}</h2>
          <p className="text-text-muted mb-6 text-sm">{t.cookMode.noStepsBody}</p>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-colors"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    );
  }

  // V2: ingredient_id 기반 정확 매칭. 이름 substring 추측 제거.
  // userIngredients 는 표시·legacy 호환용으로 prop 유지하되 매칭에는 사용 X.
  void userIngredients;
  const idSet = new Set(userIngredientIds);
  const isIngredientOwned = (ingredient_id: string | null) =>
    ingredient_id !== null && idSet.has(ingredient_id);

  // 완료 처리
  const handleCompleteRecipe = () => {
    setShowCompletionModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompletionPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setCompletionPhoto(null);
    setPhotoPreview(null);
  };

  const handleSkipReview = async () => {
    setCompleting(true);
    try {
      const formData = new FormData();
      if (completionPhoto) formData.append('photo', completionPhoto);

      const response = await fetch(`/api/recipes/${recipe.id}/complete`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        window.location.href = '/';
      } else if (response.status === 401) {
        toast.warning(t.cookMode.toastLoginCooked, {
          action: {
            label: t.common.login,
            onClick: () => { window.location.href = `/signin?redirect=${encodeURIComponent(window.location.pathname)}`; }
          }
        });
      } else {
        const data = await response.json();
        toast.error(data.error || t.cookMode.saveFailed);
      }
    } catch (error) {
      console.error('Complete recipe error:', error);
      toast.error(t.cookMode.saveError);
    } finally {
      setCompleting(false);
    }
  };

  const handleReviewSuccess = async () => {
    try {
      const formData = new FormData();
      if (completionPhoto) formData.append('photo', completionPhoto);

      const completeResponse = await fetch(`/api/recipes/${recipe.id}/complete`, {
        method: 'POST',
        body: formData,
      });

      if (!completeResponse.ok) {
        const data = await completeResponse.json();
        throw new Error(data.error || t.cookMode.saveFailed);
      }

      window.location.href = '/';
    } catch (error) {
      console.error('Complete recipe error:', error);
      toast.error(error instanceof Error ? error.message : t.cookMode.saveError);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-background-primary flex flex-col"
      onTouchStart={swipeHandlers.handleTouchStart}
      onTouchMove={swipeHandlers.handleTouchMove}
      onTouchEnd={swipeHandlers.handleTouchEnd}
    >
      {/* 헤더 */}
      <header className="flex-shrink-0 border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-text-muted hover:text-text-primary text-sm transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-sm font-bold truncate mx-4 flex-1 text-center">{recipe.title}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            {voice.isSupported && (
              <button
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                className={`p-1.5 rounded-full transition-all ${
                  voice.isEnabled
                    ? 'bg-accent-warm text-background-primary'
                    : 'text-text-muted hover:text-text-primary'
                } ${voice.isSpeaking ? 'animate-pulse' : ''}`}
                title={voice.isEnabled ? t.cookMode.voiceOnTooltip : t.cookMode.voiceOffTooltip}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {voice.isEnabled ? (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.788V15.212a1 1 0 00.553.894l5 2.5A1 1 0 0013.5 17.71V6.29a1 1 0 00-1.447-.894l-5 2.5A1 1 0 006.5 8.788z" />
                    </>
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  )}
                </svg>
              </button>
            )}
            <span className="text-xs text-text-muted">
              {currentStepIndex + 1}/{sortedSteps.length}
            </span>
          </div>
        </div>
        {/* 진행률 바 */}
        <div className="h-1.5 bg-background-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-warm transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* 음성 안내 설정 패널 — components/cook/CookVoicePanel.tsx 로 추출 (Phase 2) */}
      {showVoiceSettings && voice.isSupported && (
        <CookVoicePanel voice={voice} t={t} />
      )}

      {/* 스텝 버블 */}
      <div className="flex-shrink-0 px-4 py-3 overflow-x-auto">
        <div className="flex gap-2">
          {sortedSteps.map((step, index) => (
            <button
              key={step.step_number}
              onClick={() => goToStep(index)}
              className={`shrink-0 w-10 h-10 rounded-full font-bold text-sm transition-all ${
                index === currentStepIndex
                  ? 'bg-accent-warm text-background-primary scale-110'
                  : completedSteps.has(step.step_number)
                    ? 'bg-success text-white'
                    : 'bg-background-secondary text-text-muted hover:bg-background-tertiary'
              }`}
            >
              {completedSteps.has(step.step_number) ? '✓' : step.step_number}
            </button>
          ))}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {currentStep && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* 스텝 헤더 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggleStepComplete(currentStep.step_number)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold transition-all hover:scale-110 active:scale-95 ${
                  completedSteps.has(currentStep.step_number)
                    ? 'bg-success text-white'
                    : 'bg-accent-warm text-background-primary'
                }`}
              >
                {completedSteps.has(currentStep.step_number) ? '✓' : currentStep.step_number}
              </button>
              <div>
                <p className="text-sm text-text-muted">{t.cookMode.stepLabel.replace('{n}', String(currentStep.step_number))}</p>
                {currentStep.title && <h2 className="text-xl font-bold">{currentStep.title}</h2>}
              </div>
            </div>

            {/* 스텝 이미지 */}
            {currentStep.image_url && (
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden">
                <Image
                  src={currentStep.image_url}
                  alt={t.cookMode.stepLabel.replace('{n}', String(currentStep.step_number))}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
            )}

            {/* 지시사항 */}
            <div className="p-5 rounded-2xl bg-background-secondary border border-white/5">
              <p className="text-lg leading-relaxed">{currentStep.instruction}</p>
            </div>

            {/* 멀티 타이머 버튼 */}
            {currentStep.timer_minutes && (
              <button
                onClick={() => {
                  multiTimer.startTimer(
                    currentStep.timer_minutes!,
                    t.cookMode.stepTimerLabel.replace('{n}', String(currentStep.step_number)),
                    currentStep.step_number
                  );
                  setShowTimerPanel(true);
                  toast.success(t.cookMode.timerStarted.replace('{minutes}', String(currentStep.timer_minutes)));
                }}
                className="w-full py-4 rounded-xl bg-info/10 border-2 border-info/30 text-info font-bold hover:bg-info/20 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-xl">⏱️</span>
                {t.cookMode.addTimerBtn.replace('{minutes}', String(currentStep.timer_minutes))}
              </button>
            )}

            {/* 팁 */}
            {currentStep.tip && (
              <div className="p-4 rounded-xl bg-warning/10 border-2 border-warning/30">
                <p className="text-sm">
                  <span className="font-bold text-warning text-base">{t.cookMode.tipLabel}</span>{' '}
                  <span className="text-text-secondary">{currentStep.tip}</span>
                </p>
              </div>
            )}

            {/* 마지막 단계 - 요리 완성 버튼 */}
            {isLastStep && !hasCooked && (
              <button
                onClick={handleCompleteRecipe}
                disabled={completing}
                className="w-full py-4 px-6 rounded-2xl bg-success text-white font-bold text-lg hover:bg-success/90 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
              >
                <span className="text-2xl">🎉</span>
                {t.cookMode.recipeDone}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/5 bg-background-primary">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <button
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className="flex-1 py-3 rounded-xl bg-background-secondary font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-background-tertiary transition-all"
          >
            {t.cookMode.prevShort}
          </button>
          <button
            onClick={() => onToggleStepComplete(currentStep.step_number)}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              completedSteps.has(currentStep.step_number)
                ? 'bg-success text-white'
                : 'bg-background-tertiary text-text-muted hover:bg-background-secondary'
            }`}
          >
            {completedSteps.has(currentStep.step_number) ? t.cookMode.doneMark : t.cookMode.doneShort}
          </button>
          {!isLastStep && (
            <button
              onClick={nextStep}
              className="flex-1 py-3 rounded-xl bg-accent-warm text-background-primary font-bold text-sm hover:bg-accent-hover transition-all"
            >
              {t.cookMode.nextShort}
            </button>
          )}
        </div>
      </div>

      {/* 재료 보기 플로팅 버튼 */}
      <button
        onClick={() => setShowIngredients(true)}
        className="fixed bottom-20 left-4 z-50 px-4 py-2.5 rounded-full bg-background-secondary border border-white/10 text-sm font-medium shadow-lg hover:bg-background-tertiary transition-all flex items-center gap-2"
      >
        {t.cookMode.ingredientsBtn}
      </button>

      {/* 재료 하단 시트 — components/cook/CookIngredientsSheet.tsx 로 추출 (Phase 2) */}
      {showIngredients && (
        <CookIngredientsSheet
          t={t}
          ingredients={recipe.ingredients}
          preparedIngredients={preparedIngredients}
          onTogglePrepared={onTogglePrepared}
          isIngredientOwned={isIngredientOwned}
          unitConv={unitConv}
          onClose={() => setShowIngredients(false)}
        />
      )}

      {/* 멀티 타이머 패널 — components/cook/CookTimerPanel.tsx 로 추출 (Phase 2).
          빈 타이머면 컴포넌트가 null 반환 = 기존 조건부와 동일 */}
      <CookTimerPanel
        multiTimer={multiTimer}
        showTimerPanel={showTimerPanel}
        setShowTimerPanel={setShowTimerPanel}
        t={t}
      />

      {/* 완성 후 선택 모달 — components/cook/CookCompletionModal.tsx 로 추출 (Phase 2) */}
      {showCompletionModal && !showReviewModal && (
        <CookCompletionModal
          t={t}
          photoPreview={photoPreview}
          onPhotoChange={handlePhotoChange}
          onRemovePhoto={removePhoto}
          onWriteReview={() => setShowReviewModal(true)}
          onSkip={handleSkipReview}
          completing={completing}
        />
      )}

      {/* 리뷰 모달 */}
      {showReviewModal && (
        <RecipeReviewModal
          recipeId={recipe.id}
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setShowCompletionModal(false);
          }}
          onSuccess={handleReviewSuccess}
          initialRating={5}
          initialReview=""
        />
      )}
    </div>
  );
}

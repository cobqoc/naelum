'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture';
import { useKeyboardNavigation } from '@/lib/hooks/useKeyboardNavigation';
import { useVoiceGuide } from '@/lib/hooks/useVoiceGuide';
import { useMultiTimer, Timer } from '@/lib/hooks/useMultiTimer';
import { useUnitConversion } from '@/lib/hooks/useUnitConversion';
import { useToast } from '@/lib/toast/context';

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
          <h2 className="text-xl font-bold mb-2">조리 단계가 없어요</h2>
          <p className="text-text-muted mb-6 text-sm">이 레시피는 아직 조리 단계가 등록되지 않았어요.</p>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  const isIngredientOwned = (name: string) =>
    userIngredients.some(ui => name.includes(ui) || ui.includes(name));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
        toast.warning('로그인하면 조리 완료를 기록할 수 있어요', {
          action: {
            label: '로그인',
            onClick: () => { window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`; }
          }
        });
      } else {
        const data = await response.json();
        toast.error(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Complete recipe error:', error);
      toast.error('저장 중 오류가 발생했습니다.');
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
        throw new Error(data.error || '요리 완성 저장 실패');
      }

      window.location.href = '/';
    } catch (error) {
      console.error('Complete recipe error:', error);
      toast.error(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.');
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
                title={voice.isEnabled ? '음성 안내 끄기' : '음성 안내 켜기'}
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

      {/* 음성 안내 설정 패널 */}
      {showVoiceSettings && voice.isSupported && (
        <div className="flex-shrink-0 px-4 py-3 bg-background-secondary border-b border-white/5">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={voice.toggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                voice.isEnabled
                  ? 'bg-accent-warm text-background-primary'
                  : 'bg-background-tertiary text-text-muted'
              }`}
            >
              {voice.isEnabled ? '🔊 음성 안내 ON' : '🔇 음성 안내 OFF'}
            </button>
            {voice.isEnabled && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">속도:</span>
                {(['slow', 'normal', 'fast'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => voice.setSpeed(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      voice.speed === s
                        ? 'bg-accent-warm text-background-primary'
                        : 'bg-background-tertiary text-text-muted hover:bg-white/10'
                    }`}
                  >
                    {s === 'slow' ? '느리게' : s === 'normal' ? '보통' : '빠르게'}
                  </button>
                ))}
              </div>
            )}
          </div>
          {voice.isEnabled && voice.isSpeaking && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-0.5">
                {[12, 18, 10, 16].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-accent-warm rounded-full animate-pulse"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-accent-warm">읽는 중...</span>
              <button
                onClick={voice.stop}
                className="ml-auto text-xs text-text-muted hover:text-error transition-colors"
              >
                중지
              </button>
            </div>
          )}
        </div>
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
                <p className="text-sm text-text-muted">단계 {currentStep.step_number}</p>
                {currentStep.title && <h2 className="text-xl font-bold">{currentStep.title}</h2>}
              </div>
            </div>

            {/* 스텝 이미지 */}
            {currentStep.image_url && (
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden">
                <Image
                  src={currentStep.image_url}
                  alt={`단계 ${currentStep.step_number}`}
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
                    `${currentStep.step_number}단계`,
                    currentStep.step_number
                  );
                  setShowTimerPanel(true);
                  toast.success(`타이머 시작: ${currentStep.timer_minutes}분`);
                }}
                className="w-full py-4 rounded-xl bg-info/10 border-2 border-info/30 text-info font-bold hover:bg-info/20 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-xl">⏱️</span>
                타이머 추가 ({currentStep.timer_minutes}분)
              </button>
            )}

            {/* 팁 */}
            {currentStep.tip && (
              <div className="p-4 rounded-xl bg-warning/10 border-2 border-warning/30">
                <p className="text-sm">
                  <span className="font-bold text-warning text-base">💡 팁:</span>{' '}
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
                요리 완성!
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
            ← 이전
          </button>
          <button
            onClick={() => onToggleStepComplete(currentStep.step_number)}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              completedSteps.has(currentStep.step_number)
                ? 'bg-success text-white'
                : 'bg-background-tertiary text-text-muted hover:bg-background-secondary'
            }`}
          >
            {completedSteps.has(currentStep.step_number) ? '✓ 완료' : '완료'}
          </button>
          {!isLastStep && (
            <button
              onClick={nextStep}
              className="flex-1 py-3 rounded-xl bg-accent-warm text-background-primary font-bold text-sm hover:bg-accent-hover transition-all"
            >
              다음 →
            </button>
          )}
        </div>
      </div>

      {/* 재료 보기 플로팅 버튼 */}
      <button
        onClick={() => setShowIngredients(true)}
        className="fixed bottom-20 left-4 z-50 px-4 py-2.5 rounded-full bg-background-secondary border border-white/10 text-sm font-medium shadow-lg hover:bg-background-tertiary transition-all flex items-center gap-2"
      >
        📋 재료
      </button>

      {/* 재료 하단 시트 */}
      {showIngredients && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowIngredients(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] bg-background-secondary rounded-t-2xl border-t border-white/10 overflow-hidden animate-slide-up">
            {/* 드래그 핸들 */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="px-6 pb-6 overflow-y-auto max-h-[calc(70vh-48px)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">재료</h3>
                <button
                  onClick={() => setShowIngredients(false)}
                  className="w-8 h-8 rounded-full hover:bg-background-tertiary flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {recipe.ingredients.map((ing, idx) => {
                  const owned = isIngredientOwned(ing.ingredient_name);
                  const prepared = preparedIngredients.has(idx);
                  const converted = unitConv.convertIngredient(ing.quantity, ing.unit);
                  return (
                    <div
                      key={idx}
                      onClick={() => onTogglePrepared(idx)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-95 ${
                        prepared
                          ? 'bg-success/20 border-success'
                          : owned
                            ? 'bg-background-tertiary border-text-muted/30'
                            : 'bg-background-tertiary border-error/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${
                          prepared ? 'text-success' : owned ? 'text-text-primary' : 'text-error'
                        }`}>
                          {ing.ingredient_name}
                        </span>
                        {prepared && <span className="text-success text-xs">✓</span>}
                      </div>
                      <div className="text-xs text-text-muted">
                        {converted.isConverted ? (
                          <><span className="text-info">{converted.quantity} {converted.unit}</span> <span className="opacity-60">({ing.quantity}{ing.unit})</span></>
                        ) : (
                          <>{ing.quantity} {ing.unit}</>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 멀티 타이머 패널 */}
      {multiTimer.timers.length > 0 && (
        <>
          {/* 타이머 미니 표시 (접혔을 때) */}
          {!showTimerPanel && (
            <button
              onClick={() => setShowTimerPanel(true)}
              className="fixed top-16 right-4 z-50 bg-accent-warm text-background-primary py-2 px-4 rounded-full shadow-2xl flex items-center gap-2 animate-pulse"
            >
              <span>⏱️</span>
              <span className="font-mono font-bold text-sm">
                {multiTimer.activeTimers.length > 0
                  ? formatTime(multiTimer.activeTimers[0].remainingSeconds)
                  : '완료!'
                }
              </span>
              {multiTimer.activeTimers.length > 1 && (
                <span className="text-xs bg-background-primary/20 px-1.5 py-0.5 rounded-full">
                  +{multiTimer.activeTimers.length - 1}
                </span>
              )}
            </button>
          )}

          {/* 타이머 전체 패널 (펼쳤을 때) */}
          {showTimerPanel && (
            <div className="fixed top-14 left-2 right-2 z-50 bg-background-secondary rounded-2xl shadow-2xl border border-white/10 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  ⏱️ 타이머 ({multiTimer.timers.length})
                </h3>
                <div className="flex gap-2">
                  {multiTimer.completedTimers.length > 0 && (
                    <button
                      onClick={multiTimer.removeCompleted}
                      className="text-xs text-text-muted hover:text-text-primary"
                    >
                      완료 삭제
                    </button>
                  )}
                  <button
                    onClick={() => setShowTimerPanel(false)}
                    className="text-text-muted hover:text-text-primary"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-2 space-y-1.5">
                {multiTimer.timers.map((timer: Timer) => (
                  <div
                    key={timer.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      timer.isActive
                        ? timer.isPaused
                          ? 'bg-warning/10 border border-warning/20'
                          : 'bg-accent-warm/10 border border-accent-warm/20'
                        : 'bg-success/10 border border-success/20'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-text-muted">{timer.label}</div>
                      <div className={`text-lg font-mono font-bold ${
                        !timer.isActive ? 'text-success' :
                        timer.remainingSeconds < 30 ? 'text-error animate-pulse' :
                        'text-text-primary'
                      }`}>
                        {timer.isActive ? formatTime(timer.remainingSeconds) : '00:00 ✓'}
                      </div>
                      {/* Progress bar */}
                      {timer.isActive && (
                        <div className="h-1 bg-background-tertiary rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-accent-warm rounded-full transition-all duration-1000"
                            style={{ width: `${((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {timer.isActive && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => multiTimer.togglePause(timer.id)}
                          className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center text-xs hover:bg-white/10"
                        >
                          {timer.isPaused ? '▶' : '⏸'}
                        </button>
                        <button
                          onClick={() => multiTimer.stopTimer(timer.id)}
                          className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center text-xs hover:bg-error/20 text-error"
                        >
                          ■
                        </button>
                      </div>
                    )}
                    {!timer.isActive && (
                      <button
                        onClick={() => multiTimer.stopTimer(timer.id)}
                        className="text-xs text-text-muted hover:text-text-primary"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 완성 후 선택 모달 */}
      {showCompletionModal && !showReviewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-4">
          <div className="bg-background-secondary rounded-2xl p-6 max-w-md w-full my-8 border border-white/10">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold mb-2">요리 완성!</h3>
              <p className="text-text-secondary text-sm">이 레시피는 어떠셨나요?</p>
            </div>

            {/* 완성 사진 */}
            <div className="mb-6">
              <label className="block text-sm font-bold mb-3">📷 완성 사진 (선택사항)</label>
              {photoPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="완성 사진" className="w-full h-48 object-cover rounded-xl" />
                  <button
                    onClick={removePhoto}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-error text-white flex items-center justify-center hover:bg-error/90 transition-all"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="block w-full py-8 border-2 border-dashed border-white/20 rounded-xl hover:border-accent-warm transition-all cursor-pointer bg-background-tertiary">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <div className="text-center">
                    <div className="text-4xl mb-2">📸</div>
                    <p className="font-bold text-sm">사진 찍기</p>
                    <p className="text-text-muted text-xs mt-1">또는 갤러리에서 선택</p>
                  </div>
                </label>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowReviewModal(true)}
                className="w-full py-3 px-6 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-all flex items-center justify-center gap-2"
              >
                <span>⭐</span> 리뷰 작성하기
              </button>
              <button
                onClick={handleSkipReview}
                disabled={completing}
                className="w-full py-3 px-6 rounded-xl bg-background-tertiary text-text-primary font-bold hover:bg-background-primary transition-all disabled:opacity-50"
              >
                {completing ? '저장 중...' : '다음에 하기'}
              </button>
            </div>
          </div>
        </div>
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

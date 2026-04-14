'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';

interface RecipeStep {
  id: string;
  step_number: number;
  title: string | null;
  instruction: string;
  image_url: string | null;
  timer_minutes: number | null;
  tip: string | null;
}

interface RecipeIngredient {
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
}

interface Recipe {
  id: string;
  title: string;
  thumbnail_url: string | null;
  servings: number;
  steps: RecipeStep[];
  ingredients: RecipeIngredient[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CookingModePage(props: PageProps) {
  const resolvedParams = use(props.params);
  const { id } = resolvedParams;

  const supabase = createClient();
  const toast = useToast();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showIngredients, setShowIngredients] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime] = useState(new Date());

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const fetchRecipe = useCallback(async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        id, title, thumbnail_url, servings,
        steps:recipe_steps(*),
        ingredients:recipe_ingredients(ingredient_name, quantity, unit)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching recipe:', error);
    } else {
      const sortedSteps = (data.steps || []).sort(
        (a: RecipeStep, b: RecipeStep) => a.step_number - b.step_number
      );
      setRecipe({ ...data, steps: sortedSteps });
    }
    setLoading(false);
  }, [id, supabase]);

  const startCookingSession = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('cooking_sessions')
      .insert({
        user_id: user.id,
        recipe_id: id,
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (data) {
      setSessionId(data.id);
    }
  }, [id, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecipe();
    startCookingSession();
  }, [fetchRecipe, startCookingSession]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            // Play sound or notification
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('타이머 완료!', { body: '다음 단계로 진행하세요.' });
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerSeconds]);

  const completeCookingSession = useCallback(async () => {
    if (!sessionId) return;

    const totalMinutes = Math.round((new Date().getTime() - startTime.getTime()) / 60000);

    await supabase
      .from('cooking_sessions')
      .update({
        completed_at: new Date().toISOString(),
        total_time_minutes: totalMinutes
      })
      .eq('id', sessionId);
  }, [sessionId, startTime, supabase]);

  const toggleStepComplete = (stepNumber: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepNumber)) {
      newCompleted.delete(stepNumber);
    } else {
      newCompleted.add(stepNumber);
    }
    setCompletedSteps(newCompleted);
  };

  const startTimer = (minutes: number) => {
    setTimerSeconds(minutes * 60);
    setTimerActive(true);

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const goToStep = (index: number) => {
    if (recipe && index >= 0 && index < recipe.steps.length) {
      setCurrentStepIndex(index);
    }
  };

  const finishCooking = async () => {
    await completeCookingSession();
    toast.success('요리를 완료했습니다! 수고하셨어요 🎉');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="animate-bounce text-4xl">🍳</div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center text-text-primary">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">레시피를 찾을 수 없습니다</p>
          <Link href="/" className="text-accent-warm hover:underline">홈으로 이동</Link>
        </div>
      </div>
    );
  }

  const currentStep = recipe.steps[currentStepIndex];
  const progress = (completedSteps.size / recipe.steps.length) * 100;

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-primary border-b border-white/5">
        <div className="container mx-auto max-w-2xl px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link
              href={`/recipes/${id}`}
              className="text-text-muted hover:text-text-primary text-sm"
            >
              ← 레시피로 돌아가기
            </Link>
            <button
              onClick={() => setShowIngredients(!showIngredients)}
              className="text-sm text-accent-warm"
            >
              {showIngredients ? '재료 숨기기' : '재료 보기'}
            </button>
          </div>

          <h1 className="text-lg font-bold mb-2">{recipe.title}</h1>

          {/* Progress Bar */}
          <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-warm transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-text-muted mt-1">
            {completedSteps.size} / {recipe.steps.length} 단계 완료
          </p>
        </div>
      </header>

      {/* Ingredients Drawer */}
      {showIngredients && (
        <div className="bg-background-secondary border-b border-white/5">
          <div className="container mx-auto max-w-2xl px-6 py-4">
            <h3 className="font-bold mb-3">재료 ({recipe.servings}인분)</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {recipe.ingredients.map((ing, index) => (
                <div key={index} className="text-text-secondary">
                  {ing.ingredient_name} {ing.quantity}{ing.unit}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timer */}
      {timerActive && (
        <div className="bg-accent-warm text-background-primary py-4 text-center">
          <div className="text-4xl font-mono font-bold">{formatTime(timerSeconds)}</div>
          <button
            onClick={() => setTimerActive(false)}
            className="mt-2 text-sm underline"
          >
            타이머 중지
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto max-w-2xl px-6 py-8">
        {/* Step Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {recipe.steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`shrink-0 w-10 h-10 rounded-full font-bold transition-all ${
                index === currentStepIndex
                  ? 'bg-accent-warm text-background-primary'
                  : completedSteps.has(step.step_number)
                    ? 'bg-success text-white'
                    : 'bg-background-secondary text-text-muted hover:bg-white/10'
              }`}
            >
              {completedSteps.has(step.step_number) ? '✓' : step.step_number}
            </button>
          ))}
        </div>

        {/* Current Step */}
        {currentStep && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent-warm text-background-primary flex items-center justify-center text-xl font-bold">
                  {currentStep.step_number}
                </div>
                <div>
                  <p className="text-sm text-text-muted">단계 {currentStep.step_number}</p>
                  {currentStep.title && (
                    <h2 className="text-xl font-bold">{currentStep.title}</h2>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleStepComplete(currentStep.step_number)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  completedSteps.has(currentStep.step_number)
                    ? 'bg-success text-white'
                    : 'bg-background-secondary text-text-muted hover:bg-white/10'
                }`}
              >
                {completedSteps.has(currentStep.step_number) ? '완료됨 ✓' : '완료하기'}
              </button>
            </div>

            {/* Step Image */}
            {currentStep.image_url && (
              <div className="relative h-64 rounded-2xl overflow-hidden">
                <Image
                  src={currentStep.image_url}
                  alt={`Step ${currentStep.step_number}`}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Instruction */}
            <div className="p-6 rounded-2xl bg-background-secondary">
              <p className="text-lg leading-relaxed">{currentStep.instruction}</p>
            </div>

            {/* Timer Button */}
            {currentStep.timer_minutes && !timerActive && (
              <button
                onClick={() => startTimer(currentStep.timer_minutes!)}
                className="w-full py-4 rounded-xl bg-info/10 border border-info/20 text-info font-bold hover:bg-info/20 transition-all"
              >
                ⏱️ 타이머 시작 ({currentStep.timer_minutes}분)
              </button>
            )}

            {/* Tip */}
            {currentStep.tip && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <p className="text-sm">
                  <span className="font-bold text-warning">💡 팁:</span>{' '}
                  <span className="text-text-secondary">{currentStep.tip}</span>
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => goToStep(currentStepIndex - 1)}
                disabled={currentStepIndex === 0}
                className="flex-1 py-4 rounded-xl bg-background-secondary font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
              >
                ← 이전 단계
              </button>
              {currentStepIndex === recipe.steps.length - 1 ? (
                <button
                  onClick={finishCooking}
                  className="flex-1 py-4 rounded-xl bg-success text-white font-bold hover:bg-success/80 transition-all"
                >
                  요리 완료! 🎉
                </button>
              ) : (
                <button
                  onClick={() => goToStep(currentStepIndex + 1)}
                  className="flex-1 py-4 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-all"
                >
                  다음 단계 →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

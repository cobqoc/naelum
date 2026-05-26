'use client';

import { useCallback, useState } from 'react';
import { useMultiTimer } from '@/lib/hooks/useMultiTimer';
import { useVoiceGuide } from '@/lib/hooks/useVoiceGuide';
import { parseAllTimers } from '@/lib/cook/parseTimers';

/**
 * 요리 모드 hook — RecipeBrowseView 의 cookMode 도메인 통합.
 *
 * **Why 추출** ([[feedback-check-line-count-before-adding]] + [[project-god-file-phase2]]):
 *  - RecipeBrowseView 1075줄 god-file 의 *진짜 독립 도메인*
 *  - 단계 완료 토글·타이머 설정·음성 안내는 cart·fridge·tab 과 서로 race 없음
 *  - hook 추출 후 RBV 는 표현 + 외부 prop wiring 만 책임 → 분해 임계 아래로
 *
 * **포함**:
 *  - `completedSteps: Set<number>` + `toggleStep(stepNumber)`
 *  - `timerSetup` 모달 state + `openTimerForStep(stepNumber, effectiveTimers)` + `closeTimerSetup`
 *  - `showTimerPanel` state + setter
 *  - `multiTimer` (useMultiTimer)·`voice` (useVoiceGuide) re-export
 *  - `getEffectiveTimers(step)` — DB timer_minutes + 본문 parse 결합 (pure)
 *  - `completedCount`·`stepProgress` 계산
 *
 * **불변식**:
 *  - completedSteps 는 Set immutable update (prev → new Set)
 *  - timerSetup 객체 = 열림, null = 닫힘. confirmTimer 시 다시 null
 *  - DB timer 가 본문에 이미 있으면 중복 제거 (getEffectiveTimers)
 *  - voice.isSupported false 시 UI 가 voice 버튼 자체를 렌더 안 함 — hook 은 그대로 노출
 */

export interface RecipeStepLite {
  step_number: number;
  instruction: string;
  timer_minutes?: number | null;
  tip?: string;
}

export interface TimerSetupState {
  prefill?: { totalMinutes: number; checkpointMinutes: number[] };
  stepNumber?: number;
}

export interface UseCookingModeResult {
  /** 완료 표시된 단계 번호 Set */
  completedSteps: Set<number>;
  /** 단계 완료 토글 — 있으면 제거, 없으면 추가 */
  toggleStep: (stepNumber: number) => void;
  /** 완료된 단계 수 (derived) */
  completedCount: number;
  /** 진행률 0~100 (derived) */
  stepProgress: number;

  /** 타이머 패널 표시 여부 */
  showTimerPanel: boolean;
  setShowTimerPanel: (show: boolean) => void;

  /** 직접 타이머 설정 모달 state — null=닫힘 */
  timerSetup: TimerSetupState | null;
  /** 단계 본문 타이머로 prefill 한 setup 모달 열기 */
  openTimerForStep: (stepNumber: number, effectiveTimers: number[]) => void;
  closeTimerSetup: () => void;

  /** 단계 타이머 — DB 값 + 본문 parse 결합 (1~120분 범위) */
  getEffectiveTimers: (step: RecipeStepLite) => number[];

  /** 멀티 타이머 hook re-export — CLAUDE.md "ReturnType<typeof useX>" 규약 */
  multiTimer: ReturnType<typeof useMultiTimer>;
  /** 음성 안내 hook re-export */
  voice: ReturnType<typeof useVoiceGuide>;
}

export function useCookingMode(sortedSteps: RecipeStepLite[]): UseCookingModeResult {
  const multiTimer = useMultiTimer();
  const voice = useVoiceGuide();

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showTimerPanel, setShowTimerPanel] = useState(false);
  const [timerSetup, setTimerSetup] = useState<TimerSetupState | null>(null);

  const toggleStep = useCallback((stepNumber: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepNumber)) next.delete(stepNumber);
      else next.add(stepNumber);
      return next;
    });
  }, []);

  const openTimerForStep = useCallback((stepNumber: number, effectiveTimers: number[]) => {
    const sorted = [...effectiveTimers].sort((a, b) => a - b);
    setTimerSetup({
      stepNumber,
      prefill: {
        totalMinutes: sorted[sorted.length - 1],
        checkpointMinutes: sorted.slice(0, -1),
      },
    });
  }, []);

  const closeTimerSetup = useCallback(() => setTimerSetup(null), []);

  const getEffectiveTimers = useCallback((step: RecipeStepLite): number[] => {
    const fromText = parseAllTimers(step.instruction);
    const dbVal = step.timer_minutes && step.timer_minutes >= 1 && step.timer_minutes <= 120
      ? step.timer_minutes : null;
    if (dbVal && !fromText.includes(dbVal)) {
      return [dbVal, ...fromText];
    }
    return fromText;
  }, []);

  const completedCount = sortedSteps.filter(s => completedSteps.has(s.step_number)).length;
  const stepProgress = sortedSteps.length > 0 ? (completedCount / sortedSteps.length) * 100 : 0;

  return {
    completedSteps,
    toggleStep,
    completedCount,
    stepProgress,
    showTimerPanel,
    setShowTimerPanel,
    timerSetup,
    openTimerForStep,
    closeTimerSetup,
    getEffectiveTimers,
    multiTimer,
    voice,
  };
}

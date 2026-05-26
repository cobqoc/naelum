'use client';

import SafeImage from '@/components/Common/SafeImage';
import OptionalIngredientBadge from '@/components/Recipes/OptionalIngredientBadge';
import { tokenizeStepText, type OptionalIngredient } from '@/lib/recipes/highlightOptionalIngredients';
import type { TranslationKeys } from '@/lib/i18n/translations';

/**
 * 조리순서 탭 — RecipeBrowseView 분해 ([[project-god-file-phase2]]) 의 표현 컴포넌트.
 *
 * 순수 표현: 상태·hook 호출 0. 부모(RBV) 가 cook hook 결과를 props 로 주입.
 * JSX byte-identical (className·SVG·핸들러 시그니처 동일) — 행위 변경 0.
 *
 * **불변식**:
 *  - `activeTab === 'steps'` 시 모바일 표시, md+ 는 항상 표시 (PC 2컬럼).
 *  - `alreadyMentioned` Set 은 .map() 안에서 *공유* — step1 의 첫 멘션만 ⓘ 배지, step2 는 색만.
 *    IIFE 로 가둠 (.map 외부에 두면 다중 인스턴스 race).
 *  - instruction·tip 둘 다 같은 Set 공유 → 같은 재료 양쪽 등장 시 첫 멘션만 ⓘ.
 */

interface StepLite {
  title?: string;
  instruction: string;
  step_number: number;
  timer_minutes?: number | null;
  tip?: string;
  image_url?: string | null;
}

interface StepsTabProps {
  /** 'ingredients' | 'steps' — 모바일 show/hide */
  activeTab: 'ingredients' | 'steps';
  sortedSteps: StepLite[];
  completedSteps: Set<number>;
  completedCount: number;
  stepProgress: number;
  optionalIngredients: OptionalIngredient[];
  onToggleStep: (stepNumber: number) => void;
  onOpenTimer: (stepNumber: number, effectiveTimers: number[]) => void;
  getEffectiveTimers: (step: StepLite) => number[];
  voice: {
    isSupported: boolean;
    speakStepDirect: (n: number, instruction: string, tip?: string) => void;
  };
  t: TranslationKeys;
}

export default function StepsTab({
  activeTab,
  sortedSteps,
  completedSteps,
  completedCount,
  stepProgress,
  optionalIngredients,
  onToggleStep,
  onOpenTimer,
  getEffectiveTimers,
  voice,
  t,
}: StepsTabProps) {
  return (
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
                onClick={() => onToggleStep(step.step_number)}
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
                    onClick={() => onOpenTimer(step.step_number, effectiveTimers)}
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
  );
}

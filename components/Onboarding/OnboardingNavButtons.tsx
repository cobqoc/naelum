'use client';

import type { TranslationKeys } from '@/lib/i18n/translations';

/**
 * 온보딩 2·3단계 하단 이동 버튼(이전 · 나중에 · 다음).
 * 2026-10-04 PAU-38: Step2Interests·Step3Dietary 에 className·핸들러까지 같은 블록이 복제돼 있던 것을 그대로 옮김.
 */
export default function OnboardingNavButtons({
  t,
  onBack,
  onSkip,
  onNext,
}: {
  t: TranslationKeys;
  onBack?: () => void;
  onSkip?: () => void;
  onNext: () => void;
}) {
  return (
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl bg-background-tertiary text-text-secondary hover:bg-white/5 font-medium transition-all"
        >
          {t.onboarding.back}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-3.5 rounded-xl bg-background-tertiary text-text-secondary hover:bg-white/5 font-medium transition-all whitespace-nowrap"
        >
          {t.onboarding.skipShort}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 py-3.5 rounded-xl bg-accent-warm text-background-primary hover:bg-accent-hover font-bold transition-all shadow-md"
        >
          {t.onboarding.next}
        </button>
      </div>
  );
}

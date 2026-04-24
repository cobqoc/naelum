'use client';

import { useRouter } from 'next/navigation';
import { OnboardingStepProps } from './OnboardingTypes';
import { useI18n } from '@/lib/i18n/context';

export default function OnboardingStep4Complete({
  formData,
  onNext,
  onBack,
}: OnboardingStepProps) {
  const router = useRouter();
  const { t } = useI18n();
  const tc = t.onboarding.complete;

  const handleGoToIngredients = () => {
    onNext(); // 온보딩 완료 처리
    router.push('/');
  };

  const handleGoToHome = () => {
    onNext(); // 온보딩 완료 처리
  };

  return (
    <div className="space-y-6">
      {/* 완료 아이콘 */}
      <div className="text-center">
        <div className="inline-block text-7xl mb-4 animate-bounce">
          🎉
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-2">{tc.welcomeTitle}</h3>
        <p className="text-sm text-text-secondary">
          {tc.welcomeSubtitle}
        </p>
      </div>

      {/* 사용자명 표시 */}
      <div className="text-center py-6 px-4 rounded-xl bg-background-tertiary border border-white/10">
        <p className="text-sm text-text-muted mb-2">{tc.usernameLabel}</p>
        <p className="text-xl font-bold text-accent-warm">
          @{formData.username}
        </p>
        {formData.bio && (
          <p className="text-sm text-text-secondary mt-3 italic">
            &quot;{formData.bio}&quot;
          </p>
        )}
      </div>

      {/* 요약 정보 */}
      <div className="space-y-3">
        {formData.interests.length > 0 && (
          <div className="p-4 rounded-xl bg-background-secondary">
            <p className="text-xs text-text-muted mb-2">{tc.interestsLabel}</p>
            <p className="text-sm text-text-primary">
              {t.onboarding.interests.selectedCount.replace('{count}', String(formData.interests.length))}
            </p>
          </div>
        )}
        {formData.dietary_preferences.length > 0 && (
          <div className="p-4 rounded-xl bg-background-secondary">
            <p className="text-xs text-text-muted mb-2">{tc.dietaryLabel}</p>
            <p className="text-sm text-text-primary">
              {t.onboarding.interests.selectedCount.replace('{count}', String(formData.dietary_preferences.length))}
            </p>
          </div>
        )}
        {formData.allergies && (
          <div className="p-4 rounded-xl bg-background-secondary">
            <p className="text-xs text-text-muted mb-2">{tc.allergyLabel}</p>
            <p className="text-sm text-text-primary">
              {formData.allergies}
            </p>
          </div>
        )}
      </div>

      {/* 다음 단계 안내 */}
      <div className="p-4 rounded-xl bg-accent-warm/10 border border-accent-warm/20">
        <p className="text-sm text-accent-warm text-center">
          {tc.nextStepHint}
        </p>
      </div>

      {/* 버튼 */}
      <div className="flex flex-col gap-3 pt-4">
        <button
          type="button"
          onClick={handleGoToIngredients}
          className="w-full py-3.5 rounded-xl bg-accent-warm text-background-primary hover:bg-accent-hover font-bold transition-all shadow-md"
        >
          {tc.ctaIngredients}
        </button>
        <button
          type="button"
          onClick={handleGoToHome}
          className="w-full py-3.5 rounded-xl bg-background-tertiary text-text-secondary hover:bg-white/5 font-medium transition-all"
        >
          {tc.ctaHome}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-text-muted hover:text-accent-warm transition-colors"
        >
          {tc.backLink}
        </button>
      </div>
    </div>
  );
}

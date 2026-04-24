'use client';

import { OnboardingStepProps } from './OnboardingTypes';
import { useI18n } from '@/lib/i18n/context';

export default function OnboardingStep2Interests({
  formData,
  setFormData,
  onNext,
  onBack,
  onSkip,
}: OnboardingStepProps) {
  const { t } = useI18n();
  const ti = t.onboarding.interests;
  // 요리 카테고리 이름은 기존 t.cuisines를 재사용 (홈·검색과 동일 소스).
  const cuisineOptions: { id: keyof typeof t.cuisines; icon: string }[] = [
    { id: 'korean', icon: '🍚' },
    { id: 'chinese', icon: '🥟' },
    { id: 'japanese', icon: '🍣' },
    { id: 'western', icon: '🍝' },
    { id: 'italian', icon: '🍕' },
    { id: 'french', icon: '🥐' },
    { id: 'mexican', icon: '🌮' },
    { id: 'indian', icon: '🍛' },
    { id: 'thai', icon: '🍜' },
    { id: 'vegan', icon: '🥗' },
    { id: 'dessert', icon: '🍰' },
    { id: 'baking', icon: '🥖' },
  ];

  const toggleInterest = (id: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.includes(id)
        ? formData.interests.filter((i) => i !== id)
        : [...formData.interests, id],
    });
  };

  const isSelected = (id: string) => formData.interests.includes(id);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-text-primary mb-2">{ti.title}</h3>
        <p className="text-sm text-text-secondary">
          {ti.subtitle}
        </p>
      </div>

      {/* 선택 개수 표시 */}
      {formData.interests.length > 0 && (
        <div className="text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-accent-warm/20 text-accent-warm text-sm font-medium">
            {ti.selectedCount.replace('{count}', String(formData.interests.length))}
          </span>
        </div>
      )}

      {/* 관심사 그리드 */}
      <div className="grid grid-cols-3 gap-3">
        {cuisineOptions.map((cuisine) => (
          <button
            key={cuisine.id}
            type="button"
            onClick={() => toggleInterest(cuisine.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl font-medium transition-all ${
              isSelected(cuisine.id)
                ? 'bg-accent-warm text-background-primary shadow-md scale-105'
                : 'bg-background-tertiary text-text-secondary hover:bg-white/10 active:scale-95'
            }`}
          >
            <span className="text-3xl mb-2">{cuisine.icon}</span>
            <span className="text-xs">{t.cuisines[cuisine.id]}</span>
          </button>
        ))}
      </div>

      {/* 안내 메시지 */}
      {formData.interests.length < 3 && (
        <p className="text-xs text-center text-accent-warm">
          {ti.minHint}
        </p>
      )}

      {/* 버튼 */}
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
    </div>
  );
}

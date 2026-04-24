'use client';

import { OnboardingStepProps } from './OnboardingTypes';
import { useI18n } from '@/lib/i18n/context';

export default function OnboardingStep3Dietary({
  formData,
  setFormData,
  onNext,
  onBack,
  onSkip,
}: OnboardingStepProps) {
  const { t } = useI18n();
  const td = t.onboarding.dietary;
  const dietaryOptions: { id: keyof typeof td.options; icon: string }[] = [
    { id: 'vegetarian', icon: '🥬' },
    { id: 'vegan', icon: '🌱' },
    { id: 'lacto_vegetarian', icon: '🥛' },
    { id: 'gluten_free', icon: '🌾' },
    { id: 'low_carb', icon: '🥩' },
    { id: 'low_calorie', icon: '🥗' },
  ];

  const toggleDietaryPref = (id: string) => {
    setFormData({
      ...formData,
      dietary_preferences: formData.dietary_preferences.includes(id)
        ? formData.dietary_preferences.filter((p) => p !== id)
        : [...formData.dietary_preferences, id],
    });
  };

  const isSelected = (id: string) => formData.dietary_preferences.includes(id);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-text-primary mb-2">{td.title}</h3>
        <p className="text-sm text-text-secondary">
          {td.subtitle}
        </p>
      </div>

      {/* 식단 선호도 */}
      <div>
        <h4 className="text-sm font-medium text-text-secondary mb-3">{td.dietaryLabel}</h4>
        <div className="grid grid-cols-2 gap-3">
          {dietaryOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleDietaryPref(option.id)}
              className={`flex items-center gap-3 p-4 rounded-xl font-medium transition-all ${
                isSelected(option.id)
                  ? 'bg-accent-warm text-background-primary shadow-md'
                  : 'bg-background-tertiary text-text-secondary hover:bg-white/10'
              }`}
            >
              <span className="text-2xl">{option.icon}</span>
              <span className="text-sm">{td.options[option.id]}</span>
            </button>
          ))}
        </div>
        {formData.dietary_preferences.length > 0 && (
          <p className="text-xs text-center text-text-muted mt-2">
            {t.onboarding.interests.selectedCount.replace('{count}', String(formData.dietary_preferences.length))}
          </p>
        )}
      </div>

      {/* 알레르기 */}
      <div>
        <h4 className="text-sm font-medium text-text-secondary mb-3">{td.allergyLabel}</h4>
        <div className="space-y-2">
          <textarea
            value={formData.allergies}
            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            placeholder={td.allergyPlaceholder}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-background-secondary text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm transition-all resize-none"
          />
          <p className="text-xs text-text-muted">
            {td.allergyHint}
          </p>
        </div>
      </div>

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

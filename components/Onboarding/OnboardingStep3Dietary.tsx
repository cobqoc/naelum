'use client';

import { OnboardingStepProps } from './OnboardingTypes';

export default function OnboardingStep3Dietary({
  formData,
  setFormData,
  onNext,
  onBack,
  onSkip,
}: OnboardingStepProps) {
  const dietaryOptions = [
    { id: 'vegetarian', name: '채식주의자', icon: '🥬' },
    { id: 'vegan', name: '비건', icon: '🌱' },
    { id: 'lacto_vegetarian', name: '락토 베지테리언', icon: '🥛' },
    { id: 'gluten_free', name: '글루텐 프리', icon: '🌾' },
    { id: 'low_carb', name: '저탄수화물', icon: '🥩' },
    { id: 'low_calorie', name: '저칼로리', icon: '🥗' },
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
        <h3 className="text-lg font-bold text-text-primary mb-2">식단 선호도</h3>
        <p className="text-sm text-text-secondary">
          식단 선호도와 알레르기 정보를 입력하세요 (선택)
        </p>
      </div>

      {/* 식단 선호도 */}
      <div>
        <h4 className="text-sm font-medium text-text-secondary mb-3">식단 선호도</h4>
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
              <span className="text-sm">{option.name}</span>
            </button>
          ))}
        </div>
        {formData.dietary_preferences.length > 0 && (
          <p className="text-xs text-center text-text-muted mt-2">
            {formData.dietary_preferences.length}개 선택됨
          </p>
        )}
      </div>

      {/* 알레르기 */}
      <div>
        <h4 className="text-sm font-medium text-text-secondary mb-3">알레르기 재료</h4>
        <div className="space-y-2">
          <textarea
            value={formData.allergies}
            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            placeholder="예: 땅콩, 새우, 우유, 계란&#10;(쉼표로 구분하여 입력해주세요)"
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-background-secondary text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm transition-all resize-none"
          />
          <p className="text-xs text-text-muted">
            💡 알레르기 재료를 등록하면 해당 재료가 포함된 레시피를 제외하고 추천해드려요
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
          이전
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-3.5 rounded-xl bg-background-tertiary text-text-secondary hover:bg-white/5 font-medium transition-all whitespace-nowrap"
        >
          나중에
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 py-3.5 rounded-xl bg-accent-warm text-background-primary hover:bg-accent-hover font-bold transition-all shadow-md"
        >
          다음
        </button>
      </div>
    </div>
  );
}

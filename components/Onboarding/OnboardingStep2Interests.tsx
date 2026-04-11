'use client';

import { OnboardingStepProps } from './OnboardingTypes';

export default function OnboardingStep2Interests({
  formData,
  setFormData,
  onNext,
  onBack,
  onSkip,
}: OnboardingStepProps) {
  const cuisineOptions = [
    { id: 'korean', name: '한식', icon: '🍚' },
    { id: 'chinese', name: '중식', icon: '🥟' },
    { id: 'japanese', name: '일식', icon: '🍣' },
    { id: 'western', name: '양식', icon: '🍝' },
    { id: 'italian', name: '이탈리안', icon: '🍕' },
    { id: 'french', name: '프렌치', icon: '🥐' },
    { id: 'mexican', name: '멕시칸', icon: '🌮' },
    { id: 'indian', name: '인도', icon: '🍛' },
    { id: 'thai', name: '태국', icon: '🍜' },
    { id: 'vegan', name: '비건', icon: '🥗' },
    { id: 'dessert', name: '디저트', icon: '🍰' },
    { id: 'baking', name: '베이킹', icon: '🥖' },
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
        <h3 className="text-lg font-bold text-text-primary mb-2">관심 요리 선택</h3>
        <p className="text-sm text-text-secondary">
          관심 있는 요리를 선택하세요 (최소 3개 권장)
        </p>
      </div>

      {/* 선택 개수 표시 */}
      {formData.interests.length > 0 && (
        <div className="text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-accent-warm/20 text-accent-warm text-sm font-medium">
            {formData.interests.length}개 선택됨
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
            <span className="text-xs">{cuisine.name}</span>
          </button>
        ))}
      </div>

      {/* 안내 메시지 */}
      {formData.interests.length < 3 && (
        <p className="text-xs text-center text-accent-warm">
          💡 최소 3개 이상 선택하시면 더 정확한 추천을 받을 수 있어요!
        </p>
      )}

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

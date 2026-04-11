'use client';

import { useState, useEffect } from 'react';
import { OnboardingFormData, OnboardingWizardProps } from './OnboardingTypes';
import OnboardingStep1Profile from './OnboardingStep1Profile';
import OnboardingStep2Interests from './OnboardingStep2Interests';
import OnboardingStep3Dietary from './OnboardingStep3Dietary';
import OnboardingStep4Complete from './OnboardingStep4Complete';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';

export default function OnboardingWizard({
  isOpen,
  onClose,
  onComplete,
  initialData,
}: OnboardingWizardProps) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<OnboardingFormData>({
    username: '',
    bio: '',
    avatar_url: null,
    avatar_file: null,
    birth_date: null,
    gender: null,
    country: null,
    interests: [],
    dietary_preferences: [],
    allergies: '',
    ...initialData,
  });

  const supabase = createClient();

  // Body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC 키 비활성화 (강제 온보딩)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // "나중에 하기" 처리
  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 현재 단계 저장
      await supabase.from('profiles').update({
        onboarding_step: step,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      onClose();
    } catch (error) {
      console.error('Skip error:', error);
    }
  };

  // 온보딩 완료 처리
  const handleComplete = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('사용자 인증 정보를 찾을 수 없습니다');
      }

      // 1. 아바타 업로드 (있으면)
      let avatarUrl = formData.avatar_url;
      if (formData.avatar_file) {
        const fileExt = formData.avatar_file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, formData.avatar_file);

        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      // 2. 프로필 업데이트
      const { error: profileError } = await supabase.from('profiles').update({
        username: formData.username,
        bio: formData.bio || null,
        avatar_url: avatarUrl,
        birth_date: formData.birth_date,
        gender: formData.gender,
        country: formData.country,
        onboarding_completed: true,
        onboarding_step: 4,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // 3. 관심사 저장
      if (formData.interests.length > 0) {
        // 기존 관심사 삭제
        await supabase.from('user_interests')
          .delete()
          .eq('user_id', user.id)
          .eq('interest_type', 'cuisine');

        // 새 관심사 추가
        const { error: interestsError } = await supabase.from('user_interests').insert(
          formData.interests.map((interest) => ({
            user_id: user.id,
            interest_type: 'cuisine',
            interest_value: interest,
          }))
        );

        if (interestsError) {
          console.error('Interests save error:', interestsError);
        }
      }

      // 4. 식단 선호도 저장
      if (formData.dietary_preferences.length > 0) {
        // 기존 식단 선호도 삭제
        await supabase.from('user_dietary_preferences')
          .delete()
          .eq('user_id', user.id);

        // 새 식단 선호도 추가
        const { error: dietaryError } = await supabase.from('user_dietary_preferences').insert(
          formData.dietary_preferences.map((pref) => ({
            user_id: user.id,
            preference_type: pref,
            is_active: true,
          }))
        );

        if (dietaryError) {
          console.error('Dietary preferences save error:', dietaryError);
        }
      }

      // 5. 알레르기 저장
      const allergiesList = formData.allergies
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a);

      if (allergiesList.length > 0) {
        // 기존 알레르기 삭제
        await supabase.from('user_allergies')
          .delete()
          .eq('user_id', user.id);

        // 새 알레르기 추가
        const { error: allergiesError } = await supabase.from('user_allergies').insert(
          allergiesList.map((allergy) => ({
            user_id: user.id,
            ingredient_name: allergy,
            severity: 'moderate',
          }))
        );

        if (allergiesError) {
          console.error('Allergies save error:', allergiesError);
        }
      }

      // 완료 처리
      onComplete();
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error(`저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* 배경 오버레이 (클릭 방지) */}
      <div className="absolute inset-0" onClick={() => {}} />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-background-secondary rounded-2xl p-6 max-w-2xl w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* 진행률 표시 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-text-primary">
            프로필 설정 ({step}/4)
          </h2>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full transition-all ${
                  i <= step ? 'bg-accent-warm' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 단계별 컴포넌트 렌더링 */}
        {step === 1 && (
          <OnboardingStep1Profile
            formData={formData}
            setFormData={setFormData}
            onNext={() => setStep(2)}
            onSkip={handleSkip}
          />
        )}
        {step === 2 && (
          <OnboardingStep2Interests
            formData={formData}
            setFormData={setFormData}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            onSkip={handleSkip}
          />
        )}
        {step === 3 && (
          <OnboardingStep3Dietary
            formData={formData}
            setFormData={setFormData}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
            onSkip={handleSkip}
          />
        )}
        {step === 4 && (
          <OnboardingStep4Complete
            formData={formData}
            setFormData={setFormData}
            onNext={handleComplete}
            onBack={() => setStep(3)}
          />
        )}

        {/* 저장 중 오버레이 */}
        {saving && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <div className="bg-background-secondary p-6 rounded-xl border border-white/10 text-center">
              <div className="w-12 h-12 border-4 border-accent-warm border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-primary font-medium">저장 중...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

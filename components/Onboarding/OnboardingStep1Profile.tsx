'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import { OnboardingStepProps } from './OnboardingTypes';
import { COUNTRIES } from './countries';

export default function OnboardingStep1Profile({
  formData,
  setFormData,
  onNext,
  onSkip,
}: OnboardingStepProps) {
  const toast = useToast();
  const { t } = useI18n();
  const tp = t.onboarding.profile;
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 닉네임 중복 확인 (500ms 디바운스)
  useEffect(() => {
    const checkUsername = async () => {
      if (!formData.username || formData.username.length < 2) {
        setUsernameAvailable(null);
        return;
      }

      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(formData.username)}`);
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch (error) {
        console.error('Username check error:', error);
        setUsernameAvailable(null);
      }
      setCheckingUsername(false);
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

  // 프로필 사진 선택 핸들러
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(tp.errorFileSize);
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      toast.error(tp.errorFileType);
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 폼 데이터 업데이트
    setFormData({ ...formData, avatar_file: file });
  };

  // 다음 버튼 활성화 조건
  const canProceed =
    formData.username.length >= 2 &&
    !checkingUsername &&
    usernameAvailable === true;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-text-primary mb-2">{tp.title}</h3>
        <p className="text-sm text-text-secondary">
          {tp.subtitle}
        </p>
      </div>

      {/* 프로필 사진 */}
      <div className="flex flex-col items-center space-y-3">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-background-tertiary border-2 border-white/10">
            {avatarPreview || formData.avatar_url ? (
              <Image
                src={avatarPreview || formData.avatar_url!}
                alt={tp.avatarAlt}
                width={96}
                height={96}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-text-muted">
                👤
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent-warm text-background-primary hover:bg-accent-hover transition-all flex items-center justify-center shadow-lg"
          >
            📷
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <p className="text-xs text-text-muted">{tp.avatarHint}</p>
      </div>

      {/* 닉네임 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary flex items-center gap-1">
          {tp.usernameLabel} <span className="text-accent-warm">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder={tp.usernamePlaceholder}
            className="w-full px-4 py-3 rounded-xl bg-background-secondary text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm transition-all pr-10"
            minLength={2}
            maxLength={20}
          />
          {checkingUsername && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!checkingUsername && usernameAvailable === true && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xl">
              ✓
            </div>
          )}
          {!checkingUsername && usernameAvailable === false && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xl">
              ✗
            </div>
          )}
        </div>
        {usernameAvailable === false && (
          <p className="text-xs text-red-400">{tp.usernameTaken}</p>
        )}
        {usernameAvailable === true && (
          <p className="text-xs text-green-400">{tp.usernameAvailable}</p>
        )}
      </div>

      {/* 소개 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">{tp.bioLabel}</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder={tp.bioPlaceholder}
          className="w-full px-4 py-3 rounded-xl bg-background-secondary text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm transition-all resize-none"
          rows={3}
          maxLength={200}
        />
        <p className="text-xs text-text-muted text-right">{formData.bio.length}/200</p>
      </div>

      {/* 생년월일 — 모바일 native picker의 "빈공간 탭 시 오늘 자동 입력" 이슈 방지용 clear 버튼 포함 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-secondary">{tp.birthLabel}</label>
          {formData.birth_date && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, birth_date: null })}
              className="text-[11px] text-accent-warm hover:underline"
            >
              {tp.birthClear}
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="date"
            value={formData.birth_date || ''}
            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value || null })}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 pr-10 rounded-xl bg-background-secondary text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm transition-all"
          />
          {formData.birth_date && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, birth_date: null })}
              aria-label={tp.birthClearAria}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 성별 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">{tp.genderLabel}</label>
        <div className="flex gap-3">
          {[
            { value: 'male', label: tp.genderMale, icon: '👨' },
            { value: 'female', label: tp.genderFemale, icon: '👩' },
            { value: 'other', label: tp.genderOther, icon: '🧑' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, gender: option.value as 'male' | 'female' | 'other' })}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                formData.gender === option.value
                  ? 'bg-accent-warm text-background-primary shadow-md'
                  : 'bg-background-tertiary text-text-secondary hover:bg-white/5'
              }`}
            >
              <span className="mr-1">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
        {formData.gender && (
          <button
            type="button"
            onClick={() => setFormData({ ...formData, gender: null })}
            className="text-xs text-text-muted hover:text-accent-warm transition-colors"
          >
            {tp.genderUnselect}
          </button>
        )}
      </div>

      {/* 국가 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">
          {tp.countryLabel}
        </label>
        <select
          value={formData.country || ''}
          onChange={(e) => setFormData({ ...formData, country: e.target.value || null })}
          className="w-full px-4 py-3 rounded-xl bg-background-secondary text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm transition-all appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem',
          }}
        >
          <option value="">{tp.countryNone}</option>
          {COUNTRIES.map((c) => (
            // value는 c.name(한국어) 유지 — 기존 DB 레코드 호환. 표시는 locale에서 lookup.
            <option key={c.code} value={c.name}>
              {t.onboarding.countries[c.code]}
            </option>
          ))}
        </select>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 py-3.5 rounded-xl bg-background-tertiary text-text-secondary hover:bg-white/5 font-medium transition-all"
        >
          {t.onboarding.skip}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${
            canProceed
              ? 'bg-accent-warm text-background-primary hover:bg-accent-hover shadow-md'
              : 'bg-background-tertiary text-text-muted cursor-not-allowed opacity-50'
          }`}
        >
          {t.onboarding.next}
        </button>
      </div>
    </div>
  );
}

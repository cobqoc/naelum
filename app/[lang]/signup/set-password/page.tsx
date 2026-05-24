'use client';

import { useState, useEffect } from 'react';
import Link from '@/components/Common/LocalizedLink';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { createClient } from '@/lib/supabase/client';
import { translateError } from '@/lib/i18n/errorMessages';
import { getPasswordStrength } from '@/lib/utils/password';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import { useI18n } from '@/lib/i18n/context';
import { createProfile, beginOnboarding } from '@/lib/auth/profile';
import { checkMinAge, MIN_AGE } from '@/lib/auth/ageGate';

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToCopyright, setAgreedToCopyright] = useState(false);
  const [agreedToMarketing, setAgreedToMarketing] = useState(false);
  const [birthDate, setBirthDate] = useState('');

  // 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // 로그인되지 않은 경우 회원가입 페이지로
        router.push('/signup');
        return;
      }

      setEmail(user.email || '');
      setChecking(false);
    };

    checkSession();
  }, [router, supabase]);

  const strength = getPasswordStrength(password);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setError(t.auth.passwordMinLength);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    if (!agreedToTerms || !agreedToPrivacy || !agreedToCopyright) {
      setError(t.auth.termsRequired);
      return;
    }

    // 연령 gate — 글로벌 safe 기준 16세 (GDPR Art. 8 최강, COPPA·개인정보보호법 모두 충족)
    if (!birthDate) {
      setError(t.auth.birthDateRequired || `생년월일을 입력해주세요. 만 ${MIN_AGE}세 이상만 가입할 수 있어요.`);
      return;
    }
    const { meetsMinimum } = checkMinAge(birthDate);
    if (!meetsMinimum) {
      setError(t.auth.ageGateError || `만 ${MIN_AGE}세 이상만 가입할 수 있어요.`);
      return;
    }

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(translateError(updateError));
      setLoading(false);
      return;
    }

    // 현재 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 프로필 존재 여부 확인
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      // 프로필이 없으면 생성, 있으면 기존 프로필에 동의 기록·생년월일 업데이트
      if (!existingProfile) {
        await createProfile(supabase, {
          id: user.id,
          email: user.email || email,
          authProvider: 'email',
          marketingConsent: agreedToMarketing,
          termsAgreed: true,
          privacyAgreed: true,
          copyrightAgreed: true,
          birthDate,
        });
      } else {
        // 이미 프로필 존재 (OAuth 후 이메일 등록 등) — 모든 동의 기록 갱신
        await beginOnboarding(supabase, user.id, agreedToMarketing, {
          termsAgreed: true,
          privacyAgreed: true,
          copyrightAgreed: true,
          birthDate,
        });
      }
    }

    // 회원가입 완료 후 홈으로 이동
    router.push('/');
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary">
        <div className="flex items-center gap-3 text-text-muted">
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {t.auth.checking}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary px-4 md:px-6 py-8 md:py-12">
      <div className="w-full max-w-md rounded-2xl md:rounded-3xl bg-background-secondary p-6 md:p-10 shadow-2xl border border-white/5">
        <h1 className="mb-2 text-xl md:text-2xl font-bold text-text-primary">{t.auth.setPasswordTitle}</h1>
        <p className="mb-6 md:mb-8 text-sm text-text-muted">
          {t.auth.setPasswordSubtitle}
        </p>

        {/* 이메일 확인 */}
        <div className="mb-6 rounded-xl bg-success/10 p-4 text-center">
          <p className="text-sm text-success">
            ✓ {t.auth.emailVerifiedLabel} <span className="font-medium">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-6">
          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">{t.auth.password} *</label>
            <div className="relative">
              <InputBoxWrapper className="!bg-background-tertiary !rounded-xl !px-5 !py-3.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${INPUT_INNER_COMFORTABLE_CLASS} pr-10`}
                  style={INPUT_INNER_STYLE}
                  placeholder={t.auth.passwordPlaceholder}
                  autoComplete="new-password"
                  required
                />
              </InputBoxWrapper>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                )}
              </button>
            </div>
            {/* Strength Indicator */}
            <div className="flex gap-1 pt-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    i <= strength ? (strength <= 2 ? 'bg-warning' : 'bg-success') : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-text-muted italic">{t.auth.passwordHint}</p>
              {strength > 0 && (
                <p className={`text-[10px] font-medium ${strength <= 2 ? 'text-warning' : 'text-success'}`}>
                  {strength === 1 ? t.auth.passwordStrengthWeak
                    : strength === 2 ? t.auth.passwordStrengthFair
                    : strength === 3 ? t.auth.passwordStrengthStrong
                    : t.auth.passwordStrengthVeryStrong}
                </p>
              )}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">{t.auth.confirmPassword} *</label>
            <div className="relative">
              <InputBoxWrapper className={`!bg-background-tertiary !rounded-xl !px-5 !py-3.5 ${confirmPassword && password !== confirmPassword ? '!ring-error' : ''}`}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${INPUT_INNER_COMFORTABLE_CLASS} pr-10`}
                  style={INPUT_INNER_STYLE}
                  placeholder={t.auth.confirmPassword}
                  autoComplete="new-password"
                  required
                />
              </InputBoxWrapper>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && password === confirmPassword && (
              <p className="text-xs text-success">✓ {t.auth.passwordMatch}</p>
            )}
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-error">✗ {t.auth.passwordMismatch}</p>
            )}
          </div>

          {/* 생년월일 — 연령 gate (글로벌 safe 16세 기준) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">
              {t.auth.birthDateLabel} <span className="text-error">*</span>
            </label>
            <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={INPUT_INNER_COMFORTABLE_CLASS}
                style={INPUT_INNER_STYLE}
                required
              />
            </InputBoxWrapper>
            <p className="text-[11px] text-text-muted">
              {t.auth.ageGateNotice || `만 ${MIN_AGE}세 이상만 가입할 수 있어요 (GDPR·COPPA 등 글로벌 기준).`}
            </p>
          </div>

          {/* 약관 동의 */}
          <div className="pt-2 space-y-3">
            {/* 전체 동의 */}
            <label className="flex items-center gap-3 cursor-pointer pb-2 border-b border-white/10">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={agreedToTerms && agreedToPrivacy && agreedToCopyright && agreedToMarketing}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    setAgreedToPrivacy(e.target.checked);
                    setAgreedToCopyright(e.target.checked);
                    setAgreedToMarketing(e.target.checked);
                  }}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-white/30 bg-background-primary transition-all checked:border-accent-warm checked:bg-accent-warm hover:border-accent-warm/50"
                />
                <svg
                  className="pointer-events-none absolute h-3 w-3 text-background-primary opacity-0 peer-checked:opacity-100 transition-opacity"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-text-primary">{t.auth.agreeAll}</span>
            </label>

            {/* 이용약관 동의 (필수) */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-white/30 bg-background-primary transition-all checked:border-accent-warm checked:bg-accent-warm hover:border-accent-warm/50"
                />
                <svg
                  className="pointer-events-none absolute h-3 w-3 text-background-primary opacity-0 peer-checked:opacity-100 transition-opacity"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                    {t.auth.termsAgreeLabel}
                  </span>
                  <span className="text-xs text-error font-medium">{t.auth.termsRequiredLabel}</span>
                </div>
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-xs text-text-muted hover:text-accent-warm underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t.auth.termsViewDetail}
                </Link>
              </div>
            </label>

            {/* 개인정보처리방침 동의 (필수) */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-white/30 bg-background-primary transition-all checked:border-accent-warm checked:bg-accent-warm hover:border-accent-warm/50"
                />
                <svg
                  className="pointer-events-none absolute h-3 w-3 text-background-primary opacity-0 peer-checked:opacity-100 transition-opacity"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                    {t.auth.termsPrivacyLabel}
                  </span>
                  <span className="text-xs text-error font-medium">{t.auth.termsRequiredLabel}</span>
                </div>
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-xs text-text-muted hover:text-accent-warm underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t.auth.termsViewDetail}
                </Link>
              </div>
            </label>

            {/* 저작권 조항 동의 (필수) */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToCopyright}
                  onChange={(e) => setAgreedToCopyright(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-white/30 bg-background-primary transition-all checked:border-accent-warm checked:bg-accent-warm hover:border-accent-warm/50"
                />
                <svg
                  className="pointer-events-none absolute h-3 w-3 text-background-primary opacity-0 peer-checked:opacity-100 transition-opacity"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                    {t.auth.termsCopyrightLabel}
                  </span>
                  <span className="text-xs text-error font-medium">{t.auth.termsRequiredLabel}</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {t.auth.termsCopyrightDesc}
                </p>
              </div>
            </label>

            {/* 마케팅 수신 동의 (선택) */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToMarketing}
                  onChange={(e) => setAgreedToMarketing(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-white/30 bg-background-primary transition-all checked:border-accent-warm checked:bg-accent-warm hover:border-accent-warm/50"
                />
                <svg
                  className="pointer-events-none absolute h-3 w-3 text-background-primary opacity-0 peer-checked:opacity-100 transition-opacity"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                    {t.auth.termsMarketingLabel}
                  </span>
                  <span className="text-xs text-text-muted">{t.auth.termsOptionalLabel}</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {t.auth.termsMarketingDesc}
                </p>
              </div>
            </label>
          </div>

          {error && <p className="text-center text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent-warm py-4 font-bold text-background-primary transition-all hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {t.auth.processingText}
              </span>
            ) : t.auth.setPasswordTitle}
          </button>
        </form>

        <p className="mt-6 md:mt-8 text-center text-sm text-text-muted">
          {t.auth.hasAccount}{' '}
          <Link href="/login" className="font-medium text-accent-warm hover:underline">
            {t.common.login}
          </Link>
        </p>
      </div>
    </div>
  );
}

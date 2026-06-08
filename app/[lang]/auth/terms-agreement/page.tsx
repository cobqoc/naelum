'use client';

import { localDateISO } from '@/lib/date/localDate';

import { useState, useEffect } from 'react';
import Link from '@/components/Common/LocalizedLink';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import { checkMinAge } from '@/lib/auth/ageGate';

const OnboardingWizard = dynamic(
  () => import('@/components/Onboarding/OnboardingWizard'),
  { ssr: false }
);

export default function TermsAgreementPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [provider, setProvider] = useState<'google' | 'kakao' | 'email'>('google');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToCopyright, setAgreedToCopyright] = useState(false);
  const [agreedToMarketing, setAgreedToMarketing] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // 세션 확인 — 데이터 계층 이전(docs/DATA_LAYER.md): getUser + profile read → GET /api/auth/onboarding-status.
  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch('/api/auth/onboarding-status');
      if (!res.ok) {
        // 미인증(401) 등 → 회원가입 페이지로
        router.push('/signup');
        return;
      }
      const { onboardingCompleted, authProvider, email } = await res.json();

      // 이미 온보딩 완료한 사용자는 홈으로
      if (onboardingCompleted) {
        router.push('/');
        return;
      }

      // 프로필이 없거나(신규) onboarding_completed: false인 경우 → 약관 동의 필요
      setEmail(email || '');
      setProvider(authProvider || 'google');
      setChecking(false);
    };

    checkSession();
  }, [router]);

  const handleCancel = async () => {
    if (cancelling || loading) return;
    if (!window.confirm(t.auth.termsCancelConfirm)) return;

    setCancelling(true);
    setError('');
    try {
      const res = await fetch('/api/auth/cancel-signup', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('cancel-signup failed:', body);
        setError(t.auth.processErrorText);
        setCancelling(false);
        return;
      }
      // 세션 쿠키를 완전히 비우기 위해 full reload
      window.location.href = '/signup';
    } catch (err) {
      console.error('cancel-signup error:', err);
      setError(t.auth.processErrorText);
      setCancelling(false);
    }
  };

  const handleAgree = async () => {
    if (!agreedToTerms || !agreedToPrivacy || !agreedToCopyright) {
      setError(t.auth.termsRequired);
      return;
    }

    // 연령 gate — 글로벌 safe 16세
    if (!birthDate) {
      setError(t.auth.birthDateRequired);
      return;
    }
    const { meetsMinimum } = checkMinAge(birthDate);
    if (!meetsMinimum) {
      setError(t.auth.ageGateError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 데이터 계층 이전(docs/DATA_LAYER.md): 존재확인 read + createProfile/beginOnboarding
      // mutation → POST /api/auth/complete-onboarding (서버가 upsert). OAuth 가입이라 온보딩 미완.
      const res = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authProvider: provider,
          marketingConsent: agreedToMarketing,
          birthDate,
          onboardingCompleted: false,
          onboardingStep: 0,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('complete-onboarding failed:', body);
        setError(body.error === 'age_gate' ? t.auth.ageGateError : t.auth.processErrorText);
        setLoading(false);
        return;
      }

      // 세션 갱신 → auth context에서 profile 재조회 (드롭다운에 사용자 정보 표시)
      await supabase.auth.refreshSession();

      // 온보딩 모달 표시
      setShowOnboardingModal(true);
      setLoading(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(t.auth.processErrorText);
      setLoading(false);
    }
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
        <div className="mb-8 md:mb-10 text-center">
          <span className="text-2xl md:text-3xl font-bold tracking-tighter text-accent-warm">
            낼름
          </span>
        </div>

        <h1 className="mb-2 text-xl md:text-2xl font-bold text-text-primary text-center">
          {t.auth.termsTitle} 🎉
        </h1>
        <p className="mb-6 md:mb-8 text-sm text-text-muted text-center">
          {t.auth.termsSubtitle}
        </p>

        {/* 인증 완료 표시 */}
        <div className="mb-6 rounded-xl bg-success/10 p-4 text-center">
          <p className="text-sm text-success flex items-center justify-center gap-2">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {provider === 'google' ? 'Google' : provider === 'kakao' ? 'Kakao' : t.auth.email} {t.auth.authVerifiedColon} <span className="font-medium">{email}</span>
          </p>
        </div>

        {/* 생년월일 — 연령 gate (글로벌 safe 16세) */}
        <div className="space-y-1.5 mb-5">
          <label className="text-sm font-medium text-text-secondary">
            {t.auth.birthDateLabel} <span className="text-error">*</span>
          </label>
          <InputBoxWrapper className="!bg-background-primary !rounded-xl !px-4 !py-3">
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={localDateISO()}
              className={INPUT_INNER_COMFORTABLE_CLASS}
              style={INPUT_INNER_STYLE}
              required
            />
          </InputBoxWrapper>
          <p className="text-[11px] text-text-muted">
            {t.auth.ageGateNotice}
          </p>
        </div>

        {/* 약관 동의 */}
        <div className="space-y-4 mb-6">
          {/* 전체 동의 */}
          <label className="flex items-center gap-3 cursor-pointer pb-3 border-b border-white/10">
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

        {error && <p className="mb-4 text-center text-sm text-error">{error}</p>}

        <button
          onClick={handleAgree}
          disabled={loading || cancelling}
          className="w-full rounded-xl bg-accent-warm py-4 font-bold text-background-primary transition-all hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t.auth.processingText}
            </span>
          ) : t.auth.termsAgreeCta}
        </button>

        <button
          onClick={handleCancel}
          disabled={loading || cancelling}
          className="mt-3 w-full rounded-xl border border-white/10 bg-transparent py-3 text-sm text-text-muted transition-all hover:border-error/40 hover:text-error disabled:opacity-50"
        >
          {cancelling ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t.auth.processingText}
            </span>
          ) : t.auth.termsCancelCta}
        </button>

        <p className="mt-6 text-center text-xs text-text-muted">
          {t.auth.termsNotice}
        </p>
      </div>

      {/* 온보딩 모달 */}
      {showOnboardingModal && (
        <OnboardingWizard
          isOpen={showOnboardingModal}
          onClose={() => {
            // "나중에 하기" 클릭 시 홈으로 이동
            router.push('/');
          }}
          onComplete={() => {
            router.push('/');
          }}
        />
      )}
    </div>
  );
}

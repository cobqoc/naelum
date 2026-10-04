'use client';

import { useState, useEffect } from 'react';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import AuthCheckingScreen from '@/components/Auth/AuthCheckingScreen';
import BirthDateField from '@/components/Auth/BirthDateField';
import ConsentCheckboxes from '@/components/Auth/ConsentCheckboxes';
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
  // 세션 확인 요청 자체가 실패(네트워크 오류·비 JSON 응답)했을 때의 오류 화면 + 재시도 (2026-10-04 PAU-62)
  const [checkFailed, setCheckFailed] = useState(false);
  const [checkAttempt, setCheckAttempt] = useState(0);

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

    checkSession().catch((err) => {
      // 예전엔 처리 없이 reject 되어 '확인 중…' 스피너에서 영구 정지했다 (2026-10-04 PAU-62).
      // 가입 수단(provider)을 모르는 채 폼을 열면 잘못된 auth_provider 로 프로필이 생길 수 있어
      // 폼 대신 오류 안내 + 재시도(checkAttempt 증가 → 이 effect 재실행).
      console.error('onboarding-status error:', err);
      setCheckFailed(true);
    });
  }, [router, checkAttempt]);

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

  if (checkFailed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary px-4 md:px-6 py-8 md:py-12">
        <div className="w-full max-w-md rounded-2xl md:rounded-3xl bg-background-secondary p-6 md:p-10 shadow-2xl border border-white/5 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="mb-2 text-xl md:text-2xl font-bold text-text-primary">
            {t.auth.processErrorText}
          </h1>
          <p className="mb-6 text-sm text-text-muted">
            {t.auth.tryAgainLater}
          </p>
          <button
            onClick={() => {
              setCheckFailed(false);
              setCheckAttempt((n) => n + 1);
            }}
            className="w-full rounded-xl bg-accent-warm py-4 font-bold text-background-primary transition-all hover:bg-accent-hover"
          >
            {t.common.retry}
          </button>
        </div>
      </div>
    );
  }

  if (checking) {
    return <AuthCheckingScreen label={t.auth.checking} />;
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

        {/* 생년월일 — 연령 gate (글로벌 safe 16세). components/Auth/BirthDateField (2026-10-04 PAU-15) */}
        <BirthDateField
          t={t}
          value={birthDate}
          setValue={setBirthDate}
          wrapperClassName="space-y-1.5 mb-5"
          boxClassName="!bg-background-primary !rounded-xl !px-4 !py-3"
        />

        {/* 약관 동의 — components/Auth/ConsentCheckboxes (2026-10-04 PAU-15, 마크업 동일·상태는 이 페이지 소유) */}
        <ConsentCheckboxes
          t={t}
          consents={{
            terms: { checked: agreedToTerms, set: setAgreedToTerms },
            privacy: { checked: agreedToPrivacy, set: setAgreedToPrivacy },
            copyright: { checked: agreedToCopyright, set: setAgreedToCopyright },
            marketing: { checked: agreedToMarketing, set: setAgreedToMarketing },
          }}
          containerClassName="space-y-4 mb-6"
          agreeAllPaddingClassName="pb-3"
        />

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

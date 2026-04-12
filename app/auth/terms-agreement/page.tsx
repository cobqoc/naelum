'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { createProfile, beginOnboarding } from '@/lib/auth/profile';

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
  const [agreedToMarketing, setAgreedToMarketing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // 로그인되지 않은 경우 회원가입 페이지로
        router.push('/signup');
        return;
      }

      // 프로필 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, auth_provider, email')
        .eq('id', user.id)
        .maybeSingle(); // single() 대신 maybeSingle() - 프로필이 없을 수 있음

      // 이미 온보딩 완료한 사용자는 홈으로
      if (profile?.onboarding_completed) {
        router.push('/');
        return;
      }

      // 프로필이 없거나(신규) onboarding_completed: false인 경우 → 약관 동의 필요
      setEmail(profile?.email || user.email || '');
      setProvider(profile?.auth_provider || 'google');
      setChecking(false);
    };

    checkSession();
  }, [router, supabase]);

  const handleAgree = async () => {
    if (!agreedToTerms || !agreedToPrivacy) {
      setError(t.auth.termsRequired);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError(t.auth.sessionExpiredRetry);
        setLoading(false);
        return;
      }

      // 프로필 존재 여부 확인
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        // 프로필이 없으면 생성 (Google/Kakao OAuth 신규 가입자)
        const { error: insertError } = await createProfile(supabase, {
          id: user.id,
          email: user.email!,
          authProvider: provider,
          onboardingCompleted: false,
          onboardingStep: 0,
        });
        if (insertError) {
          console.error('Profile insert error:', insertError);
          setError(t.auth.profileCreateError);
          setLoading(false);
          return;
        }
      }

      // 약관 동의 상태 업데이트 (마케팅 동의 포함)
      const { error: updateError } = await beginOnboarding(supabase, user.id, agreedToMarketing);
      if (updateError) {
        console.error('Profile update error:', updateError);
        setError(t.auth.profileUpdateError);
        setLoading(false);
        return;
      }

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
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {provider === 'google' ? 'Google' : provider === 'kakao' ? '카카오' : '이메일'} 인증 완료: <span className="font-medium">{email}</span>
          </p>
        </div>

        {/* 약관 동의 */}
        <div className="space-y-4 mb-6">
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
          disabled={loading}
          className="w-full rounded-xl bg-accent-warm py-4 font-bold text-background-primary transition-all hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t.auth.processingText}
            </span>
          ) : t.auth.termsAgreeCta}
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

'use client';

import { useState, useEffect } from 'react';
import Link from '@/components/Common/LocalizedLink';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { createClient } from '@/lib/supabase/client';
import { translateError } from '@/lib/i18n/errorMessages';
import { getPasswordStrength } from '@/lib/utils/password';
import AuthCheckingScreen from '@/components/Auth/AuthCheckingScreen';
import { PasswordField, PasswordStrengthMeter, PasswordMatchHint } from '@/components/Auth/PasswordFields';
import BirthDateField from '@/components/Auth/BirthDateField';
import ConsentCheckboxes from '@/components/Auth/ConsentCheckboxes';
import { useI18n } from '@/lib/i18n/context';
import { checkMinAge } from '@/lib/auth/ageGate';

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

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(translateError(updateError, t));
      setLoading(false);
      return;
    }

    // 데이터 계층 이전(docs/DATA_LAYER.md): 존재확인 read + createProfile/beginOnboarding
    // mutation → POST /api/auth/complete-onboarding. onboardingCompleted 미전달 → createProfile
    // 기본값(email 신규 가입은 완료) / 기존 프로필은 beginOnboarding.
    const res = await fetch('/api/auth/complete-onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authProvider: 'email',
        marketingConsent: agreedToMarketing,
        birthDate,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error === 'age_gate' ? t.auth.ageGateError : t.auth.processErrorText);
      setLoading(false);
      return;
    }

    // 회원가입 완료 후 홈으로 이동
    router.push('/');
  };

  if (checking) {
    return <AuthCheckingScreen label={t.auth.checking} />;
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
          {/* 비밀번호 입력·확인 블록 — components/Auth/PasswordFields 로 공용화 (2026-10-04 PAU-14, 마크업 동일) */}
          <PasswordField
            label={t.auth.password}
            value={password}
            setValue={setPassword}
            show={showPassword}
            setShow={setShowPassword}
            boxClassName="!bg-background-tertiary !rounded-xl !px-5 !py-3.5"
            placeholder={t.auth.passwordPlaceholder}
          >
            <PasswordStrengthMeter strength={strength} t={t} />
          </PasswordField>

          <PasswordField
            label={t.auth.confirmPassword}
            value={confirmPassword}
            setValue={setConfirmPassword}
            show={showConfirmPassword}
            setShow={setShowConfirmPassword}
            boxClassName={`!bg-background-tertiary !rounded-xl !px-5 !py-3.5 ${confirmPassword && password !== confirmPassword ? '!ring-error' : ''}`}
            placeholder={t.auth.confirmPassword}
          >
            <PasswordMatchHint password={password} confirm={confirmPassword} t={t} />
          </PasswordField>

          {/* 생년월일 — 연령 gate (글로벌 safe 16세 기준). components/Auth/BirthDateField (2026-10-04 PAU-15) */}
          <BirthDateField
            t={t}
            value={birthDate}
            setValue={setBirthDate}
            wrapperClassName="space-y-1.5"
            boxClassName="!bg-background-secondary !rounded-xl !px-4 !py-3"
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
            containerClassName="pt-2 space-y-3"
            agreeAllPaddingClassName="pb-2"
          />

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
          <Link href="/signin" className="font-medium text-accent-warm hover:underline">
            {t.common.login}
          </Link>
        </p>
      </div>
    </div>
  );
}

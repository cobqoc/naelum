'use client';

import { useState, useEffect, useRef } from 'react';
import Link from '@/components/Common/LocalizedLink';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { createClient } from '@/lib/supabase/client';
import { translateError } from '@/lib/i18n/errorMessages';
import { getPasswordStrength } from '@/lib/utils/password';
import AuthCheckingScreen from '@/components/Auth/AuthCheckingScreen';
import { PasswordField, PasswordStrengthMeter, PasswordMatchHint } from '@/components/Auth/PasswordFields';
import { useI18n } from '@/lib/i18n/context';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);

  // 세션 확인 (리셋 링크 클릭 시 Supabase가 자동으로 세션 생성)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // 세션이 없으면 로그인 페이지로
        setChecking(false);
        setValidSession(false);
        return;
      }

      setValidSession(true);
      setChecking(false);
    };

    // Supabase Auth 이벤트 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string) => {
        if (event === 'PASSWORD_RECOVERY') {
          setValidSession(true);
          setChecking(false);
        }
      }
    );

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 성공 후 3초 뒤 로그인 이동 타이머 — 언마운트(사용자가 먼저 '로그인 페이지로' 이동 등) 시 정리하고,
  // 언마운트 뒤에 끝난 요청은 예약하지 않는다. 예전엔 정리하지 않아 다른 화면에서 3초 뒤 다시
  // /signin 으로 끌려갔다 (2026-10-04 PAU-59). 화면에 머무는 정상 흐름의 이동 시점은 동일.
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const strength = getPasswordStrength(password);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setError(t.auth.passwordMinLength);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
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

    setSuccess(true);
    setLoading(false);

    // 3초 후 로그인 페이지로 이동
    if (!unmountedRef.current) {
      redirectTimerRef.current = setTimeout(() => {
        router.push('/signin');
      }, 3000);
    }
  };

  if (checking) {
    return <AuthCheckingScreen label={t.auth.checking} />;
  }

  if (!validSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary px-4 md:px-6 py-8 md:py-12">
        <div className="w-full max-w-md rounded-2xl md:rounded-3xl bg-background-secondary p-6 md:p-10 shadow-2xl border border-white/5 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="mb-2 text-xl md:text-2xl font-bold text-text-primary">
            {t.auth.linkExpired}
          </h1>
          <p className="mb-6 text-sm text-text-muted">
            {t.auth.linkExpiredDesc}
          </p>
          <Link
            href="/signin"
            className="inline-block w-full rounded-xl bg-accent-warm py-4 font-bold text-background-primary transition-all hover:bg-accent-hover"
          >
            {t.auth.goToLoginPage}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary px-4 md:px-6 py-8 md:py-12">
        <div className="w-full max-w-md rounded-2xl md:rounded-3xl bg-background-secondary p-6 md:p-10 shadow-2xl border border-white/5 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-6">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="mb-2 text-xl md:text-2xl font-bold text-text-primary">
            {t.auth.passwordChanged}
          </h1>
          <p className="mb-6 text-sm text-text-muted">
            {t.auth.loginAfterChange}<br />
            {t.auth.autoMoveNext}...
          </p>
          <Link
            href="/signin"
            className="inline-block w-full rounded-xl bg-accent-warm py-4 font-bold text-background-primary transition-all hover:bg-accent-hover"
          >
            {t.auth.goToLoginPage}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary px-4 md:px-6 py-8 md:py-12">
      <div className="w-full max-w-md rounded-2xl md:rounded-3xl bg-background-secondary p-6 md:p-10 shadow-2xl border border-white/5">
        <h1 className="mb-2 text-xl md:text-2xl font-bold text-text-primary">{t.auth.resetPasswordTitle}</h1>
        <p className="mb-6 md:mb-8 text-sm text-text-muted">
          {t.auth.resetPasswordNewDesc}
        </p>

        <form onSubmit={handleResetPassword} className="space-y-6">
          {/* 비밀번호 입력·확인 블록 — components/Auth/PasswordFields 로 공용화 (2026-10-04 PAU-14, 마크업 동일) */}
          <PasswordField
            label={t.auth.newPassword}
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
          >
            <PasswordMatchHint password={password} confirm={confirmPassword} t={t} />
          </PasswordField>

          {error && <p className="text-center text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent-warm py-4 font-bold text-background-primary transition-all hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {t.auth.changingPassword}
              </span>
            ) : t.auth.changePassword}
          </button>
        </form>

        <p className="mt-6 md:mt-8 text-center text-sm text-text-muted">
          <Link href="/signin" className="font-medium text-accent-warm hover:underline">
            {t.auth.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  );
}

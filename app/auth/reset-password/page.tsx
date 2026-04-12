'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { translateError } from '@/lib/i18n/errorMessages';
import { getPasswordStrength } from '@/lib/utils/password';
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
      setError(translateError(updateError));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // 3초 후 로그인 페이지로 이동
    setTimeout(() => {
      router.push('/login');
    }, 3000);
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
            href="/login"
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
            href="/login"
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
          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">{t.auth.newPassword} *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-background-tertiary px-5 py-3.5 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
                placeholder={t.auth.passwordPlaceholder}
                autoComplete="new-password"
                required
              />
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
            <p className="text-[10px] text-text-muted italic">{t.auth.passwordHint}</p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">{t.auth.confirmPassword} *</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full rounded-xl bg-background-tertiary px-5 py-3.5 text-text-primary outline-none ring-1 transition-all focus:ring-2 ${
                  confirmPassword && password !== confirmPassword ? 'ring-error' : 'ring-white/10 focus:ring-2 focus:ring-accent-warm'
                }`}
                autoComplete="new-password"
                required
              />
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
          <Link href="/login" className="font-medium text-accent-warm hover:underline">
            {t.auth.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  );
}

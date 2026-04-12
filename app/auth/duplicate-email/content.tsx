'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

interface Props {
  email: string;
  originalProvider: string;
}

export function DuplicateEmailContent({ email, originalProvider }: Props) {
  const { t } = useI18n();

  const getProviderMessage = () => {
    if (originalProvider === 'email') {
      return {
        description: t.auth.registeredWithEmail,
        action: t.auth.loginWithPassword,
      };
    } else if (originalProvider === 'google') {
      return {
        description: t.auth.registeredWithGoogle,
        action: t.auth.useGoogleLogin,
      };
    } else if (originalProvider === 'kakao') {
      return {
        description: t.auth.registeredWithKakao,
        action: t.auth.loginWithKakaoAction,
      };
    } else {
      return {
        description: t.auth.registeredWithOther,
        action: t.auth.loginWithOther,
      };
    }
  };

  const providerInfo = getProviderMessage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary px-4 md:px-6 py-8 md:py-12">
      <div className="w-full max-w-md rounded-2xl md:rounded-3xl bg-background-secondary p-6 md:p-10 shadow-2xl border border-white/5">
        <div className="mb-8 md:mb-10 text-center">
          <Link href="/" className="text-2xl md:text-3xl font-bold tracking-tighter text-accent-warm">
            낼름
          </Link>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <h1 className="mb-3 text-xl md:text-2xl font-bold text-text-primary text-center">
          {t.auth.duplicateEmailTitle}
        </h1>

        <p className="mb-6 text-sm md:text-base text-text-secondary text-center">
          <span className="font-medium text-accent-warm">{email}</span>
          <br />
          계정이 이미 존재합니다.
        </p>

        <div className="mb-8 rounded-xl bg-warning/10 border border-warning/30 p-4">
          <div className="flex gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="text-sm text-text-primary">
              <p className="font-bold text-warning mb-2">{providerInfo.description}</p>
              <p className="text-text-secondary mb-3">{providerInfo.action}</p>
              <div className="rounded-lg bg-background-tertiary p-3 mt-3">
                <p className="text-xs text-text-muted">
                  <strong>{t.auth.securityNoticeTitle}</strong> {t.auth.securityNoticeDesc}
                  {originalProvider === 'email' && ` ${t.auth.emailPasswordSecurityNote}`}
                  {originalProvider === 'google' && ` ${t.auth.googleSecurityNote}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <details className="mb-6 rounded-xl bg-info/10 border border-info/20 p-4">
          <summary className="cursor-pointer text-sm font-medium text-info flex items-center gap-2">
            <span>💡</span>
            <span>{t.auth.forgotSignupMethod}</span>
          </summary>
          <div className="mt-3 text-sm text-text-secondary">
            <ul className="space-y-1.5 ml-2">
              <li className="flex items-start gap-2">
                <span className="text-accent-warm">•</span>
                <span>{t.auth.dupEmailHint1}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-warm">•</span>
                <span>{t.auth.dupEmailHint2}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-warm">•</span>
                <span>{t.auth.dupEmailHint3}</span>
              </li>
            </ul>
          </div>
        </details>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-xl bg-accent-warm py-4 font-bold text-background-primary text-center transition-all hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(255,153,102,0.4)] active:scale-[0.98]"
          >
            {t.auth.goToLoginPage}
          </Link>

          <Link
            href="/signup"
            className="block w-full rounded-xl border border-white/10 bg-white/5 py-4 font-medium text-text-primary text-center transition-all hover:bg-white/10 active:scale-[0.98]"
          >
            {t.auth.useAnotherEmail}
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-muted mb-2">{t.auth.accountIssue}</p>
          <Link href="/login?action=reset-password" className="text-sm font-medium text-accent-warm hover:underline">
            {t.auth.findPassword}
          </Link>
        </div>
      </div>
    </div>
  );
}

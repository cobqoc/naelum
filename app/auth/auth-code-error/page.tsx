'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

export default function AuthCodeErrorPage() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary px-6 py-12">
      <div className="w-full max-w-md rounded-3xl bg-background-secondary p-10 text-center shadow-2xl border border-white/5">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <svg
              className="h-8 w-8 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-text-primary">
          {t.auth.authError}
        </h1>

        <p className="mb-8 text-text-secondary">
          {t.auth.authErrorDesc}
          <br />
          {t.auth.tryAgainLater}
        </p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-xl bg-accent-warm py-3.5 font-bold text-background-primary transition-all hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(255,153,102,0.4)]"
          >
            {t.auth.retryLogin}
          </Link>

          <Link
            href="/"
            className="block w-full rounded-xl border border-white/10 bg-white/5 py-3.5 font-medium text-text-primary transition-all hover:bg-white/10"
          >
            {t.auth.goToHome}
          </Link>
        </div>

        <p className="mt-8 text-xs text-text-muted">
          {t.auth.contactSupportText}{' '}
          <a href="mailto:hello@naelum.app" className="text-accent-warm hover:underline">
            hello@naelum.app
          </a>
        </p>
      </div>
    </div>
  );
}

'use client';

// [lang]/error.tsx — I18nProvider 안쪽에 위치하므로 useI18n 사용 가능.
// app/error.tsx는 I18nProvider 바깥이라 useI18n 호출 시 throw됨 → 진짜 에러 메시지가 가려짐.
// 이 파일이 우선 적용되어 [lang] 하위 라우트의 에러를 i18n 형태로 표시.

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Link from '@/components/Common/LocalizedLink';
import { useI18n } from '@/lib/i18n/context';

const TITLES: Record<string, string> = {
  ko: '문제가 발생했습니다',
  en: 'Something went wrong',
  ja: '問題が発生しました',
  zh: '出现问题',
  es: 'Algo salió mal',
  fr: 'Une erreur est survenue',
  de: 'Etwas ist schiefgelaufen',
  it: 'Qualcosa è andato storto',
};

export default function LangError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, language } = useI18n();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // 개발 환경에서만 raw error 표시 — 프로덕션에선 깔끔한 fallback
  const isDev = process.env.NODE_ENV !== 'production';
  const title = TITLES[language] ?? TITLES.ko;

  return (
    <div className="min-h-screen bg-background-primary text-text-primary flex items-center justify-center px-4">
      <div className="text-center max-w-2xl w-full">
        <div className="text-6xl mb-4">😵</div>
        <h1 className="text-2xl font-bold mb-3">{title}</h1>
        <p className="text-text-muted mb-6">
          {isDev ? error.message : ''}
        </p>

        {isDev && error.message && (
          <pre className="text-left text-xs text-text-muted whitespace-pre-wrap bg-background-secondary p-3 rounded-xl mb-6 max-h-64 overflow-auto">
{error.name}: {error.message}
{error.digest ? `\ndigest: ${error.digest}` : ''}
          </pre>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-colors"
          >
            {t.common.confirm}
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-background-secondary border border-white/10 font-bold hover:bg-background-tertiary transition-colors"
          >
            {t.common.home}
          </Link>
        </div>
      </div>
    </div>
  );
}

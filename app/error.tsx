'use client';

import { useEffect } from 'react';
import Link from '@/components/Common/LocalizedLink';
import * as Sentry from '@sentry/nextjs';

type ErrorMessages = {
  title: string;
  description: string;
  retry: string;
  goHome: string;
};

const messages: Record<string, ErrorMessages> = {
  ko: { title: '문제가 발생했습니다', description: '예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.', retry: '다시 시도', goHome: '홈으로 돌아가기' },
  en: { title: 'Something went wrong', description: 'An unexpected error occurred. Please try again.', retry: 'Try again', goHome: 'Go home' },
  ja: { title: '問題が発生しました', description: '予期しないエラーが発生しました。もう一度お試しください。', retry: '再試行', goHome: 'ホームへ戻る' },
  zh: { title: '出现问题', description: '发生了意外错误。请重试。', retry: '重试', goHome: '返回首页' },
  es: { title: 'Algo salió mal', description: 'Ocurrió un error inesperado. Inténtalo de nuevo.', retry: 'Reintentar', goHome: 'Ir al inicio' },
  fr: { title: 'Une erreur est survenue', description: 'Une erreur inattendue s\'est produite. Veuillez réessayer.', retry: 'Réessayer', goHome: 'Retour à l\'accueil' },
  de: { title: 'Etwas ist schiefgelaufen', description: 'Ein unerwarteter Fehler ist aufgetreten. Bitte erneut versuchen.', retry: 'Erneut versuchen', goHome: 'Zur Startseite' },
  it: { title: 'Qualcosa è andato storto', description: 'Si è verificato un errore imprevisto. Riprova.', retry: 'Riprova', goHome: 'Vai alla home' },
};

// 루트 에러 바운더리는 I18nProvider *바깥*에서 렌더되므로 useI18n() 을 호출하면
// "useI18n must be used within an I18nProvider" 로 자기 자신이 throw → 흰 화면 +
// 진짜 에러 은폐. 그래서 context 없이 URL 경로(/ko, /en…)에서 직접 언어를 감지한다.
// (path-based 라우팅이라 첫 세그먼트가 locale. fallback: <html lang> → 브라우저 → ko)
function resolveLanguage(): string {
  if (typeof window !== 'undefined') {
    const seg = window.location.pathname.split('/')[1]?.toLowerCase();
    if (seg && seg in messages) return seg;
    const htmlLang = document.documentElement.lang?.toLowerCase();
    if (htmlLang && htmlLang in messages) return htmlLang;
    const nav = navigator.language?.split('-')[0]?.toLowerCase();
    if (nav && nav in messages) return nav;
  }
  return 'ko';
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const t = messages[resolveLanguage()] ?? messages.ko;

  return (
    <div className="min-h-screen bg-background-primary text-text-primary flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">😵</div>
        <h1 className="text-2xl font-bold mb-3">{t.title}</h1>
        <p className="text-text-muted mb-8">
          {t.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-colors"
          >
            {t.retry}
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-background-secondary border border-white/10 font-bold hover:bg-background-tertiary transition-colors"
          >
            {t.goHome}
          </Link>
        </div>
      </div>
    </div>
  );
}

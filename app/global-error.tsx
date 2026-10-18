'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { captureException } from '@/lib/sentry/captureException';

const messages = {
  ko: {
    title: '심각한 오류가 발생했습니다',
    description: '예기치 않은 오류가 발생했습니다.',
    retry: '다시 시도',
  },
  en: {
    title: 'A critical error occurred',
    description: 'An unexpected error occurred.',
    retry: 'Try again',
  },
};

const noopSubscribe = () => () => {};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  // I18nProvider 바깥(루트 레이아웃까지 실패한 경우)이라 경로의 언어 세그먼트로 고른다. ko 외에는 영어(2026-10-04 — 예전엔 항상 ko).
  // 서버 스냅샷은 ko → 하이드레이션 불일치 없이 클라이언트에서 실제 경로 값으로 갱신.
  const lang = useSyncExternalStore(
    noopSubscribe,
    () => window.location.pathname.split('/')[1] ?? 'ko',
    () => 'ko',
  );
  const t = lang === 'ko' || !lang ? messages.ko : messages.en;
  // 원문 에러 메시지는 개발 환경에서만 — 프로덕션에선 내부 정보가 노출되지 않게 일반 안내(같은 정책의 [lang]/error.tsx 와 일치).
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <html lang="ko">
      <body style={{ backgroundColor: '#1a1a1a', color: '#e8e8e8', margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>😵</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
              {t.title}
            </h1>
            <p style={{ color: '#888888', marginBottom: '2rem' }}>
              {(isDev && error.message) || t.description}
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                backgroundColor: '#ff9966',
                color: '#1a1a1a',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              {t.retry}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

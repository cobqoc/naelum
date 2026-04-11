'use client';

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

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = messages.ko;

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
              {error.message || t.description}
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

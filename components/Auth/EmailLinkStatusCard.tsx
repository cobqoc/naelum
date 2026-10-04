import type { ReactNode } from 'react';
import type { TranslationKeys } from '@/lib/i18n/locales';

/**
 * 이메일 링크 처리 화면의 상태 카드(확인 중 / 성공 / 실패) — 순수 표현 (2026-10-04 PAU-16).
 * auth/verify ↔ auth/reset-password-verify 에 복제돼 있던 카드 틀·로딩 블록·실패 블록을 1벌로.
 * 성공 본문과 실패 버튼(라벨·이동)만 화면별로 받는다. 마크업은 원본과 바이트 단위로 같다(하네스 확인).
 */
interface EmailLinkStatusCardProps {
  status: 'loading' | 'success' | 'error';
  t: TranslationKeys;
  successTitle: string;
  /** 성공 제목 아래 본문(안내 문구·버튼) */
  successBody: ReactNode;
  /** 실패 안내 문구(호출처가 기본 문구 대체까지 결정) */
  errorMessage: string;
  errorActionLabel: string;
  onErrorAction: () => void;
}

export default function EmailLinkStatusCard({
  status,
  t,
  successTitle,
  successBody,
  errorMessage,
  errorActionLabel,
  onErrorAction,
}: EmailLinkStatusCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary px-4">
      <div className="w-full max-w-md rounded-2xl bg-background-secondary p-8 shadow-2xl border border-white/5 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-accent-warm/20 flex items-center justify-center mb-6">
              <span className="w-8 h-8 border-3 border-accent-warm border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">
              {t.auth.verifying}
            </h1>
            <p className="text-text-secondary text-sm">
              {t.auth.pleaseWait}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-6">
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">
              {successTitle}
            </h1>
            {successBody}
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mb-6">
              <span className="text-3xl">✗</span>
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">
              {t.auth.authFailed}
            </h1>
            <p className="text-text-secondary text-sm mb-4">
              {errorMessage}
            </p>
            <button
              onClick={onErrorAction}
              className="w-full rounded-xl bg-accent-warm py-3 font-bold text-background-primary transition-all hover:bg-accent-hover"
            >
              {errorActionLabel}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

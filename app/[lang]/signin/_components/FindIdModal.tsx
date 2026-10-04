import type { TranslationKeys } from '@/lib/i18n/translations';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import AuthModalShell, { SuccessCheckCircle } from './AuthModalShell';

/**
 * 아이디(이메일) 찾기 모달 — 순수 표현.
 *
 * god-file(login/page) 분해 Phase 2 후속. 상태·ref·async(handleFindId)는
 * 부모(LoginContent) 소유 — 값+콜백만. JSX·className 원본과 byte-identical →
 * 행위 변경 0. onClose=원본 4-state 리셋, onGoToReset=리셋+비번찾기 모달 열기
 * (부모가 동일 본문 보존). 회귀 가드: e2e/signin-decomposition.spec.ts.
 * 2026-10-04 (PAU-68): 모달 셸·완료 체크 아이콘은 ./AuthModalShell 공용 — 마크업 동일.
 */

interface FindIdModalProps {
  t: TranslationKeys;
  findIdInputRef: React.RefObject<HTMLInputElement | null>;
  findIdUsername: string;
  setFindIdUsername: (v: string) => void;
  findIdResult: string;
  findIdError: string;
  findIdLoading: boolean;
  onFindId: () => void;
  onClose: () => void;
  onGoToReset: () => void;
}

export default function FindIdModal({
  t,
  findIdInputRef,
  findIdUsername,
  setFindIdUsername,
  findIdResult,
  findIdError,
  findIdLoading,
  onFindId,
  onClose,
  onGoToReset,
}: FindIdModalProps) {
  return (
    <AuthModalShell title={t.auth.findId} onClose={onClose}>
      <div className="space-y-4">
        {!findIdResult ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                {t.auth.findIdUsername}
              </label>
              <InputBoxWrapper className="!bg-background-tertiary !rounded-xl !px-4 !py-3">
                <input
                  ref={findIdInputRef}
                  type="text"
                  value={findIdUsername}
                  onChange={(e) => setFindIdUsername(e.target.value)}
                  placeholder={t.auth.findIdUsernamePlaceholder}
                  autoComplete="username"
                  onKeyDown={(e) => e.key === 'Enter' && onFindId()}
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                />
              </InputBoxWrapper>
              {findIdError && (
                <p className="text-sm text-error mt-1">{findIdError}</p>
              )}
            </div>

            <button
              onClick={onFindId}
              disabled={findIdLoading}
              className="w-full py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover disabled:opacity-50 transition-all"
            >
              {findIdLoading ? t.auth.findIdSearching : t.auth.findIdSearch}
            </button>

            <div className="p-4 rounded-xl bg-background-tertiary">
              <p className="text-sm text-text-muted mb-3">{t.auth.forgotEmail}</p>
              <ul className="text-sm text-text-secondary space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-accent-warm">•</span>
                  <span>{t.auth.tryCommonEmail}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-warm">•</span>
                  <span>{t.auth.useGoogleLogin}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-warm">•</span>
                  <span>{t.auth.searchInbox}</span>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="space-y-4 text-center">
            <SuccessCheckCircle />

            <div>
              <p className="text-sm text-text-secondary mb-2">
                {t.auth.findIdResultLabel}
              </p>
              <p className="text-lg font-bold text-accent-warm break-all">{findIdResult}</p>
              <p className="text-sm text-text-secondary mt-3">
                {t.auth.findIdSuccessDesc}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-all"
            >
              {t.common.confirm}
            </button>
            <button
              onClick={onGoToReset}
              className="w-full py-2.5 rounded-xl border border-white/10 text-sm text-text-muted hover:text-text-secondary transition-all"
            >
              {t.auth.findPassword}
            </button>
          </div>
        )}
      </div>
    </AuthModalShell>
  );
}

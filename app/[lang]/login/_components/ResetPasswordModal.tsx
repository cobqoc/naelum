import type { TranslationKeys } from '@/lib/i18n/translations';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';

/**
 * 비밀번호 재설정 모달 (4스텝: 이메일→발송완료→새비번→완료) — 순수 표현.
 *
 * god-file(login/page) 분해 Phase 2 후속. 모든 상태·ref·async(handleReset
 * Password·handleUpdatePassword)·BroadcastChannel 리스너·passwordStrength
 * 계산은 부모(LoginContent) 소유 — 값+콜백만. JSX·className·스텝 분기 원본과
 * byte-identical → 행위 변경 0. 회귀 가드: e2e/login-decomposition.spec.ts.
 */

interface ResetPasswordModalProps {
  t: TranslationKeys;
  resetEmailInputRef: React.RefObject<HTMLInputElement | null>;
  resetEmail: string;
  setResetEmail: (v: string) => void;
  resetEmailError: string;
  setResetEmailError: (v: string) => void;
  resetLoading: boolean;
  resetSuccess: boolean;
  resetReady: boolean;
  passwordUpdateSuccess: boolean;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmNewPassword: string;
  setConfirmNewPassword: (v: string) => void;
  showNewPassword: boolean;
  setShowNewPassword: (v: boolean) => void;
  showConfirmNewPassword: boolean;
  setShowConfirmNewPassword: (v: boolean) => void;
  newPasswordError: string;
  updatingPassword: boolean;
  passwordStrength: number;
  onResetPassword: () => void;
  onUpdatePassword: () => void;
  onClose: () => void;
}

export default function ResetPasswordModal({
  t,
  resetEmailInputRef,
  resetEmail,
  setResetEmail,
  resetEmailError,
  setResetEmailError,
  resetLoading,
  resetSuccess,
  resetReady,
  passwordUpdateSuccess,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmNewPassword,
  setShowConfirmNewPassword,
  newPasswordError,
  updatingPassword,
  passwordStrength,
  onResetPassword,
  onUpdatePassword,
  onClose,
}: ResetPasswordModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-background-secondary p-6 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text-primary">{t.auth.findPassword}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step 1: 이메일 입력 */}
        {!resetSuccess && !resetReady && !passwordUpdateSuccess && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {t.auth.resetPasswordDesc}
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">{t.auth.email}</label>
              <InputBoxWrapper className={`!bg-background-tertiary !rounded-xl !px-4 !py-3 ${resetEmailError ? '!ring-error' : ''}`}>
                <input
                  ref={resetEmailInputRef}
                  type="email"
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    setResetEmailError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && onResetPassword()}
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                  placeholder="example@email.com"
                  autoComplete="email"
                />
              </InputBoxWrapper>
              {resetEmailError && <p className="text-xs text-error">{resetEmailError}</p>}
            </div>

            <button
              onClick={onResetPassword}
              disabled={resetLoading}
              className="w-full py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover disabled:opacity-50 transition-all"
            >
              {resetLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t.auth.sendingEmail}
                </span>
              ) : t.auth.getResetLink}
            </button>
          </div>
        )}

        {/* Step 2: 이메일 발송 완료, 인증 대기 */}
        {resetSuccess && !resetReady && !passwordUpdateSuccess && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent-warm/20 flex items-center justify-center">
              <span className="text-3xl">✉️</span>
            </div>

            <div>
              <p className="font-bold text-text-primary mb-2">{t.auth.checkEmail}</p>
              <p className="text-sm text-text-secondary">
                <span className="text-accent-warm font-medium">{resetEmail}</span>
                <br />{t.auth.resetLinkSent}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-accent-warm/10 text-sm text-text-primary flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
              {t.auth.autoNextStep}
            </div>

            <div className="p-3 rounded-xl bg-background-tertiary text-xs text-text-muted">
              {t.auth.emailNotVisible}
            </div>
          </div>
        )}

        {/* Step 3: 새 비밀번호 입력 */}
        {resetReady && !passwordUpdateSuccess && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-success/10 text-center">
              <p className="text-sm text-success">✓ {t.auth.verificationComplete}</p>
            </div>

            {/* 새 비밀번호 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">{t.auth.newPassword}</label>
              <div className="relative">
                <InputBoxWrapper className="!bg-background-tertiary !rounded-xl !px-4 !py-3">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${INPUT_INNER_COMFORTABLE_CLASS} pr-10`}
                    style={INPUT_INNER_STYLE}
                    placeholder={t.auth.minChars}
                  />
                </InputBoxWrapper>
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showNewPassword ? (
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
              {/* 비밀번호 강도 표시 */}
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i <= passwordStrength ? (passwordStrength <= 2 ? 'bg-warning' : 'bg-success') : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              {passwordStrength > 0 && (
                <p className={`text-[10px] text-right font-medium ${passwordStrength <= 2 ? 'text-warning' : 'text-success'}`}>
                  {passwordStrength === 1 ? t.auth.passwordStrengthWeak
                    : passwordStrength === 2 ? t.auth.passwordStrengthFair
                    : passwordStrength === 3 ? t.auth.passwordStrengthStrong
                    : t.auth.passwordStrengthVeryStrong}
                </p>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">{t.auth.confirmPassword}</label>
              <div className="relative">
                <InputBoxWrapper className={`!bg-background-tertiary !rounded-xl !px-4 !py-3 ${confirmNewPassword && newPassword !== confirmNewPassword ? '!ring-error' : ''}`}>
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className={`${INPUT_INNER_COMFORTABLE_CLASS} pr-10`}
                    style={INPUT_INNER_STYLE}
                  />
                </InputBoxWrapper>
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showConfirmNewPassword ? (
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
              {confirmNewPassword && newPassword === confirmNewPassword && (
                <p className="text-xs text-success">✓ {t.auth.passwordMatch}</p>
              )}
              {confirmNewPassword && newPassword !== confirmNewPassword && (
                <p className="text-xs text-error">✗ {t.auth.passwordMismatch}</p>
              )}
            </div>

            {newPasswordError && <p className="text-center text-sm text-error">{newPasswordError}</p>}

            <button
              onClick={onUpdatePassword}
              disabled={updatingPassword}
              className="w-full py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover disabled:opacity-50 transition-all"
            >
              {updatingPassword ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t.auth.changingPassword}
                </span>
              ) : t.auth.changePassword}
            </button>
          </div>
        )}

        {/* Step 4: 비밀번호 변경 완료 */}
        {passwordUpdateSuccess && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <p className="font-bold text-text-primary mb-2">{t.auth.passwordChanged}</p>
              <p className="text-sm text-text-secondary">
                {t.auth.loginWithNewPassword}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-all"
            >
              {t.auth.goToLogin}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import type { TranslationKeys } from '@/lib/i18n/translations';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import AuthModalShell, { SuccessCheckCircle } from './AuthModalShell';
import EyeIcon from '@/components/Auth/EyeIcon';
import { PasswordMatchHint } from '@/components/Auth/PasswordFields';

/**
 * 비밀번호 재설정 모달 (4스텝: 이메일→발송완료→새비번→완료) — 순수 표현.
 *
 * god-file(login/page) 분해 Phase 2 후속. 모든 상태·ref·async(handleReset
 * Password·handleUpdatePassword)·BroadcastChannel 리스너·passwordStrength
 * 계산은 부모(LoginContent) 소유 — 값+콜백만. JSX·className·스텝 분기 원본과
 * byte-identical → 행위 변경 0. 회귀 가드: e2e/signin-decomposition.spec.ts.
 * 2026-10-04: 모달 셸·완료 체크 아이콘은 ./AuthModalShell(PAU-68), 비밀번호 보기 아이콘·일치 힌트는
 * components/Auth(PAU-14) 공용 컴포넌트로 치환 — 마크업 동일(렌더 동등성 하네스 확인).
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
    <AuthModalShell title={t.auth.findPassword} onClose={onClose}>
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
                  // '{count}' 자리표시자를 채우지 않아 화면에 '최소 {count}자 이상' 이 그대로 보였다(2026-10-04). 재설정 규칙은 8자(signin/page.tsx).
                  placeholder={t.auth.minChars.replace('{count}', '8')}
                />
              </InputBoxWrapper>
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <EyeIcon open={showNewPassword} />
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
                <EyeIcon open={showConfirmNewPassword} />
              </button>
            </div>
            <PasswordMatchHint password={newPassword} confirm={confirmNewPassword} t={t} />
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
          <SuccessCheckCircle />

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
    </AuthModalShell>
  );
}

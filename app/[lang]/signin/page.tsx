'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from '@/components/Common/LocalizedLink';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { translateError } from '@/lib/i18n/errorMessages';
import { useI18n } from '@/lib/i18n/context';
import { getPasswordStrength } from '@/lib/utils/password';
import FindIdModal from './_components/FindIdModal';
import ResetPasswordModal from './_components/ResetPasswordModal';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';


const STORAGE_KEYS = {
  SAVED_EMAIL: 'naelum_saved_email',
} as const;

function LoginContent() {

  const searchParams = useSearchParams();
  const supabase = createClient();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveEmail, setSaveEmail] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Find ID states
  const [findIdUsername, setFindIdUsername] = useState('');
  const [findIdLoading, setFindIdLoading] = useState(false);
  const [findIdResult, setFindIdResult] = useState('');
  const [findIdError, setFindIdError] = useState('');

  // Modal states
  const [showFindIdModal, setShowFindIdModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const findIdInputRef = useRef<HTMLInputElement>(null);
  const resetEmailInputRef = useRef<HTMLInputElement>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Password reset states (for setting new password in same window)
  const [resetReady, setResetReady] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);

  const redirectAfterLogin = () => {
    const param = searchParams.get('redirect') || '/';
    // 상대경로만 허용: /path 형식. //evil.com 같은 프로토콜-상대 URL 차단
    const redirectTo = param.startsWith('/') && !param.startsWith('//') ? param : '/';
    window.location.href = redirectTo;
  };

  // localStorage 초기화 (hydration 후 클라이언트에서만 실행)
  useEffect(() => {
    localStorage.removeItem('naelum_auto_login');
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_EMAIL) ?? '';
    if (saved) {
      queueMicrotask(() => {
        setEmail(saved);
        setSaveEmail(true);
      });
    }
  }, []);

  // 쿼리 파라미터 확인하여 비밀번호 찾기 모달 자동 열기
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'reset-password') {
      queueMicrotask(() => setShowResetPasswordModal(true));
    }
  }, [searchParams]);

  // 모달 autofocus
  useEffect(() => {
    if (showFindIdModal) {
      setTimeout(() => findIdInputRef.current?.focus(), 50);
    }
  }, [showFindIdModal]);

  useEffect(() => {
    if (showResetPasswordModal) {
      setTimeout(() => resetEmailInputRef.current?.focus(), 50);
    }
  }, [showResetPasswordModal]);

  // Escape 키로 모달 닫기 (closeResetPasswordModal 선언 후 별도 useEffect에서 처리)
  const escHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  // 비밀번호 재설정 이메일 발송 후 BroadcastChannel 리스닝
  useEffect(() => {
    if (!resetSuccess) return;

    const channel = new BroadcastChannel('auth-channel');
    channel.onmessage = async (event) => {
      if (event.data.type === 'PASSWORD_RESET_READY') {
        // 세션 설정
        if (event.data.accessToken && event.data.refreshToken) {
          await supabase.auth.setSession({
            access_token: event.data.accessToken,
            refresh_token: event.data.refreshToken,
          });
        }
        setResetReady(true);
      }
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'naelum_auth_event') {
        try {
          const data = JSON.parse(event.newValue || '{}');
          if (data.type === 'PASSWORD_RESET_READY') {
            if (data.accessToken && data.refreshToken) {
              supabase.auth.setSession({
                access_token: data.accessToken,
                refresh_token: data.refreshToken,
              });
            }
            setResetReady(true);
            localStorage.removeItem('naelum_auth_event');
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [resetSuccess, supabase.auth]);

  const validateEmail = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val && !emailRegex.test(val)) {
      setEmailError(t.auth.invalidEmailFormat);
    } else {
      setEmailError('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError(t.auth.emailAndPasswordRequired);
      return;
    }

    setLoading(true);
    setLoginError('');

    try {
      // 옛 provider 사전확인(google/kakao 가입자 차단)은 제거됨 — 비로그인 anon 은 profiles 에
      // SELECT 권한이 없어(dev·prod 모두 GRANT 차단) 그 read 가 항상 permission denied→null 로
      // 죽은 코드였다(차단이 한 번도 작동 안 함). OAuth 계정은 비번이 없어 아래 로그인이
      // "invalid credentials" 로 자연 실패하므로 기능 손실 없음. (데이터 계층 이전 정리)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setLoginError(translateError(signInError));
        setLoading(false);
        return;
      }

      // 아이디 저장 처리
      if (saveEmail) {
        localStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, email);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SAVED_EMAIL);
      }

      // 프로필 확인 및 리다이렉트
      redirectAfterLogin();
    } catch {
      setLoginError(t.common.error);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account', // 항상 계정 선택 화면 표시
        },
      },
    });

    if (error) {
      setLoginError(translateError(error));
      setOauthLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setOauthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setLoginError(translateError(error));
      setOauthLoading(false);
    }
  };

  // 비밀번호 재설정 이메일 전송
  const handleResetPassword = async () => {
    if (!resetEmail) {
      setResetEmailError(t.auth.emailRequired);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setResetEmailError(t.auth.invalidEmailFormat);
      return;
    }

    setResetLoading(true);
    setResetEmailError('');

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password-verify`,
    });

    if (error) {
      setResetEmailError(translateError(error));
    } else {
      setResetSuccess(true);
    }

    setResetLoading(false);
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // 새 비밀번호 설정
  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      setNewPasswordError(t.auth.passwordMinLength);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setNewPasswordError(t.auth.passwordMismatch);
      return;
    }

    setUpdatingPassword(true);
    setNewPasswordError('');

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setNewPasswordError(translateError(error));
      setUpdatingPassword(false);
      return;
    }

    // 비밀번호 변경 후 로그아웃 (새 비밀번호로 다시 로그인하도록)
    await supabase.auth.signOut();
    setPasswordUpdateSuccess(true);
    setUpdatingPassword(false);
  };

  // 모달 닫기
  const closeResetPasswordModal = () => {
    setShowResetPasswordModal(false);
    setResetEmail('');
    setResetEmailError('');
    setResetSuccess(false);
    setResetReady(false);
    setNewPassword('');
    setConfirmNewPassword('');
    setNewPasswordError('');
    setPasswordUpdateSuccess(false);
  };

  // Escape 키로 모달 닫기
  useEffect(() => {
    escHandlerRef.current = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showFindIdModal) {
        setShowFindIdModal(false);
        setFindIdUsername('');
        setFindIdResult('');
        setFindIdError('');
      }
      if (showResetPasswordModal) closeResetPasswordModal();
    };
    window.addEventListener('keydown', escHandlerRef.current);
    return () => {
      if (escHandlerRef.current) window.removeEventListener('keydown', escHandlerRef.current);
    };
  }, [showFindIdModal, showResetPasswordModal]);

  // 아이디(이메일) 찾기
  const handleFindId = async () => {
    if (!findIdUsername.trim()) return;
    setFindIdLoading(true);
    setFindIdError('');
    try {
      const res = await fetch('/api/auth/find-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: findIdUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFindIdError(data.error);
      } else {
        setFindIdResult(data.maskedEmail);
      }
    } catch {
      setFindIdError(t.common.error);
    }
    setFindIdLoading(false);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background-primary px-4 md:px-6 py-4 md:py-8">
      <div className="w-full max-w-md rounded-2xl md:rounded-3xl bg-background-secondary p-5 md:p-8 shadow-2xl border border-white/5">
        <div className="mb-5 md:mb-8 text-center">
          <Link href="/" className="text-2xl md:text-3xl font-bold tracking-tighter text-accent-warm">
            낼름
          </Link>
          <p className="mt-1.5 md:mt-2 text-sm md:text-base text-text-secondary">{t.auth.meetRecipes}</p>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-2.5 md:space-y-3">
          {/* Kakao Login */}
          <button
            onClick={handleKakaoLogin}
            disabled={oauthLoading}
            className={`flex w-full items-center justify-center gap-3 rounded-xl py-2.5 md:py-3.5 text-sm md:text-base font-medium transition-all hover:brightness-95 active:scale-[0.98] ${oauthLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: '#FEE500', color: '#000000' }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.62 1.74 4.93 4.36 6.27-.14.53-.9 3.4-.93 3.6 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.62.09 1.27.14 1.96.14 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
            </svg>
            {t.auth.loginWithKakao}
          </button>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={oauthLoading}
            className={`flex w-full items-center justify-center gap-3 rounded-xl py-2.5 md:py-3.5 text-sm md:text-base font-medium transition-all active:scale-[0.98] ${oauthLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
            style={{
              backgroundColor: '#ffffff',
              color: '#3c4043',
              border: '1px solid #dadce0',
              boxShadow: '0 1px 2px 0 rgba(60,64,67,0.10)',
            }}
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t.auth.loginWithGoogle}
          </button>
        </div>

        <div className="my-4 md:my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-sm text-text-muted">{t.auth.or}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleLogin} className="space-y-3 md:space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">{t.auth.email}</label>
            <InputBoxWrapper className={`!bg-background-tertiary !rounded-xl !px-4 md:!px-5 !py-2.5 md:!py-3.5 ${emailError ? '!ring-error/50 focus-within:!ring-error' : ''}`}>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateEmail(e.target.value);
                }}
                className={`${INPUT_INNER_COMFORTABLE_CLASS} text-base`}
                style={INPUT_INNER_STYLE}
                placeholder="example@email.com"
                autoComplete="email"
              />
            </InputBoxWrapper>
            {emailError && <p className="text-xs text-error">{emailError}</p>}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">{t.auth.password}</label>
            <div className="relative">
              <InputBoxWrapper className="!bg-background-tertiary !rounded-xl !px-4 md:!px-5 !py-2.5 md:!py-3.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${INPUT_INNER_COMFORTABLE_CLASS} text-base pr-12`}
                  style={INPUT_INNER_STYLE}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </InputBoxWrapper>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showPassword ? (
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
          </div>

          {/* Options */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 md:gap-4">
              <label
                className="flex cursor-pointer items-center gap-2 text-text-secondary hover:text-text-primary"
                onClick={() => setSaveEmail(!saveEmail)}
              >
                <span
                  className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${
                    saveEmail
                      ? 'bg-accent-warm border-accent-warm'
                      : 'bg-transparent border-white/30'
                  }`}
                >
                  {saveEmail && (
                    <svg className="w-2.5 h-2.5 text-background-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-xs md:text-sm">{t.auth.saveId}</span>
              </label>
            </div>
          </div>

          {loginError && <p className="text-center text-sm text-error">{loginError}</p>}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent-warm py-2.5 md:py-4 font-bold text-background-primary transition-all hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(255,153,102,0.4)] disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {t.auth.loginProcessing}
              </span>
            ) : t.common.login}
          </button>
        </form>

        <div className="mt-4 md:mt-6 flex justify-center gap-4 text-sm text-text-muted">
          <button
            onClick={() => setShowFindIdModal(true)}
            className="hover:text-text-secondary transition-colors"
          >
            {t.auth.findId}
          </button>
          <span className="text-white/10">|</span>
          <button
            onClick={() => setShowResetPasswordModal(true)}
            className="hover:text-text-secondary transition-colors"
          >
            {t.auth.findPassword}
          </button>
        </div>

        <p className="mt-4 md:mt-6 text-center text-sm text-text-muted">
          {t.auth.noAccount}{' '}
          <Link href="/signup" className="font-medium text-accent-warm hover:underline">
            {t.common.signup}
          </Link>
        </p>
      </div>

      {/* 아이디 찾기 모달 — _components/FindIdModal.tsx 로 추출 (Phase 2 후속).
          상태·ref·handleFindId 는 부모 소유, onClose/onGoToReset 는 원본
          inline setState 시퀀스 byte-identical 보존 */}
      {showFindIdModal && (
        <FindIdModal
          t={t}
          findIdInputRef={findIdInputRef}
          findIdUsername={findIdUsername}
          setFindIdUsername={setFindIdUsername}
          findIdResult={findIdResult}
          findIdError={findIdError}
          findIdLoading={findIdLoading}
          onFindId={handleFindId}
          onClose={() => {
            setShowFindIdModal(false);
            setFindIdUsername('');
            setFindIdResult('');
            setFindIdError('');
          }}
          onGoToReset={() => {
            setShowFindIdModal(false);
            setFindIdUsername('');
            setFindIdResult('');
            setFindIdError('');
            setShowResetPasswordModal(true);
          }}
        />
      )}

      {/* 비밀번호 찾기 모달 — _components/ResetPasswordModal.tsx 로 추출
          (Phase 2 후속). 4스텝 상태·ref·async·BroadcastChannel·passwordStrength
          전부 부모 소유, 콜백만 전달. JSX byte-identical */}
      {showResetPasswordModal && (
        <ResetPasswordModal
          t={t}
          resetEmailInputRef={resetEmailInputRef}
          resetEmail={resetEmail}
          setResetEmail={setResetEmail}
          resetEmailError={resetEmailError}
          setResetEmailError={setResetEmailError}
          resetLoading={resetLoading}
          resetSuccess={resetSuccess}
          resetReady={resetReady}
          passwordUpdateSuccess={passwordUpdateSuccess}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmNewPassword={confirmNewPassword}
          setConfirmNewPassword={setConfirmNewPassword}
          showNewPassword={showNewPassword}
          setShowNewPassword={setShowNewPassword}
          showConfirmNewPassword={showConfirmNewPassword}
          setShowConfirmNewPassword={setShowConfirmNewPassword}
          newPasswordError={newPasswordError}
          updatingPassword={updatingPassword}
          passwordStrength={passwordStrength}
          onResetPassword={handleResetPassword}
          onUpdatePassword={handleUpdatePassword}
          onClose={closeResetPasswordModal}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background-primary">
        <div className="text-text-muted">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

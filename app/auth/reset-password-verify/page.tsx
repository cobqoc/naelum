'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { translateError } from '@/lib/i18n/errorMessages';
import { useI18n } from '@/lib/i18n/context';

export default function ResetPasswordVerifyPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Supabase가 URL hash에서 자동으로 세션 처리
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          setStatus('error');
          setErrorMessage(translateError(error));
          return;
        }

        if (session?.user) {
          setStatus('success');
          // 원래 창에 비밀번호 재설정 준비 완료 알림
          try {
            const channel = new BroadcastChannel('auth-channel');
            channel.postMessage({
              type: 'PASSWORD_RESET_READY',
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
            });
            channel.close();
          } catch {
            // BroadcastChannel not supported
          }
          try {
            localStorage.setItem('naelum_auth_event', JSON.stringify({
              type: 'PASSWORD_RESET_READY',
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
              timestamp: Date.now()
            }));
          } catch {}
          // 잠시 후 닫기 시도, 실패 시 비밀번호 재설정 페이지로 이동
          setTimeout(() => {
            window.close();
            // window.close()가 동작하지 않는 경우 (스크립트로 열리지 않은 탭)
            window.location.href = '/auth/reset-password';
          }, 2000);
          return;
        }

        // 세션이 없으면 URL hash에서 토큰 처리 시도
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && refreshToken && type === 'recovery') {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            setStatus('error');
            setErrorMessage(translateError(setSessionError));
            return;
          }

          setStatus('success');
          // 원래 창에 비밀번호 재설정 준비 완료 알림
          try {
            const channel = new BroadcastChannel('auth-channel');
            channel.postMessage({
              type: 'PASSWORD_RESET_READY',
              accessToken: data.session?.access_token,
              refreshToken: data.session?.refresh_token,
            });
            channel.close();
          } catch {
            // BroadcastChannel not supported
          }
          try {
            localStorage.setItem('naelum_auth_event', JSON.stringify({
              type: 'PASSWORD_RESET_READY',
              accessToken: data.session?.access_token,
              refreshToken: data.session?.refresh_token,
              timestamp: Date.now()
            }));
          } catch {}
          // 잠시 후 닫기 시도, 실패 시 비밀번호 재설정 페이지로 이동
          setTimeout(() => {
            window.close();
            // window.close()가 동작하지 않는 경우 (스크립트로 열리지 않은 탭)
            window.location.href = '/auth/reset-password';
          }, 2000);
          return;
        }

        // 토큰이 없거나 recovery 타입이 아님
        setStatus('error');
        setErrorMessage('유효하지 않은 링크입니다.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setErrorMessage('인증 처리 중 오류가 발생했습니다.');
      }
    };

    handleVerification();
  }, [router, supabase.auth]);

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
              {t.auth.resetReady}
            </h1>
            <p className="text-text-secondary text-sm mb-4">
              {t.auth.setNewPwdInOriginalTab}
            </p>
            <p className="text-xs text-text-muted mb-4">
              {t.auth.tabAutoCloseHint}
            </p>
            <Link
              href="/auth/reset-password"
              className="inline-block w-full rounded-xl bg-accent-warm py-3 font-bold text-background-primary text-center transition-all hover:bg-accent-hover"
            >
              {t.auth.manuallyResetPassword}
            </Link>
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
              {errorMessage || t.auth.linkInvalid}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full rounded-xl bg-accent-warm py-3 font-bold text-background-primary transition-all hover:bg-accent-hover"
            >
              {t.auth.backToLogin}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

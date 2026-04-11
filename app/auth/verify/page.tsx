'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { translateError } from '@/lib/i18n/errorMessages';
import { useI18n } from '@/lib/i18n/context';

export default function VerifyPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // URL에서 토큰 정보 확인 (Supabase가 자동으로 처리)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          setStatus('error');
          setErrorMessage(translateError(error));
          return;
        }

        if (session?.user) {
          setStatus('success');
          // 원래 창에 인증 완료 알림
          const channel = new BroadcastChannel('auth-channel');
          channel.postMessage({ type: 'AUTH_SUCCESS' });
          channel.close();
          try {
            localStorage.setItem('naelum_auth_event', JSON.stringify({
              type: 'AUTH_SUCCESS',
              timestamp: Date.now()
            }));
          } catch {}
          // 이 탭은 잠시 후 닫기 시도
          setTimeout(() => {
            window.close();
            // 닫히지 않으면 안내 메시지 표시 (아래 UI에서 처리)
          }, 1500);
          return;
        } else {
          // 세션이 없으면 URL hash에서 토큰 처리 시도
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setSessionError) {
              setStatus('error');
              setErrorMessage(translateError(setSessionError));
              return;
            }

            setStatus('success');
            // 원래 창에 인증 완료 알림
            const channel = new BroadcastChannel('auth-channel');
            channel.postMessage({ type: 'AUTH_SUCCESS' });
            channel.close();
            try {
              localStorage.setItem('naelum_auth_event', JSON.stringify({
                type: 'AUTH_SUCCESS',
                timestamp: Date.now()
              }));
            } catch {}
            // 이 탭은 잠시 후 닫기 시도
            setTimeout(() => {
              window.close();
            }, 1500);
            return;
          } else {
            // 토큰이 없으면 회원가입 페이지로
            setStatus('error');
            setErrorMessage('인증 정보를 찾을 수 없습니다.');
            setTimeout(() => {
              router.push('/signup');
            }, 2000);
          }
        }
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
              {t.auth.emailVerifyComplete}
            </h1>
            <p className="text-text-secondary text-sm mb-4">
              {t.auth.autoMoveNext}
            </p>
            <p className="text-xs text-text-muted">
              {t.auth.tabAutoClose}<br />
              {t.auth.tabCloseManual}
            </p>
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
              {errorMessage || t.auth.authErrorDesc}
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="w-full rounded-xl bg-accent-warm py-3 font-bold text-background-primary transition-all hover:bg-accent-hover"
            >
              {t.auth.backToSignup}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

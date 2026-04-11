'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { translateError } from '@/lib/i18n/errorMessages';
import { useI18n } from '@/lib/i18n/context';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // 이메일 인증 완료 감지 - BroadcastChannel을 통해 다른 탭에서 인증 완료 시 감지
  useEffect(() => {
    if (!emailSent) return;

    // BroadcastChannel로 다른 탭에서의 인증 완료 감지
    const channel = new BroadcastChannel('auth-channel');
    channel.onmessage = (event) => {
      if (event.data.type === 'AUTH_SUCCESS') {
        // 세션 새로고침 후 이동
        supabase.auth.getSession().then(() => {
          router.push('/signup/set-password');
        });
      }
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'naelum_auth_event') {
        try {
          const data = JSON.parse(event.newValue || '{}');
          if (data.type === 'AUTH_SUCCESS') {
            localStorage.removeItem('naelum_auth_event');
            supabase.auth.getSession().then(() => {
              router.push('/signup/set-password');
            });
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 기존 onAuthStateChange도 유지 (같은 탭에서 인증되는 경우 대비)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          router.push('/signup/set-password');
        }
      }
    );

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorageEvent);
      subscription.unsubscribe();
    };
  }, [emailSent, router, supabase.auth]);

  // 이메일 인증 링크 전송
  const handleSendMagicLink = async () => {
    if (!email) {
      setError(t.auth.emailRequired);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t.auth.invalidEmailFormat);
      return;
    }

    setLoading(true);
    setError('');

    // 이미 가입된 이메일인지 확인
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, auth_provider')
      .eq('email', email)
      .single();

    if (existingProfile) {
      // Provider별 에러 메시지
      if (existingProfile.auth_provider === 'google') {
        setError(t.auth.googleRegisteredUseGoogle);
      } else if (existingProfile.auth_provider === 'kakao') {
        setError(t.auth.kakaoRegisteredUseKakao);
      } else {
        setError(t.auth.alreadyRegisteredLogin);
      }
      setLoading(false);
      return;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // 인증 후 verify 페이지로 이동 (원래 창에서 감지하여 set-password로 리다이렉트)
        emailRedirectTo: `${window.location.origin}/auth/verify`,
      },
    });

    if (otpError) {
      // Rate limit 에러 처리
      if (otpError.message.includes('rate limit') || otpError.message.includes('Rate limit')) {
        setError(t.auth.rateLimitError);
      } else {
        setError(translateError(otpError));
      }
      setLoading(false);
    } else {
      setEmailSent(true);
      setLoading(false);
    }
  };

  // Google 가입
  const handleGoogleSignup = async () => {
    setOauthLoading(true);
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (googleError) {
      setError(googleError.message);
      setOauthLoading(false);
    }
  };

  // 카카오 가입
  const handleKakaoSignup = async () => {
    setOauthLoading(true);
    const { error: kakaoError } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (kakaoError) {
      setError(kakaoError.message);
      setOauthLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary px-4 md:px-6 py-8 md:py-12">
      <div className="w-full max-w-md rounded-2xl md:rounded-3xl bg-background-secondary p-6 md:p-10 shadow-2xl border border-white/5">
        <div className="mb-8 md:mb-10 text-center">
          <Link href="/" className="text-2xl md:text-3xl font-bold tracking-tighter text-accent-warm">
            낼름
          </Link>
        </div>
        <h1 className="mb-2 text-xl md:text-2xl font-bold text-text-primary text-center">{t.common.signup}</h1>
        <p className="mb-6 md:mb-8 text-sm text-text-muted text-center">
          {t.auth.signupSimple}
        </p>

        {!emailSent ? (
          <>
            {/* Social 가입 */}
            <div className="space-y-3">
              {/* 카카오 가입 */}
              <button
                onClick={handleKakaoSignup}
                disabled={oauthLoading}
                className={`flex w-full items-center justify-center gap-3 rounded-xl py-3 md:py-3.5 text-sm md:text-base font-medium transition-all hover:brightness-95 active:scale-[0.98] ${oauthLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ backgroundColor: '#FEE500', color: '#000000' }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.62 1.74 4.93 4.36 6.27-.14.53-.9 3.4-.93 3.6 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.62.09 1.27.14 1.96.14 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
                </svg>
                {t.auth.signupWithKakaoFull}
              </button>

              {/* Google 가입 */}
              <button
                onClick={handleGoogleSignup}
                disabled={oauthLoading}
                className={`flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 md:py-3.5 text-sm md:text-base text-text-primary transition-all hover:bg-white/10 active:scale-[0.98] ${oauthLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t.auth.signupWithGoogleFull}
              </button>
            </div>

            <div className="my-6 md:my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-sm text-text-muted">{t.auth.or}</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* 이메일 입력 */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">{t.auth.email} *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMagicLink()}
                  className="w-full rounded-xl bg-background-tertiary px-5 py-3.5 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm"
                  placeholder="example@email.com"
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="text-center text-sm text-error">
                  <p>{error}</p>
                  {error.includes(t.auth.alreadyRegisteredLogin) && (
                    <Link href="/login" className="mt-2 inline-block font-medium text-accent-warm hover:underline">
                      {t.auth.goToLoginPage}
                    </Link>
                  )}
                </div>
              )}

              <button
                onClick={handleSendMagicLink}
                disabled={loading}
                className="w-full rounded-xl bg-accent-warm py-4 font-bold text-background-primary transition-all hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t.auth.sendingEmail}
                  </span>
                ) : t.auth.getVerification}
              </button>
            </div>
          </>
        ) : (
          /* 이메일 전송 완료 화면 */
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-accent-warm/20 flex items-center justify-center">
              <span className="text-3xl">✉️</span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-text-primary mb-2">
                {t.auth.checkEmail}
              </h2>
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-accent-warm">{email}</span>
                <br />
                {t.auth.verificationSent}
              </p>
            </div>

            <div className="rounded-xl bg-accent-warm/10 p-4 text-sm text-text-primary">
              <p className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                {t.auth.autoMoveNext}
              </p>
            </div>

            <div className="rounded-xl bg-white/5 p-4 text-left text-sm text-text-muted">
              <p className="mb-2">📌 {t.auth.emailNotFound}</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>{t.auth.checkSpam}</li>
                <li>{t.auth.checkEmailCorrect}</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
              className="text-sm text-text-muted hover:text-text-primary"
            >
              {t.auth.tryOtherEmail}
            </button>
          </div>
        )}

        <p className="mt-6 md:mt-8 text-center text-sm text-text-muted">
          {t.auth.hasAccount}{' '}
          <Link href="/login" className="font-medium text-accent-warm hover:underline">
            {t.common.login}
          </Link>
        </p>
      </div>
    </div>
  );
}

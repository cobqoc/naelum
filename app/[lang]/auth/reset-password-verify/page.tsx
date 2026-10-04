'use client';

import { useEffect, useState } from 'react';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import Link from '@/components/Common/LocalizedLink';
import { createClient } from '@/lib/supabase/client';
import { translateError } from '@/lib/i18n/errorMessages';
import { useI18n } from '@/lib/i18n/context';
import { resolveEmailLinkSession } from '@/lib/auth/emailLinkSession';
import { broadcastCrossTabAuth } from '@/lib/auth/crossTabAuth';
import EmailLinkStatusCard from '@/components/Auth/EmailLinkStatusCard';

export default function ResetPasswordVerifyPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // 지연 이동 타이머는 언마운트 시 정리 — 예전엔 사용자가 먼저 다른 곳으로 가도 2초 뒤
    // 다시 끌려갔다 (2026-10-04 PAU-59). 정상 흐름의 이동 시점은 동일.
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => {
      if (!cancelled) timers.push(setTimeout(fn, ms));
    };

    const handleVerification = async () => {
      try {
        // 세션 확립(getSession → type=recovery hash 토큰 setSession) — lib/auth/emailLinkSession (2026-10-04 PAU-16)
        const result = await resolveEmailLinkSession(supabase.auth, () => window.location.hash, {
          requireRecoveryType: true,
        });

        if (result.kind === 'error') {
          setStatus('error');
          setErrorMessage(translateError(result.error, t));
          return;
        }

        if (result.kind === 'missing') {
          // 토큰이 없거나 recovery 타입이 아님
          setStatus('error');
          setErrorMessage(t.auth.resetLinkInvalid);
          later(() => {
            router.push('/signin');
          }, 2000);
          return;
        }

        setStatus('success');
        // 원래 창에 비밀번호 재설정 준비 완료 알림 (BroadcastChannel + localStorage 폴백 — lib/auth/crossTabAuth)
        broadcastCrossTabAuth({
          type: 'PASSWORD_RESET_READY',
          accessToken: result.session?.access_token,
          refreshToken: result.session?.refresh_token,
        });
        // 잠시 후 닫기 시도, 실패 시 비밀번호 재설정 페이지로 이동
        later(() => {
          window.close();
          // window.close()가 동작하지 않는 경우 (스크립트로 열리지 않은 탭)
          window.location.href = '/auth/reset-password';
        }, 2000);
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setErrorMessage(t.auth.verifyError);
      }
    };

    handleVerification();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [router, supabase.auth, t]);

  // 상태 카드 틀·로딩·실패 블록은 components/Auth/EmailLinkStatusCard (2026-10-04 PAU-16, 마크업 동일)
  return (
    <EmailLinkStatusCard
      status={status}
      t={t}
      successTitle={t.auth.resetReady}
      successBody={
        <>
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
      }
      errorMessage={errorMessage || t.auth.linkInvalid}
      errorActionLabel={t.auth.backToLogin}
      onErrorAction={() => router.push('/signin')}
    />
  );
}

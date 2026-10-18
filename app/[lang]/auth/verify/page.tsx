'use client';

import { useEffect, useState } from 'react';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { createClient } from '@/lib/supabase/client';
import { translateError } from '@/lib/i18n/errorMessages';
import { useI18n } from '@/lib/i18n/context';
import { resolveEmailLinkSession } from '@/lib/auth/emailLinkSession';
import { broadcastCrossTabAuth } from '@/lib/auth/crossTabAuth';
import EmailLinkStatusCard from '@/components/Auth/EmailLinkStatusCard';

export default function VerifyPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // 지연 이동 타이머는 언마운트 시 정리 — 예전엔 사용자가 먼저 다른 곳으로 가도 1.5~2초 뒤
    // 다시 끌려갔다 (2026-10-04 PAU-59). 정상 흐름의 이동 시점은 동일.
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => {
      if (!cancelled) timers.push(setTimeout(fn, ms));
    };

    const handleVerification = async () => {
      try {
        // 세션 확립(getSession → URL hash 토큰 setSession) — lib/auth/emailLinkSession (2026-10-04 PAU-16)
        const result = await resolveEmailLinkSession(supabase.auth, () => window.location.hash, {
          requireRecoveryType: false,
        });

        if (result.kind === 'error') {
          setStatus('error');
          setErrorMessage(translateError(result.error, t));
          return;
        }

        if (result.kind === 'missing') {
          // 토큰이 없으면 회원가입 페이지로
          setStatus('error');
          setErrorMessage(t.auth.verifyNotFound);
          later(() => {
            router.push('/signup');
          }, 2000);
          return;
        }

        setStatus('success');
        // 원래 창에 인증 완료 알림 (BroadcastChannel + localStorage 폴백 — lib/auth/crossTabAuth)
        broadcastCrossTabAuth({ type: 'AUTH_SUCCESS' });
        // 탭 닫기 시도 → 실패 시 set-password로 직접 이동 (원래 탭이 없는 경우 대비)
        later(() => {
          window.close();
          later(() => {
            router.push('/signup/set-password');
          }, 500);
        }, 1500);
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
      successTitle={t.auth.emailVerifyComplete}
      successBody={
        <>
          <p className="text-text-secondary text-sm mb-4">
            {t.auth.autoMoveNext}
          </p>
          <p className="text-xs text-text-muted">
            {t.auth.tabAutoClose}<br />
            {t.auth.tabCloseManual}
          </p>
        </>
      }
      errorMessage={errorMessage || t.auth.authErrorDesc}
      errorActionLabel={t.auth.backToSignup}
      onErrorAction={() => router.push('/signup')}
    />
  );
}

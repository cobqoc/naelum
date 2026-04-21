'use client';

/**
 * Cookie Consent Context
 *
 * 앱 전역에서 현재 consent 상태에 접근하거나 변경하는 React Context.
 * - 로컬스토리지 + Supabase profiles 양쪽 동기화
 * - GDPR 요구: 동의 기록(version + timestamp) + 언제든 철회 가능
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  CookieConsent,
  CURRENT_CONSENT_VERSION,
  readStoredConsent,
  writeStoredConsent,
} from './types';
import { createClient } from '@/lib/supabase/client';

interface ConsentContextValue {
  /** 현재 consent. null = 아직 미결정 (배너 표시해야 함) */
  consent: CookieConsent | null;
  /** 배너 재오픈 요청 (설정 페이지에서 "쿠키 설정 변경" 버튼 등) */
  reopenBanner: () => void;
  /** 배너 노출 여부 */
  bannerVisible: boolean;
  /** consent 저장 + DB 동기화 */
  saveConsent: (analytics: boolean, marketing: boolean) => Promise<void>;
  /** 배너 숨기기 (저장 없이 — 거의 안 씀, 주로 내부용) */
  closeBanner: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 초기 로드: localStorage에서 consent 읽기
  useEffect(() => {
    const stored = readStoredConsent();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(stored);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBannerVisible(!stored); // 없으면 배너 띄움
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialized(true);
  }, []);

  // 로그인 유저: DB의 consent가 더 최신이면 덮어쓰기
  useEffect(() => {
    if (!initialized) return;

    const supabase = createClient();
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('cookie_consent_version, cookie_consent_analytics, cookie_consent_marketing, cookie_consent_at')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile) return;

        const dbVersion = profile.cookie_consent_version as number | null;
        if (dbVersion === null || dbVersion === undefined) return; // 미동의
        if (dbVersion < CURRENT_CONSENT_VERSION) return; // 구 버전 → 재동의 필요

        // DB에 유효한 consent 있음 → localStorage도 동기화
        const dbConsent: CookieConsent = {
          version: dbVersion,
          essential: true,
          analytics: profile.cookie_consent_analytics === true,
          marketing: profile.cookie_consent_marketing === true,
          timestamp: profile.cookie_consent_at || new Date().toISOString(),
        };
        writeStoredConsent(dbConsent);
        setConsent(dbConsent);
        setBannerVisible(false);
      } catch {
        // 조용히 실패 — localStorage fallback
      }
    })();
  }, [initialized]);

  const saveConsent = useCallback(async (analytics: boolean, marketing: boolean) => {
    const newConsent: CookieConsent = {
      version: CURRENT_CONSENT_VERSION,
      essential: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    };

    // 1) localStorage 저장 (즉시 반영)
    writeStoredConsent(newConsent);
    setConsent(newConsent);
    setBannerVisible(false);

    // 2) DB 동기화 (로그인 유저만)
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          cookie_consent_version: newConsent.version,
          cookie_consent_analytics: newConsent.analytics,
          cookie_consent_marketing: newConsent.marketing,
          cookie_consent_at: newConsent.timestamp,
        }).eq('id', user.id);
      }
    } catch {
      // 로그인 안 된 유저나 DB 에러 — localStorage는 이미 저장됨
    }
  }, []);

  const reopenBanner = useCallback(() => {
    setBannerVisible(true);
  }, []);

  const closeBanner = useCallback(() => {
    setBannerVisible(false);
  }, []);

  return (
    <ConsentContext.Provider value={{ consent, bannerVisible, saveConsent, reopenBanner, closeBanner }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useCookieConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within <ConsentProvider>');
  }
  return ctx;
}

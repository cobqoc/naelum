'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';

const CONSENT_KEY = 'naelum_cookie_consent';

export default function CookieConsent() {
  const { t } = useI18n();
  const supabase = createClient();

  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  // Check if consent has already been given
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        // Small delay so the banner slides in after page load
        const timer = setTimeout(() => setVisible(true), 500);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const saveConsent = useCallback(
    async (value: 'all' | 'necessary') => {
      // Save to localStorage
      try {
        localStorage.setItem(
          CONSENT_KEY,
          JSON.stringify({ consent: value, timestamp: new Date().toISOString() })
        );
      } catch {
        // localStorage unavailable
      }

      // Save to user profile if logged in
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ cookie_consent: value })
            .eq('id', user.id);
        }
      } catch {
        // Not critical
      }

      // Animate out
      setDismissing(true);
      setTimeout(() => setVisible(false), 350);
    },
    [supabase]
  );

  // Labels with i18n fallback
  const labels = {
    message:
      t.cookieConsent?.message ||
      '이 웹사이트는 더 나은 사용자 경험을 위해 쿠키를 사용합니다. We use cookies to improve your experience.',
    acceptAll: t.cookieConsent?.acceptAll || '모두 수락 / Accept All',
    necessaryOnly:
      t.cookieConsent?.necessaryOnly || '필수만 / Necessary Only',
    learnMore: t.cookieConsent?.learnMore || '자세히 보기 / Learn More',
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4"
      style={{
        animation: dismissing
          ? 'cookie-slide-down 0.35s ease-in forwards'
          : 'cookie-slide-up 0.4s ease-out forwards',
      }}
      role="dialog"
      aria-label="Cookie consent"
    >
      <div
        className="max-w-xl mx-auto rounded-2xl p-5 shadow-2xl border"
        style={{
          backgroundColor: 'var(--background-secondary)',
          borderColor: 'var(--background-tertiary)',
        }}
      >
        <p
          className="text-sm leading-relaxed mb-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          🍪 {labels.message}
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => saveConsent('all')}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent-warm)',
              color: '#1a1a1a',
            }}
          >
            {labels.acceptAll}
          </button>
          <button
            onClick={() => saveConsent('necessary')}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 border"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              borderColor: 'var(--background-tertiary)',
            }}
          >
            {labels.necessaryOnly}
          </button>
        </div>

        <Link
          href="/privacy"
          className="block text-xs mt-3 text-center underline transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          {labels.learnMore}
        </Link>
      </div>

      <style jsx>{`
        @keyframes cookie-slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes cookie-slide-down {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

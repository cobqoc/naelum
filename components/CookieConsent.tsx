'use client';

/**
 * GDPR 쿠키 동의 배너
 *
 * 3단계 선택:
 * 1. 모두 수락 (analytics + marketing)
 * 2. 필수만 (analytics, marketing 모두 거부)
 * 3. 커스터마이즈 (카테고리별 세밀 선택)
 *
 * 버전 관리 + 동의 철회 지원. useCookieConsent 훅에서 bannerVisible을 제어.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { useCookieConsent } from '@/lib/cookieConsent/context';

export default function CookieConsent() {
  const { t } = useI18n();
  const { bannerVisible, saveConsent } = useCookieConsent();

  const [dismissing, setDismissing] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const handleAcceptAll = async () => {
    setDismissing(true);
    await saveConsent(true, true);
    setTimeout(() => setDismissing(false), 400);
  };

  const handleNecessaryOnly = async () => {
    setDismissing(true);
    await saveConsent(false, false);
    setTimeout(() => setDismissing(false), 400);
  };

  const handleSaveCustom = async () => {
    setDismissing(true);
    await saveConsent(analytics, marketing);
    setTimeout(() => { setDismissing(false); setCustomizing(false); }, 400);
  };

  if (!bannerVisible) return null;

  const labels = {
    message: t.cookieConsent?.message || '이 웹사이트는 더 나은 경험을 위해 쿠키를 사용합니다.',
    acceptAll: t.cookieConsent?.acceptAll || '모두 수락',
    necessaryOnly: t.cookieConsent?.necessaryOnly || '필수만',
    learnMore: t.cookieConsent?.learnMore || '자세히',
    customize: t.cookieConsent?.customize || '상세 설정',
    essential: t.cookieConsent?.essential || '필수',
    essentialDesc: t.cookieConsent?.essentialDesc || '로그인·세션 등 서비스 작동에 꼭 필요함 (거부 불가)',
    analytics: t.cookieConsent?.analytics || '분석·에러 추적',
    analyticsDesc: t.cookieConsent?.analyticsDesc || '서비스 개선 목적 오류 리포트 (Sentry)',
    marketing: t.cookieConsent?.marketing || '마케팅',
    marketingDesc: t.cookieConsent?.marketingDesc || '맞춤형 광고·리마케팅 (현재 미사용)',
    saveChoices: t.cookieConsent?.saveChoices || '선택 저장',
    cancel: t.cookieConsent?.cancel || '취소',
    cookiePolicy: t.cookieConsent?.cookiePolicy || '쿠키 정책',
  };

  return (
    <div
      className="fixed left-0 right-0 z-40 px-4 pb-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-0"
      style={{
        animation: dismissing ? 'cookie-slide-down 0.35s ease-in forwards' : 'cookie-slide-up 0.4s ease-out forwards',
      }}
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
    >
      <div
        className="max-w-xl mx-auto rounded-2xl p-5 shadow-2xl border"
        style={{
          backgroundColor: 'var(--background-secondary)',
          borderColor: 'var(--background-tertiary)',
        }}
      >
        {!customizing ? (
          // 기본 배너 (3-way 선택)
          <>
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              🍪 {labels.message}
            </p>

            {/* 3-way 버튼 — 거절("필수만")이 수락과 동등한 prominence (GDPR 요구) */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAcceptAll}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--accent-warm)', color: '#1a1a1a' }}
              >
                {labels.acceptAll}
              </button>
              <button
                onClick={handleNecessaryOnly}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 border"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--text-muted)',
                }}
              >
                {labels.necessaryOnly}
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 mt-3 text-xs">
              <button
                onClick={() => setCustomizing(true)}
                className="underline transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-secondary)' }}
              >
                {labels.customize}
              </button>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <Link
                href="/cookies"
                className="underline transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                {labels.cookiePolicy}
              </Link>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <Link
                href="/privacy"
                className="underline transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                {labels.learnMore}
              </Link>
            </div>
          </>
        ) : (
          // 커스터마이즈 모달 (카테고리별 토글)
          <>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              {labels.customize}
            </p>
            <div className="space-y-3 mb-4">
              {/* Essential — 항상 ON, 비활성 토글 */}
              <CategoryRow
                label={labels.essential}
                desc={labels.essentialDesc}
                checked={true}
                disabled
                onChange={() => {}}
              />
              {/* Analytics */}
              <CategoryRow
                label={labels.analytics}
                desc={labels.analyticsDesc}
                checked={analytics}
                onChange={setAnalytics}
              />
              {/* Marketing */}
              <CategoryRow
                label={labels.marketing}
                desc={labels.marketingDesc}
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveCustom}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--accent-warm)', color: '#1a1a1a' }}
              >
                {labels.saveChoices}
              </button>
              <button
                onClick={() => setCustomizing(false)}
                className="py-2.5 px-4 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 border"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--background-tertiary)',
                }}
              >
                {labels.cancel}
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes cookie-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes cookie-slide-down {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function CategoryRow({
  label,
  desc,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-accent-warm' : 'bg-white/20'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

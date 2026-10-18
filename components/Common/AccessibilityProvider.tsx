'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { useLocalizedPathname } from '@/lib/i18n/useLocalizedPathname';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKeys } from '@/lib/i18n/translations';

// 2026-10-04: 소비처 0 이던 useAccessibility 훅·AccessibilityContext(값 객체)를 삭제(PAU-04).
// announceMessage 는 아래 라우트 안내 effect 가 내부에서 계속 쓴다.

/**
 * Alt+N 단축키 → 헤더 알림 패널(NotificationPanel)을 여는 window 이벤트 이름.
 * 예전엔 존재하지 않는 /notifications 로 이동해 404 였다(PAU-03, 2026-10-04).
 */
export const OPEN_NOTIFICATIONS_EVENT = 'naelum:open-notifications';

// ── Provider ───────────────────────────────────────────

interface AccessibilityProviderProps {
  children: ReactNode;
}

export default function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const router = useRouter();
  // 2026-10-04: raw usePathname()(=/ko/recipes)의 첫 세그먼트는 항상 언어코드라 "ko 페이지로 이동했습니다"만
  // 낭독됐다(PAU-02) → [lang] 접두를 뗀 경로로 페이지명을 만든다.
  const pathname = useLocalizedPathname();
  const { t } = useI18n();

  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: more)').matches || window.matchMedia('(forced-colors: active)').matches;
  });

  // Refs for aria-live regions
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);
  const prevPathnameRef = useRef(pathname);

  // ── Media query detection ──

  useEffect(() => {
    const motionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionMQ.addEventListener('change', onMotionChange);

    const contrastMQ = window.matchMedia('(prefers-contrast: more)');
    const onContrastChange = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    contrastMQ.addEventListener('change', onContrastChange);

    const forcedMQ = window.matchMedia('(forced-colors: active)');
    const onForcedChange = (e: MediaQueryListEvent) => {
      if (e.matches) setHighContrast(true);
    };
    forcedMQ.addEventListener('change', onForcedChange);

    return () => {
      motionMQ.removeEventListener('change', onMotionChange);
      contrastMQ.removeEventListener('change', onContrastChange);
      forcedMQ.removeEventListener('change', onForcedChange);
    };
  }, []);

  // ── Announce message ──

  const announceMessage = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const ref = priority === 'assertive' ? assertiveRef : politeRef;
      if (ref.current) {
        // Clear then set to ensure the screen reader picks up the change
        ref.current.textContent = '';
        requestAnimationFrame(() => {
          if (ref.current) {
            ref.current.textContent = message;
          }
        });
      }
    },
    []
  );

  // ── Route change announcements ──

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;

      // Build a human-readable page name from the pathname
      const pageName = getPageName(pathname, t);
      announceMessage(t.accessibility.navigatedTo.replace('{page}', pageName));
    }
  }, [pathname, announceMessage, t]);

  // ── Keyboard shortcuts ──

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Only handle Escape in inputs
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Alt+H: Go home
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        router.push('/');
        return;
      }

      // Alt+S: Focus search bar
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        // SearchBar 는 type="search" — 그걸 우선 타깃. placeholder/aria 는 영어 fallback(로케일별 한글 placeholder 매칭은 불완전하므로 제거).
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          router.push('/search');
        }
        return;
      }

      // Alt+N: 알림 패널 열기 — 알림 전용 페이지는 없고(/notifications 는 404) 헤더 종 아이콘 패널이 실제 알림 UI.
      // 패널(로그인 + 헤더가 있는 페이지)이 없으면 아무 일도 일어나지 않는다. (PAU-03, 2026-10-04)
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(OPEN_NOTIFICATIONS_EVENT));
        return;
      }

      // (2026-10-04) Escape 시 'accessibility:escape' 이벤트를 쏘던 분기는 리스너 0 이라 삭제(PAU-04).
      // 모달·드롭다운의 Escape 닫기는 각자 useEscapeKey 가 담당한다.
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // ── Apply reduced motion class to html ──

  useEffect(() => {
    const html = document.documentElement;
    if (reducedMotion) {
      html.classList.add('reduce-motion');
    } else {
      html.classList.remove('reduce-motion');
    }
  }, [reducedMotion]);

  // ── Apply high contrast class to html ──

  useEffect(() => {
    const html = document.documentElement;
    if (highContrast) {
      html.classList.add('high-contrast');
    } else {
      html.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // ── Render ──

  return (
    <>
      {/* Skip to content link — 대상 #main-content 는 Header 가 <header> 바로 뒤에 렌더한다 (PAU-01) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[10000] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:outline-none focus:ring-2"
        style={{
          backgroundColor: 'var(--accent-warm)',
          color: '#1a1a1a',
        }}
      >
        {t.accessibility.skipToContent}
      </a>

      {children}

      {/* Screen reader live regions (visually hidden) */}
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      />
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        className="sr-only"
      />

      {/* reduce-motion·high-contrast 전역 스타일은 app/globals.css 끝으로 이관 (styled-jsx 런타임 제거, perf 2026-09-27) */}
    </>
  );
}

// ── Utility ────────────────────────────────────────────

// 2026-10-04: 페이지명을 현재 로케일 라벨로(기존 번역 키 재사용). 옛 맵은 영어 고정 + 없어진 경로
// (login·ingredients·recommendations·notifications) 기준이었다. 모르는 세그먼트(@닉네임 등)는 그대로 읽는다.
function getPageName(pathname: string, t: TranslationKeys): string {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return t.common.home;

  const nameMap: Record<string, string> = {
    recipes: t.nav.recipes,
    search: t.common.search,
    settings: t.common.settings,
    signin: t.common.login,
    signup: t.common.signup,
    kitchen: t.meta.ingredientsTitle,
    tip: t.meta.tipTitle,
    cart: t.bottomNav.cart,
    about: t.about.title,
    privacy: t.meta.privacyTitle,
    terms: t.meta.termsTitle,
    copyright: t.meta.copyrightTitle,
    cookies: t.meta.cookiesTitle,
    admin: 'Admin',
  };

  const firstSegment = segments[0];
  return nameMap[firstSegment] || firstSegment;
}

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';

// ── Types ──────────────────────────────────────────────

interface AccessibilityContextValue {
  /** Whether the user prefers reduced motion */
  reducedMotion: boolean;
  /** Whether the user has high-contrast mode enabled */
  highContrast: boolean;
  /** Announce a message to screen readers via aria-live region */
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue>({
  reducedMotion: false,
  highContrast: false,
  announceMessage: () => {},
});

/**
 * Hook to access accessibility state and utilities.
 */
export function useAccessibility() {
  return useContext(AccessibilityContext);
}

// ── Provider ───────────────────────────────────────────

interface AccessibilityProviderProps {
  children: ReactNode;
}

export default function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

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
      const pageName = getPageName(pathname);
      announceMessage(`${pageName} 페이지로 이동했습니다. Navigated to ${pageName}.`);
    }
  }, [pathname, announceMessage]);

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
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="검색"], input[placeholder*="search"], input[aria-label*="search"], input[aria-label*="검색"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          router.push('/search');
        }
        return;
      }

      // Alt+N: Go to notifications
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        router.push('/notifications');
        return;
      }

      // Escape: Close modals (dispatch a custom event that modals can listen to)
      if (e.key === 'Escape') {
        document.dispatchEvent(new CustomEvent('accessibility:escape'));
        return;
      }
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
    <AccessibilityContext.Provider
      value={{ reducedMotion, highContrast, announceMessage }}
    >
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[10000] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:outline-none focus:ring-2"
        style={{
          backgroundColor: 'var(--accent-warm)',
          color: '#1a1a1a',
        }}
      >
        Skip to content
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

      {/* Global reduced-motion styles */}
      <style jsx global>{`
        .reduce-motion *,
        .reduce-motion *::before,
        .reduce-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }

        .high-contrast {
          --text-primary: #ffffff;
          --text-secondary: #e0e0e0;
          --text-muted: #c0c0c0;
          --background-primary: #000000;
          --background-secondary: #1a1a1a;
          --background-tertiary: #333333;
        }
      `}</style>
    </AccessibilityContext.Provider>
  );
}

// ── Utility ────────────────────────────────────────────

function getPageName(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return 'Home';

  const nameMap: Record<string, string> = {
    recipes: 'Recipes',
    search: 'Search',
    settings: 'Settings',
    notifications: 'Notifications',
    login: 'Login',
    signup: 'Sign Up',
    ingredients: 'Ingredients',
    recommendations: 'Recommendations',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    admin: 'Admin',
  };

  const firstSegment = segments[0];
  return nameMap[firstSegment] || firstSegment;
}

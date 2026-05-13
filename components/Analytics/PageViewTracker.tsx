'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics/track';

/**
 * 자동 페이지뷰 트래킹.
 * - pathname 변경 시 page_view 이벤트 전송
 * - useSearchParams는 안 씀(Suspense 강제 + hydration 부작용) — query는 client-side에서 직접 읽음
 * - CookieConsent.analytics 동의 안 한 경우 track()이 no-op이라 안전
 */
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const query = typeof window !== 'undefined' && window.location.search
      ? window.location.search.slice(1)
      : undefined;
    track('page_view', {
      path: pathname,
      query,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    });
  }, [pathname]);

  return null;
}

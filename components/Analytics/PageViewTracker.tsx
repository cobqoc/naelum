'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { track } from '@/lib/analytics/track';

/**
 * 자동 페이지뷰 트래킹.
 * - pathname 또는 query 변경 시 page_view 이벤트 전송
 * - CookieConsent.analytics 동의 안 한 경우 track()이 no-op이라 안전
 * - layout 안에 한 번만 mount
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams?.toString() ?? '';
    track('page_view', {
      path: pathname,
      query: search || undefined,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    });
  }, [pathname, searchParams]);

  return null;
}

'use client';

import { useEffect } from 'react';

/**
 * SSR <html lang>은 정적 "ko"로 prerender됨 (루트 layout 정적화를 위해).
 * 클라이언트 hydration 후 현재 URL의 lang param에 맞춰 동기화.
 * 스크린리더·SEO에 정확한 locale 노출 (Google은 JS 실행 후 lang 인식).
 */
export default function HtmlLangSync({ lang }: { lang: string }) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.documentElement.lang !== lang) {
      document.documentElement.lang = lang;
    }
  }, [lang]);
  return null;
}

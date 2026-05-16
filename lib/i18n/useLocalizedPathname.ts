'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { SUPPORTED_LANGUAGES, type Language } from './locales';

/**
 * usePathname() 에서 /[lang] prefix 를 제거한 bare 경로 반환.
 * /ko/recipes → /recipes, /ko → /, / → / (lang 없으면 그대로).
 *
 * `proxy.ts` 의 server-side `stripLang` 와 **동일 정규식·규칙**의 client 대응.
 *
 * ⚠️ raw `next/navigation` `usePathname()` 은 i18n redirect 후 항상 `/{lang}…`
 * (예: `/ko`). 이걸 bare 경로(`/`, `/login`, `/admin`…)와 직접 비교하면
 * 영영 어긋난다(홈탭 active 안 됨·홈 검색 오버레이 dead·피드백 버튼 숨김 깨짐
 * 등 다증상 버그의 근본 원인). **bare 경로 비교에는 반드시 이 훅을 쓸 것.**
 */
export function useLocalizedPathname(): string {
  const pathname = usePathname();
  return useMemo(() => {
    if (!pathname) return pathname;
    const m = /^\/([a-z]{2})(?=\/|$)(.*)$/.exec(pathname);
    if (!m) return pathname;
    const lang = m[1] as Language;
    if (!SUPPORTED_LANGUAGES.includes(lang)) return pathname;
    return m[2] || '/';
  }, [pathname]);
}

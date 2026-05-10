'use client';

import { useRouter, useParams } from 'next/navigation';
import { useMemo } from 'react';
import { SUPPORTED_LANGUAGES, type Language } from './locales';

/**
 * router.push/replace 호출 시 현재 lang을 자동 prefix.
 * /[lang]/ path-based i18n에서 next/router 대신 사용.
 * 외부 URL(http://, mailto:, #) 또는 이미 lang 시작이면 그대로.
 */
export function useLocalizedRouter() {
  const router = useRouter();
  const params = useParams();
  const langParam = params?.lang as Language | undefined;
  const lang: Language = langParam && SUPPORTED_LANGUAGES.includes(langParam) ? langParam : 'ko';

  return useMemo(() => {
    const transform = (path: string): string => {
      if (!path) return path;
      if (/^[a-z]+:\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('tel:') || path.startsWith('#')) {
        return path;
      }
      if (!path.startsWith('/')) return path;
      const firstSeg = path.split('/')[1];
      if (firstSeg && SUPPORTED_LANGUAGES.includes(firstSeg as Language)) return path;
      return path === '/' ? `/${lang}` : `/${lang}${path}`;
    };

    return {
      push: (path: string, options?: Parameters<typeof router.push>[1]) => router.push(transform(path), options),
      replace: (path: string, options?: Parameters<typeof router.replace>[1]) => router.replace(transform(path), options),
      back: () => router.back(),
      forward: () => router.forward(),
      refresh: () => router.refresh(),
      prefetch: (path: string) => router.prefetch(transform(path)),
    };
  }, [router, lang]);
}

'use client';

import Link, { type LinkProps } from 'next/link';
import { useParams } from 'next/navigation';
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';

type LocalizedLinkProps = Omit<LinkProps, 'href'> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | 'href'> & {
    href: string | { pathname?: string; query?: Record<string, string | number | undefined> };
    children?: ReactNode;
  };

/**
 * /[lang]/ path-based i18n에서 내부 링크 prefix 자동 부여.
 * - href가 절대 URL(http://, mailto:, tel:)이거나 hash(#)면 그대로
 * - 외부에서는 useParams로 현재 lang을 읽어 /{lang}/{path} 형태로 변환
 * - 이미 /ko/, /en/, /{lang}/ 시작이면 변환 안 함 (idempotent)
 * - 내부 어딘가 빠진 prefix 방지용 wrapper. next/link 대신 이것을 import.
 */
const LocalizedLink = forwardRef<HTMLAnchorElement, LocalizedLinkProps>(function LocalizedLink(
  { href, ...rest },
  ref
) {
  const params = useParams();
  const langParam = (params?.lang as Language | undefined);
  const lang: Language = langParam && SUPPORTED_LANGUAGES.includes(langParam) ? langParam : 'ko';

  const transform = (path: string): string => {
    if (!path) return path;
    if (/^[a-z]+:\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('tel:') || path.startsWith('#')) {
      return path;
    }
    if (!path.startsWith('/')) return path;
    // 이미 /{lang}/... 인지 검사
    const firstSeg = path.split('/')[1];
    if (firstSeg && SUPPORTED_LANGUAGES.includes(firstSeg as Language)) {
      return path;
    }
    // / 만 있는 경우 → /{lang}
    return path === '/' ? `/${lang}` : `/${lang}${path}`;
  };

  const normalizedHref =
    typeof href === 'string'
      ? transform(href)
      : { ...href, pathname: href.pathname ? transform(href.pathname) : href.pathname };

  return <Link ref={ref} href={normalizedHref} {...rest} />;
});

export default LocalizedLink;

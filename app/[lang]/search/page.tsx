import type { Metadata } from 'next';
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';
import SearchClient from './SearchClient';

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const { q } = await searchParams;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) return {};
  const t = await loadLocale(lang as Language);

  // 검색어 sanitize: 100자 제한 + 특수 HTML 문자 제거 (XSS·OG 카드 보호).
  const safeQ = q ? q.slice(0, 100).replace(/[<>'"&]/g, '').trim() : '';
  const title = safeQ
    ? `"${safeQ}" — ${t.meta.searchTitle}`
    : t.meta.searchTitle;
  const description = t.meta.searchDescription;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default function Page() {
  return <SearchClient />;
}

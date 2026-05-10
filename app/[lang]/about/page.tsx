import type { Metadata } from 'next';
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';
import AboutClient from './AboutClient';

// 정적 페이지 — ISR 60초 캐싱 (콘텐츠 거의 안 변함)
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) return {};
  const t = await loadLocale(lang as Language);
  const title = t.meta.aboutTitle;
  const description = t.meta.aboutDescription;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: ['/icons/icon-512.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/icons/icon-512.png'],
    },
  };
}

export default function AboutPage() {
  return <AboutClient />;
}

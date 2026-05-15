import type { Metadata } from 'next';
import { Suspense } from 'react';
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';
import DeliveryHomeClient from './DeliveryHomeClient';

// 식당 리스트는 클라이언트 fetch 기반. 셸은 캐시.
export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) return {};
  const t = await loadLocale(lang as Language);
  return {
    title: `${t.delivery.title} | 낼름`,
    description: t.delivery.subtitle,
    // 검색엔진 노출 차단 — 출시 전까지 admin 진입만 허용
    robots: { index: false, follow: false },
  };
}

export default function DeliveryPage() {
  return (
    <Suspense>
      <DeliveryHomeClient />
    </Suspense>
  );
}

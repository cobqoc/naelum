import type { Metadata } from 'next';
import { Suspense } from 'react';
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';
import DeliveryMapClient from './DeliveryMapClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) return {};
  const t = await loadLocale(lang as Language);
  return {
    title: `${t.delivery.map.title} | 낼름`,
    description: t.delivery.map.subtitle,
    // 검색엔진 노출 차단 — 출시 전까지 admin 진입만 허용 (기존 delivery 정책 계승)
    robots: { index: false, follow: false },
  };
}

export default function DeliveryMapPage() {
  return (
    <Suspense>
      <DeliveryMapClient />
    </Suspense>
  );
}

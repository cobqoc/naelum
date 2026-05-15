import type { Metadata } from 'next';
import { Suspense } from 'react';
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';
import RestaurantDetailClient from './RestaurantDetailClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) return {};
  const t = await loadLocale(lang as Language);
  return {
    title: `${t.delivery.title} | 낼름`,
    robots: { index: false, follow: false },
  };
}

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string; lang: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <RestaurantDetailClient restaurantId={id} />
    </Suspense>
  );
}

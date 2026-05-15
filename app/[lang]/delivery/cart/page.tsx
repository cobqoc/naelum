import type { Metadata } from 'next';
import { Suspense } from 'react';
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';
import CartClient from './CartClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) return {};
  const t = await loadLocale(lang as Language);
  return {
    title: `${t.delivery.cart.title} | 낼름`,
    robots: { index: false, follow: false },
  };
}

export default function CartPage() {
  return (
    <Suspense>
      <CartClient />
    </Suspense>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { useI18n } from '@/lib/i18n/context';
import DeliveryFloatingNav from '../DeliveryFloatingNav';

// maplibre-gl 은 window 의존 — SSR 비활성으로 클라이언트에서만 로드.
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
      …
    </div>
  ),
});

export default function DeliveryMapClient() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <DeliveryFloatingNav />
      <div className="container mx-auto px-4 pt-6 pb-3 max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">{t.delivery.map.title}</h1>
        <p className="text-text-muted text-sm">{t.delivery.map.subtitle}</p>
      </div>
      <div className="relative w-full h-[calc(100vh-7rem)]">
        <MapView />
      </div>
    </div>
  );
}

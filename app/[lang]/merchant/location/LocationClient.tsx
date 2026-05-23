'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';

interface Restaurant {
  id: string;
  name: string;
  place_type: string;
  lat: number | string | null;
  lng: number | string | null;
}
interface Live {
  id: string;
  lat: number;
  lng: number;
  label: string | null;
}

const DEFAULT_POS = { lng: 126.9784, lat: 37.5666 }; // 서울 시청

const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">…</div>
  ),
});

export default function LocationClient({
  restaurant,
  live,
}: {
  restaurant: Restaurant;
  live: Live | null;
}) {
  const { t, language } = useI18n();

  const initialPos = useMemo(() => {
    if (live) return { lng: live.lng, lat: live.lat };
    if (restaurant.lat != null && restaurant.lng != null) {
      return { lng: Number(restaurant.lng), lat: Number(restaurant.lat) };
    }
    return DEFAULT_POS;
  }, [live, restaurant.lat, restaurant.lng]);

  const [pos, setPos] = useState(initialPos);
  const [label, setLabel] = useState(live?.label ?? '');
  const [liveId, setLiveId] = useState<string | null>(live?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (restaurant.place_type !== 'food_truck') {
    return (
      <div className="max-w-xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold mb-1">{t.merchant.locationTitle}</h1>
          <p className="text-text-muted text-sm">{restaurant.name}</p>
        </header>
        <div className="rounded-xl bg-background-secondary border border-white/10 p-6 text-center">
          <p className="text-text-secondary mb-4">{t.merchant.foodTruckOnly}</p>
          <Link
            href={`/${language}/merchant/restaurant`}
            className="inline-block px-4 py-2 rounded-lg bg-accent-warm text-background-primary font-bold text-sm hover:bg-accent-warm/90 transition-colors"
          >
            {t.merchant.navRestaurant}
          </Link>
        </div>
      </div>
    );
  }

  async function publish() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    const supabase = createClient();
    const now = new Date().toISOString();

    // 기존 live 위치 종료
    await supabase
      .from('delivery_truck_locations')
      .update({ status: 'ended', ends_at: now })
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'live');

    const { data, error: err } = await supabase
      .from('delivery_truck_locations')
      .insert({
        restaurant_id: restaurant.id,
        lat: pos.lat,
        lng: pos.lng,
        label: label.trim() || null,
        status: 'live',
        starts_at: now,
      })
      .select('id')
      .single();

    setBusy(false);
    if (err || !data) {
      setError(err?.message ?? 'failed');
      return;
    }
    setLiveId(data.id);
    setMsg(t.merchant.locationPublished);
    window.setTimeout(() => setMsg(null), 2500);
  }

  async function endService() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('delivery_truck_locations')
      .update({ status: 'ended', ends_at: new Date().toISOString() })
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'live');

    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setLiveId(null);
    setMsg(t.merchant.locationEnded);
    window.setTimeout(() => setMsg(null), 2500);
  }

  return (
    <div className="max-w-2xl">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t.merchant.locationTitle}</h1>
          <p className="text-text-muted text-sm">{t.merchant.locationSubtitle}</p>
        </div>
        {liveId ? (
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-success/20 text-success text-xs font-bold">
            ● {t.merchant.liveBadge}
          </span>
        ) : (
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-text-muted/20 text-text-muted text-xs">
            {t.merchant.noLiveLocation}
          </span>
        )}
      </header>

      <div className="w-full h-[55vh] mb-4">
        <LocationMap position={pos} onChange={setPos} />
      </div>

      <label className="block mb-4">
        <span className="text-xs text-text-muted mb-1 block">{t.merchant.locationLabel}</span>
        <InputBoxWrapper className="!bg-background-secondary !rounded-lg !px-3 !py-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t.merchant.locationLabelPlaceholder}
            className={INPUT_INNER_COMFORTABLE_CLASS}
            style={INPUT_INNER_STYLE}
            data-testid="loc-label"
          />
        </InputBoxWrapper>
      </label>

      {error && (
        <div className="text-sm text-error bg-error/10 rounded-lg p-3 mb-3">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={publish}
          disabled={busy}
          className="px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold disabled:opacity-40 hover:bg-accent-warm/90 transition-colors"
          data-testid="loc-publish"
        >
          {t.merchant.goLive}
        </button>
        {liveId && (
          <button
            onClick={endService}
            disabled={busy}
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold disabled:opacity-40 transition-colors"
            data-testid="loc-end"
          >
            {t.merchant.endLive}
          </button>
        )}
        {msg && <span className="text-success text-sm">✓ {msg}</span>}
      </div>
    </div>
  );
}

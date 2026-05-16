'use client';

import { useState, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';

const PlaceLocationPicker = dynamic(
  () => import('@/components/Merchant/PlaceLocationPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">
        …
      </div>
    ),
  },
);

export default function OnboardingClient({ lang }: { lang: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();

  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
    cuisine: '',
    delivery_fee: 3000,
    min_order: 12000,
    avg_cook_time: 25,
    lat: null as number | null,
    lng: null as number | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || !user) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const cuisineTypes = form.cuisine
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const { data, error: err } = await supabase
      .from('delivery_restaurants')
      .insert({
        owner_id: user.id,
        name: form.name,
        description: form.description || null,
        cuisine_types: cuisineTypes,
        phone: form.phone || null,
        address: form.address || null,
        lat: form.lat,
        lng: form.lng,
        delivery_fee: form.delivery_fee,
        min_order_price: form.min_order,
        avg_cook_time_min: form.avg_cook_time,
        is_active: true,
        is_open: false,
      })
      .select('id')
      .single();

    if (err || !data) {
      setError(err?.message ?? 'Unknown error');
      setSubmitting(false);
      return;
    }
    router.push(`/${lang}/merchant`);
  }

  return (
    <div className="max-w-xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t.merchant.registerTitle}</h1>
        <p className="text-text-muted text-sm">{t.merchant.registerSubtitle}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs text-text-muted mb-1 block">{t.merchant.nameLabel} *</span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none"
            data-testid="form-name"
          />
        </label>

        <label className="block">
          <span className="text-xs text-text-muted mb-1 block">{t.merchant.descLabel}</span>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none resize-none"
            data-testid="form-description"
          />
        </label>

        <label className="block">
          <span className="text-xs text-text-muted mb-1 block">{t.merchant.cuisineLabel}</span>
          <input
            type="text"
            value={form.cuisine}
            onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
            placeholder={t.merchant.cuisinePlaceholder}
            className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none"
            data-testid="form-cuisine"
          />
        </label>

        <label className="block">
          <span className="text-xs text-text-muted mb-1 block">{t.merchant.phoneLabel}</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none"
            data-testid="form-phone"
          />
        </label>

        <label className="block">
          <span className="text-xs text-text-muted mb-1 block">{t.merchant.addressLabel}</span>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none"
            data-testid="form-address"
          />
        </label>

        <div className="block">
          <span className="text-xs text-text-muted mb-1 block">{t.merchant.locationPickerLabel}</span>
          <div className="w-full h-64" data-testid="form-location">
            <PlaceLocationPicker
              value={form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng } : null}
              onChange={(p) => setForm({ ...form, lat: p.lat, lng: p.lng })}
              searchPlaceholder={t.merchant.locationSearchPlaceholder}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs text-text-muted mb-1 block">{t.merchant.deliveryFeeLabel}</span>
            <input
              type="number"
              min={0}
              value={form.delivery_fee}
              onChange={(e) => setForm({ ...form, delivery_fee: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none"
              data-testid="form-delivery-fee"
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-muted mb-1 block">{t.merchant.minOrderLabel}</span>
            <input
              type="number"
              min={0}
              value={form.min_order}
              onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none"
              data-testid="form-min-order"
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-muted mb-1 block">{t.merchant.avgCookTimeLabel}</span>
            <input
              type="number"
              min={1}
              value={form.avg_cook_time}
              onChange={(e) => setForm({ ...form, avg_cook_time: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none"
              data-testid="form-cook-time"
            />
          </label>
        </div>

        {error && (
          <div className="text-sm text-error bg-error/10 rounded-lg p-3" data-testid="form-error">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !form.name}
          className="w-full px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-warm/90 transition-colors"
          data-testid="onboarding-submit"
        >
          {submitting ? t.merchant.saving : t.merchant.registerRestaurant}
        </button>
      </form>
    </div>
  );
}

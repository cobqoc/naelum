'use client';

import { useState, FormEvent } from 'react';
import dynamic from 'next/dynamic';
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

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  cuisine_types: string[];
  phone: string | null;
  address: string | null;
  lat: number | string | null;
  lng: number | string | null;
  delivery_fee: number;
  min_order_price: number;
  avg_cook_time_min: number;
  is_open: boolean;
  is_active: boolean;
  place_type: string;
}

export default function RestaurantEditClient({ restaurant }: { restaurant: Restaurant }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: restaurant.name,
    description: restaurant.description ?? '',
    phone: restaurant.phone ?? '',
    address: restaurant.address ?? '',
    cuisine: restaurant.cuisine_types.join(', '),
    delivery_fee: restaurant.delivery_fee,
    min_order: restaurant.min_order_price,
    avg_cook_time: restaurant.avg_cook_time_min,
    place_type: restaurant.place_type === 'food_truck' ? 'food_truck' : 'restaurant',
    lat: (restaurant.lat == null ? null : Number(restaurant.lat)) as number | null,
    lng: (restaurant.lng == null ? null : Number(restaurant.lng)) as number | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSavedMessage(null);
    setError(null);

    const supabase = createClient();
    const cuisineTypes = form.cuisine.split(',').map((c) => c.trim()).filter(Boolean);

    const { error: err } = await supabase
      .from('delivery_restaurants')
      .update({
        name: form.name,
        description: form.description || null,
        phone: form.phone || null,
        address: form.address || null,
        cuisine_types: cuisineTypes,
        lat: form.lat,
        lng: form.lng,
        delivery_fee: form.delivery_fee,
        min_order_price: form.min_order,
        avg_cook_time_min: form.avg_cook_time,
        place_type: form.place_type,
      })
      .eq('id', restaurant.id);

    setSubmitting(false);
    if (err) {
      setError(err.message);
    } else {
      setSavedMessage(t.merchant.saved);
      window.setTimeout(() => setSavedMessage(null), 2000);
    }
  }

  return (
    <div className="max-w-xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t.merchant.navRestaurant}</h1>
        <p className="text-text-muted text-sm">{restaurant.name}</p>
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
            data-testid="edit-name"
          />
        </label>

        <label className="block">
          <span className="text-xs text-text-muted mb-1 block">{t.merchant.descLabel}</span>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none resize-none"
          />
        </label>

        <label className="block">
          <span className="text-xs text-text-muted mb-1 block">{t.merchant.placeTypeLabel}</span>
          <select
            value={form.place_type}
            onChange={(e) => setForm({ ...form, place_type: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none"
            data-testid="edit-place-type"
          >
            <option value="restaurant">{t.merchant.placeTypeRestaurant}</option>
            <option value="food_truck">{t.merchant.placeTypeFoodTruck}</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-text-muted mb-1 block">{t.merchant.cuisineLabel}</span>
          <input
            type="text"
            value={form.cuisine}
            onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
            placeholder={t.merchant.cuisinePlaceholder}
            className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-text-muted mb-1 block">{t.merchant.phoneLabel}</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-muted mb-1 block">{t.merchant.addressLabel}</span>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-white/10 focus:border-accent-warm focus:outline-none"
            />
          </label>
        </div>

        <div className="block">
          <span className="text-xs text-text-muted mb-1 block">{t.merchant.locationPickerLabel}</span>
          <div className="w-full h-64" data-testid="edit-location">
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
            />
          </label>
        </div>

        {error && (
          <div className="text-sm text-error bg-error/10 rounded-lg p-3">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold disabled:opacity-40 hover:bg-accent-warm/90 transition-colors"
            data-testid="edit-save"
          >
            {submitting ? t.merchant.saving : t.merchant.saveButton}
          </button>
          {savedMessage && (
            <span className="text-success text-sm" data-testid="edit-saved">
              ✓ {savedMessage}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

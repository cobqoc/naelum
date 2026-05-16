import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LocationClient from './LocationClient';

export const dynamic = 'force-dynamic';

export default async function MerchantLocationPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/login?redirect=/${lang}/merchant/location`);

  const { data: restaurant } = await supabase
    .from('delivery_restaurants')
    .select('id, name, place_type, lat, lng')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!restaurant) redirect(`/${lang}/merchant/onboarding`);

  // 현재 공개 중(live) 위치 — 푸드트럭만 의미 있음
  let live: { id: string; lat: number; lng: number; label: string | null } | null = null;
  if (restaurant.place_type === 'food_truck') {
    const { data: rows } = await supabase
      .from('delivery_truck_locations')
      .select('id, lat, lng, label')
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'live')
      .order('starts_at', { ascending: false })
      .limit(1);
    const r = rows?.[0];
    live = r ? { id: r.id, lat: Number(r.lat), lng: Number(r.lng), label: r.label } : null;
  }

  return <LocationClient restaurant={restaurant} live={live} />;
}

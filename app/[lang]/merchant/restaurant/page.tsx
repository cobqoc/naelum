import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RestaurantEditClient from './RestaurantEditClient';

export const dynamic = 'force-dynamic';

export default async function MerchantRestaurantPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/login?redirect=/${lang}/merchant/restaurant`);

  const { data: restaurant } = await supabase
    .from('delivery_restaurants')
    .select('id, name, description, cuisine_types, phone, address, lat, lng, delivery_fee, min_order_price, avg_cook_time_min, is_open, is_active, place_type')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!restaurant) redirect(`/${lang}/merchant/onboarding`);

  return <RestaurantEditClient restaurant={restaurant} />;
}

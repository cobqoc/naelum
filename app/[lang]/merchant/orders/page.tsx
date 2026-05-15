import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MerchantOrdersClient from './MerchantOrdersClient';

export const dynamic = 'force-dynamic';

export default async function MerchantOrdersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/login?redirect=/${lang}/merchant/orders`);

  const { data: restaurant } = await supabase
    .from('delivery_restaurants')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!restaurant) redirect(`/${lang}/merchant/onboarding`);

  return <MerchantOrdersClient restaurantId={restaurant.id} restaurantName={restaurant.name} />;
}

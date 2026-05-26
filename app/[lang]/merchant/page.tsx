import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MerchantDashboardClient from './MerchantDashboardClient';

export const dynamic = 'force-dynamic';

export default async function MerchantDashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/signin?redirect=/${lang}/merchant`);

  const { data: restaurant } = await supabase
    .from('delivery_restaurants')
    .select('id, name, is_open, delivery_fee, min_order_price, avg_cook_time_min, rating, rating_count')
    .eq('owner_id', user.id)
    .maybeSingle();

  // 식당 없으면 onboarding으로
  if (!restaurant) redirect(`/${lang}/merchant/onboarding`);

  // 오늘 주문 통계
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data: todayOrders } = await supabase
    .from('delivery_orders')
    .select('id, status, total')
    .eq('restaurant_id', restaurant.id)
    .gte('placed_at', startOfDay.toISOString());

  const orderCount = todayOrders?.length ?? 0;
  const revenue = (todayOrders ?? [])
    .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((s, o) => s + o.total, 0);
  const pendingCount = (todayOrders ?? []).filter((o) => o.status === 'paid').length;
  const preparingCount = (todayOrders ?? []).filter((o) =>
    ['accepted', 'preparing', 'ready'].includes(o.status)
  ).length;

  return (
    <MerchantDashboardClient
      lang={lang}
      restaurant={restaurant}
      stats={{ orderCount, revenue, pendingCount, preparingCount }}
    />
  );
}

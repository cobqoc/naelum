import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingClient from './OnboardingClient';

export const dynamic = 'force-dynamic';

export default async function MerchantOnboardingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/signin?redirect=/${lang}/merchant/onboarding`);

  // 이미 식당 있으면 dashboard로
  const { data: existing } = await supabase
    .from('delivery_restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (existing) redirect(`/${lang}/merchant`);

  return <OnboardingClient lang={lang} />;
}

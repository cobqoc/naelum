import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MerchantLayoutClient from './MerchantLayoutClient';

// 사장님 어드민 — auth 필수.
// 진입은 /admin 사이드바에서만. 다른 곳(홈/Header/BottomNav) 노출 X.
// 한 사용자가 여러 식당을 가질 수 있으나 일단 첫 번째 식당만 다룸 (MVP).
export default async function MerchantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${lang}/login?redirect=/${lang}/merchant`);
  }

  // 본인 소유 식당 조회 (없으면 onboarding으로)
  const { data: restaurant } = await supabase
    .from('delivery_restaurants')
    .select('id, name, is_open, is_active, place_type')
    .eq('owner_id', user.id)
    .maybeSingle();

  return (
    <MerchantLayoutClient
      lang={lang}
      restaurant={restaurant}
      userEmail={user.email ?? ''}
    >
      {children}
    </MerchantLayoutClient>
  );
}

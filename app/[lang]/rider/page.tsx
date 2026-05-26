import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RiderHomeClient from './RiderHomeClient';

export const dynamic = 'force-dynamic';

export default async function RiderHomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/signin?redirect=/${lang}/rider`);

  // 라이더 프로필 조회 (없으면 setup 화면 표시)
  const { data: profile } = await supabase
    .from('delivery_rider_profiles')
    .select('user_id, status, vehicle_type, total_deliveries, rating')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <RiderHomeClient
      lang={lang}
      userId={user.id}
      userEmail={user.email ?? ''}
      initialProfile={profile}
    />
  );
}

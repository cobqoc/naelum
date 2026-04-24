import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getVerifiedUserIdFromHeaders } from '@/lib/supabase/middleware';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '낼름 - 냉장고 열고 바로 만드는 한식 레시피',
  description: '보유한 재료로 만들 수 있는 요리를 바로 추천해드려요. 냉장고를 등록하고 시들기 전에 비워보세요.',
  openGraph: {
    title: '낼름 - 냉장고 열고 바로 만드는 한식',
    description: '보유한 재료로 만들 수 있는 요리를 바로 추천해드려요',
  },
};

export default async function HomePage() {
  const userId = await getVerifiedUserIdFromHeaders();

  let initialUsername: string | null = null;
  let initialOnboardingStep: number | null = null;
  let initialOnboardingCompleted: boolean | null = null;
  let initialItems: unknown[] | null = null;

  if (userId) {
    const supabase = await createClient();
    // profile + items 병렬 fetch — 초기 렌더에서 빈 냉장고 flicker 제거.
    // CSR에서도 fetchItems가 한 번 더 돌아 stale 데이터(타 기기 수정) 방어.
    const [profileRes, itemsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('username, onboarding_step, onboarding_completed')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('user_ingredients')
        .select('id, ingredient_name, category, expiry_date, storage_location, quantity, unit, purchase_date, notes, expiry_alert')
        .eq('user_id', userId)
        .order('expiry_date', { ascending: true, nullsFirst: false }),
    ]);
    initialUsername = profileRes.data?.username ?? null;
    initialOnboardingStep = profileRes.data?.onboarding_step ?? null;
    initialOnboardingCompleted = profileRes.data?.onboarding_completed ?? null;
    initialItems = itemsRes.data ?? [];
  }

  return (
    <HomeClient
      isAuthenticated={!!userId}
      initialUsername={initialUsername}
      initialOnboardingStep={initialOnboardingStep}
      initialOnboardingCompleted={initialOnboardingCompleted}
      initialItems={initialItems}
    />
  );
}

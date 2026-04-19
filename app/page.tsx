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

  if (userId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('profiles')
      .select('username, onboarding_step')
      .eq('id', userId)
      .maybeSingle();
    initialUsername = data?.username ?? null;
    initialOnboardingStep = data?.onboarding_step ?? null;
  }

  return (
    <HomeClient
      isAuthenticated={!!userId}
      initialUsername={initialUsername}
      initialOnboardingStep={initialOnboardingStep}
    />
  );
}

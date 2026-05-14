import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getVerifiedUserIdFromHeaders } from '@/lib/supabase/middleware';
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';
import HomeClient from './HomeClient';

// 홈은 user/items SSR fetch가 있어 dynamic 유지. 비인증 사용자 페이지는 fully cached 가능하지만
// 인증 헤더 매번 검증해야 하므로 dynamic 필요.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) return {};
  const t = await loadLocale(lang as Language);
  const title = `낼름 — ${t.home.tagline}`;
  const description = t.home.taglineSub;
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description },
  };
}

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

import { createClient } from '@/lib/supabase/server';
import { getVerifiedUserIdFromHeaders } from '@/lib/supabase/middleware';
import HomeClient from './HomeClient';
import { selectUserIngredientsWithMaster } from '@/lib/queries/userIngredients';

// 홈은 user/items SSR fetch가 있어 dynamic 유지. 비인증 사용자 페이지는 fully cached 가능하지만
// 인증 헤더 매번 검증해야 하므로 dynamic 필요.
export const dynamic = 'force-dynamic';

// 메타데이터: [lang]/layout.tsx 의 generateMetadata 와 글자 그대로 같은 사본이 여기에도 있었다 → 레이아웃 것 하나만 둔다
// (홈의 최종 메타데이터 동일, 같은 segment 이중 정의 제거 — 2026-10-04).

export default async function HomePage() {
  const userId = await getVerifiedUserIdFromHeaders();

  let initialUsername: string | null = null;
  let initialOnboardingStep: number | null = null;
  let initialOnboardingCompleted: boolean | null = null;
  let initialItems: unknown[] | null = null;

  if (userId) {
    const supabase = await createClient();
    // profile + items 병렬 fetch — 초기 렌더에서 빈 냉장고 flicker 제거.
    // items 는 API(/api/user-ingredients?withMaster=1)와 같은 도감 조인·평탄화라 재료 이모지·보관기간 추정이
    // 첫 화면부터 보이고, 클라가 마운트 직후 같은 조회를 반복하지 않는다 (perf 2026-09-28).
    // 이후 재조회(탭 복귀 등 auth 이벤트·fridge-updated)는 useFridgeItems 가 그대로 수행.
    const [profileRes, itemsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('username, onboarding_step, onboarding_completed')
        .eq('id', userId)
        .maybeSingle(),
      selectUserIngredientsWithMaster(supabase, userId),
    ]);
    initialUsername = profileRes.data?.username ?? null;
    initialOnboardingStep = profileRes.data?.onboarding_step ?? null;
    initialOnboardingCompleted = profileRes.data?.onboarding_completed ?? null;
    initialItems = itemsRes.items ?? [];
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

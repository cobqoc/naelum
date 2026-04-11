import { SupabaseClient } from '@supabase/supabase-js';

function generateTempUsername(): string {
  return `user${Math.floor(1000 + Math.random() * 9000)}`;
}

export interface ProfileInsertData {
  id: string;
  email: string;
  authProvider: 'email' | 'google' | 'kakao';
  marketingConsent?: boolean;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
}

/** 새 프로필을 임시 username으로 생성합니다 */
export async function createProfile(
  supabase: SupabaseClient,
  data: ProfileInsertData
): Promise<{ error?: string }> {
  const row: Record<string, unknown> = {
    id: data.id,
    email: data.email,
    username: generateTempUsername(),
    auth_provider: data.authProvider,
    onboarding_completed: data.onboardingCompleted ?? true,
    onboarding_step: data.onboardingStep ?? 4,
  };

  if (data.marketingConsent !== undefined) {
    row.marketing_consent = data.marketingConsent;
    row.marketing_consent_at = new Date().toISOString();
  }

  const { error } = await supabase.from('profiles').insert(row);
  return { error: error?.message };
}

/** 기존 프로필의 마케팅 동의를 업데이트합니다 */
export async function updateMarketingConsent(
  supabase: SupabaseClient,
  userId: string,
  consent: boolean
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({
      marketing_consent: consent,
      marketing_consent_at: new Date().toISOString(),
    })
    .eq('id', userId);
  return { error: error?.message };
}

/** 약관 동의 후 온보딩 상태 초기화 및 마케팅 동의를 저장합니다 */
export async function beginOnboarding(
  supabase: SupabaseClient,
  userId: string,
  marketingConsent: boolean
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: false,
      onboarding_step: 0,
      marketing_consent: marketingConsent,
      marketing_consent_at: new Date().toISOString(),
    })
    .eq('id', userId);
  return { error: error?.message };
}

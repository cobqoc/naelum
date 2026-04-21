import { SupabaseClient } from '@supabase/supabase-js';

function generateTempUsername(): string {
  return `user${Math.floor(10000000 + Math.random() * 90000000)}`;
}

export interface ProfileInsertData {
  id: string;
  email: string;
  authProvider: 'email' | 'google' | 'kakao';
  marketingConsent?: boolean;
  /** 이용약관 동의 여부 — true일 때만 terms_agreed_at 기록 */
  termsAgreed?: boolean;
  /** 개인정보처리방침 동의 여부 — true일 때만 privacy_agreed_at 기록 */
  privacyAgreed?: boolean;
  /** 생년월일 YYYY-MM-DD (선택 제공) */
  birthDate?: string | null;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
}

/** 새 프로필을 임시 username으로 생성합니다 */
export async function createProfile(
  supabase: SupabaseClient,
  data: ProfileInsertData
): Promise<{ error?: string }> {
  const now = new Date().toISOString();
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
    row.marketing_consent_at = now;
  }
  // GDPR Art. 7 감사 기록 — 동의 시점 저장
  if (data.termsAgreed) row.terms_agreed_at = now;
  if (data.privacyAgreed) row.privacy_agreed_at = now;
  if (data.birthDate) row.birth_date = data.birthDate;

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

/** 약관 동의 후 온보딩 상태 초기화 및 동의 기록을 저장합니다 */
export async function beginOnboarding(
  supabase: SupabaseClient,
  userId: string,
  marketingConsent: boolean,
  options?: { termsAgreed?: boolean; privacyAgreed?: boolean; birthDate?: string | null }
): Promise<{ error?: string }> {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    onboarding_completed: false,
    onboarding_step: 0,
    marketing_consent: marketingConsent,
    marketing_consent_at: now,
  };
  if (options?.termsAgreed) update.terms_agreed_at = now;
  if (options?.privacyAgreed) update.privacy_agreed_at = now;
  if (options?.birthDate) update.birth_date = options.birthDate;

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', userId);
  return { error: error?.message };
}

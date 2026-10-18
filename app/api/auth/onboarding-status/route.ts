import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { newServiceRoleClient } from '@/lib/supabase/service';

// 약관 동의 페이지 게이트용 — 본인 온보딩 상태 조회.
// 데이터 계층 이전(docs/DATA_LAYER.md): terms-agreement checkSession 의 profile read 를 서버로.
export async function GET() {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  // profiles 민감 컬럼(email·생년월일·동의 기록 등)은 authenticated 에 SELECT 권한이 없다(20261019_profiles_column_privileges.sql)
  // → 본인 행만 service-role 로 읽는다(id = 인증된 user.id 고정).
  const { data: profile, error } = await newServiceRoleClient()
    .from('profiles')
    .select('onboarding_completed, auth_provider, email')
    .eq('id', user!.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    onboardingCompleted: profile?.onboarding_completed ?? false,
    authProvider: profile?.auth_provider ?? null,
    email: profile?.email ?? user!.email ?? '',
  });
}

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { createProfile, beginOnboarding } from '@/lib/auth/profile';
import { checkMinAge } from '@/lib/auth/ageGate';

// 회원가입 완료 — 약관 동의 기록 + 프로필 생성/갱신.
// 데이터 계층 이전(docs/DATA_LAYER.md): set-password·terms-agreement 가 클라에서 하던
// 프로필 존재확인 read + createProfile/beginOnboarding mutation 을 서버로 통합.
// ⚠️ /api/auth/* 라야 온보딩 미완 세션도 미들웨어 게이트(proxy.ts)를 통과(가입 완료에 필요).
type Provider = 'email' | 'google' | 'kakao';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const authProvider: Provider =
    body.authProvider === 'google' || body.authProvider === 'kakao' ? body.authProvider : 'email';
  const marketingConsent = body.marketingConsent === true;
  const birthDate = typeof body.birthDate === 'string' ? body.birthDate : '';
  // createProfile 경로의 온보딩 상태(미지정 시 createProfile 기본값 = 완료). terms 는 false/0 전달.
  const onboardingCompleted: boolean | undefined =
    typeof body.onboardingCompleted === 'boolean' ? body.onboardingCompleted : undefined;
  const onboardingStep: number | undefined =
    typeof body.onboardingStep === 'number' ? body.onboardingStep : undefined;

  // 연령 게이트 — 서버에서도 검증(클라 신뢰 안 함)
  if (!birthDate) {
    return NextResponse.json({ error: 'birth_date_required' }, { status: 400 });
  }
  if (!checkMinAge(birthDate).meetsMinimum) {
    return NextResponse.json({ error: 'age_gate' }, { status: 400 });
  }

  // 프로필 존재 여부 (authenticated 본인 read — RLS 통과)
  const { data: existing, error: readErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user!.id)
    .maybeSingle();
  if (readErr) {
    return NextResponse.json({ error: readErr.message }, { status: 500 });
  }

  const consents = { termsAgreed: true, privacyAgreed: true, copyrightAgreed: true, birthDate };

  if (!existing) {
    const { error } = await createProfile(supabase, {
      id: user!.id,
      email: user!.email ?? '',
      authProvider,
      onboardingCompleted,
      onboardingStep,
      marketingConsent,
      ...consents,
    });
    if (error) return NextResponse.json({ error }, { status: 500 });
  } else {
    const { error } = await beginOnboarding(supabase, user!.id, marketingConsent, consents);
    if (error) return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, created: !existing });
}

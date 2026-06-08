import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// cookieConsent context 전용 — 본인 쿠키동의 상태(DB가 localStorage보다 최신이면 동기화용).
// 데이터 계층 이전(docs/DATA_LAYER.md). 쓰기(saveConsent)는 클라 유지.
export async function GET() {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { data, error } = await supabase
    .from('profiles')
    .select('cookie_consent_version, cookie_consent_analytics, cookie_consent_marketing, cookie_consent_at')
    .eq('id', user!.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ consent: data ?? null });
}

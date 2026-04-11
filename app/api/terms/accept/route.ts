import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

const CURRENT_TERMS_VERSION = '1.0';

// POST /api/terms/accept - 이용약관 동의 기록
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  let version = CURRENT_TERMS_VERSION;
  try {
    const body = await request.json();
    if (body.version) version = body.version;
  } catch {
    // version 파라미터 없으면 현재 버전 사용
  }

  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_terms_acceptance')
    .upsert(
      {
        user_id: user.id,
        terms_version: version,
        accepted_at: new Date().toISOString(),
        ip_address: ipAddress,
      },
      { onConflict: 'user_id,terms_version' }
    );

  if (error) {
    return NextResponse.json({ error: '약관 동의 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, version });
}

// GET /api/terms/accept - 약관 동의 여부 확인
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const version = searchParams.get('version') || CURRENT_TERMS_VERSION;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('user_terms_acceptance')
    .select('accepted_at, terms_version')
    .eq('user_id', user.id)
    .eq('terms_version', version)
    .maybeSingle();

  return NextResponse.json({
    accepted: !!data,
    acceptedAt: data?.accepted_at || null,
    version,
  });
}

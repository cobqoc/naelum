import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// auth context 전용 — 본인 프로필 요약(username·avatar). 부트스트랩 경로라 /api/users/me(4쿼리)
// 대신 단일 컬럼 조회로 가볍게. 데이터 계층 이전(docs/DATA_LAYER.md).
export async function GET() {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { data, error } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user!.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data ?? null });
}

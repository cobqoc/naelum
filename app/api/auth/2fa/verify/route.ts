import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { loadVerifiedTotp, TOTP_VERIFY_GUARD } from '@/lib/api/totpGuard';

// POST: Verify TOTP code and enable 2FA
// 2026-10-04 AG2-32: 코드 검증~TOTP 확인 42줄(disable 과 사본) → lib/api/totpGuard 공용(문구·상태코드 옵션으로 보존).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const guard = await loadVerifiedTotp(request, supabase, user.id, TOTP_VERIFY_GUARD);
  if (guard.response) return guard.response;
  const totpRecord = guard.record;

  // Enable 2FA
  const { error: updateError } = await supabase
    .from('user_totp_secrets')
    .update({
      is_enabled: true,
      verified_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: '2FA 활성화 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    backupCodes: totpRecord.backup_codes,
  });
}

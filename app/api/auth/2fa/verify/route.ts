import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { verifyTOTP, decryptSecret } from '@/lib/security/totp';

// POST: Verify TOTP code and enable 2FA
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();
  const { code } = body;

  if (!code || typeof code !== 'string' || code.length !== 6) {
    return NextResponse.json({ error: '6자리 인증 코드를 입력해주세요.' }, { status: 400 });
  }

  // Get the TOTP record
  const { data: totpRecord, error: fetchError } = await supabase
    .from('user_totp_secrets')
    .select('encrypted_secret, is_enabled, backup_codes')
    .eq('user_id', user.id)
    .single();

  if (fetchError || !totpRecord) {
    return NextResponse.json({ error: '2FA 설정을 먼저 시작해주세요.' }, { status: 400 });
  }

  if (totpRecord.is_enabled) {
    return NextResponse.json({ error: '2FA가 이미 활성화되어 있습니다.' }, { status: 400 });
  }

  // Decrypt the secret
  let secret: string;
  try {
    secret = decryptSecret(totpRecord.encrypted_secret);
  } catch {
    return NextResponse.json({ error: '암호화 키 오류입니다. 관리자에게 문의하세요.' }, { status: 500 });
  }

  // Verify the code
  if (!verifyTOTP(secret, code)) {
    return NextResponse.json({ error: '인증 코드가 올바르지 않습니다. 다시 시도해주세요.' }, { status: 400 });
  }

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

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { base32Encode } from '@/lib/security/totp';

function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

// GET: Check 2FA status
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { data } = await supabase
    .from('user_totp_secrets')
    .select('is_enabled, verified_at')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({
    isEnabled: data?.is_enabled ?? false,
    isVerified: !!data?.verified_at,
  });
}

// POST: Generate TOTP secret and start setup
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // Check if 2FA is already enabled
  const { data: existing } = await supabase
    .from('user_totp_secrets')
    .select('is_enabled')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing?.is_enabled) {
    return NextResponse.json({ error: '2FA가 이미 활성화되어 있습니다.' }, { status: 400 });
  }

  // Generate 20-byte random secret and encode as base32
  const secretBuffer = crypto.randomBytes(20);
  const secret = base32Encode(secretBuffer);

  // Generate backup codes
  const backupCodes = generateBackupCodes(8);

  // Build otpauth URL
  const issuer = encodeURIComponent('낼름');
  const account = encodeURIComponent(user.email || user.id);
  const otpauthUrl = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

  // Encrypt the secret for storage
  const encryptionKey = process.env.TOTP_ENCRYPTION_KEY;
  if (!encryptionKey) {
    return NextResponse.json({ error: '서버 설정 오류: TOTP 암호화 키가 설정되지 않았습니다.' }, { status: 500 });
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey.slice(0, 64), 'hex'), iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const encryptedSecret = iv.toString('hex') + ':' + encrypted;

  // Upsert the TOTP record (replace if setup was started but not verified)
  const { error } = await supabase
    .from('user_totp_secrets')
    .upsert({
      user_id: user.id,
      encrypted_secret: encryptedSecret,
      is_enabled: false,
      backup_codes: backupCodes,
      verified_at: null,
    }, { onConflict: 'user_id' });

  if (error) {
    return NextResponse.json({ error: '2FA 설정 중 오류가 발생했습니다.' }, { status: 500 });
  }

  return NextResponse.json({
    secret,
    otpauthUrl,
    backupCodes,
  });
}

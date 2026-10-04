import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyTOTP, decryptSecret } from '@/lib/security/totp';

/**
 * 2FA verify ↔ disable 라우트의 42줄 사본(코드 검증 → 레코드 조회 → 상태 검사 → 복호화 → TOTP 검증)을 1벌로.
 * (2026-10-04 AG2-32, 행위보존: 두 라우트의 차이 4개 — select 컬럼·레코드 없음 문구·상태 방향·상태 문구 — 를 옵션으로 보존)
 *
 * 순서·문구·상태코드(원본 그대로): 코드 400 → 레코드 없음 400 → 상태 400 → 복호화 실패 500 → 코드 불일치 400.
 * 인증(401 '로그인이 필요합니다.')은 각 라우트에 남긴다.
 */

export interface TotpRecord {
  encrypted_secret: string;
  is_enabled: boolean;
  backup_codes?: string[] | null;
}

export interface TotpGuardOptions {
  select: string;
  notFoundMessage: string;
  /** 통과하려면 2FA 가 활성(true, disable)·비활성(false, verify) 이어야 함 */
  requireEnabled: boolean;
  stateMessage: string;
}

/** POST /api/auth/2fa/verify — 미활성 레코드의 코드를 확인해 활성화 */
export const TOTP_VERIFY_GUARD: TotpGuardOptions = {
  select: 'encrypted_secret, is_enabled, backup_codes',
  notFoundMessage: '2FA 설정을 먼저 시작해주세요.',
  requireEnabled: false,
  stateMessage: '2FA가 이미 활성화되어 있습니다.',
};

/** POST /api/auth/2fa/disable — 활성 레코드의 코드를 확인해 삭제 */
export const TOTP_DISABLE_GUARD: TotpGuardOptions = {
  select: 'encrypted_secret, is_enabled',
  notFoundMessage: '2FA가 설정되어 있지 않습니다.',
  requireEnabled: true,
  stateMessage: '2FA가 활성화되어 있지 않습니다.',
};

const CODE_REQUIRED = '6자리 인증 코드를 입력해주세요.';

export async function loadVerifiedTotp(
  request: Request,
  supabase: SupabaseClient,
  userId: string,
  opts: TotpGuardOptions,
): Promise<{ record: TotpRecord; response?: undefined } | { response: NextResponse; record?: undefined }> {
  // 2026-10-04 AG2-49: 형식 오류 JSON·null 본문은 request.json() throw / 구조분해 TypeError 로 500 이었다
  // → 코드 누락과 같은 400(읽을 수 있는 코드가 없음). 정상 본문은 그대로.
  let body: { code?: unknown } | null;
  try {
    body = await request.json();
  } catch {
    return { response: NextResponse.json({ error: CODE_REQUIRED }, { status: 400 }) };
  }
  const code = body?.code;

  if (!code || typeof code !== 'string' || code.length !== 6) {
    return { response: NextResponse.json({ error: CODE_REQUIRED }, { status: 400 }) };
  }

  // Get the TOTP record
  const { data, error: fetchError } = await supabase
    .from('user_totp_secrets')
    .select(opts.select)
    .eq('user_id', userId)
    .single();
  const totpRecord = data as TotpRecord | null;

  if (fetchError || !totpRecord) {
    return { response: NextResponse.json({ error: opts.notFoundMessage }, { status: 400 }) };
  }

  // verify: 활성이면 거부 / disable: 비활성이면 거부 (원본의 `if (is_enabled)` / `if (!is_enabled)` 와 같은 진리값)
  if (Boolean(totpRecord.is_enabled) !== opts.requireEnabled) {
    return { response: NextResponse.json({ error: opts.stateMessage }, { status: 400 }) };
  }

  // Decrypt the secret
  let secret: string;
  try {
    secret = decryptSecret(totpRecord.encrypted_secret);
  } catch {
    return { response: NextResponse.json({ error: '암호화 키 오류입니다. 관리자에게 문의하세요.' }, { status: 500 }) };
  }

  // Verify the code
  if (!verifyTOTP(secret, code)) {
    return { response: NextResponse.json({ error: '인증 코드가 올바르지 않습니다. 다시 시도해주세요.' }, { status: 400 }) };
  }

  return { record: totpRecord };
}

import { describe, it, expect, beforeAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadVerifiedTotp, TOTP_VERIFY_GUARD, TOTP_DISABLE_GUARD, type TotpGuardOptions } from '../totpGuard';
import { encryptSecret, generateTOTP } from '@/lib/security/totp';

// 2026-10-04 AG2-32: 2FA verify↔disable 사본 → loadVerifiedTotp 1벌. 기대 문구·상태코드는 *원본 두 route.ts 리터럴* 그대로.
beforeAll(() => {
  process.env.TOTP_ENCRYPTION_KEY = 'b'.repeat(64);
});

const SECRET = 'JBSWY3DPEHPK3PXP';
const currentCode = () => generateTOTP(SECRET, Math.floor(Date.now() / 1000 / 30));

function fakeSupabase(record: Record<string, unknown> | null) {
  const seen: { select?: string; eq?: [string, unknown] } = {};
  const b = {
    select: (s: string) => { seen.select = s; return b; },
    eq: (c: string, v: unknown) => { seen.eq = [c, v]; return b; },
    single: async () => ({ data: record, error: record ? null : { code: 'PGRST116' } }),
  };
  return { client: { from: () => b } as unknown as SupabaseClient, seen };
}

const req = (body: unknown) =>
  new Request('http://localhost/api/auth/2fa/x', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });

async function run(opts: TotpGuardOptions, record: Record<string, unknown> | null, body: unknown) {
  const fake = fakeSupabase(record);
  const r = await loadVerifiedTotp(req(body), fake.client, 'u1', opts);
  if (r.response) return { status: r.response.status, json: await r.response.json(), seen: fake.seen };
  return { record: r.record, seen: fake.seen };
}

describe.each([
  { name: 'verify', opts: TOTP_VERIFY_GUARD, ok: false, bad: true, select: 'encrypted_secret, is_enabled, backup_codes',
    notFound: '2FA 설정을 먼저 시작해주세요.', state: '2FA가 이미 활성화되어 있습니다.' },
  { name: 'disable', opts: TOTP_DISABLE_GUARD, ok: true, bad: false, select: 'encrypted_secret, is_enabled',
    notFound: '2FA가 설정되어 있지 않습니다.', state: '2FA가 활성화되어 있지 않습니다.' },
])('loadVerifiedTotp — $name (원본 라우트와 같은 응답)', (c) => {
  const record = (isEnabled: boolean, encrypted = encryptSecret(SECRET)) =>
    ({ encrypted_secret: encrypted, is_enabled: isEnabled, backup_codes: ['AAAA-BBBB'] });

  it('코드 누락·형식 오류 → 400', async () => {
    for (const body of [{}, { code: 123456 }, { code: '12345' }, { code: '1234567' }]) {
      expect(await run(c.opts, record(c.ok), body)).toMatchObject({ status: 400, json: { error: '6자리 인증 코드를 입력해주세요.' } });
    }
  });

  it('(AG2-49) JSON 형식 오류·null 본문 → 같은 400 (이전 500)', async () => {
    for (const body of ['not-json', 'null']) {
      expect(await run(c.opts, record(c.ok), body)).toMatchObject({ status: 400, json: { error: '6자리 인증 코드를 입력해주세요.' } });
    }
  });

  it('레코드 없음 → 400 + 원본 select 컬럼·user 필터', async () => {
    const r = await run(c.opts, null, { code: '123456' });
    expect(r).toMatchObject({ status: 400, json: { error: c.notFound } });
    expect(r.seen).toEqual({ select: c.select, eq: ['user_id', 'u1'] });
  });

  it('상태 불일치 → 400', async () => {
    expect(await run(c.opts, record(c.bad), { code: currentCode() })).toMatchObject({ status: 400, json: { error: c.state } });
  });

  it('복호화 실패 → 500', async () => {
    expect(await run(c.opts, record(c.ok, 'zz:zz'), { code: currentCode() }))
      .toMatchObject({ status: 500, json: { error: '암호화 키 오류입니다. 관리자에게 문의하세요.' } });
  });

  it('코드 불일치 → 400', async () => {
    // ±1 스텝 허용 창(verifyTOTP drift=1)의 세 코드와 모두 다른 값으로 — 우연 일치 없는 결정적 테스트
    const step = Math.floor(Date.now() / 1000 / 30);
    const valid = new Set([-1, 0, 1].map(d => generateTOTP(SECRET, step + d)));
    const wrong = ['000000', '111111', '222222', '333333'].find(x => !valid.has(x))!;
    expect(await run(c.opts, record(c.ok), { code: wrong }))
      .toMatchObject({ status: 400, json: { error: '인증 코드가 올바르지 않습니다. 다시 시도해주세요.' } });
  });

  it('정상 → record 반환(라우트가 이어서 활성화/삭제)', async () => {
    const r = await run(c.opts, record(c.ok), { code: currentCode() });
    expect(r.record).toMatchObject({ is_enabled: c.ok, backup_codes: ['AAAA-BBBB'] });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  allowed: true,
  keys: [] as string[],
  configs: [] as unknown[],
  auth: null as unknown,
}));
vi.mock('@/lib/ratelimit', () => ({
  checkRateLimit: vi.fn(async (key: string, cfg: unknown) => {
    state.keys.push(key);
    state.configs.push(cfg);
    return { allowed: state.allowed };
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ verifyAdmin: vi.fn(async () => state.auth) }));

import { guardAdminApi, requireAdminRole } from '../adminGuard';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/supabase/admin';

// 2026-10-04 AG2-30: 관리자 API 상단 보일러플레이트 8벌 → guardAdminApi. 기대값은 *원본 route.ts 리터럴* 그대로.
const req = () => new Request('http://localhost/api/admin/x', { headers: { 'cf-connecting-ip': '1.2.3.4' } });
const ok = { user: { id: 'admin1' }, profile: { role: 'admin', username: 'a' }, supabase: {} };

beforeEach(() => {
  vi.mocked(verifyAdmin).mockClear();
  state.allowed = true;
  state.keys = [];
  state.configs = [];
  state.auth = ok;
});

describe('guardAdminApi', () => {
  it('기본(6개 GET·actions): 키 admin-api:<ip>, 10분/100회', async () => {
    const r = await guardAdminApi(req());
    expect(r.auth).toBe(ok);
    expect(state.keys).toEqual(['admin-api:1.2.3.4']);
    expect(state.configs).toEqual([{ windowMs: 600000, maxRequests: 100 }]);
  });

  it('기본 429 본문', async () => {
    state.allowed = false;
    const r = await guardAdminApi(req());
    expect(r.response!.status).toBe(429);
    expect(await r.response!.json()).toEqual({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });
  });

  it('analytics/events: 키 admin-analytics-events:<ip> + 429 "요청이 너무 많습니다."', async () => {
    state.allowed = false;
    const r = await guardAdminApi(req(), { rateKeyPrefix: 'admin-analytics-events', rateLimitedMessage: '요청이 너무 많습니다.' });
    expect(state.keys).toEqual(['admin-analytics-events:1.2.3.4']);
    expect(await r.response!.json()).toEqual({ error: '요청이 너무 많습니다.' });
  });

  it('인증 실패: 기본 { error } / actions 는 { error, code } — 상태코드는 verifyAdmin 그대로', async () => {
    for (const [status, code, error] of [
      [401, 'UNAUTHORIZED', '인증이 필요합니다'],
      [403, 'FORBIDDEN', '관리자 권한이 필요합니다'],
      [404, 'NOT_FOUND', '프로필을 찾을 수 없습니다'],
    ] as const) {
      state.auth = { error, status, code };
      const plain = await guardAdminApi(req());
      expect(plain.response!.status).toBe(status);
      expect(await plain.response!.json()).toEqual({ error });
      const withCode = await guardAdminApi(req(), { includeErrorCode: true });
      expect(await withCode.response!.json()).toEqual({ error, code });
    }
  });

  it('rate limit 거부 시 verifyAdmin 을 부르지 않음(원본 순서)', async () => {
    state.allowed = false;
    state.auth = { error: 'x', status: 401, code: 'UNAUTHORIZED' };
    const r = await guardAdminApi(req());
    expect(r.response!.status).toBe(429);
    expect(verifyAdmin).not.toHaveBeenCalled();
  });
});

// 2026-10-04 AG2-31: approve·pending 의 checkAdminRole + 인증 블록 → requireAdminRole. 문구는 원본 리터럴 그대로.
function roleClient(user: { id: string } | null, role: string | null) {
  const seen: unknown[] = [];
  const b = {
    select: (c: string) => { seen.push(['select', c]); return b; },
    eq: (c: string, v: unknown) => { seen.push(['eq', c, v]); return b; },
    maybeSingle: async () => ({ data: role === null ? null : { role }, error: null }),
  };
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: user ? null : { message: 'no' } }) },
    from: (t: string) => { seen.push(['from', t]); return b; },
  } as unknown as SupabaseClient;
  return { client, seen };
}

describe('requireAdminRole', () => {
  it('비로그인 → 401 requireAuth 본문', async () => {
    const r = await requireAdminRole(roleClient(null, null).client);
    expect(r.response!.status).toBe(401);
    expect(await r.response!.json()).toEqual({ error: '로그인이 필요합니다' });
  });

  it('관리자 아님·프로필 없음 → 403 관리자 권한이 필요합니다', async () => {
    for (const role of ['user', null]) {
      const r = await requireAdminRole(roleClient({ id: 'u1' }, role).client);
      expect(r.response!.status).toBe(403);
      expect(await r.response!.json()).toEqual({ error: '관리자 권한이 필요합니다' });
    }
  });

  it('관리자 → user 반환, 역할 조회는 profiles.role · id=user.id (원본 checkAdminRole 과 같은 쿼리)', async () => {
    const { client, seen } = roleClient({ id: 'admin1' }, 'admin');
    const r = await requireAdminRole(client);
    expect(r.user).toEqual({ id: 'admin1' });
    expect(seen).toEqual([['from', 'profiles'], ['select', 'role'], ['eq', 'id', 'admin1']]);
  });
});

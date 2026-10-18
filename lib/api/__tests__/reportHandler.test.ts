import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// rate limit 은 DB RPC — 테스트에선 허용/거부만 제어
const rateLimit = vi.hoisted(() => ({ allowed: true, keys: [] as string[] }));
vi.mock('@/lib/ratelimit', () => ({
  checkRateLimit: vi.fn(async (key: string) => {
    rateLimit.keys.push(key);
    return { allowed: rateLimit.allowed };
  }),
}));

import { handleReport, recipeReportConfig, tipReportConfig, userReportConfig, type ReportConfig } from '../reportHandler';

// 2026-10-04 API1-35: 신고 라우트 3벌 → handleReport 1벌. 기대값은 *원본 3개 route.ts 의 리터럴* 그대로.
type Scenario = {
  user: { id: string } | null;
  target: Record<string, unknown> | null; // 대상 조회(.single()) 결과
  existing: { id: string } | null; // 대기 중 중복 신고(.maybeSingle()) 결과
  insertError: { message: string } | null;
};
type Op = [string, unknown[]];

function fakeSupabase(s: Scenario) {
  const calls: { table: string; ops: Op[] }[] = [];
  const from = (table: string) => {
    const rec = { table, ops: [] as Op[] };
    calls.push(rec);
    const b = {
      select: (...a: unknown[]) => { rec.ops.push(['select', a]); return b; },
      eq: (...a: unknown[]) => { rec.ops.push(['eq', a]); return b; },
      single: async () => ({ data: s.target, error: s.target ? null : { code: 'PGRST116', message: '0 rows' } }),
      maybeSingle: async () => ({ data: s.existing, error: null }),
      insert: (row: unknown) => { rec.ops.push(['insert', [row]]); return Promise.resolve({ error: s.insertError }); },
    };
    return b;
  };
  const client = {
    auth: { getUser: async () => ({ data: { user: s.user }, error: s.user ? null : { message: 'no session' } }) },
    from,
  } as unknown as SupabaseClient;
  return { client, calls };
}

const req = (body: unknown) =>
  new Request('http://localhost/api/x', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });

const base: Scenario = { user: { id: 'u1' }, target: null, existing: null, insertError: null };

async function run(cfg: ReportConfig, s: Partial<Scenario>, body: unknown = { reason: 'spam', description: '  설명  ' }) {
  const fake = fakeSupabase({ ...base, ...s });
  const res = await handleReport(req(body), fake.client, cfg);
  return { status: res.status, json: await res.json(), calls: fake.calls };
}

beforeEach(() => {
  rateLimit.allowed = true;
  rateLimit.keys = [];
});

const cases = [
  {
    name: 'recipe',
    cfg: () => recipeReportConfig('R-ID'),
    target: { id: 'R-ID', author_id: 'owner' },
    selfTarget: { id: 'R-ID', author_id: 'u1' },
    table: 'recipes',
    targetOps: [['select', ['id, author_id']], ['eq', ['id', 'R-ID']]],
    reportedId: 'R-ID',
    key: 'report:u1',
    okReason: 'copyright',
    badReason: 'harassment',
    notFound: '레시피를 찾을 수 없습니다.',
    self: '자신의 레시피는 신고할 수 없습니다.',
    dup: '이미 신고가 접수된 레시피입니다.',
    success: '신고가 접수되었습니다. 검토 후 조치하겠습니다.',
  },
  {
    name: 'tip',
    cfg: () => tipReportConfig('T-ID'),
    target: { id: 'T-ID', author_id: 'owner' },
    selfTarget: { id: 'T-ID', author_id: 'u1' },
    table: 'tip',
    targetOps: [['select', ['id, author_id']], ['eq', ['id', 'T-ID']]],
    reportedId: 'T-ID',
    key: 'report:u1',
    okReason: 'false_info',
    badReason: 'impersonation',
    notFound: '팁을 찾을 수 없습니다.',
    self: '자신의 팁은 신고할 수 없습니다.',
    dup: '이미 신고가 접수된 팁입니다.',
    success: '신고가 접수되었습니다. 검토 후 조치하겠습니다.',
  },
  {
    name: 'user',
    cfg: () => userReportConfig('chef'),
    target: { id: 'P-ID' },
    selfTarget: { id: 'u1' },
    table: 'profiles',
    targetOps: [['select', ['id']], ['eq', ['username', 'chef']]],
    reportedId: 'P-ID',
    key: 'user-report:u1',
    okReason: 'harassment',
    badReason: 'copyright',
    notFound: '사용자를 찾을 수 없습니다.',
    self: '자기 자신을 신고할 수 없습니다.',
    dup: '이미 신고가 접수된 사용자입니다.',
    success: '신고가 접수되었습니다.',
  },
] as const;

describe.each(cases)('handleReport — $name 신고 (원본 라우트와 같은 응답)', (c) => {
  it('비로그인 → 401 requireAuth 본문', async () => {
    const r = await run(c.cfg(), { user: null });
    expect(r).toMatchObject({ status: 401, json: { error: '로그인이 필요합니다' } });
  });

  it('rate limit 초과 → 429, 키 접두사 원본과 동일', async () => {
    rateLimit.allowed = false;
    const r = await run(c.cfg(), { target: c.target });
    expect(r).toMatchObject({ status: 429, json: { error: '신고 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.' } });
    expect(rateLimit.keys).toEqual([c.key]);
  });

  it('JSON 아님 → 400', async () => {
    const r = await run(c.cfg(), { target: c.target }, 'not-json');
    expect(r).toMatchObject({ status: 400, json: { error: '잘못된 요청 형식입니다.' } });
  });

  it('사유 없음·다른 종류의 사유 → 400', async () => {
    for (const body of [{}, { reason: c.badReason }]) {
      const r = await run(c.cfg(), { target: c.target }, body);
      expect(r).toMatchObject({ status: 400, json: { error: '유효한 신고 사유를 선택해주세요.' } });
    }
  });

  it('대상 없음 → 404', async () => {
    const r = await run(c.cfg(), { target: null }, { reason: c.okReason });
    expect(r).toMatchObject({ status: 404, json: { error: c.notFound } });
    expect(r.calls[0].table).toBe(c.table);
    expect(r.calls[0].ops).toEqual(c.targetOps);
  });

  it('자기 신고 → 400', async () => {
    const r = await run(c.cfg(), { target: c.selfTarget }, { reason: c.okReason });
    expect(r).toMatchObject({ status: 400, json: { error: c.self } });
  });

  it('대기 중 중복 → 409 (reports 필터 원본과 동일)', async () => {
    const r = await run(c.cfg(), { target: c.target, existing: { id: 'rep1' } }, { reason: c.okReason });
    expect(r).toMatchObject({ status: 409, json: { error: c.dup } });
    const dupCall = r.calls.find(x => x.table === 'reports')!;
    expect(dupCall.ops).toEqual([
      ['select', ['id']],
      ['eq', ['reporter_id', 'u1']],
      ['eq', ['reported_type', c.name]],
      ['eq', ['reported_id', c.reportedId]],
      ['eq', ['status', 'pending']],
    ]);
  });

  it('insert 실패 → 500', async () => {
    const r = await run(c.cfg(), { target: c.target, insertError: { message: 'x' } }, { reason: c.okReason });
    expect(r).toMatchObject({ status: 500, json: { error: '신고 처리 중 오류가 발생했습니다.' } });
  });

  it('성공 → 200 + insert 행(description trim·빈 값 null)', async () => {
    const r = await run(c.cfg(), { target: c.target }, { reason: c.okReason, description: '  설명  ' });
    expect(r).toEqual({ status: 200, json: { success: true, message: c.success }, calls: expect.anything() });
    const insert = r.calls.filter(x => x.table === 'reports').flatMap(x => x.ops).find(o => o[0] === 'insert')!;
    expect(insert[1][0]).toEqual({
      reporter_id: 'u1', reported_type: c.name, reported_id: c.reportedId,
      reason: c.okReason, description: '설명', status: 'pending',
    });
    const r2 = await run(c.cfg(), { target: c.target }, { reason: c.okReason, description: '   ' });
    const insert2 = r2.calls.filter(x => x.table === 'reports').flatMap(x => x.ops).find(o => o[0] === 'insert')!;
    expect((insert2[1][0] as { description: unknown }).description).toBeNull();
  });
});

// 2026-10-04 API1-41: 원래 500(TypeError)이던 입력 → 400, 판정 순서는 원래 실패 지점 그대로.
describe('handleReport — 잘못된 입력 400 (API1-41)', () => {
  it('JSON null·숫자 본문 → 400 잘못된 요청 형식', async () => {
    for (const body of ['null', '5']) {
      const r = await run(recipeReportConfig('R-ID'), { target: { id: 'R-ID', author_id: 'owner' } }, body);
      expect(r).toMatchObject({ status: 400, json: { error: '잘못된 요청 형식입니다.' } });
    }
  });

  it('문자열 아닌 description → 400 (insert 전), 대상 없음이면 기존처럼 404 가 먼저', async () => {
    const bad = { reason: 'spam', description: 123 };
    const r = await run(recipeReportConfig('R-ID'), { target: { id: 'R-ID', author_id: 'owner' } }, bad);
    expect(r).toMatchObject({ status: 400, json: { error: '잘못된 요청 형식입니다.' } });
    expect(r.calls.filter(x => x.table === 'reports').flatMap(x => x.ops).some(o => o[0] === 'insert')).toBe(false);
    const r404 = await run(recipeReportConfig('R-ID'), { target: null }, bad);
    expect(r404.status).toBe(404);
  });

  it('description 없음(undefined)·null 은 기존처럼 통과 → null 저장', async () => {
    for (const description of [undefined, null]) {
      const r = await run(recipeReportConfig('R-ID'), { target: { id: 'R-ID', author_id: 'owner' } }, { reason: 'spam', description });
      expect(r.status).toBe(200);
    }
  });
});

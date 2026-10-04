import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireRecipeOwner } from '../ownership';

// 2026-10-04 API1-36: recipes/[id] PUT·DELETE·visibility 소유 확인 3벌 → requireRecipeOwner. 기대값은 원본 리터럴 그대로.
function fake(row: Record<string, unknown> | null, error: unknown = null) {
  const seen: unknown[] = [];
  const b = {
    select: (c: string) => { seen.push(['select', c]); return b; },
    eq: (c: string, v: unknown) => { seen.push(['eq', c, v]); return b; },
    single: async () => ({ data: row, error: row ? error : (error ?? { code: 'PGRST116' }) }),
  };
  return { client: { from: (t: string) => { seen.push(['from', t]); return b; } } as unknown as SupabaseClient, seen };
}

describe('requireRecipeOwner', () => {
  it('없음·조회 오류 → 404 레시피를 찾을 수 없습니다.', async () => {
    for (const f of [fake(null), fake({ author_id: 'u1' }, { message: 'x' })]) {
      const r = await requireRecipeOwner(f.client, 'r1', 'u1', '레시피를 수정할 권한이 없습니다.');
      expect(r.response!.status).toBe(404);
      expect(await r.response!.json()).toEqual({ error: '레시피를 찾을 수 없습니다.' });
    }
  });

  it('남의 레시피 → 403 + 라우트별 문구', async () => {
    for (const msg of ['레시피를 수정할 권한이 없습니다.', '레시피를 삭제할 권한이 없습니다.']) {
      const r = await requireRecipeOwner(fake({ author_id: 'other' }).client, 'r1', 'u1', msg);
      expect(r.response!.status).toBe(403);
      expect(await r.response!.json()).toEqual({ error: msg });
    }
  });

  it('본인 → recipe 반환, 쿼리 = recipes.select(cols).eq(id) (기본 author_id / visibility 는 published_at 포함)', async () => {
    const a = fake({ author_id: 'u1' });
    const r = await requireRecipeOwner(a.client, 'r1', 'u1', 'x');
    expect(r.recipe).toEqual({ author_id: 'u1' });
    expect(a.seen).toEqual([['from', 'recipes'], ['select', 'author_id'], ['eq', 'id', 'r1']]);

    const b = fake({ author_id: 'u1', published_at: null });
    const r2 = await requireRecipeOwner(b.client, 'r1', 'u1', 'x', 'author_id, published_at');
    expect(r2.recipe).toEqual({ author_id: 'u1', published_at: null });
    expect(b.seen[1]).toEqual(['select', 'author_id, published_at']);
  });
});

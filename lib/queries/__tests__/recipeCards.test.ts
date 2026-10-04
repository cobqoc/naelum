import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { firstOfEmbed, fetchCookedRecipeIds, RECIPE_LIST_CARD_COLS } from '../recipeCards';

// 2026-10-04 API1-39: 레시피 카드 공용 조각 — 원본 식과 같은 결과.
describe('firstOfEmbed', () => {
  it('배열이면 첫 원소, 아니면 그대로(null 포함) — `Array.isArray(x) ? x[0] : x`', () => {
    expect(firstOfEmbed([{ username: 'a' }, { username: 'b' }])).toEqual({ username: 'a' });
    expect(firstOfEmbed({ username: 'a' })).toEqual({ username: 'a' });
    expect(firstOfEmbed(null)).toBeNull();
    expect(firstOfEmbed([] as { username: string }[])).toBeUndefined();
  });
});

describe('RECIPE_LIST_CARD_COLS', () => {
  it('browse·trending 원본 문자열과 동일', () => {
    expect(RECIPE_LIST_CARD_COLS).toBe(
      'id, title, thumbnail_url, prep_time_minutes, cook_time_minutes, difficulty_level, average_rating, views_count, author:profiles!recipes_author_id_fkey(username), created_at',
    );
  });
});

describe('fetchCookedRecipeIds', () => {
  function fake(result: { data: unknown; error: unknown }) {
    const ops: unknown[] = [];
    const b = {
      select: (c: string) => { ops.push(['select', c]); return b; },
      eq: (c: string, v: unknown) => { ops.push(['eq', c, v]); return b; },
      in: (c: string, v: unknown) => { ops.push(['in', c, v]); return b; },
      not: (c: string, op: string, v: unknown) => { ops.push(['not', c, op, v]); return Promise.resolve(result); },
    };
    return { client: { from: (t: string) => { ops.push(['from', t]); return b; } } as unknown as SupabaseClient, ops };
  }

  it('원본과 같은 쿼리 + recipe_id 집합', async () => {
    const f = fake({ data: [{ recipe_id: 'r1' }, { recipe_id: 'r2' }, { recipe_id: 'r1' }], error: null });
    const set = await fetchCookedRecipeIds(f.client, 'u1', ['r1', 'r2', 'r3']);
    expect([...set].sort()).toEqual(['r1', 'r2']);
    expect(f.ops).toEqual([
      ['from', 'cooking_sessions'], ['select', 'recipe_id'], ['eq', 'user_id', 'u1'],
      ['in', 'recipe_id', ['r1', 'r2', 'r3']], ['not', 'completed_at', 'is', null],
    ]);
  });

  it('조회 오류(data null) → 빈 집합(원본처럼 배지 미표시)', async () => {
    const set = await fetchCookedRecipeIds(fake({ data: null, error: { message: 'x' } }).client, 'u1', ['r1']);
    expect(set.size).toBe(0);
  });
});

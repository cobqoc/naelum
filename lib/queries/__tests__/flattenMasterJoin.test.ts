import { describe, it, expect } from 'vitest';
import { flattenMasterJoin } from '../flattenMasterJoin';

// 이전 route 구현 — 오라클(응답 바이트 동일성 비교용)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const legacy = (rows: any[]) => rows.map((row) => {
  const master = row.ingredients_master;
  return { ...row, emoji: master?.emoji ?? null, shelf_life_days: master?.shelf_life_days ?? null, ingredients_master: undefined };
});

const rows = [
  { id: 'a', ingredient_name: '양파', quantity: 2, ingredients_master: { emoji: '🧅', shelf_life_days: { fridge: 30 } } },
  { id: 'b', ingredient_name: '두부', quantity: null, ingredients_master: null },
  { id: 'c', ingredient_name: '물', quantity: 1, ingredients_master: { emoji: null, shelf_life_days: null } },
  { id: 'd', ingredient_name: '대파' },
];

describe('flattenMasterJoin', () => {
  it('emoji·shelf_life_days 를 최상위로, 중첩 키 제거, 없으면 null', () => {
    const out = flattenMasterJoin(rows);
    expect(out[0]).toEqual({ id: 'a', ingredient_name: '양파', quantity: 2, emoji: '🧅', shelf_life_days: { fridge: 30 } });
    expect(out[1]).toEqual({ id: 'b', ingredient_name: '두부', quantity: null, emoji: null, shelf_life_days: null });
    expect('ingredients_master' in out[0]).toBe(false);
    expect(Object.keys(out[0])).toEqual(['id', 'ingredient_name', 'quantity', 'emoji', 'shelf_life_days']);
  });

  it('JSON 직렬화 결과가 이전 route 구현과 바이트 동일', () => {
    expect(JSON.stringify(flattenMasterJoin(rows))).toBe(JSON.stringify(legacy(rows)));
  });
});

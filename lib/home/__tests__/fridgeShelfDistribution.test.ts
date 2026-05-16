import { describe, it, expect } from 'vitest';
import { computeFridgeShelfDistribution } from '../fridgeShelfDistribution';
import type { FridgeItem } from '@/app/[lang]/_home/types';

function mk(id: string, name: string, opts: Partial<FridgeItem> = {}): FridgeItem {
  return {
    id,
    ingredient_name: name,
    category: 'x',
    expiry_date: null,
    storage_location: '냉장',
    ...opts,
  };
}

// urgencyScore 주입 = 숫자 id (낮을수록 임박). 정렬을 완전 결정적으로 통제.
const byId = (i: FridgeItem) => Number(i.id);

describe('computeFridgeShelfDistribution', () => {
  it('빈 입력 → 빈 본체 3단·빈 냉동·overflow 0', () => {
    const r = computeFridgeShelfDistribution([], 4, byId);
    expect(r.bodyShelfGroups).toEqual([[], [], []]);
    expect(r.freezerGroups).toEqual([]);
    expect(r.totalOverflow).toBe(0);
  });

  it('같은 이름 그룹화는 trim + case-insensitive', () => {
    const r = computeFridgeShelfDistribution(
      [mk('1', 'Tomato'), mk('2', ' tomato '), mk('3', 'TOMATO')],
      4,
      byId,
    );
    // 한 그룹으로 합쳐짐
    expect(r.bodyShelfGroups[0]).toHaveLength(1);
    expect(r.bodyShelfGroups[0][0].map(i => i.id)).toEqual(['1', '2', '3']);
  });

  it('그룹 내 = urgencyScore 오름차순(가장 임박 우선)', () => {
    const r = computeFridgeShelfDistribution(
      [mk('3', 'A'), mk('1', 'A'), mk('2', 'A')],
      4,
      byId,
    );
    expect(r.bodyShelfGroups[0][0].map(i => i.id)).toEqual(['1', '2', '3']);
  });

  it('그룹 간 = 그룹 대표(intra-sort 후 첫 항목=최소) 기준 오름차순', () => {
    const r = computeFridgeShelfDistribution(
      [mk('9', 'A'), mk('1', 'A'), mk('3', 'B')], // A 대표=1, B 대표=3 → [A,B]
      4,
      byId,
    );
    const names = r.bodyShelfGroups[0].map(g => g[0].ingredient_name);
    expect(names).toEqual(['A', 'B']);
  });

  it("냉동만 freezerGroups 로 분리, 그 외(냉장·상온·null)는 본체", () => {
    const r = computeFridgeShelfDistribution(
      [
        mk('1', 'frozenpea', { storage_location: '냉동' }),
        mk('2', 'milk', { storage_location: '냉장' }),
        mk('3', 'salt', { storage_location: null }),
      ],
      4,
      byId,
    );
    expect(r.freezerGroups).toHaveLength(1);
    expect(r.freezerGroups[0][0].ingredient_name).toBe('frozenpea');
    // 냉장 + null(상온) = 본체 2그룹, 냉동은 본체에 없음
    const bodyNames = r.bodyShelfGroups.flat().map(g => g[0].ingredient_name).sort();
    expect(bodyNames).toEqual(['milk', 'salt']);
  });

  it('비냉동 그룹을 본체 3단에 shelfMaxBody 단위로 분배 + 마지막 단 누적 + overflow', () => {
    // 7개 distinct 그룹, shelfMaxBody=2 → idx 0,1→0단 / 2,3→1단 / 4,5,6→2단(min(floor(i/2),2))
    const items = ['1', '2', '3', '4', '5', '6', '7'].map(id => mk(id, `n${id}`));
    const r = computeFridgeShelfDistribution(items, 2, byId);
    expect(r.bodyShelfGroups.map(s => s.length)).toEqual([2, 2, 3]);
    // 2단(3) > shelfMaxBody(2) → overflow 1
    expect(r.totalOverflow).toBe(1);
  });

  it('냉동 그룹 수 > shelfMaxBody → freezer overflow 가산', () => {
    const items = ['1', '2', '3', '4', '5'].map(id =>
      mk(id, `f${id}`, { storage_location: '냉동' }),
    );
    const r = computeFridgeShelfDistribution(items, 2, byId);
    expect(r.bodyShelfGroups).toEqual([[], [], []]);
    expect(r.freezerGroups).toHaveLength(5);
    expect(r.totalOverflow).toBe(3); // 5 - 2
  });
});

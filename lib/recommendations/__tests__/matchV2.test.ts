import { describe, it, expect } from 'vitest';
import {
  matchIngredient,
  matchRecipe,
  isFundamental,
  type RelationGraph,
  EMPTY_GRAPH,
} from '../matchV2';

// V2 매칭 — ID 기반 정확 매칭 + 그래프 lookup. 옛 이름·정규화·추측 *전부 제거*.
// 본질 재설계: docs/INGREDIENT_MATCHING_REDESIGN.md

describe('matchIngredient — V2 ID 기반 매칭', () => {
  it('owned — 정확 ID 일치', () => {
    const result = matchIngredient(
      { ingredient_id: 'recipe-onion', ingredient_name: '양파' },
      new Set(['recipe-onion']),
      EMPTY_GRAPH,
    );
    expect(result.kind).toBe('owned');
    expect(result.recipeIngredientName).toBe('양파');
  });

  it('missing — 보유 X + 그래프 X', () => {
    const result = matchIngredient(
      { ingredient_id: 'recipe-onion', ingredient_name: '양파' },
      new Set(['user-garlic']),
      EMPTY_GRAPH,
    );
    expect(result.kind).toBe('missing');
  });

  it('missing — 옛 데이터(ingredient_id null) 는 매칭 안 됨', () => {
    const result = matchIngredient(
      { ingredient_id: null, ingredient_name: '양파' },
      new Set(['user-onion']),
      EMPTY_GRAPH,
    );
    expect(result.kind).toBe('missing');
  });

  it('substitute — 그래프에 양방향 매핑 존재', () => {
    const graph: RelationGraph = {
      incoming: new Map([
        ['recipe-anchovy', [{ from_id: 'user-fish-sauce', kind: 'substitute' as const }]],
      ]),
    };
    const result = matchIngredient(
      { ingredient_id: 'recipe-anchovy', ingredient_name: '멸치액젓' },
      new Set(['user-fish-sauce']),
      graph,
    );
    expect(result.kind).toBe('substitute');
    expect(result.via).toBe('user-fish-sauce');
  });

  it('preparable — 단방향 raw→processed (사용자가 raw 보유)', () => {
    const graph: RelationGraph = {
      incoming: new Map([
        ['recipe-minced-garlic', [{ from_id: 'user-garlic-raw', kind: 'preparable_to' as const }]],
      ]),
    };
    const result = matchIngredient(
      { ingredient_id: 'recipe-minced-garlic', ingredient_name: '다진마늘' },
      new Set(['user-garlic-raw']),
      graph,
    );
    expect(result.kind).toBe('preparable');
    expect(result.via).toBe('user-garlic-raw');
  });

  it('substitute 가 preparable 보다 우선', () => {
    const graph: RelationGraph = {
      incoming: new Map([
        [
          'recipe-x',
          [
            { from_id: 'user-prep', kind: 'preparable_to' as const },
            { from_id: 'user-sub', kind: 'substitute' as const },
          ],
        ],
      ]),
    };
    const result = matchIngredient(
      { ingredient_id: 'recipe-x', ingredient_name: 'X' },
      new Set(['user-prep', 'user-sub']),
      graph,
    );
    expect(result.kind).toBe('substitute');
    expect(result.via).toBe('user-sub');
  });

  it('가공형 → 원형 거짓 매칭 차단 — V2 는 그래프에 단방향 row 만 존재', () => {
    // 사용자 보유 = 다진마늘. 레시피 필요 = 통마늘.
    // 그래프에는 통마늘→다진마늘 단방향만 있음 (reverse 자동 생성 X).
    const graph: RelationGraph = {
      incoming: new Map([
        ['recipe-minced', [{ from_id: 'user-raw', kind: 'preparable_to' as const }]],
        // 'recipe-raw' 에는 incoming 없음 (다진마늘 → 통마늘 매칭 차단)
      ]),
    };
    const result = matchIngredient(
      { ingredient_id: 'recipe-raw', ingredient_name: '통마늘' },
      new Set(['user-minced']),
      graph,
    );
    expect(result.kind).toBe('missing');
  });
});

describe('matchRecipe — 카운트 집계', () => {
  it('owned/substitute/preparable/missing 혼합 — totalCount·ownedCount 정확', () => {
    const graph: RelationGraph = {
      incoming: new Map([['recipe-b', [{ from_id: 'user-b-sub', kind: 'substitute' as const }]]]),
    };
    const summary = matchRecipe(
      [
        { ingredient_id: 'recipe-a', ingredient_name: 'A' },
        { ingredient_id: 'recipe-b', ingredient_name: 'B' },
        { ingredient_id: 'recipe-c', ingredient_name: 'C' },
        { ingredient_id: 'recipe-d', ingredient_name: 'D' },
      ],
      new Set(['recipe-a', 'user-b-sub']),
      graph,
    );
    expect(summary.totalCount).toBe(4);
    expect(summary.ownedCount).toBe(1);
    expect(summary.matchRate).toBe(25);
    expect(summary.ingredientStatus).toBe('partial');
  });

  it('is_optional 재료는 카운트에서 제외', () => {
    const summary = matchRecipe(
      [
        { ingredient_id: 'recipe-a', ingredient_name: 'A', is_optional: false },
        { ingredient_id: 'recipe-b', ingredient_name: 'B', is_optional: true },
      ],
      new Set(['recipe-a']),
      EMPTY_GRAPH,
    );
    expect(summary.totalCount).toBe(1);
    expect(summary.ownedCount).toBe(1);
    expect(summary.ingredientStatus).toBe('all');
  });

  it('fundamental(물 등) 재료 카운트 제외', () => {
    const summary = matchRecipe(
      [
        { ingredient_id: 'recipe-a', ingredient_name: 'A' },
        { ingredient_id: null, ingredient_name: '물' },
        { ingredient_id: null, ingredient_name: 'water' },
      ],
      new Set(['recipe-a']),
      EMPTY_GRAPH,
    );
    expect(summary.totalCount).toBe(1);
    expect(summary.ownedCount).toBe(1);
  });

  it('fundamental(물) 은 id null 이어도 owned — 재료 목록에서 missing(빨강) 아님', () => {
    const summary = matchRecipe(
      [{ ingredient_id: null, ingredient_name: '물' }],
      new Set(),
      EMPTY_GRAPH,
    );
    expect(summary.totalCount).toBe(0);             // 기본 재료라 카운트 제외
    expect(summary.results[0].kind).toBe('owned');  // 그래도 owned — 빨강 X
  });

  it('전부 보유 — ingredientStatus all', () => {
    const summary = matchRecipe(
      [
        { ingredient_id: 'recipe-a', ingredient_name: 'A' },
        { ingredient_id: 'recipe-b', ingredient_name: 'B' },
      ],
      new Set(['recipe-a', 'recipe-b']),
      EMPTY_GRAPH,
    );
    expect(summary.ingredientStatus).toBe('all');
    expect(summary.matchRate).toBe(100);
  });

  it('전부 없음 — ingredientStatus none', () => {
    const summary = matchRecipe(
      [{ ingredient_id: 'recipe-a', ingredient_name: 'A' }],
      new Set(),
      EMPTY_GRAPH,
    );
    expect(summary.ingredientStatus).toBe('none');
    expect(summary.matchRate).toBe(0);
  });

  it('재료 없는 레시피 — totalCount 0', () => {
    const summary = matchRecipe([], new Set(['x']), EMPTY_GRAPH);
    expect(summary.totalCount).toBe(0);
    expect(summary.matchRate).toBe(0);
    expect(summary.ingredientStatus).toBe('none');
  });
});

describe('isFundamental', () => {
  it('물 계열 true', () => {
    expect(isFundamental('물')).toBe(true);
    expect(isFundamental('생수')).toBe(true);
    expect(isFundamental('식수')).toBe(true);
    expect(isFundamental('water')).toBe(true);
    expect(isFundamental(' 물 ')).toBe(true);
  });

  it('양념은 fundamental 아님', () => {
    expect(isFundamental('설탕')).toBe(false);
    expect(isFundamental('간장')).toBe(false);
    expect(isFundamental('소금')).toBe(false);
  });
});

// 핵심 회귀 검증 — 옛 시스템에서 발견된 모든 거짓 매칭 사례를 V2 가 차단하는지.
describe('V2 회귀 가드 — 옛 시스템 거짓 매칭 차단 (2026-05-29)', () => {
  it('다진마늘 → 편마늘 거짓 매칭 차단 (그래프에 매핑 없음)', () => {
    const result = matchIngredient(
      { ingredient_id: 'recipe-sliced-garlic', ingredient_name: '편마늘' },
      new Set(['user-minced-garlic']),
      EMPTY_GRAPH,
    );
    expect(result.kind).toBe('missing');
  });

  it('가공형 입력 → 원형 매칭 차단 (옛 정규화 부작용 사라짐)', () => {
    const result = matchIngredient(
      { ingredient_id: 'recipe-raw-garlic', ingredient_name: '통마늘' },
      new Set(['user-minced-garlic']),
      EMPTY_GRAPH,
    );
    expect(result.kind).toBe('missing');
  });

  it('케첩 ↔ 토마토소스 양방향 — 그래프에 명시 안 되면 매칭 0', () => {
    const result = matchIngredient(
      { ingredient_id: 'recipe-tomato-sauce', ingredient_name: '토마토소스' },
      new Set(['user-ketchup']),
      EMPTY_GRAPH,
    );
    expect(result.kind).toBe('missing');
  });

  it('빈 그래프에서도 안전 작동 — V2 초기 상태(사용자 입력 0)', () => {
    const summary = matchRecipe(
      [
        { ingredient_id: 'a', ingredient_name: 'A' },
        { ingredient_id: 'b', ingredient_name: 'B' },
      ],
      new Set(['a']),
      EMPTY_GRAPH,
    );
    expect(summary.ownedCount).toBe(1);
    expect(summary.totalCount).toBe(2);
  });
});

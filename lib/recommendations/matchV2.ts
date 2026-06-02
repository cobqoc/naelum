/**
 * V2 재료 매칭 — ID 기반 그래프 lookup (2026-05-29 본질 재설계)
 *
 * 설계: docs/INGREDIENT_MATCHING_REDESIGN.md, 메모리 [[ingredient-match-v2-redesign]]
 *
 * 핵심 변화 vs 옛 시스템:
 *  - 이름 매칭·정규화·substring 매칭 **전부 제거** — 추측 0
 *  - ingredient_id 기반 정확 매칭만
 *  - 관계는 DB `ingredient_relations` 테이블에서 lookup
 *    - substitute (양방향): 액젓끼리 등. DB trigger로 reverse row 자동 보장
 *    - preparable_to (단방향): raw→processed (마늘→다진마늘)
 *  - 알레르기는 `ingredients_master.allergens` 컬럼 직접 lookup
 *
 * 매칭 함수는 *순수* — DB fetch 한 번 후 매칭은 in-memory.
 * fetch 책임은 hook/route 가짐 (caching 위치).
 */

/**
 * 보편 재료 — 수돗물처럼 누구나 항상 갖고 있다고 가정. 매칭에서 카운트 제외.
 */
const FUNDAMENTAL_NAMES = new Set(['물', '생수', '식수', 'water']);

export function isFundamental(name: string): boolean {
  return FUNDAMENTAL_NAMES.has(name.trim().toLowerCase());
}

/** 수량 안전 파싱 — number|string|null 어느 것이든 유한수만 반환, 아니면 null(분수·"약간" 등 → 판단 생략). */
function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

import { compareQuantity, type UnitCoeffs } from '@/lib/units/quantity';

export type MatchKind = 'owned' | 'preparable' | 'substitute' | 'missing';

export interface MatchResult {
  kind: MatchKind;
  /** 레시피 재료 이름 (표시용) */
  recipeIngredientName: string;
  /** preparable·substitute 의 경우 사용자 보유 재료 이름 (chip 표시용) */
  via?: string;
  /** 보유하지만 양 부족 — owned(정확·변형)에만. 같은 단위/변환 가능할 때만. 없으면 충분 or 판단 생략. */
  shortBy?: { by: number; unit: string };
  /** 대체 비율 (Phase 3) — substitute 에만. (from 사용량)/(to 1단위). 없으면 1:1. */
  ratio?: number;
}

export interface UserIngredient {
  ingredient_id: string;
  name: string;
}

export interface RecipeIngredientInput {
  ingredient_id: string | null;  // null = 옛 데이터, 매칭 안 됨
  ingredient_name: string;
  is_optional?: boolean;
  quantity?: number | string | null;  // 양 비교용 (Phase 2) — DB 가 문자열 반환 가능
  unit?: string | null;
}

/** 사용자 보유 재료의 양 — id 별. 양 매칭(Phase 2)용. 없으면 양 판단 생략(degrade). */
export type UserQtyMap = Map<string, { quantity: number | string | null; unit: string | null }>;

/** 재료별 단위 변환 계수 — id 별. 차원 교차(부피↔무게·개수↔무게) 양 비교용. 없으면 해당 변환 생략(degrade). */
export type CoeffsMap = Map<string, UnitCoeffs>;

/** ingredient_relations 그래프 — to_id 별로 incoming 관계 묶음 */
export interface RelationGraph {
  /** Map<to_id, [{from_id, kind, ratio}]> — to(레시피 필요) 측에서 from(사용자 보유) 검색. ratio=대체 비율(substitute). */
  incoming: Map<string, Array<{ from_id: string; kind: 'substitute' | 'preparable_to'; ratio?: number | null }>>;
}

/**
 * 한 레시피 재료를 사용자 보유 재료들과 매칭.
 *
 * 우선순위:
 *  1. owned       — 정확 보유 (id 일치)
 *  2. owned(변형) — 사용자가 *변형*을 보유 (삼겹살 보유 → "돼지고기" 필요 충족). 단방향: 변형→base만.
 *  3. substitute  — 양방향 대체 매핑 존재
 *  4. preparable  — 단방향 가공 매핑 존재 (사용자가 from, 레시피가 to)
 *  5. missing     — 매칭 0
 *
 * `userBaseMap`: Map<base_id, 사용자 보유 변형 id>. 비면 변형 매칭 없음(degrade) — 기존 동작.
 */
export function matchIngredient(
  recipe: RecipeIngredientInput,
  userIngredientIds: Set<string>,
  graph: RelationGraph,
  userBaseMap: Map<string, string> = new Map(),
  userQtyMap?: UserQtyMap,
  coeffsMap?: CoeffsMap,
): MatchResult {
  // 양 부족분 계산 — owned(정확·변형)에만. 매칭된 보유 재료 id 의 양 vs 레시피 양.
  // 같은 단위/변환 가능할 때만 short, 아니면 undefined(충분 or 판단 생략 — 거짓 정확성 회피).
  // 수량은 문자열("3")로 올 수 있어 안전 파싱(분수·"약간" 등 비수치 → null → 판단 생략).
  // 계수는 *레시피 재료 id* 기준(변환 대상 단위 = 레시피 단위). 변형 매칭도 base의 계수로 근사.
  const shortOf = (matchedUserId: string): { by: number; unit: string } | undefined => {
    if (!userQtyMap) return undefined;
    const have = userQtyMap.get(matchedUserId);
    if (!have) return undefined;
    const coeffs = recipe.ingredient_id ? coeffsMap?.get(recipe.ingredient_id) : undefined;
    const v = compareQuantity(toNum(recipe.quantity), recipe.unit ?? '', toNum(have.quantity), have.unit ?? '', coeffs);
    return v.kind === 'short' ? { by: v.by, unit: v.unit } : undefined;
  };

  // 기본 재료(물 등)는 누구나 보유로 간주 — 코드 상수 allowlist.
  // *이름 기반*이라 ingredient_id 가 null 이어도 작동 (id 기반 매칭의 예외, 이름으로만 판정).
  // 카운트(matchRecipe)에서도 isFundamental 로 제외되므로 N/N 보유 수엔 영향 없음.
  if (isFundamental(recipe.ingredient_name)) {
    return { kind: 'owned', recipeIngredientName: recipe.ingredient_name };
  }
  if (recipe.ingredient_id === null) {
    return { kind: 'missing', recipeIngredientName: recipe.ingredient_name };
  }

  if (userIngredientIds.has(recipe.ingredient_id)) {
    return { kind: 'owned', recipeIngredientName: recipe.ingredient_name, shortBy: shortOf(recipe.ingredient_id) };
  }

  // 변형 보유 → base 필요 충족 (삼겹살→돼지고기). 변형은 base의 한 종류이므로 owned.
  // 단방향: 레시피가 base(=어떤 변형의 base_id)일 때만. base→변형(돼지고기 보유→삼겹살 필요)은 여기 안 걸려 missing.
  const variantId = userBaseMap.get(recipe.ingredient_id);
  if (variantId) {
    return { kind: 'owned', recipeIngredientName: recipe.ingredient_name, via: variantId, shortBy: shortOf(variantId) };
  }

  const incoming = graph.incoming.get(recipe.ingredient_id);
  if (incoming) {
    // substitute 우선 (양방향이 보유에 더 가까움), 그 다음 preparable
    let preparableFrom: string | null = null;
    for (const { from_id, kind, ratio } of incoming) {
      if (!userIngredientIds.has(from_id)) continue;
      if (kind === 'substitute') {
        return { kind: 'substitute', recipeIngredientName: recipe.ingredient_name, via: from_id, ratio: ratio ?? undefined };
      }
      if (kind === 'preparable_to' && preparableFrom === null) {
        preparableFrom = from_id;
      }
    }
    if (preparableFrom !== null) {
      return { kind: 'preparable', recipeIngredientName: recipe.ingredient_name, via: preparableFrom };
    }
  }

  return { kind: 'missing', recipeIngredientName: recipe.ingredient_name };
}

/**
 * 여러 레시피 재료를 한 번에 매칭 + 카운트 집계.
 * is_optional 재료는 total/missing/owned 카운트에서 제외.
 */
export interface RecipeMatchSummary {
  results: MatchResult[];
  ownedCount: number;
  totalCount: number;
  matchRate: number;     // 0~100
  ingredientStatus: 'none' | 'partial' | 'all';
}

export function matchRecipe(
  recipeIngredients: RecipeIngredientInput[],
  userIngredientIds: Set<string>,
  graph: RelationGraph,
  userBaseMap: Map<string, string> = new Map(),
  userQtyMap?: UserQtyMap,
  coeffsMap?: CoeffsMap,
): RecipeMatchSummary {
  const results = recipeIngredients.map(ri => matchIngredient(ri, userIngredientIds, graph, userBaseMap, userQtyMap, coeffsMap));

  // is_optional + fundamental(물 등) 재료는 카운트에서 제외
  const required = recipeIngredients
    .map((ri, i) => ({ ri, result: results[i] }))
    .filter(({ ri }) => !ri.is_optional && !isFundamental(ri.ingredient_name));

  const totalCount = required.length;
  const ownedCount = required.filter(({ result }) => result.kind === 'owned').length;
  const matchRate = totalCount === 0 ? 0 : Math.round((ownedCount / totalCount) * 100);

  const ingredientStatus: 'none' | 'partial' | 'all' =
    totalCount === 0 ? 'none'
    : ownedCount === 0 ? 'none'
    : ownedCount === totalCount ? 'all'
    : 'partial';

  return { results, ownedCount, totalCount, matchRate, ingredientStatus };
}

export interface MatchNameArrays {
  /** 보유(정확·변형) 재료 이름 — 모달 "있는" 섹션 */
  ownedIngredientNames: string[];
  /** 없는 재료 이름 — RecipeCard 배지 카운트의 단일 출처(length) + 모달 "없는" */
  missingIngredientNames: string[];
  /** 대체/가공 충족 — {레시피 재료, 사용자 보유(via)}. 모달 "대체" 섹션 */
  substitutableIngredients: { ingredient: string; via: string }[];
}

/**
 * matchRecipe 결과 → RecipeCard 가 쓰는 이름 배열(보유/없는/대체).
 *
 * **fridgeMatch(client·전체/검색)·recommendations route(server·재료기반 추천) 공용.**
 * 둘이 갈라져 추천 API 응답에 `missingIngredientNames` 가 안 실려, RecipeCard 배지가
 * `missingIngredientNames.length`(undefined→0)로 항상 "바로 가능" 오판하던 버그
 * (2026-06-03, 쌀만 보유인데 대패삼겹 양배추 덮밥이 바로 가능) 방지. is_optional 제외.
 *
 * `userIdToName`: 사용자 보유 재료 id→이름. via(대체/가공 출처) 표시명 해석용.
 * via 이름을 못 찾으면(맵 누락) 보수적으로 missing 처리.
 */
export function buildMatchNameArrays(
  recipeIngredients: RecipeIngredientInput[],
  results: MatchResult[],
  userIdToName: Map<string, string>,
): MatchNameArrays {
  const ownedIngredientNames: string[] = [];
  const missingIngredientNames: string[] = [];
  const substitutableIngredients: { ingredient: string; via: string }[] = [];
  results.forEach((result, i) => {
    const ing = recipeIngredients[i];
    if (ing.is_optional) return;
    if (result.kind === 'owned') ownedIngredientNames.push(ing.ingredient_name);
    else if (result.via) {
      const viaName = userIdToName.get(result.via) ?? '';
      if (viaName) substitutableIngredients.push({ ingredient: ing.ingredient_name, via: viaName });
      else missingIngredientNames.push(ing.ingredient_name);
    } else {
      missingIngredientNames.push(ing.ingredient_name);
    }
  });
  return { ownedIngredientNames, missingIngredientNames, substitutableIngredients };
}

/** 레시피에 부착되는 매칭 필드 한 벌 — RecipeCard 배지/모달·추천 응답 공용 계약. */
export interface RecipeMatchFields {
  ownedCount: number;
  totalIngredients: number;
  matchRate: number;
  ingredientStatus: 'none' | 'partial' | 'all';
  ownedIngredientNames: string[];
  missingIngredientNames: string[];
  substitutableIngredients: { ingredient: string; via: string }[];
  matchedCount: number;
  /** RecipeCard 배지의 단일 카운트 출처. missingIngredientNames.length 와 항상 동일. */
  missingCount: number;
}

/**
 * matchRecipe 결과 → 레시피에 붙는 매칭 필드 한 벌(이름배열 + 카운트).
 *
 * **fridgeMatch(client·전체/검색)·recommendations route(server·재료기반) 단일 출처.**
 * 둘이 따로 조립하다 한쪽이 missingIngredientNames 를 빠뜨려 RecipeCard 배지가 항상
 * "바로 가능" 오판하던 버그(2026-06-03)의 구조적 뿌리(경로 이중화)를 차단. 카운트는
 * 이름배열에서 파생(matched = 보유 + 대체, missing = 없는.length)해 배지·필터가 한 기준.
 */
/**
 * kind 기반 카운트(이름 불필요) — 충족/없는/전체. is_optional·fundamental(물) 제외.
 *
 * **충족(matched) = 정확보유 + 변형 + 대체 + 가공(preparable)** = kind !== 'missing'.
 * RecipeCard 배지(missingCount)·레시피 상세 "N/M 보유" 배지가 *같은 기준*을 쓰도록 하는 단일 출처.
 * 상세가 ownedCount(정확보유만)를 써서 "쌀로 밥 충족"인데 0/7 로 뜨고 카드는 6 부족인 불일치
 * (2026-06-03)를 차단. via 이름 해석이 필요 없어(카운트만) userIdToName 없이 동작.
 */
export function countMatched(
  recipeIngredients: RecipeIngredientInput[],
  results: MatchResult[],
): { matchedCount: number; missingCount: number; totalCount: number } {
  let matchedCount = 0;
  let missingCount = 0;
  let totalCount = 0;
  results.forEach((r, i) => {
    const ing = recipeIngredients[i];
    if (ing.is_optional || isFundamental(ing.ingredient_name)) return;
    totalCount++;
    if (r.kind === 'missing') missingCount++;
    else matchedCount++;
  });
  return { matchedCount, missingCount, totalCount };
}

export function assembleRecipeMatchFields(
  recipeIngredients: RecipeIngredientInput[],
  summary: RecipeMatchSummary,
  userIdToName: Map<string, string>,
): RecipeMatchFields {
  const { ownedIngredientNames, missingIngredientNames, substitutableIngredients } =
    buildMatchNameArrays(recipeIngredients, summary.results, userIdToName);
  return {
    ownedCount: summary.ownedCount,
    totalIngredients: summary.totalCount,
    matchRate: summary.matchRate,
    ingredientStatus: summary.ingredientStatus,
    ownedIngredientNames,
    missingIngredientNames,
    substitutableIngredients,
    matchedCount: summary.ownedCount + substitutableIngredients.length,
    missingCount: missingIngredientNames.length,
  };
}

/**
 * 빈 그래프 — 사용자/시스템 초기 상태에서 안전 fallback.
 * 모든 매칭이 missing 반환 (정확 보유만 매칭).
 */
export const EMPTY_GRAPH: RelationGraph = { incoming: new Map() };

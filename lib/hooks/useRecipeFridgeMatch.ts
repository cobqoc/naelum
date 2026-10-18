'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  matchRecipe,
  countMatched,
  type RelationGraph,
  type RecipeIngredientInput,
  type RecipeMatchSummary,
  type UserQtyMap,
  type CoeffsMap,
  EMPTY_GRAPH,
} from '@/lib/recommendations/matchV2';
import { fetchRelationsForRecipe, fetchUserVariantBases, fetchUnitCoeffs } from '@/lib/recommendations/fetchRelations';

/**
 * V2 레시피 ↔ 냉장고 매칭 hook (2026-05-29 본질 재설계).
 *
 * 변경:
 *  - 옛 시스템: 이름 매칭 + 정규화 + 코드 상수 lookup
 *  - V2: ingredient_id 정확 매칭 + DB ingredient_relations 그래프 lookup
 *  - 정규화 부작용·이름 추측 0 — 다진마늘 → 통마늘 거짓 매칭 자체 불가능
 *
 * fetch 전략:
 *  - 마운트 시 한 번 fetch — 레시피 재료 id 들의 incoming relations
 *  - 양방향 substitute 는 DB trigger 로 reverse row 자동 존재 → 한 방향만 fetch
 *
 * 2026-10-04 [PHR-28] 소비자 0 인 공개 API 정리(행위 보존): findSubstitute·isLoading·ingredientStatus 반환과
 * 옛 시그너처 호환용 `userIngredients` 인자(V2 에서 무시)를 제거. 호출처는 RecipeBrowseView 1곳이며
 * isIngredientOwned·ownedCount·coveredCount·totalIngredients·coverageStatus·summary 만 사용한다(grep 확인).
 * isLoading state 는 fetch 마다 true/false 로 RBV 를 2회 더 재렌더시키기만 했음. 정확보유 기준 상태는 summary.ingredientStatus 그대로.
 */

/** 호출처 호환 — recipe.ingredients 의 ingredient_id 가 optional 인 케이스 허용 */
export interface MatchableIngredient {
  ingredient_id?: string | null;
  ingredient_name: string;
  is_optional?: boolean;
  quantity?: number | string | null;  // 양 매칭(Phase 2)
  unit?: string | null;
}

export interface UseRecipeFridgeMatchResult {
  /** name 보유 판정 — V2 는 id 기반이라 이름은 매칭 안 함. 호출처는 ingredient_id 로 lookup */
  isIngredientOwned: (ingredient_id: string | null) => boolean;
  /** 정확 보유(+변형) 수 — cart "보유 재료 제외" 등 *물리적 보유* 기준에 사용 */
  ownedCount: number;
  /** 충족 수 = 정확보유 + 변형 + 대체 + 가공(쌀→밥). RecipeCard 배지와 같은 기준 — 상세 "N/M 보유" 배지용 */
  coveredCount: number;
  totalIngredients: number;
  /** 충족(coveredCount) 기준 상태 — 상세 배지 색. 쌀로 밥 충족이면 partial(빨강 아님) */
  coverageStatus: 'none' | 'partial' | 'all';
  /** 전체 매칭 summary — UI 가 카드별 chip 결정에 사용 */
  summary: RecipeMatchSummary;
}

export function useRecipeFridgeMatch(
  ingredients: MatchableIngredient[],
  userIngredientIds: string[],
  userQtyMap?: UserQtyMap,            // 양 매칭(Phase 2). 없으면 양 판단 생략(degrade).
  servingsMultiplier: number = 1,    // 현재 인분/기본 인분 — 레시피 필요량 스케일
): UseRecipeFridgeMatchResult {
  const userIdSet = useMemo(() => new Set(userIngredientIds), [userIngredientIds]);

  const recipeIngredientIds = useMemo(
    () =>
      ingredients
        .map(i => i.ingredient_id ?? null)
        .filter((id): id is string => id !== null),
    [ingredients],
  );

  // matchRecipe 에 전달할 정규화된 ingredients (ingredient_id null 통일 + 인분 스케일 양)
  const normalizedIngredients = useMemo<RecipeIngredientInput[]>(
    () =>
      ingredients.map(i => {
        const n = i.quantity == null || i.quantity === '' ? null : Number(i.quantity);
        const scaledQty = n != null && Number.isFinite(n) ? n * servingsMultiplier : (i.quantity ?? null);
        return {
          ingredient_id: i.ingredient_id ?? null,
          ingredient_name: i.ingredient_name,
          is_optional: i.is_optional,
          quantity: scaledQty,
          unit: i.unit ?? null,
        };
      }),
    [ingredients, servingsMultiplier],
  );

  const [graph, setGraph] = useState<RelationGraph>(EMPTY_GRAPH);
  // 양 비교(Phase 2) 차원 교차용 계수 — 레시피 재료 id 기준. 같은 키(recipeIngredientIds)라 그래프와 함께 fetch.
  const [coeffsMap, setCoeffsMap] = useState<CoeffsMap>(new Map());

  // 보유 재료 id 가 하나도 없으면(비로그인·빈 냉장고 — SEO·익명 트래픽 전부) graph·coeffs 는 어떤 결과에도
  // 영향이 없다: matchIngredient 는 has()/userBaseMap 이 전부 false 라 incoming 루프가 모두 continue → missing,
  // 계수(coeffsMap)를 읽는 shortOf 는 owned 분기에서만 호출된다. → 두 PostgREST read 를 생략 (perf 2026-09-27).
  // boolean 키라 보유 id 집합이 바뀔 때마다 재실행하지 않고, 없음↔있음 전환 때만 다시 판단한다.
  const hasUserIds = userIdSet.size > 0;

  useEffect(() => {
    let cancelled = false;
    if (recipeIngredientIds.length === 0 || !hasUserIds) {
      Promise.resolve().then(() => {
        if (!cancelled) { setGraph(EMPTY_GRAPH); setCoeffsMap(new Map()); }
      });
      return () => {
        cancelled = true;
      };
    }
    const supabase = createClient();
    Promise.all([
      fetchRelationsForRecipe(recipeIngredientIds, supabase).then(g => { if (!cancelled) setGraph(g); }),
      fetchUnitCoeffs(recipeIngredientIds, supabase).then(c => { if (!cancelled) setCoeffsMap(c); }),
    ]);
    return () => {
      cancelled = true;
    };
  }, [recipeIngredientIds, hasUserIds]);

  // 변형 매칭용 — 보유 재료의 base_id 맵 (삼겹살 보유 → "돼지고기" 필요 충족)
  const [userBaseMap, setUserBaseMap] = useState<Map<string, string>>(new Map());
  const userIdsKey = useMemo(() => [...userIdSet].sort().join(','), [userIdSet]);

  useEffect(() => {
    let cancelled = false;
    const ids = userIdsKey ? userIdsKey.split(',') : [];
    if (ids.length === 0) {
      Promise.resolve().then(() => {
        if (!cancelled) setUserBaseMap(new Map());
      });
      return () => {
        cancelled = true;
      };
    }
    const supabase = createClient();
    fetchUserVariantBases(ids, supabase).then(m => {
      if (!cancelled) setUserBaseMap(m);
    });
    return () => {
      cancelled = true;
    };
  }, [userIdsKey]);

  const summary = useMemo(
    () => matchRecipe(normalizedIngredients, userIdSet, graph, userBaseMap, userQtyMap, coeffsMap),
    [normalizedIngredients, userIdSet, graph, userBaseMap, userQtyMap, coeffsMap],
  );

  // 충족 수 = owned + 변형 + 대체 + 가공(쌀→밥). RecipeCard 배지(missingCount)와 같은 기준.
  // 상세 "N/M 보유" 가 ownedCount(정확보유=0)만 써서 "쌀로 밥 충족"인데 0/7 로 뜨던 불일치 fix.
  const coveredCount = useMemo(
    () => countMatched(normalizedIngredients, summary.results).matchedCount,
    [normalizedIngredients, summary],
  );
  const coverageStatus: 'none' | 'partial' | 'all' =
    summary.totalCount === 0 || coveredCount === 0
      ? 'none'
      : coveredCount >= summary.totalCount
        ? 'all'
        : 'partial';

  const isIngredientOwned = useCallback(
    // 정확 보유 또는 변형 보유(삼겹살→돼지고기). userBaseMap 은 base_id(=레시피 재료 id) 키.
    (id: string | null) => (id ? userIdSet.has(id) || userBaseMap.has(id) : false),
    [userIdSet, userBaseMap],
  );

  return {
    isIngredientOwned,
    ownedCount: summary.ownedCount,
    coveredCount,
    totalIngredients: summary.totalCount,
    coverageStatus,
    summary,
  };
}

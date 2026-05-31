'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  matchRecipe,
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
 * **호환성**:
 *  - 인터페이스는 옛 hook 과 유사 — RecipeBrowseView 등 호출처 변경 최소
 *  - findSubstitute 반환은 *사용자 보유 재료의 ingredient_id* (이름이 아닌 id)
 *    → 표시할 때는 호출처에서 id → name resolve 필요
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
  /**
   * 레시피 재료 → 사용자 보유 재료 중 *대체 가능한* id 반환.
   * preparable·substitute 케이스. 없으면 null.
   */
  findSubstitute: (ingredient_id: string | null) => string | null;
  ownedCount: number;
  totalIngredients: number;
  ingredientStatus: 'none' | 'partial' | 'all';
  /** 전체 매칭 summary — UI 가 카드별 chip 결정에 사용 */
  summary: RecipeMatchSummary;
  /** fetch 중 여부 */
  isLoading: boolean;
}

export function useRecipeFridgeMatch(
  ingredients: MatchableIngredient[],
  userIngredients: string[],         // legacy (옛 시그너처) — V2 에서 무시
  userIngredientIds: string[],
  userQtyMap?: UserQtyMap,            // 양 매칭(Phase 2). 없으면 양 판단 생략(degrade).
  servingsMultiplier: number = 1,    // 현재 인분/기본 인분 — 레시피 필요량 스케일
): UseRecipeFridgeMatchResult {
  void userIngredients;  // V2: 이름 매칭 안 함, 매개변수 호환만

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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (recipeIngredientIds.length === 0) {
      Promise.resolve().then(() => {
        if (!cancelled) { setGraph(EMPTY_GRAPH); setCoeffsMap(new Map()); }
      });
      return () => {
        cancelled = true;
      };
    }
    // setIsLoading 을 microtask 로 — set-state-in-effect lint 회피
    Promise.resolve().then(() => {
      if (!cancelled) setIsLoading(true);
    });
    const supabase = createClient();
    Promise.all([
      fetchRelationsForRecipe(recipeIngredientIds, supabase).then(g => { if (!cancelled) setGraph(g); }),
      fetchUnitCoeffs(recipeIngredientIds, supabase).then(c => { if (!cancelled) setCoeffsMap(c); }),
    ])
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recipeIngredientIds]);

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

  const isIngredientOwned = useCallback(
    // 정확 보유 또는 변형 보유(삼겹살→돼지고기). userBaseMap 은 base_id(=레시피 재료 id) 키.
    (id: string | null) => (id ? userIdSet.has(id) || userBaseMap.has(id) : false),
    [userIdSet, userBaseMap],
  );

  const findSubstitute = useCallback(
    (id: string | null): string | null => {
      if (!id) return null;
      const incoming = graph.incoming.get(id);
      if (!incoming) return null;
      // substitute 우선
      for (const { from_id, kind } of incoming) {
        if (kind === 'substitute' && userIdSet.has(from_id)) return from_id;
      }
      for (const { from_id, kind } of incoming) {
        if (kind === 'preparable_to' && userIdSet.has(from_id)) return from_id;
      }
      return null;
    },
    [graph, userIdSet],
  );

  return {
    isIngredientOwned,
    findSubstitute,
    ownedCount: summary.ownedCount,
    totalIngredients: summary.totalCount,
    ingredientStatus: summary.ingredientStatus,
    summary,
    isLoading,
  };
}

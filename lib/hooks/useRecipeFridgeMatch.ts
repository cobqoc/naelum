'use client';

import { useMemo, useCallback } from 'react';
import { isSameIngredient, isSubstituteFor, isFundamental } from '@/lib/recommendations/match';

/**
 * 레시피 재료 ↔ 사용자 냉장고 매칭 hook — RecipeBrowseView 의 fridge match 도메인.
 *
 * **Why 추출** ([[project-god-file-phase2]]):
 *  - RBV 의 *3 개 소비자*(재료 탭 카드 / 냉장고 모달 / cart "보유 제외" 토글)가 동일
 *    isIngredientOwned·findSubstitute·ownedCount 사용
 *  - 단일 출처화 — 한 곳만 수정하면 3 곳 동시 정확. 갈래나면 사용자에게 *모순된*
 *    화면 (재료 탭은 보유라는데 모달은 없다고 표시 등 — 2026-05-22 fix 사례)
 *  - 순수 derivation (state X) — useMemo 만으로 충분
 *
 * **불변식**:
 *  - 기본 재료(`isFundamental`: 물·소금 등)는 항상 보유 ✓
 *  - FK 일치(ingredient_id) 우선 — 이름 messy("양파(중)") 해도 정확 매칭
 *  - 동의어(`isSameIngredient`) — 까나리액젓을 멸치액젓 "보유" 처리 X (대체는 별도)
 *  - 매칭 카운트는 `is_optional` 재료 *제외* — "선택" 재료 보유 여부는 무관
 *  - findSubstitute: 전역 INGREDIENT_SUBSTITUTES → 레시피별(작성자 substitutes 배열) 순
 */

export interface MatchableIngredient {
  ingredient_name: string;
  ingredient_id?: string | null;
  is_optional?: boolean;
  /** legacy DB rows: string[] / 신규: { name; note? }[] */
  substitutes?: (string | { name?: string; note?: string })[] | null;
}

export interface UseRecipeFridgeMatchResult {
  /** name 보유 판정 — FK·동의어·기본재료 */
  isIngredientOwned: (name: string) => boolean;
  /**
   * 보유는 아니지만 대체 가능한 사용자 재료(via)를 찾는다.
   * @param name 레시피 재료명
   * @param recipeSpecific 레시피별 작성자 명시 substitutes (legacy/신규 양형식)
   */
  findSubstitute: (
    name: string,
    recipeSpecific?: (string | { name?: string; note?: string })[] | null,
  ) => string | null;
  /** 필수 재료(is_optional=false) 중 보유한 개수 */
  ownedCount: number;
  /** 필수 재료 총 개수 (is_optional 제외) */
  totalIngredients: number;
  /** 'none'(0) | 'partial' | 'all' — 냉장고 아이콘 색상 분기용 */
  ingredientStatus: 'none' | 'partial' | 'all';
}

export function useRecipeFridgeMatch(
  ingredients: MatchableIngredient[],
  userIngredients: string[],
  userIngredientIds: string[],
): UseRecipeFridgeMatchResult {
  // FK 매칭 — recipe 재료의 ingredient_id 가 user 보유 재료 id 와 일치하면 보유.
  // 이름이 messy 해도("양파(중)" 등) FK 로 정확히 잡는다(추천 API 와 동일 기준).
  const fkOwnedNames = useMemo(() => {
    const userIdSet = new Set(userIngredientIds);
    return new Set(
      ingredients
        .filter(i => i.ingredient_id && userIdSet.has(i.ingredient_id))
        .map(i => i.ingredient_name),
    );
  }, [ingredients, userIngredientIds]);

  // 보유 판정 — 물 등 기본 재료(isFundamental)는 항상 보유. FK 일치 또는
  // isSameIngredient(동의어). 까나리액젓을 가졌다고 멸치액젓을 "보유"로
  // 치지 않는다 — 그건 대체(findSubstitute) 영역.
  const isIngredientOwned = useCallback(
    (name: string) =>
      isFundamental(name) ||
      fkOwnedNames.has(name) ||
      userIngredients.some(ui => isSameIngredient(ui, name)),
    [fkOwnedNames, userIngredients],
  );

  // 대체 — 보유는 아니지만 가진 재료로 바꿔 쓸 수 있음. via(가진 재료명) 반환.
  // ① 전역 INGREDIENT_SUBSTITUTES → ② recipe-specific(작성자가 적은 substitutes 배열) 순서.
  // recipeSpecific: legacy string[] / 신규 {name,note?}[] 양형식 지원 (note 무시, name 만 매칭).
  const findSubstitute = useCallback(
    (
      name: string,
      recipeSpecific?: (string | { name?: string; note?: string })[] | null,
    ): string | null => {
      const globalVia = userIngredients.find(ui => isSubstituteFor(ui, name)) ?? null;
      if (globalVia) return globalVia;
      if (Array.isArray(recipeSpecific) && recipeSpecific.length > 0) {
        const subsLC = recipeSpecific
          .map(s => (typeof s === 'string' ? s : (s?.name ?? '')).toLowerCase().trim())
          .filter(Boolean);
        return (
          userIngredients.find(ui => {
            const u = ui.toLowerCase().trim();
            return subsLC.some(s => s === u || isSameIngredient(u, s));
          }) ?? null
        );
      }
      return null;
    },
    [userIngredients],
  );

  // 매칭 카운트는 is_optional 재료를 제외하고 계산 ("선택" 재료는 보유 여부와 무관).
  const requiredIngredients = useMemo(
    () => ingredients.filter(i => !i.is_optional),
    [ingredients],
  );
  const ownedCount = useMemo(
    () => requiredIngredients.filter(i => isIngredientOwned(i.ingredient_name)).length,
    [requiredIngredients, isIngredientOwned],
  );
  const totalIngredients = requiredIngredients.length;

  const ingredientStatus: 'none' | 'partial' | 'all' =
    totalIngredients === 0
      ? 'none'
      : ownedCount === 0
        ? 'none'
        : ownedCount === totalIngredients
          ? 'all'
          : 'partial';

  return { isIngredientOwned, findSubstitute, ownedCount, totalIngredients, ingredientStatus };
}

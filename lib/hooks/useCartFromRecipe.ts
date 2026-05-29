'use client';

import { useCallback, useState } from 'react';
import type { TranslationKeys } from '@/lib/i18n/translations';

/**
 * 레시피 → 장보기 카트 추가 hook.
 *
 * **Why 추출** ([[project-god-file-phase2]]):
 *  - excludeOwnedInCart 체크박스 + addingToShoppingList 스피너 + POST + 토스트 단일 책임
 *  - `useRecipeFridgeMatch` 가 제공하는 `isIngredientOwned`·`ownedCount` 만 외부 주입
 *  - 카트 도메인 자체는 fridge match 외부와 무관 — 추출 깔끔
 *
 * **불변식**:
 *  - excludeOwnedInCart && 전부 보유 → POST 안 함, "전부 보유" 토스트
 *  - 성공 → `shopping-list-updated` 이벤트 발행 → cart dropdown 자동 refresh
 *  - 어느 분기든 마지막에 addingToShoppingList=false (스피너 해제)
 */

export interface RecipeIngredientForCart {
  ingredient_id: string | null;  // V2: id 기반 매칭. null = 옛 데이터
  ingredient_name: string;
  quantity: string;
  unit: string;
}

export interface RecipeForCart {
  id: string;
  title: string;
  ingredients: RecipeIngredientForCart[];
}

export interface CartToastShape {
  success: (msg: string) => void;
  info: (msg: string) => void;
  error: (msg: string) => void;
}

export interface CartLocaleMessages {
  cartAllOwned: string;
  cartAddedSimple: string;
  cartAddedWithSkip: string;
  cartAddFailed: string;
}

export interface UseCartFromRecipeResult {
  /** "보유 재료 제외" 체크박스 상태 */
  excludeOwnedInCart: boolean;
  setExcludeOwnedInCart: (v: boolean) => void;
  /** POST 진행 중 — 버튼 disable + 스피너 */
  addingToShoppingList: boolean;
  /** 카트 추가 액션 (POST → 이벤트 발행 + 토스트) */
  addToShoppingList: () => Promise<void>;
}

export function useCartFromRecipe(args: {
  recipe: RecipeForCart;
  /** V2: ingredient_id 기반 — null 이면 항상 false (옛 데이터 매칭 안 됨) */
  isIngredientOwned: (ingredient_id: string | null) => boolean;
  ownedCount: number;
  toast: CartToastShape;
  locale: CartLocaleMessages;
}): UseCartFromRecipeResult {
  const [excludeOwnedInCart, setExcludeOwnedInCart] = useState(false);
  const [addingToShoppingList, setAddingToShoppingList] = useState(false);

  const { recipe, isIngredientOwned, ownedCount, toast, locale } = args;

  const addToShoppingList = useCallback(async () => {
    setAddingToShoppingList(true);
    try {
      const ingredientsToSend = excludeOwnedInCart
        ? recipe.ingredients.filter(i => !isIngredientOwned(i.ingredient_id))
        : recipe.ingredients;

      if (ingredientsToSend.length === 0) {
        toast.info(locale.cartAllOwned);
        setAddingToShoppingList(false);
        return;
      }

      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          ingredients: ingredientsToSend.map(i => ({
            ingredient_name: i.ingredient_name,
            quantity: i.quantity,
            unit: i.unit,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const added = data.added || 0;
        const skippedOwned = excludeOwnedInCart ? ownedCount : 0;
        toast.success(
          skippedOwned > 0
            ? locale.cartAddedWithSkip.replace('{count}', String(added)).replace('{skip}', String(skippedOwned))
            : locale.cartAddedSimple.replace('{count}', String(added)),
        );
        window.dispatchEvent(new Event('shopping-list-updated'));
      } else {
        toast.error(data.error || locale.cartAddFailed);
      }
    } catch {
      toast.error(locale.cartAddFailed);
    }
    setAddingToShoppingList(false);
  }, [excludeOwnedInCart, recipe, isIngredientOwned, ownedCount, toast, locale]);

  return { excludeOwnedInCart, setExcludeOwnedInCart, addingToShoppingList, addToShoppingList };
}

// TranslationKeys 가 위 import 에서 사용 안 되면 unused warning — 명시 alias 로 의도 보존.
export type CartLocaleStrict = Pick<TranslationKeys['recipe'], 'cartAllOwned' | 'cartAddedSimple' | 'cartAddedWithSkip' | 'cartAddFailed'>;

import type { ShoppingItem } from '@/lib/shopping-list/cache';
import type { TranslationKeys } from '@/lib/i18n/translations';

/**
 * 장보기 항목 그룹핑 — 순수 알고리즘.
 *
 * god-file(ShoppingCartDropdown) 분해 Phase 2: 표현과 무관한 순수 함수라
 * 컴포넌트에서 분리해 vitest 단독 검증(영상 「2차 소프트웨어 위기」 테스트
 * 처방). 로직은 원본과 byte-identical — 동작 변경 0.
 */

export interface GroupedItems {
  groupTitle: string;
  groupKey: string;
  groupIcon: string;
  items: ShoppingItem[];
}

export type GroupMode = 'recipe' | 'category';

export const CATEGORY_LABELS: Record<string, { label: string; icon: string; order: number }> = {
  veggie: { label: '채소', icon: '🥬', order: 1 },
  fruit: { label: '과일', icon: '🍎', order: 2 },
  meat: { label: '육류', icon: '🥩', order: 3 },
  seafood: { label: '해산물', icon: '🐟', order: 4 },
  dairy: { label: '유제품·계란', icon: '🥛', order: 5 },
  grain: { label: '곡물·면', icon: '🌾', order: 6 },
  seasoning: { label: '양념&소스', icon: '🥫', order: 7 },
  condiment: { label: '조미료', icon: '🧂', order: 8 },
  beverage: { label: '음료', icon: '🥤', order: 9 },
  snack: { label: '간식', icon: '🍪', order: 10 },
  other: { label: '기타', icon: '📦', order: 99 },
  // 2026-10-04 TT-30/PAU-50: 2026-05-30 이후 재료 분류(ingredients_master.category)에 생긴 키 — 예전엔 이 표에 없어
  // 각각 별도 "📦 기타"(한국어 고정, 순서 99) 그룹으로 흩어졌다. 위 기존 11종의 라벨·아이콘·순서는 그대로 두고,
  // 마트 동선상 가까운 기존 분류 사이에 소수 순서로 끼운다. 아이콘은 부엌 도감(kitchen CATEGORY_EMOJI)과 동일,
  // label 은 한국어 폴백(화면 표시는 categoryLabelFor 가 t.ingredient.categoryLabels 번역을 씀).
  mushroom: { label: '버섯류', icon: '🍄', order: 1.5 },
  seaweed: { label: '해조류', icon: '🌿', order: 4.5 },
  egg: { label: '달걀류', icon: '🥚', order: 5.5 },
  legume: { label: '콩류', icon: '🫘', order: 6.2 },
  nuts: { label: '견과류', icon: '🥜', order: 6.4 },
  seeds: { label: '씨앗류', icon: '🌰', order: 6.6 },
  oil: { label: '유지·기름', icon: '🫗', order: 7.3 },
  sweetener: { label: '당류·감미료', icon: '🍯', order: 7.6 },
  alcohol: { label: '주류', icon: '🍷', order: 9.5 },
};

/**
 * 장보기 카테고리 키 → 현재 로케일 라벨. 장보기 전용 라벨(t.cart.categoryLabels)이 있으면 그대로(기존 표시 유지),
 * 없으면 재료 분류 라벨(t.ingredient.categoryLabels — 신규 분류 포함), 둘 다 없으면 null(호출자가 폴백 결정).
 * 프로토타입 키(constructor 등)를 라벨로 오인하지 않게 own property 만 본다. (TT-30·PAU-48, 2026-10-04)
 */
export function categoryLabelFor(
  t: { cart: Pick<TranslationKeys['cart'], 'categoryLabels'>; ingredient: Pick<TranslationKeys['ingredient'], 'categoryLabels'> },
  key: string,
): string | null {
  const own = (labels: Record<string, string>) =>
    Object.prototype.hasOwnProperty.call(labels, key) ? labels[key] : undefined;
  return own(t.cart.categoryLabels) ?? own(t.ingredient.categoryLabels) ?? null;
}

export function getCategoryMeta(category: string) {
  return CATEGORY_LABELS[category] ?? CATEGORY_LABELS.other;
}

export function groupItems(items: ShoppingItem[], mode: GroupMode): GroupedItems[] {
  const map = new Map<string, GroupedItems>();
  for (const item of items) {
    if (mode === 'recipe') {
      const key = item.recipe_id ?? '__manual__';
      if (!map.has(key)) {
        map.set(key, {
          groupTitle: item.recipe_title ?? '직접 추가',
          groupKey: key,
          groupIcon: item.recipe_id ? '🍲' : '📦',
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    } else {
      const key = item.category || 'other';
      if (!map.has(key)) {
        const meta = getCategoryMeta(key);
        map.set(key, {
          groupTitle: meta.label,
          groupKey: key,
          groupIcon: meta.icon,
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    }
  }
  const result = Array.from(map.values());
  if (mode === 'category') {
    result.sort((a, b) => getCategoryMeta(a.groupKey).order - getCategoryMeta(b.groupKey).order);
  }
  return result;
}

import type { ShoppingItem } from '@/lib/shopping-list/cache';

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
};

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

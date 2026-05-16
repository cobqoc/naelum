import { describe, it, expect } from 'vitest';
import { groupItems, getCategoryMeta, CATEGORY_LABELS } from '@/lib/shopping-list/groupItems';
import type { ShoppingItem } from '@/lib/shopping-list/cache';

// 테스트에 필요한 필드만 채운 최소 ShoppingItem (그룹핑은 id/recipe_*/category 만 사용)
function item(partial: Partial<ShoppingItem>): ShoppingItem {
  return {
    id: Math.random().toString(36).slice(2),
    ingredient_name: 'x',
    category: '',
    recipe_id: null,
    recipe_title: null,
    is_checked: false,
    quantity: 1,
    unit: null,
    note: null,
    is_owned: false,
    ...partial,
  } as ShoppingItem;
}

describe('groupItems', () => {
  it('recipe 모드: recipe_id 별로 묶고 title/icon 을 채운다', () => {
    const groups = groupItems(
      [
        item({ recipe_id: 'r1', recipe_title: '김치찌개' }),
        item({ recipe_id: 'r1', recipe_title: '김치찌개' }),
        item({ recipe_id: 'r2', recipe_title: '된장국' }),
      ],
      'recipe'
    );
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ groupKey: 'r1', groupTitle: '김치찌개', groupIcon: '🍲' });
    expect(groups[0].items).toHaveLength(2);
    expect(groups[1].groupKey).toBe('r2');
  });

  it('recipe 모드: recipe_id 없으면 __manual__ / "직접 추가" / 📦 로 묶인다', () => {
    const groups = groupItems(
      [item({ recipe_id: null }), item({ recipe_id: null })],
      'recipe'
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      groupKey: '__manual__',
      groupTitle: '직접 추가',
      groupIcon: '📦',
    });
  });

  it('category 모드: category 별로 묶는다', () => {
    const groups = groupItems(
      [
        item({ category: 'vegetable' }),
        item({ category: 'meat' }),
        item({ category: 'vegetable' }),
      ],
      'category'
    );
    const veg = groups.find(g => g.groupKey === 'vegetable')!;
    expect(veg.items).toHaveLength(2);
    expect(veg.groupTitle).toBe('채소');
    expect(veg.groupIcon).toBe('🥬');
  });

  it('category 모드: 빈/미지정 category 는 other(기타)로 fallback', () => {
    const groups = groupItems([item({ category: '' }), item({ category: 'unknowncat' })], 'category');
    // '' → 'other', 'unknowncat' → meta fallback(other) 이지만 key 는 원본 유지
    const other = groups.find(g => g.groupKey === 'other')!;
    expect(other).toBeDefined();
    expect(other.groupTitle).toBe('기타');
    const unknown = groups.find(g => g.groupKey === 'unknowncat')!;
    expect(unknown.groupTitle).toBe('기타'); // getCategoryMeta fallback
  });

  it('category 모드: order 기준 정렬 (채소1 < 육류3 < 기타99)', () => {
    const groups = groupItems(
      [item({ category: 'other' }), item({ category: 'meat' }), item({ category: 'vegetable' })],
      'category'
    );
    expect(groups.map(g => g.groupKey)).toEqual(['vegetable', 'meat', 'other']);
  });

  it('recipe 모드는 정렬하지 않고 삽입 순서를 유지', () => {
    const groups = groupItems(
      [item({ recipe_id: 'z' }), item({ recipe_id: 'a' })],
      'recipe'
    );
    expect(groups.map(g => g.groupKey)).toEqual(['z', 'a']);
  });

  it('빈 입력 → 빈 그룹', () => {
    expect(groupItems([], 'recipe')).toEqual([]);
    expect(groupItems([], 'category')).toEqual([]);
  });

  it('getCategoryMeta: 미지정 카테고리는 other 메타', () => {
    expect(getCategoryMeta('nope')).toBe(CATEGORY_LABELS.other);
    expect(getCategoryMeta('vegetable')).toBe(CATEGORY_LABELS.vegetable);
  });
});

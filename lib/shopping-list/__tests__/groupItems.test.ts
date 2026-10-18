import { describe, it, expect } from 'vitest';
import { groupItems, getCategoryMeta, CATEGORY_LABELS, categoryLabelFor } from '@/lib/shopping-list/groupItems';
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
        item({ category: 'veggie' }),
        item({ category: 'meat' }),
        item({ category: 'veggie' }),
      ],
      'category'
    );
    const veg = groups.find(g => g.groupKey === 'veggie')!;
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
      [item({ category: 'other' }), item({ category: 'meat' }), item({ category: 'veggie' })],
      'category'
    );
    expect(groups.map(g => g.groupKey)).toEqual(['veggie', 'meat', 'other']);
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
    expect(getCategoryMeta('veggie')).toBe(CATEGORY_LABELS.veggie);
  });
});

// 2026-10-04 TT-30/PAU-50: 신규 재료 분류가 각자 "기타" 그룹으로 흩어지던 버그 — 기존 11종은 그대로, 신규만 제자리.
describe('groupItems — 신규 재료 분류 (TT-30)', () => {
  const LEGACY = ['veggie', 'fruit', 'meat', 'seafood', 'dairy', 'grain', 'seasoning', 'condiment', 'beverage', 'snack', 'other'];
  const NEW = ['mushroom', 'seaweed', 'egg', 'legume', 'nuts', 'seeds', 'oil', 'sweetener', 'alcohol'];

  it('기존 11종 메타(라벨·아이콘·순서)는 그대로', () => {
    expect(CATEGORY_LABELS.veggie).toEqual({ label: '채소', icon: '🥬', order: 1 });
    expect(CATEGORY_LABELS.dairy).toEqual({ label: '유제품·계란', icon: '🥛', order: 5 });
    expect(CATEGORY_LABELS.grain).toEqual({ label: '곡물·면', icon: '🌾', order: 6 });
    expect(CATEGORY_LABELS.snack).toEqual({ label: '간식', icon: '🍪', order: 10 });
    expect(CATEGORY_LABELS.other).toEqual({ label: '기타', icon: '📦', order: 99 });
    // 기존끼리의 상대 순서 불변
    const legacyOrder = [...LEGACY].sort((a, b) => CATEGORY_LABELS[a].order - CATEGORY_LABELS[b].order);
    expect(legacyOrder).toEqual(LEGACY);
  });

  it('신규 분류는 각자 자기 메타를 갖고 "기타"(other)로 떨어지지 않는다', () => {
    for (const key of NEW) {
      expect(getCategoryMeta(key)).not.toBe(CATEGORY_LABELS.other);
      expect(getCategoryMeta(key).icon).not.toBe('📦');
    }
    const groups = groupItems(
      [item({ category: 'egg' }), item({ category: 'mushroom' }), item({ category: 'seaweed' }), item({ category: 'egg' })],
      'category'
    );
    expect(groups.map(g => g.groupKey)).toEqual(['mushroom', 'seaweed', 'egg']); // 1.5 < 4.5 < 5.5
    expect(groups.find(g => g.groupKey === 'egg')!.items).toHaveLength(2);
    expect(groups.every(g => g.groupTitle !== '기타')).toBe(true);
  });

  it('신규 분류는 마트 동선상 가까운 기존 분류 사이에 정렬', () => {
    const keys = ['other', 'alcohol', 'snack', 'sweetener', 'oil', 'seasoning', 'egg', 'dairy', 'seaweed', 'seafood', 'mushroom', 'veggie', 'legume', 'grain', 'nuts', 'seeds', 'beverage', 'condiment', 'meat', 'fruit'];
    const groups = groupItems(keys.map(k => item({ category: k })), 'category');
    expect(groups.map(g => g.groupKey)).toEqual([
      'veggie', 'mushroom', 'fruit', 'meat', 'seafood', 'seaweed', 'dairy', 'egg', 'grain', 'legume', 'nuts', 'seeds',
      'seasoning', 'oil', 'sweetener', 'condiment', 'beverage', 'alcohol', 'snack', 'other',
    ]);
  });

  it('여전히 모르는 키는 기존처럼 원본 key 의 별도 그룹 + other 메타(기존 테스트와 동일 규칙)', () => {
    const groups = groupItems([item({ category: 'fermented' }), item({ category: 'zzz' })], 'category');
    expect(groups.find(g => g.groupKey === 'fermented')!.groupIcon).toBe('📦');
    expect(groups.find(g => g.groupKey === 'zzz')!.groupTitle).toBe('기타');
  });
});

describe('categoryLabelFor (TT-30·PAU-48)', () => {
  it('장보기 라벨 우선 → 재료 분류 라벨 → null, 프로토타입 키 무시', async () => {
    const { ko } = await import('@/lib/i18n/locales/ko');
    const { en } = await import('@/lib/i18n/locales/en');
    expect(categoryLabelFor(ko, 'veggie')).toBe(ko.cart.categoryLabels.veggie);       // 기존 표시 유지
    expect(categoryLabelFor(ko, 'processed')).toBe(ko.cart.categoryLabels.processed);
    expect(categoryLabelFor(ko, 'egg')).toBe(ko.ingredient.categoryLabels.egg);         // 신규 → 재료 분류 라벨
    expect(categoryLabelFor(en, 'mushroom')).toBe('Mushrooms');
    expect(categoryLabelFor(en, 'seaweed')).not.toMatch(/[가-힣]/);
    expect(categoryLabelFor(ko, 'zzz')).toBeNull();
    expect(categoryLabelFor(ko, 'constructor')).toBeNull();
    expect(categoryLabelFor(ko, '')).toBeNull();
  });
  it('CATEGORY_LABELS 의 모든 키는 8개 로케일 어디서든 번역 라벨을 가진다', async () => {
    for (const lang of ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', 'it'] as const) {
      const mod = await import(`@/lib/i18n/locales/${lang}.ts`);
      const t = mod[lang];
      for (const key of Object.keys(CATEGORY_LABELS)) {
        expect(categoryLabelFor(t, key), `${lang}.${key}`).toBeTruthy();
      }
    }
  });
});

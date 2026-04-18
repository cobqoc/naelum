/**
 * 카테고리(국가/요리) 칩에 쓰이는 시각적 매핑.
 * 로직/필터 값은 `recipe.ts`의 CUISINE_TYPES / DISH_TYPES에서 오고, 여기선 아이콘·색·이미지만 관리.
 */

export const CUISINE_IMAGES: Partial<Record<string, string>> = {
  korean: '/images/categories/korean.svg',
  chinese: '/images/categories/chinese.svg',
  italian: '/images/categories/italian.svg',
};

export const CUISINE_ICONS: Record<string, string> = {
  korean: '🇰🇷',
  chinese: '🥢',
  japanese: '🍣',
  western: '🥩',
  italian: '🍝',
  french: '🥐',
  mexican: '🌮',
  indian: '🍛',
  thai: '🌶️',
  vietnamese: '🍜',
  other: '🍽️',
};

export const CUISINE_COLORS: Record<string, string> = {
  korean: '#ef4444',
  chinese: '#f59e0b',
  japanese: '#ec4899',
  western: '#3b82f6',
  italian: '#22c55e',
  french: '#a855f7',
  mexican: '#f97316',
  indian: '#eab308',
  thai: '#84cc16',
  vietnamese: '#10b981',
  other: '#6b7280',
};

export const DISH_ICONS: Record<string, string> = {
  main: '🍖',
  soup: '🍲',
  side: '🍱',
  noodle: '🍜',
  rice: '🍚',
  dessert: '🍰',
  beverage: '☕',
  snack: '🍿',
  salad: '🥗',
  baking: '🍞',
  other: '🍽️',
};

export const DISH_COLORS: Record<string, string> = {
  main: '#ef4444',
  soup: '#f97316',
  side: '#22c55e',
  noodle: '#f59e0b',
  rice: '#84cc16',
  dessert: '#ec4899',
  beverage: '#3b82f6',
  snack: '#a855f7',
  salad: '#34d399',
  baking: '#d97706',
  other: '#6b7280',
};

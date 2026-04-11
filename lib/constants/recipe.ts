export const CUISINE_TYPES = [
  { value: 'korean', label: '한식' },
  { value: 'chinese', label: '중식' },
  { value: 'japanese', label: '일식' },
  { value: 'western', label: '양식' },
  { value: 'italian', label: '이탈리안' },
  { value: 'french', label: '프렌치' },
  { value: 'mexican', label: '멕시칸' },
  { value: 'indian', label: '인도' },
  { value: 'thai', label: '태국' },
  { value: 'vietnamese', label: '베트남' },
  { value: 'other', label: '기타' },
] as const;

export const DISH_TYPES = [
  { value: 'main', label: '메인 요리' },
  { value: 'soup', label: '국&찌개' },
  { value: 'side', label: '반찬/사이드' },
  { value: 'noodle', label: '면 요리' },
  { value: 'rice', label: '밥/볶음밥' },
  { value: 'dessert', label: '디저트' },
  { value: 'beverage', label: '음료' },
  { value: 'snack', label: '간식' },
  { value: 'salad', label: '샐러드' },
  { value: 'baking', label: '베이킹/빵' },
  { value: 'other', label: '기타' },
] as const;

export const DIFFICULTY_LEVELS = [
  { value: 'easy', label: '초급' },
  { value: 'medium', label: '중급' },
  { value: 'hard', label: '고급' },
] as const;

export const UNITS = [
  '선택', 'g', 'kg', 'ml', 'L', '개', '큰술', '작은술',
  '컵', '줌', '꼬집', '조각', '장', '포기', '대', '모', '마리', '기타',
] as const;

export const CUISINE_TYPE_TAGS: Record<string, string[]> = {
  korean: ['한식', 'KoreanFood'],
  chinese: ['중식', 'ChineseFood'],
  japanese: ['일식', 'JapaneseFood'],
  western: ['양식', 'WesternFood'],
  italian: ['이탈리안', 'ItalianFood'],
  french: ['프렌치', 'FrenchFood'],
  mexican: ['멕시칸', 'MexicanFood'],
  indian: ['인도요리', 'IndianFood'],
  thai: ['태국요리', 'ThaiFood'],
};

export const DISH_TYPE_TAGS: Record<string, string[]> = {
  main: ['메인요리', 'MainDish'],
  soup: ['국물요리', 'Soup'],
  side: ['반찬', 'SideDish'],
  noodle: ['면요리', 'Noodles'],
  rice: ['밥요리', 'RiceDish'],
  dessert: ['디저트', 'Dessert'],
  beverage: ['음료', 'Beverage'],
  snack: ['간식', 'Snack'],
};

export const DIETARY_TAGS: Record<string, string[]> = {
  vegetarian: ['채식', 'Vegetarian'],
  vegan: ['비건', 'Vegan'],
  glutenFree: ['글루텐프리', 'GlutenFree'],
};

export const DIETARY_DESCRIPTIONS: Record<string, string> = {
  vegetarian: '육류와 해산물을 먹지 않는 식단입니다',
  vegan: '모든 동물성 식품(고기, 유제품, 계란 등)을 제외한 식단입니다',
  glutenFree: '밀, 보리, 호밀 등 글루텐 함유 곡물을 제외한 식단입니다',
};

export interface RecipeIngredient {
  ingredient_name: string;
  quantity: string;
  unit: string;
  notes: string;
  is_optional: boolean;
}

export interface RecipeStep {
  title?: string;
  instruction: string;
  timer_minutes: number | null;
  tip: string;
  image_url: string | null;
}

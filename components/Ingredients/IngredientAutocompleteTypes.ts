/**
 * 재료 자동완성 전용 타입 정의
 */

import { AutocompleteItem } from '../Common/AutocompleteTypes';

/**
 * 재료 아이템 인터페이스
 * AutocompleteItem을 확장하여 재료 전용 필드 추가
 */
export interface IngredientItem extends AutocompleteItem {
  /** 재료 ID */
  id: string;

  /** 재료명 (한글) - label로도 사용 */
  name: string;

  /** 재료명 (영문) - secondaryLabel로도 사용 */
  name_en: string | null;

  /** 카테고리 */
  category: string | null;

  /** 서브카테고리 */
  subcategory?: string | null;

  /** 이미지 URL */
  image_url?: string | null;

  /** 일반적인 단위 목록 */
  common_units: string[];

  /** 검색 횟수 (인기도) */
  search_count?: number;

  // AutocompleteItem 필드 매핑
  label: string;           // = name
  secondaryLabel?: string; // = name_en
  icon?: string;           // = 카테고리 이모지
  badge?: string;          // = category
}

/**
 * 재료 카테고리 인터페이스
 */
export interface IngredientCategory {
  /** 카테고리 ID */
  id: string;

  /** 카테고리명 (한글) */
  name: string;

  /** 카테고리 이모지 아이콘 */
  icon: string;

  /** 색상 (선택사항) */
  color?: string;
}

/**
 * 재료 카테고리 목록 (ingredients_master.category 값과 일치)
 */
export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  { id: 'veggie', name: '채소', icon: '🥬' },
  { id: 'fruit', name: '과일', icon: '🍎' },
  { id: 'meat', name: '육류', icon: '🥩' },
  { id: 'seafood', name: '해산물', icon: '🐟' },
  { id: 'grain', name: '곡물류', icon: '🌾' },
  { id: 'dairy', name: '유제품', icon: '🧀' },
  { id: 'fermented', name: '발효식품', icon: '🫙' },
  { id: 'seasoning', name: '양념&소스', icon: '🥫' },
  { id: 'condiment', name: '조미료', icon: '🧂' },
  { id: 'spice', name: '향신료', icon: '🌶️' },
  { id: 'oil', name: '유지·기름', icon: '🫗' },
  { id: 'sweetener', name: '당류·감미료', icon: '🍯' },
  { id: 'mushroom', name: '버섯류', icon: '🍄' },
  { id: 'seaweed', name: '해조류', icon: '🌿' },
  { id: 'nuts', name: '견과류', icon: '🥜' },
  { id: 'beverage', name: '음료', icon: '🥤' },
  { id: 'snack', name: '간식', icon: '🍪' },
  { id: 'bakery', name: '베이커리', icon: '🍞' },
  { id: 'other', name: '기타', icon: '📦' },
];

/**
 * 재료 추가 모달에서 사용하는 카테고리 목록.
 * - 완성품(베이커리·간식·음료)과 기타는 검색으로만 추가하도록 탭에서 제외
 * - "가공식품" 탭 신설 (2026-05-20) — 라면·스팸·통조림·캔류 등 광범위 묶음.
 *   도감(INGREDIENT_CATEGORIES)은 정확한 세분화 유지 (스팸=meat, 라면=grain 등).
 *   `is_processed=true` 인 재료가 가공식품 탭에 노출됨.
 */
export const MODAL_INGREDIENT_CATEGORIES: IngredientCategory[] = [
  ...INGREDIENT_CATEGORIES.filter(c => !['bakery', 'snack', 'beverage', 'other'].includes(c.id)),
  { id: 'processed', name: '가공식품', icon: '🥫' },
];

/**
 * 카테고리 ID를 이름으로 변환
 */
export function getCategoryName(categoryId: string | null): string {
  if (!categoryId) return '기타';
  const category = INGREDIENT_CATEGORIES.find(c => c.id === categoryId);
  return category?.name || '기타';
}

/**
 * 재료 자동완성 V2 Props
 */
export interface IngredientAutocompleteV2Props {
  /** 현재 입력값 */
  value: string;

  /** 입력값 변경 핸들러 */
  onChange: (value: string) => void;

  /** 재료 선택 핸들러 */
  onSelect: (ingredient: IngredientItem) => void;

  /** Placeholder 텍스트 */
  placeholder?: string;

  /** 드롭다운 열림 방향 — 'down'(기본) | 'up'(입력창 위) */
  dropdownDirection?: 'down' | 'up';

  // ===== 재료 전용 기능 =====

  /** 카테고리 필터 활성화 */
  enableCategoryFilter?: boolean;

  /** 선택된 카테고리 목록 */
  selectedCategories?: string[];

  /** 카테고리 선택 변경 핸들러 */
  onCategoryChange?: (categories: string[]) => void;

  /** 최근 선택 재료 활성화 */
  enableRecentItems?: boolean;

  /** 최대 최근 항목 개수 (기본값: 10) */
  maxRecentItems?: number;

  /** 커스텀 재료 직접 추가 허용 */
  allowCustomIngredient?: boolean;

  /**
   * 커스텀 재료 추가 핸들러
   * @param name - 입력한 재료명
   */
  onCustomIngredient?: (name: string) => void;

  // ===== 스타일링 =====

  /** 입력창 클래스명 */
  className?: string;

  /** 비활성화 */
  disabled?: boolean;

  /** 데스크톱에서 마운트 시 자동 포커스 */
  autoFocus?: boolean;

  /** 컴팩트 모드 — 이모지·카테고리 배지·영문명 숨김 (좁은 폼에 적합) */
  compact?: boolean;
}

/**
 * API 응답 형식
 */
export interface IngredientAutocompleteResponse {
  suggestions: Array<{
    id: string;
    name: string;
    name_en: string | null;
    name_ko: string | null;
    category: string | null;
    subcategory?: string | null;
    image_url: string | null;
    common_units: string[];
    search_count?: number;
    emoji?: string | null;
  }>;
}

/**
 * API 응답을 IngredientItem으로 변환
 */
export function convertToIngredientItem(
  apiItem: IngredientAutocompleteResponse['suggestions'][0]
): IngredientItem {
  const name = apiItem.name_ko || apiItem.name;
  return {
    id: apiItem.id,
    name,
    name_en: apiItem.name_en,
    category: apiItem.category,
    subcategory: apiItem.subcategory,
    image_url: apiItem.image_url,
    common_units: apiItem.common_units || [],
    search_count: apiItem.search_count,
    // AutocompleteItem 필드
    label: name,
    secondaryLabel: apiItem.name_en || undefined,
    icon: apiItem.emoji || undefined,
    badge: apiItem.category || undefined,
  };
}

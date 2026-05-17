/**
 * 최근 선택 재료 관리 유틸리티
 * localStorage를 사용하여 사용자의 최근 선택 재료를 저장하고 관리
 */

const STORAGE_KEY = 'naelum:recentIngredients';
const MAX_RECENT_ITEMS = 10;
const STORAGE_VERSION = 1;

/**
 * 최근 선택 재료 아이템 인터페이스
 */
export interface RecentIngredient {
  /** 재료 ID (ingredients_master의 ID) */
  id: string;

  /** 재료명 (한글) */
  name: string;

  /** 재료명 (영문) */
  name_en: string | null;

  /** 카테고리 */
  category: string | null;

  /** 마지막 선택 시간 (Unix timestamp) */
  timestamp: number;

  /** 선택 횟수 */
  count: number;

  /** DB emoji — favorites 경로에서 채워짐, localStorage fallback은 undefined */
  emoji?: string | null;
}

/**
 * localStorage 저장 구조
 */
interface RecentIngredientsStorage {
  items: RecentIngredient[];
  version: number;
  lastUpdated: number;
}

/**
 * localStorage에서 최근 재료 데이터 가져오기
 * @returns 최근 선택 재료 배열 (count 높은 순으로 정렬됨)
 */
export function getRecentIngredients(): RecentIngredient[] {
  // 서버 사이드 렌더링 환경에서는 빈 배열 반환
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const data: RecentIngredientsStorage = JSON.parse(stored);

    // 버전 확인
    if (data.version !== STORAGE_VERSION) {
      console.warn('Recent ingredients storage version mismatch. Clearing data.');
      clearRecentIngredients();
      return [];
    }

    // count 높은 순으로 정렬
    return data.items.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count; // count 내림차순
      }
      return b.timestamp - a.timestamp; // count 같으면 최근 선택 순
    });
  } catch (error) {
    console.error('Error reading recent ingredients:', error);
    return [];
  }
}

/**
 * 재료를 최근 선택 목록에 추가하거나 업데이트
 * - 이미 존재하면 count 증가 + timestamp 갱신
 * - 없으면 새로 추가
 * - 최대 개수 초과 시 가장 오래된 항목 제거
 *
 * @param ingredient - 추가할 재료 정보
 */
export function addRecentIngredient(ingredient: {
  id: string;
  name: string;
  name_en: string | null;
  category: string | null;
}): void {
  // 서버 사이드 렌더링 환경에서는 실행하지 않음
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentItems = getRecentIngredients();
    const existingIndex = currentItems.findIndex(item => item.id === ingredient.id);

    let updatedItems: RecentIngredient[];

    if (existingIndex !== -1) {
      // 기존 항목 업데이트
      updatedItems = [...currentItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        count: updatedItems[existingIndex].count + 1,
        timestamp: Date.now(),
      };
    } else {
      // 새 항목 추가
      const newItem: RecentIngredient = {
        id: ingredient.id,
        name: ingredient.name,
        name_en: ingredient.name_en,
        category: ingredient.category,
        timestamp: Date.now(),
        count: 1,
      };

      updatedItems = [newItem, ...currentItems];
    }

    // 최대 개수 제한
    if (updatedItems.length > MAX_RECENT_ITEMS) {
      // count가 가장 낮고 가장 오래된 항목 제거
      updatedItems.sort((a, b) => {
        if (a.count !== b.count) {
          return a.count - b.count; // count 오름차순
        }
        return a.timestamp - b.timestamp; // 오래된 순
      });
      updatedItems = updatedItems.slice(1); // 첫 번째(가장 우선순위 낮은) 항목 제거
    }

    // localStorage에 저장
    const storageData: RecentIngredientsStorage = {
      items: updatedItems,
      version: STORAGE_VERSION,
      lastUpdated: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error('Error adding recent ingredient:', error);

    // localStorage 용량 초과 시 전체 삭제
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Clearing recent ingredients.');
      clearRecentIngredients();
    }
  }
}

/**
 * localStorage의 자주 사용 재료를 서버 user_favorites_ingredients로 일괄 이전.
 * 한 번 성공하면 SYNC_FLAG로 표시하고 더는 호출하지 않음. localStorage 데이터도 정리.
 */
const SYNC_FLAG_KEY = 'naelum:recentIngredients:synced_v1';

export async function syncRecentIngredientsToFavorites(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SYNC_FLAG_KEY) === '1') return;

  const items = getRecentIngredients();
  if (items.length === 0) {
    localStorage.setItem(SYNC_FLAG_KEY, '1');
    return;
  }

  try {
    const res = await fetch('/api/favorites/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(i => ({
          ingredient_name: i.name,
          category: i.category,
          count: i.count,
        })),
      }),
    });
    if (res.ok) {
      localStorage.setItem(SYNC_FLAG_KEY, '1');
      clearRecentIngredients();
    }
  } catch {
    // 실패 시 flag 안 세움 → 다음 로드에 재시도
  }
}

/**
 * 최근 선택 재료 전체 삭제
 */
export function clearRecentIngredients(): void {
  // 서버 사이드 렌더링 환경에서는 실행하지 않음
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing recent ingredients:', error);
  }
}

/**
 * 특정 재료를 최근 선택 목록에서 제거
 * @param ingredientId - 제거할 재료 ID
 */
export function removeRecentIngredient(ingredientId: string): void {
  // 서버 사이드 렌더링 환경에서는 실행하지 않음
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentItems = getRecentIngredients();
    const filteredItems = currentItems.filter(item => item.id !== ingredientId);

    const storageData: RecentIngredientsStorage = {
      items: filteredItems,
      version: STORAGE_VERSION,
      lastUpdated: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error('Error removing recent ingredient:', error);
  }
}

/**
 * 최근 선택 재료 개수 가져오기
 * @returns 현재 저장된 최근 재료 개수
 */
export function getRecentIngredientsCount(): number {
  return getRecentIngredients().length;
}

/**
 * localStorage 크기 추정 (디버깅용)
 * @returns 현재 저장된 데이터의 크기 (bytes)
 */
export function getStorageSize(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return 0;
    }

    // UTF-16 인코딩 고려 (JavaScript 문자열은 UTF-16)
    return new Blob([stored]).size;
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return 0;
  }
}

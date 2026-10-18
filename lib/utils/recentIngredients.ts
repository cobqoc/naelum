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
 * - 최대 개수 초과 시 *방금 고른 항목을 제외한* 나머지 중 선택 횟수(count)가 가장 적은 것(동률이면 더 오래된 것)을 제거
 *   (2026-10-19 감사 ICL-12: 예전엔 새 항목(count 1)이 정렬 맨 앞이라 들어오자마자 밀려나 목록이 영구 고정됐다)
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

    // 최대 개수 제한 — 방금 고른 항목은 보호하고, 나머지 중 우선순위가 가장 낮은 1개를 제거
    if (updatedItems.length > MAX_RECENT_ITEMS) {
      let victim = -1;
      updatedItems.forEach((item, i) => {
        if (item.id === ingredient.id) return;
        if (victim === -1) { victim = i; return; }
        const v = updatedItems[victim];
        if (item.count < v.count || (item.count === v.count && item.timestamp < v.timestamp)) victim = i;
      });
      if (victim !== -1) updatedItems = updatedItems.filter((_, i) => i !== victim);
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

// 2026-10-19 (감사 ICL-29): 로그인 시 이 목록을 user_favorites_ingredients 로 올린 뒤 *로컬 목록을 지우던*
// syncRecentIngredientsToFavorites·FavoritesSyncBoot·POST /api/favorites/sync 를 삭제했다. 그 테이블은 화면 어디에서도
// 읽지 않아(GET /api/favorites 는 user_ingredients 집계) 업로드는 쓸모없고, 로컬 최근 목록만 사라졌다.
// 테이블·트리거는 남아 있다(사용자 데이터라 drop 은 별도 결정 — GDPR 내보내기에는 계속 포함).

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

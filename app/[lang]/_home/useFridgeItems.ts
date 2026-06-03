'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isDemoRecord } from './helpers';
import { LS_KEY_DEMO_ITEMS } from './constants';
import { DEMO } from './demoItems';
import type { FridgeItem } from './types';

/**
 * 냉장고 items state stateful hook — HomeClient 최종 분해 (2026-05-25).
 *
 * 책임:
 *  - items state + setItems (외부에서도 접근 가능 — useFridgeInteractions 가 setItems 호출)
 *  - loading state (SSR initialItems 미제공 시 첫 fetch 완료까지 true)
 *  - fetchItems (DB 또는 localStorage)
 *  - 비로그인 demo 모드 localStorage 동기화
 *  - 초기 load + pendingDeleteIdsRef 필터
 *  - 외부 fridge-updated 이벤트 listener + debounce + pendingDeleteIdsRef 필터
 *
 * 양방향 의존성 해소:
 *  - 이전엔 HomeClient 가 items/setItems 보유 + useFridgeInteractions 가 pendingDeleteIdsRef
 *    내부 생성 → useFridgeItems 추출 시 양방향 의존성으로 추출 불가능.
 *  - 2026-05-25 변경: HomeClient 가 pendingDeleteIdsRef 보유 → 두 hook 에 동일 ref 주입
 *    → useFridgeInteractions(setItems 사용·ref add/delete) 와 useFridgeItems(items/setItems
 *    소유·ref filter) 가 독립 hook 으로 공존.
 *
 * race 가드 (기존 HomeClient 동작 byte-identical 이동):
 *  - 초기 load 의 `cancelled` 플래그 — strict mode 또는 빠른 navigation 시 stale setItems 차단
 *  - fridge-updated 핸들러 300ms debounce — 배치 저장 시 연속 event 를 마지막 1번만 fetch
 *    (개별 dispatch race 로 stale 데이터 덮어쓰기 방지)
 *  - 두 효과 모두 pendingDeleteIdsRef.current.has(id) 로 undo 창 중 deleted item 복원 차단
 *  - 데모 localStorage 저장은 user/loading 둘 다 안 변할 때 (race 안전한 시점)
 */
export interface UseFridgeItemsParams {
  user: { id: string } | null;
  authLoading: boolean;
  initialItems: unknown[] | null;
  /** 외부 주입 — useFridgeInteractions 와 공유. 삭제 중인 item 필터링용. */
  pendingDeleteIdsRef: MutableRefObject<Set<string>>;
}

export interface UseFridgeItemsResult {
  items: FridgeItem[];
  setItems: Dispatch<SetStateAction<FridgeItem[]>>;
  loading: boolean;
}

export function useFridgeItems({
  user,
  authLoading,
  initialItems,
  pendingDeleteIdsRef,
}: UseFridgeItemsParams): UseFridgeItemsResult {
  // SSR prefetch 된 items 가 있으면 초기 렌더부터 반영, 없으면 빈 배열 + loading 상태 유지.
  const [items, setItems] = useState<FridgeItem[]>(() => (initialItems as FridgeItem[] | null) ?? []);
  const [loading, setLoading] = useState(initialItems === null);

  // DB/localStorage 에서 raw items 반환 (filter 는 호출부에서 적용)
  const fetchItems = useCallback(async (): Promise<FridgeItem[]> => {
    if (!user) {
      // 비로그인 체험 모드: localStorage 에 저장된 데모 재료가 있으면 복원, 없으면 DEMO 기본값
      try {
        const saved = localStorage.getItem(LS_KEY_DEMO_ITEMS);
        if (saved) {
          const parsed = JSON.parse(saved) as FridgeItem[];
          if (Array.isArray(parsed)) {
            // '물' 자동 정리 + 로그아웃 race 로 오염된 DB 재료(UUID id) 제거
            const filtered = parsed.filter(
              item => item.ingredient_name !== '물' && isDemoRecord(item)
            );
            if (filtered.length > 0) return filtered;
          }
        }
      } catch { /* localStorage 실패 시 DEMO fallback */ }
      return DEMO;
    }
    const client = createClient();
    const { data } = await client
      .from('user_ingredients')
      .select('id, ingredient_name, category, expiry_date, storage_location, quantity, unit, purchase_date, notes, expiry_alert, ingredients_master!ingredient_id(emoji, shelf_life_days)')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true, nullsFirst: false });
    return (data ?? []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const master = (row as any).ingredients_master;
      return { ...row, emoji: master?.emoji ?? null, shelf_life_days: master?.shelf_life_days ?? null, ingredients_master: undefined } as FridgeItem;
    });
  }, [user]);

  // 비로그인 체험 모드 — items 변경 시 localStorage 에 저장
  useEffect(() => {
    if (user || loading) return;
    // 로그아웃 직후 race condition 방어: DB 재료(UUID id)가 섞여 있으면 저장 금지
    if (items.some(item => !isDemoRecord(item))) return;
    try { localStorage.setItem(LS_KEY_DEMO_ITEMS, JSON.stringify(items)); } catch { /* 용량 초과 등 무시 */ }
  }, [user, loading, items]);

  // 초기 load — auth hydration 후 한 번. pendingDeleteIdsRef 로 undo 창 중인 item 필터.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    queueMicrotask(async () => {
      const rows = await fetchItems();
      if (cancelled) return;
      // undo 창 중인 pending-delete 는 제외 (DB 에는 아직 있지만 UX 상 삭제된 상태)
      setItems(rows.filter(row => !pendingDeleteIdsRef.current.has(row.id)));
      setLoading(false);
    });
    return () => { cancelled = true; };
    // pendingDeleteIdsRef 는 외부 안정 ref(identity 불변) → deps 추가해도 재실행 0.
  }, [authLoading, fetchItems, pendingDeleteIdsRef]);

  // 외부에서 냉장고 변경 이벤트 발생 시 재fetch
  // (예: ShoppingCartDropdown 에서 "냉장고에 추가" 후, 레시피 → 재료 추가 등).
  // debounce 300ms: 배치 저장 시 이벤트가 연속 발생해도 마지막 한 번만 fetch
  // (개별 dispatch 가 race 하여 stale 데이터로 items 를 덮어쓰는 버그 방지).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const rows = await fetchItems();
        setItems(rows.filter(row => !pendingDeleteIdsRef.current.has(row.id)));
      }, 300);
    };
    window.addEventListener('fridge-updated', handler);
    return () => {
      window.removeEventListener('fridge-updated', handler);
      clearTimeout(timer);
    };
  }, [fetchItems, pendingDeleteIdsRef]);

  return { items, setItems, loading };
}

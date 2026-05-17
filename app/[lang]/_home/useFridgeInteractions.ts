'use client';

import { useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useToast } from '@/lib/toast/context';
import { createClient } from '@/lib/supabase/client';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { track } from '@/lib/analytics/track';
import type { TranslationKeys } from '@/lib/i18n/locales';
import { isDemoRecord } from './helpers';
import { DELETE_UNDO_WINDOW_MS, LONG_PRESS_MS } from './constants';
import type { FridgeItem } from './types';

/**
 * 냉장고 chip 인터랙션 stateful hook — god-file(HomeClient) 분해 Step 3 (고위험).
 *
 * ⚠️ 순수 표현 추출과 다른 패턴. 상태(actionItem/detailItem)·refs(longPress·
 * pendingDelete)·타이머(DELETE_UNDO_WINDOW dbTimer)·옵티미스틱+rollback·long-press
 * 분기를 **재설계 없이 기계적으로 이동**(핸들러 본문 byte-identical, closure deps·
 * cleanup·ref 시맨틱 동일. cleanup useEffect 신규 추가/제거 금지 = 동작 보존).
 *
 * 가드: e2e/fridge-chip-interactions.spec.ts (Step 0 선안전망 3 불변식 —
 * long-press 삭제+undo→dbTimer 취소·window 경과→DB delete·그룹→미니시트→액션)
 * + logged-in-home:449. `items`/`setItems`/`user`/`t` 는 HomeClient 소유(주입).
 * 반환 `pendingDeleteIdsRef` 는 HomeClient `fetchItems` 가 동일 ref 로 필터링.
 */
export function useFridgeInteractions({
  items,
  setItems,
  user,
  t,
}: {
  items: FridgeItem[];
  setItems: Dispatch<SetStateAction<FridgeItem[]>>;
  user: { id: string } | null;
  t: TranslationKeys;
}) {
  // 재료 액션 시트 (chip 탭 시 1차로 열림: 만들기/수정/삭제)
  const [actionItem, setActionItem] = useState<FridgeItem | null>(null);
  // 재료 상세 수정 모달 (액션 시트의 '수정' 선택 시 열림)
  const [detailItem, setDetailItem] = useState<FridgeItem | null>(null);

  const router = useRouter();
  const { success: toastSuccess } = useToast();

  // 액션 시트: "이 재료로 만들기" → 해당 재료 들어간 레시피 페이지로 이동.
  const handleCook = (item: FridgeItem) => {
    setActionItem(null);
    router.push(`/recommendations?mode=all&ingredients=${encodeURIComponent(item.ingredient_name)}`);
  };

  // 액션 시트: "수정" → 상세 수정 모달 열기.
  const handleEditFromSheet = (item: FridgeItem) => {
    setActionItem(null);
    setDetailItem(item);
  };

  // 삭제 pending id — 5.5초 undo 창 중 fetchItems가 외부에서 재실행돼도 삭제된 item이 state에 되살아나지 않도록 필터링.
  const pendingDeleteIdsRef = useRef<Set<string>>(new Set());

  // 모바일 chip long-press 삭제 — hover 없는 모바일에서 빠른 삭제 단축.
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const handleChipPressStart = (item: FridgeItem) => {
    longPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate?.(40); } catch {}
      }
      handleDeleteFromSheet(item);
    }, LONG_PRESS_MS);
  };
  const handleChipPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };
  const handleChipClickWithLongPress = (item: FridgeItem, e: React.MouseEvent) => {
    if (longPressTriggeredRef.current) {
      // long-press로 이미 삭제 triggered — click 무시.
      longPressTriggeredRef.current = false;
      return;
    }
    e.stopPropagation();
    setActionItem(item);
  };

  // 액션 시트: "삭제" → 즉시 state 제거 + undo 토스트 (5초 안에 [실행 취소] 클릭 시 복원).
  // DB 삭제는 토스트 만료 직전 (5.5초)에 비동기 실행 → undo 시 cancel.
  const handleDeleteFromSheet = (item: FridgeItem) => {
    track('ingredient_delete', { name: item.ingredient_name, items_total: items.length });
    const indexBefore = items.findIndex(i => i.id === item.id);
    pendingDeleteIdsRef.current.add(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    setActionItem(null);

    let cancelled = false;
    const isDemo = !user || isDemoRecord(item);
    const dbTimer = setTimeout(async () => { /* DELETE_UNDO_WINDOW_MS 뒤 DB delete */
      if (cancelled) return;
      if (!isDemo && user) {
        // RLS가 기본 방어지만 user_id 명시 필터로 이중 방어.
        const client = createClient();
        const { error } = await client.from('user_ingredients').delete().eq('id', item.id).eq('user_id', user.id);
        // 토스트는 이미 소멸 — 사용자 표면화 불가. .error 로깅(침묵 유실 방지).
        // 실패 시에도 fridge-updated 발행: 재조회가 DB 진실(미삭제) 반영해 칩 복원.
        if (error) console.error('user_ingredients delete failed:', error);
        window.dispatchEvent(new Event('fridge-updated'));
      }
      // DEMO는 state만 변경했으므로 별도 작업 없음
      pendingDeleteIdsRef.current.delete(item.id);
    }, DELETE_UNDO_WINDOW_MS);

    // 단일 토스트에 [실행 취소][장보기에 추가] 두 액션 동시 노출.
    // 비로그인/데모는 cart 자체가 로그인 유도 화면이라 cart 액션 skip.
    const actions: Array<{ label: string; onClick: () => void; variant?: 'primary' | 'secondary' }> = [
      {
        label: t.ingredient.undo,
        variant: 'primary',
        onClick: () => {
          cancelled = true;
          clearTimeout(dbTimer);
          pendingDeleteIdsRef.current.delete(item.id);
          // 원래 위치에 복원
          setItems(prev => {
            const next = [...prev];
            const safeIdx = Math.min(Math.max(0, indexBefore), next.length);
            next.splice(safeIdx, 0, item);
            return next;
          });
        },
      },
    ];
    if (user && !isDemo) {
      actions.push({
        label: t.home.usedUpAddAction,
        variant: 'secondary',
        onClick: async () => {
          try {
            const res = await fetch('/api/shopping-list', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipeId: null,
                recipeTitle: t.cart.manualAdd,
                ingredients: [{
                  ingredient_name: item.ingredient_name,
                  category: item.category || 'other',
                  unit: item.unit ?? '',
                }],
              }),
            });
            if (res.ok) {
              toastSuccess(t.home.usedUpAddedToast.replace('{name}', item.ingredient_name));
              window.dispatchEvent(new Event('shopping-list-updated'));
              track('used_up_to_cart', { name: item.ingredient_name });
            }
          } catch { /* silent */ }
        },
      });
      // 토스트에 [장보기에 추가] 노출됨 = 전환율 분모. used_up_to_cart가 분자.
      track('used_up_toast_shown', { name: item.ingredient_name });
    }

    toastSuccess(t.ingredient.deleteSuccess.replace('{name}', item.ingredient_name), {
      actions,
      duration: DELETE_UNDO_WINDOW_MS,
    });
  };

  return {
    actionItem,
    setActionItem,
    detailItem,
    setDetailItem,
    pendingDeleteIdsRef,
    handleCook,
    handleEditFromSheet,
    handleChipPressStart,
    handleChipPressEnd,
    handleChipClickWithLongPress,
    handleDeleteFromSheet,
  };
}

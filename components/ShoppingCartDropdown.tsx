'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOutsideClick } from '@/lib/hooks/useOutsideClick';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { useToast } from '@/lib/toast/context';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import {
  loadShoppingList,
  subscribeShoppingList,
  getCachedShoppingList,
  setCachedShoppingList,
  type ShoppingItem,
} from '@/lib/shopping-list/cache';
import { usePopularIngredients } from '@/lib/ingredients/usePopularIngredients';
import { useFavorites } from '@/lib/favorites/useFavorites';
import { track } from '@/lib/analytics/track';
import { groupItems, type GroupMode } from '@/lib/shopping-list/groupItems';
import CartLoginPrompt from '@/components/cart/CartLoginPrompt';
import CartHeader from '@/components/cart/CartHeader';
import CartAddInput from '@/components/cart/CartAddInput';
import CartQuickAdd from '@/components/cart/CartQuickAdd';
import CartItemList from '@/components/cart/CartItemList';
import { type CartAddSource, type Suggestion, type QuickItem } from '@/components/cart/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fromBottom?: boolean;
}

export default function ShoppingCartDropdown({ isOpen, onClose, fromBottom = false }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const { t, language } = useI18n();
  // 초기 state를 공유 캐시에서 바로 읽어옴 — 이미 로드된 경우 dropdown 열림 즉시 표시
  const [items, setItems] = useState<ShoppingItem[]>(() => getCachedShoppingList() ?? []);
  const [loading, setLoading] = useState(() => getCachedShoppingList() == null);
  const [addingToFridge, setAddingToFridge] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>(() => {
    if (typeof window === 'undefined') return 'category';
    return (localStorage.getItem('cart_group_mode') as GroupMode) ?? 'category';
  });

  const switchGroupMode = (mode: GroupMode) => {
    setGroupMode(mode);
    if (typeof window !== 'undefined') localStorage.setItem('cart_group_mode', mode);
  };

  // 재료 추가 / 필터 입력
  const [inputText, setInputText] = useState('');
  const [inputUnit, setInputUnit] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [adding, setAdding] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  // 외부 클릭 시 닫기 — overlay div 대신 document-level listener.
  // trigger 는 Header 외부에 있으나 Header onClick 의 toggle 로 race 없음 (이슈 #1).
  useOutsideClick(isOpen, panelRef, onClose);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');
  // 메모 PATCH 진행 중인 item id — 냉장고 pendingDeleteIdsRef 와 동일 패턴.
  // 백그라운드 force-refresh(loadShoppingList(true)) 가 편집 후 pre-PATCH 서버
  // 데이터로 늦게 resolve → optimistic 메모를 clobber 하는 race 방어.
  const pendingNoteEditIdsRef = useRef<Set<string>>(new Set());

  // 사용자별 자주 쓰는 재료 — 빈 상태 quick-add에 노출
  const { items: favorites } = useFavorites(20);
  const popularIngredients = usePopularIngredients();

  // 완료 항목 숨김 토글 (#4) — localStorage 저장
  const [hideChecked, setHideChecked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('cart_hide_checked') === '1';
  });
  const toggleHideChecked = () => {
    setHideChecked(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') localStorage.setItem('cart_hide_checked', next ? '1' : '0');
      return next;
    });
  };


  // 서버/캐시 데이터 적용 — 단, 메모 PATCH 진행 중인 id 는 로컬 optimistic
  // 메모를 보존(stale 서버값으로 덮어쓰지 않음). 그 외 전부 서버값 채택.
  const applyServerItems = useCallback((incoming: ShoppingItem[]) => {
    setItems(prev => incoming.map(it => {
      if (pendingNoteEditIdsRef.current.has(it.id)) {
        const local = prev.find(p => p.id === it.id);
        return local ? { ...it, note: local.note } : it;
      }
      return it;
    }));
  }, []);

  const fetchItems = useCallback(async () => {
    // 비로그인: API 호출 skip (401 silent fail 방지). 로그인 유도 뷰로 분기됨.
    if (!user) {
      setLoading(false);
      return;
    }
    // 캐시가 있으면 UI 즉시 업데이트, 백그라운드에서 리프레시
    const cached = getCachedShoppingList();
    if (cached) {
      applyServerItems(cached);
      setLoading(false);
    }
    const fresh = await loadShoppingList(true);
    applyServerItems(fresh);
    setLoading(false);
  }, [user, applyServerItems]);

  // 공유 캐시 구독 — 다른 곳에서 업데이트되면 이 dropdown도 자동으로 따라감
  useEffect(() => {
    const unsub = subscribeShoppingList((cached) => {
      if (cached) {
        applyServerItems(cached);
        setLoading(false);
      }
    });
    return unsub;
  }, [applyServerItems]);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    } else {
      setInputText('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isOpen, fetchItems]);

  // 자동완성 (300ms 디바운스)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = inputText.trim();
    if (!trimmed) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ingredients/autocomplete?q=${encodeURIComponent(trimmed)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch {
        // silent
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputText]);

  const addItem = async (name: string, category = '', unit?: string, source: CartAddSource = 'manual') => {
    if (!name.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: null,
          recipeTitle: t.cart.manualAdd,
          ingredients: [{ ingredient_name: name.trim(), category, unit: unit ?? inputUnit ?? '' }],
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        // 추가 방식 트래킹 (GDPR 동의자만) — chip vs autocomplete vs manual 비율 결정용
        track(`cart_add_via_${source}`, {
          name: name.trim().slice(0, 50),
          category: category || null,
        });
        setInputText('');
        setInputUnit('');
        setSuggestions([]);
        setShowSuggestions(false);
        window.dispatchEvent(new Event('shopping-list-updated'));
        await fetchItems();
        // 같은 재료가 합쳐졌다면 사용자에게 알림 (#3)
        if ((data as { merged?: number }).merged && (data as { merged: number }).merged > 0) {
          toastSuccess(t.cart.mergedToast.replace('{count}', String((data as { merged: number }).merged)));
        }
      }
    } catch {
      toastError(t.cart.addFailed);
    } finally {
      setAdding(false);
    }
  };

  const toggleCheck = async (item: ShoppingItem) => {
    const next = !item.is_checked;
    const updated = items.map(i => (i.id === item.id ? { ...i, is_checked: next } : i));
    setItems(updated);
    setCachedShoppingList(updated); // 공유 캐시에 동기화 (useCartCount 등에 전파)
    await fetch('/api/shopping-list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_checked: next }),
    });
  };

  const deleteItem = async (id: string) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    setCachedShoppingList(updated);
    await fetch(`/api/shopping-list?id=${id}`, { method: 'DELETE' });
  };

  const updateQuantity = async (item: ShoppingItem, delta: number) => {
    const current = item.quantity ?? 1;
    const next = Math.max(1, current + delta);
    if (next === current) return;
    const updated = items.map(i => (i.id === item.id ? { ...i, quantity: next } : i));
    setItems(updated);
    setCachedShoppingList(updated);
    await fetch('/api/shopping-list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, quantity: next }),
    });
  };

  // 항목 단위 변경 (#2)
  const updateUnit = async (item: ShoppingItem, unit: string) => {
    const finalUnit = unit || null;
    const updated = items.map(i => (i.id === item.id ? { ...i, unit: finalUnit } : i));
    setItems(updated);
    setCachedShoppingList(updated);
    await fetch('/api/shopping-list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, unit: finalUnit }),
    });
  };

  // 항목 메모 변경 — 빈 문자열이면 NULL 처리
  const updateNote = async (item: ShoppingItem, rawNote: string) => {
    const trimmed = rawNote.trim().slice(0, 200);
    const finalNote: string | null = trimmed === '' ? null : trimmed;
    if (finalNote === (item.note ?? null)) return;
    // race 가드: PATCH 정착 전까지 이 id 의 메모는 서버/캐시 재적용에서 보존.
    pendingNoteEditIdsRef.current.add(item.id);
    const updated = items.map(i => (i.id === item.id ? { ...i, note: finalNote } : i));
    setItems(updated);
    setCachedShoppingList(updated);
    try {
      await fetch('/api/shopping-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, note: finalNote }),
      });
    } finally {
      pendingNoteEditIdsRef.current.delete(item.id);
    }
  };

  // 공유 링크 생성 + 클립보드 복사. 활성 토큰 있으면 재사용 (서버에서 처리).
  const [sharing, setSharing] = useState(false);
  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const res = await fetch('/api/cart/share', { method: 'POST' });
      if (!res.ok) {
        toastError(t.cart.shareCopyFailed);
        return;
      }
      const { token } = await res.json();
      // 보내는 사람 언어로 prefix — 받는 사람 404 방지 (lang dynamic route)
      const url = `${window.location.origin}/${language}/cart/share/${token}`;
      try {
        await navigator.clipboard.writeText(url);
        toastSuccess(t.cart.shareCopied);
      } catch {
        // clipboard 차단 환경 — URL 자체를 토스트로 노출
        toastSuccess(url);
      }
      track('cart_share_created');
    } catch {
      toastError(t.cart.shareCopyFailed);
    } finally {
      setSharing(false);
    }
  };

  // 전체 비우기 (#5) — 즉시 삭제 (cart는 휘발성, 잘못 눌러도 다시 추가하면 됨)
  const clearAll = async () => {
    if (items.length === 0) return;
    setItems([]);
    setCachedShoppingList([]);
    await fetch('/api/shopping-list', { method: 'DELETE' });
    window.dispatchEvent(new Event('shopping-list-updated'));
  };

  // Quick-add — favorites + popularIngredients fallback 통합 (중복 제거, 최대 8개).
  // 입력창 바로 아래에 항상 노출 (빈 상태/항목 있는 상태 공통).
  const quickAdd = (name: string, cartCategory: string) => {
    addItem(name, cartCategory, undefined, 'chip');
  };

  const quickAddItems: QuickItem[] = (() => {
    const seen = new Set<string>();
    const merged: QuickItem[] = [];
    for (const f of favorites) {
      if (seen.has(f.ingredient_name)) continue;
      seen.add(f.ingredient_name);
      merged.push({
        name: f.ingredient_name,
        category: f.category ?? 'other',
        icon: f.emoji ?? undefined,
        fromFavorites: true,
      });
      if (merged.length >= 8) break;
    }
    for (const p of popularIngredients) {
      if (merged.length >= 8) break;
      if (seen.has(p.name)) continue;
      seen.add(p.name);
      merged.push({
        name: p.name,
        category: p.category,
        icon: p.emoji ?? undefined,
        fromFavorites: false,
      });
    }
    return merged;
  })();

  const addCheckedToFridge = async () => {
    const checked = items.filter(i => i.is_checked);
    if (checked.length === 0) return;
    setAddingToFridge(true);
    try {
      const res = await fetch('/api/shopping-list/add-to-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checked.map(i => ({
            ingredient_name: i.ingredient_name,
            category: i.category,
            quantity: i.quantity,
            unit: i.unit,
          })),
        }),
      });
      if (res.ok) {
        await fetch('/api/shopping-list?clearChecked=true', { method: 'DELETE' });
        toastSuccess(t.cart.addToFridgeSuccess.replace('{count}', String(checked.length)));
        const remaining = items.filter(i => !i.is_checked);
        setItems(remaining);
        setCachedShoppingList(remaining);
        // 홈 화면 냉장고가 즉시 refetch하도록 이벤트 발송
        window.dispatchEvent(new Event('fridge-updated'));
        router.refresh();
      } else {
        toastError(t.cart.addToFridgeFailed);
      }
    } catch {
      toastError(t.cart.addToFridgeFailed);
    } finally {
      setAddingToFridge(false);
    }
  };

  const clearChecked = async () => {
    const remaining = items.filter(i => !i.is_checked);
    setItems(remaining);
    setCachedShoppingList(remaining);
    await fetch('/api/shopping-list?clearChecked=true', { method: 'DELETE' });
  };

  const filteredItems = (() => {
    let result = items;
    if (inputText.trim()) {
      result = result.filter(i => i.ingredient_name.toLowerCase().includes(inputText.toLowerCase()));
    }
    if (hideChecked) {
      result = result.filter(i => !i.is_checked);
    }
    return result;
  })();

  const uncheckedCount = items.filter(i => !i.is_checked).length;
  const checkedCount = items.filter(i => i.is_checked).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const groups = groupItems(filteredItems, groupMode);

  if (!isOpen) return null;

  // 비로그인: 로그인 유도 뷰 — components/cart/CartLoginPrompt.tsx 로 추출
  // (god-file 분해 Phase 2, 순수 표현·상태 0·JSX byte-identical)
  if (!user) {
    return <CartLoginPrompt t={t} onClose={onClose} fromBottom={fromBottom} />;
  }

  return (
    <>
      <div ref={panelRef} className={`rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col ${fromBottom ? 'fixed left-1/2 -translate-x-1/2 bottom-20 w-[92vw] max-w-sm' : 'absolute w-80 md:w-[30rem] max-w-[calc(100vw-2rem)] right-0 top-full mt-2'}`} style={{ maxHeight: '32rem' }}>
        {/* 헤더 — components/cart/CartHeader.tsx 로 추출 (Phase 2, 순수 표현) */}
        <CartHeader
          t={t}
          uncheckedCount={uncheckedCount}
          totalCount={totalCount}
          checkedCount={checkedCount}
          progressPct={progressPct}
          groupMode={groupMode}
          switchGroupMode={switchGroupMode}
          hideChecked={hideChecked}
          toggleHideChecked={toggleHideChecked}
          handleShare={handleShare}
          sharing={sharing}
          clearAll={clearAll}
          onClose={onClose}
        />

        {/* 재료 추가 입력창 — components/cart/CartAddInput.tsx 로 추출 (Phase 2) */}
        <CartAddInput
          t={t}
          inputRef={inputRef}
          inputText={inputText}
          setInputText={setInputText}
          inputUnit={inputUnit}
          setInputUnit={setInputUnit}
          inputFocused={inputFocused}
          setInputFocused={setInputFocused}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          adding={adding}
          addItem={addItem}
        />

        {/* Quick-add 행 — components/cart/CartQuickAdd.tsx 로 추출 (Phase 2).
            빈 배열이면 컴포넌트가 null 반환 — 기존 조건부 렌더와 동일 */}
        <CartQuickAdd
          quickAddItems={quickAddItems}
          quickAdd={quickAdd}
          adding={adding}
        />

        {/* 항목 리스트 — components/cart/CartItemList.tsx 로 추출 (Phase 2 최대 블록).
            메모 race 방어(pendingNoteEditIdsRef·applyServerItems·updateNote)는
            부모 소유 그대로 — 콜백만 전달. JSX byte-identical */}
        <CartItemList
          t={t}
          loading={loading}
          items={items}
          filteredItems={filteredItems}
          inputText={inputText}
          groups={groups}
          groupMode={groupMode}
          editingNoteId={editingNoteId}
          setEditingNoteId={setEditingNoteId}
          editingNoteValue={editingNoteValue}
          setEditingNoteValue={setEditingNoteValue}
          toggleCheck={toggleCheck}
          updateQuantity={updateQuantity}
          updateUnit={updateUnit}
          deleteItem={deleteItem}
          updateNote={updateNote}
          onClose={onClose}
        />

        {/* 액션 버튼 */}
        {checkedCount > 0 && (
          <div className="border-t border-white/10 px-4 py-3 flex gap-2 flex-shrink-0">
            <button
              onClick={addCheckedToFridge}
              disabled={addingToFridge}
              className="flex-1 py-1.5 px-3 rounded-lg bg-accent-warm/10 border border-accent-warm/30 text-accent-warm text-xs font-medium hover:bg-accent-warm/20 transition-colors disabled:opacity-50"
            >
              {addingToFridge ? t.cart.addingToFridge : t.cart.addToFridge.replace('{count}', String(checkedCount))}
            </button>
            <button
              onClick={clearChecked}
              className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-text-muted text-xs hover:bg-white/10 transition-colors"
            >
              {t.cart.clearChecked}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function useCartCount() {
  const { user } = useAuth();
  // 캐시에 이미 있으면 즉시 반영
  const [count, setCount] = useState(() => {
    const cached = getCachedShoppingList();
    return cached ? cached.filter(i => !i.is_checked).length : 0;
  });

  useEffect(() => {
    if (!user) {
      // setState in effect body is flagged — 비동기로 옮겨 cascading render 방지
      queueMicrotask(() => setCount(0));
      return;
    }
    // 첫 렌더 시 바로 fetch 시작 (2.5s 지연 제거) — 공유 캐시에 들어가면
    // dropdown을 열 때 즉시 사용 가능.
    loadShoppingList();

    // 캐시 구독 — 다른 곳에서 업데이트되면 자동 반영
    const unsub = subscribeShoppingList((items) => {
      if (!items) return;
      setCount(items.filter(i => !i.is_checked).length);
    });

    // 외부 이벤트(레시피에서 재료 추가 등) → 강제 리프레시
    const handler = () => loadShoppingList(true);
    window.addEventListener('shopping-list-updated', handler);
    return () => {
      unsub();
      window.removeEventListener('shopping-list-updated', handler);
    };
  }, [user]);

  return { count, refetch: () => loadShoppingList(true) };
}

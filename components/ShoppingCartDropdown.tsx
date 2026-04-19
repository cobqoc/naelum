'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast/context';
import { useAuth } from '@/lib/auth/context';
import {
  loadShoppingList,
  subscribeShoppingList,
  getCachedShoppingList,
  setCachedShoppingList,
  type ShoppingItem,
} from '@/lib/shopping-list/cache';

interface Suggestion {
  id: string;
  name: string;
  category: string;
}

interface GroupedItems {
  recipeTitle: string;
  recipeId: string | null;
  items: ShoppingItem[];
}

function groupByRecipe(items: ShoppingItem[]): GroupedItems[] {
  const map = new Map<string, GroupedItems>();
  for (const item of items) {
    const key = item.recipe_id ?? '__manual__';
    if (!map.has(key)) {
      map.set(key, {
        recipeTitle: item.recipe_title ?? '직접 추가',
        recipeId: item.recipe_id,
        items: [],
      });
    }
    map.get(key)!.items.push(item);
  }
  return Array.from(map.values());
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fromBottom?: boolean;
}

export default function ShoppingCartDropdown({ isOpen, onClose, fromBottom = false }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  // 초기 state를 공유 캐시에서 바로 읽어옴 — 이미 로드된 경우 dropdown 열림 즉시 표시
  const [items, setItems] = useState<ShoppingItem[]>(() => getCachedShoppingList() ?? []);
  const [loading, setLoading] = useState(() => getCachedShoppingList() == null);
  const [addingToFridge, setAddingToFridge] = useState(false);

  // 재료 추가 / 필터 입력
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [adding, setAdding] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = useCallback(async () => {
    // 비로그인: API 호출 skip (401 silent fail 방지). 로그인 유도 뷰로 분기됨.
    if (!user) {
      setLoading(false);
      return;
    }
    // 캐시가 있으면 UI 즉시 업데이트, 백그라운드에서 리프레시
    const cached = getCachedShoppingList();
    if (cached) {
      setItems(cached);
      setLoading(false);
    }
    const fresh = await loadShoppingList(true);
    setItems(fresh);
    setLoading(false);
  }, [user]);

  // 공유 캐시 구독 — 다른 곳에서 업데이트되면 이 dropdown도 자동으로 따라감
  useEffect(() => {
    const unsub = subscribeShoppingList((cached) => {
      if (cached) {
        setItems(cached);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

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

  const addItem = async (name: string, category = '') => {
    if (!name.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: null,
          recipeTitle: '직접 추가',
          ingredients: [{ ingredient_name: name.trim(), category }],
        }),
      });
      if (res.ok) {
        setInputText('');
        setSuggestions([]);
        setShowSuggestions(false);
        window.dispatchEvent(new Event('shopping-list-updated'));
        await fetchItems();
      }
    } catch {
      toastError('추가에 실패했어요.');
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
        toastSuccess(`${checked.length}개 재료가 냉장고에 추가됐어요!`);
        const remaining = items.filter(i => !i.is_checked);
        setItems(remaining);
        setCachedShoppingList(remaining);
        // 홈 화면 냉장고가 즉시 refetch하도록 이벤트 발송
        window.dispatchEvent(new Event('fridge-updated'));
        router.refresh();
      } else {
        toastError('냉장고 추가에 실패했어요.');
      }
    } catch {
      toastError('냉장고 추가에 실패했어요.');
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

  const filteredItems = inputText.trim()
    ? items.filter(i => i.ingredient_name.toLowerCase().includes(inputText.toLowerCase()))
    : items;

  const uncheckedCount = items.filter(i => !i.is_checked).length;
  const checkedCount = items.filter(i => i.is_checked).length;
  const groups = groupByRecipe(filteredItems);

  if (!isOpen) return null;

  // 비로그인: 로그인 유도 뷰 (API 호출 없음, 체험 모드 없음)
  if (!user) {
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div
          className={`rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col ${
            fromBottom
              ? 'fixed left-1/2 -translate-x-1/2 bottom-20 w-[92vw] max-w-sm'
              : 'absolute w-80 max-w-[calc(100vw-2rem)] right-0 top-full mt-2'
          }`}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="font-bold text-sm">🛒 장보기</span>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors text-base"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          {/* 로그인 유도 */}
          <div className="px-5 pt-6 pb-5 text-center">
            <div className="text-5xl mb-3">🛍</div>
            <h3 className="text-sm font-bold text-text-primary mb-1.5">
              로그인하고 장보기 시작
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              레시피 재료를 모아두고<br />장볼 때 바로 꺼내 쓰세요
            </p>

            {/* 혜택 리스트 */}
            <ul className="text-left text-xs text-text-secondary space-y-1.5 mb-5 px-2">
              <li className="flex items-start gap-2">
                <span className="text-accent-warm shrink-0">✓</span>
                <span>레시피에서 재료 원탭 담기</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-warm shrink-0">✓</span>
                <span>체크한 재료 냉장고에 자동 이동</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-warm shrink-0">✓</span>
                <span>모든 기기에서 실시간 동기화</span>
              </li>
            </ul>

            <Link
              href="/login"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent-warm text-background-primary font-bold text-sm hover:bg-accent-hover active:scale-[0.98] transition-all"
            >
              로그인하고 시작하기 <span className="leading-none">→</span>
            </Link>

            <p className="text-[11px] text-text-muted mt-3">
              아직 계정 없으세요?{' '}
              <Link href="/signup" onClick={onClose} className="text-accent-warm underline">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className={`rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col ${fromBottom ? 'fixed left-1/2 -translate-x-1/2 bottom-20 w-[92vw] max-w-sm' : 'absolute w-80 max-w-[calc(100vw-2rem)] right-0 top-full mt-2'}`} style={{ maxHeight: '32rem' }}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <span className="font-bold text-sm">
            🛒 장보기 {uncheckedCount > 0 && <span className="text-accent-warm">({uncheckedCount})</span>}
          </span>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-base"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 재료 추가 입력창 */}
        <div className="relative px-3 py-2.5 border-b border-white/10 flex-shrink-0">
          <div
            className={`relative w-full flex items-center gap-0 overflow-hidden bg-background-secondary transition-all duration-300 rounded-xl [&>*]:!border-0 ${
              inputFocused
                ? 'ring-2 ring-accent-warm shadow-[0_0_20px_rgba(255,153,102,0.3)] scale-[1.01]'
                : 'ring-1 ring-white/10 shadow-[0_0_10px_rgba(255,153,102,0.15)] scale-100'
            }`}
            style={{ border: 'none' }}
          >
            <span className="pl-3 text-text-muted text-sm flex-shrink-0 !border-0" style={{ border: 'none' }}>🔍</span>
            <input
                ref={inputRef}
                type="search"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && inputText.trim()) {
                    e.preventDefault();
                    addItem(inputText);
                  }
                  if (e.key === 'Escape') {
                    setInputText('');
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => { setInputFocused(true); if (suggestions.length > 0) setShowSuggestions(true); }}
                onBlur={() => setInputFocused(false)}
                placeholder="재료 검색 또는 직접 입력..."
                className="w-full bg-transparent text-text-primary placeholder-text-muted !outline-none !border-0 !border-none px-2 py-2 text-sm"
                style={{ border: 'none', outline: 'none' }}
              />
            {adding ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-warm border-t-transparent flex-shrink-0 mr-3" />
            ) : (
              <button
                onMouseDown={() => inputText.trim() && addItem(inputText)}
                disabled={!inputText.trim()}
                className="flex-shrink-0 mr-2 px-3 py-1.5 text-xs rounded-lg bg-accent-warm font-semibold text-background-primary transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed !outline-none !border-0"
                style={{ border: 'none' }}
              >
                추가
              </button>
            )}
          </div>

          {/* 자동완성 목록 */}
          {showSuggestions && inputText.trim() && (
            <div className="absolute left-3 right-3 top-full mt-1 rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-10 overflow-hidden">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  onMouseDown={() => addItem(s.name, s.category)}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <span className="text-accent-warm flex-shrink-0">+</span>
                  <span className="text-text-primary flex-1 truncate">{s.name}</span>
                  {s.category && <span className="text-text-muted">{s.category}</span>}
                </button>
              ))}
              <button
                onMouseDown={() => addItem(inputText)}
                className="w-full text-left px-4 py-2.5 text-xs hover:bg-accent-warm/10 transition-colors flex items-center gap-2 border-t border-white/5"
              >
                <span className="text-accent-warm flex-shrink-0">+</span>
                <span className="text-accent-warm font-medium truncate">&ldquo;{inputText}&rdquo; 직접 추가</span>
              </button>
            </div>
          )}
        </div>

        {/* 내용 */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-warm border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="text-3xl mb-2">🛒</div>
              <p className="text-xs text-text-muted">위 입력창에서 재료를 추가해보세요</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-xs text-text-muted">&ldquo;{inputText}&rdquo;와 일치하는 재료가 없어요</p>
            </div>
          ) : (
            <div>
              {groups.map((group) => (
                <div key={group.recipeId ?? '__manual__'}>
                  <div className="px-4 py-2 bg-white/5 flex items-center gap-2">
                    <span className="text-sm">{group.recipeId ? '🍲' : '📦'}</span>
                    <span className="text-xs font-medium text-text-secondary truncate">
                      {group.recipeTitle}
                    </span>
                  </div>
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleCheck(item)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors group cursor-pointer select-none"
                    >
                      {/* 체크 인디케이터 */}
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          item.is_checked
                            ? 'bg-accent-warm'
                            : 'border-2 border-white/25 group-hover:border-accent-warm/60'
                        }`}
                      >
                        {item.is_checked && (
                          <svg className="w-3 h-3 text-background-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`flex-1 text-sm truncate ${item.is_checked ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                        {item.ingredient_name}
                      </span>
                      {(item.quantity || item.unit) && (
                        <span className="text-xs text-text-muted flex-shrink-0">
                          {item.quantity}{item.unit}
                        </span>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                        className="flex-shrink-0 text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100 text-sm ml-1 p-0.5"
                        aria-label="삭제"
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        {checkedCount > 0 && (
          <div className="border-t border-white/10 px-4 py-3 flex gap-2 flex-shrink-0">
            <button
              onClick={addCheckedToFridge}
              disabled={addingToFridge}
              className="flex-1 py-1.5 px-3 rounded-lg bg-accent-warm/10 border border-accent-warm/30 text-accent-warm text-xs font-medium hover:bg-accent-warm/20 transition-colors disabled:opacity-50"
            >
              {addingToFridge ? '추가 중...' : `냉장고에 추가 (${checkedCount})`}
            </button>
            <button
              onClick={clearChecked}
              className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-text-muted text-xs hover:bg-white/10 transition-colors"
            >
              완료 삭제
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

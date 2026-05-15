'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from '@/components/Common/LocalizedLink';
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
import { POPULAR_ITEMS } from '@/lib/ingredients/popularItems';
import { useFavorites } from '@/lib/favorites/useFavorites';
import { getIngredientEmoji } from '@/lib/utils/ingredientEmoji';
import { track } from '@/lib/analytics/track';

// chip / autocomplete / manual 비율 측정 — 카테고리 탭 추가 vs 검색 강화 결정용
type CartAddSource = 'chip' | 'autocomplete' | 'manual';

// cart의 카테고리 키(vegetable/dairy/...) vs popularItems 카테고리(veggie/...) 매핑
const POPULAR_CATEGORY_TO_CART: Record<string, string> = {
  veggie: 'vegetable',
  meat: 'meat',
  dairy: 'dairy',
  grain: 'grain',
  condiment: 'sauce',
  seasoning: 'sauce',
};

// 직접 추가·수량 수정 시 흔히 쓰는 단위 (DB 저장값이라 한글 그대로 — CLAUDE.md 규칙)
const COMMON_UNITS = ['개', 'g', 'kg', 'ml', 'L', '팩', '봉지', '병', '통', '장', '큰술', '작은술'];

interface Suggestion {
  id: string;
  name: string;
  category: string;
}

interface GroupedItems {
  groupTitle: string;
  groupKey: string;
  groupIcon: string;
  items: ShoppingItem[];
}

type GroupMode = 'recipe' | 'category';

const CATEGORY_LABELS: Record<string, { label: string; icon: string; order: number }> = {
  vegetable: { label: '채소', icon: '🥬', order: 1 },
  fruit: { label: '과일', icon: '🍎', order: 2 },
  meat: { label: '육류', icon: '🥩', order: 3 },
  seafood: { label: '해산물', icon: '🐟', order: 4 },
  dairy: { label: '유제품·계란', icon: '🥛', order: 5 },
  grain: { label: '곡물·면', icon: '🌾', order: 6 },
  sauce: { label: '소스·양념', icon: '🍯', order: 7 },
  beverage: { label: '음료', icon: '🥤', order: 8 },
  snack: { label: '간식', icon: '🍪', order: 9 },
  other: { label: '기타', icon: '📦', order: 99 },
};

function getCategoryMeta(category: string) {
  return CATEGORY_LABELS[category] ?? CATEGORY_LABELS.other;
}

function groupItems(items: ShoppingItem[], mode: GroupMode): GroupedItems[] {
  const map = new Map<string, GroupedItems>();
  for (const item of items) {
    if (mode === 'recipe') {
      const key = item.recipe_id ?? '__manual__';
      if (!map.has(key)) {
        map.set(key, {
          groupTitle: item.recipe_title ?? '직접 추가',
          groupKey: key,
          groupIcon: item.recipe_id ? '🍲' : '📦',
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    } else {
      const key = item.category || 'other';
      if (!map.has(key)) {
        const meta = getCategoryMeta(key);
        map.set(key, {
          groupTitle: meta.label,
          groupKey: key,
          groupIcon: meta.icon,
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    }
  }
  const result = Array.from(map.values());
  if (mode === 'category') {
    result.sort((a, b) => getCategoryMeta(a.groupKey).order - getCategoryMeta(b.groupKey).order);
  }
  return result;
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
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');

  // 사용자별 즐겨찾기·자주 사용 재료 — 빈 상태 quick-add에 노출
  const { items: favorites, toggleStar: toggleFavoriteStar } = useFavorites(20);

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
    const updated = items.map(i => (i.id === item.id ? { ...i, note: finalNote } : i));
    setItems(updated);
    setCachedShoppingList(updated);
    await fetch('/api/shopping-list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, note: finalNote }),
    });
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

  // Quick-add — favorites + POPULAR_ITEMS fallback 통합 (중복 제거, 최대 8개).
  // 입력창 바로 아래에 항상 노출 (빈 상태/항목 있는 상태 공통).
  // 호출 측에서 이미 cart category로 매핑 완료한 값 전달.
  const quickAdd = (name: string, cartCategory: string) => {
    addItem(name, cartCategory, undefined, 'chip');
  };

  type QuickItem = { name: string; category: string; icon: string; isStarred: boolean; fromFavorites: boolean };
  const quickAddItems: QuickItem[] = (() => {
    const seen = new Set<string>();
    const merged: QuickItem[] = [];
    for (const f of favorites) {
      if (seen.has(f.ingredient_name)) continue;
      seen.add(f.ingredient_name);
      merged.push({
        name: f.ingredient_name,
        category: f.category ?? 'other',
        icon: getIngredientEmoji(f.ingredient_name, f.category ?? 'other'),
        isStarred: f.is_starred,
        fromFavorites: true,
      });
      if (merged.length >= 8) break;
    }
    for (const p of POPULAR_ITEMS) {
      if (merged.length >= 8) break;
      if (seen.has(p.name)) continue;
      seen.add(p.name);
      merged.push({
        name: p.name,
        category: POPULAR_CATEGORY_TO_CART[p.category] ?? 'other',
        icon: p.icon,
        isStarred: false,
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

  // 비로그인: 로그인 유도 뷰 (API 호출 없음, 체험 모드 없음)
  if (!user) {
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div
          className={`rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col ${
            fromBottom
              ? 'fixed left-1/2 -translate-x-1/2 bottom-20 w-[92vw] max-w-sm'
              : 'absolute w-80 md:w-[30rem] max-w-[calc(100vw-2rem)] right-0 top-full mt-2'
          }`}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="font-bold text-sm">{t.cart.title}</span>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors text-base"
              aria-label={t.cart.closeAria}
            >
              ✕
            </button>
          </div>

          {/* 로그인 유도 */}
          <div className="px-5 pt-6 pb-5 text-center">
            <div className="text-5xl mb-3">🛍</div>
            <h3 className="text-sm font-bold text-text-primary mb-1.5">
              {t.cart.loginTitle}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-4 whitespace-pre-line">
              {t.cart.loginDesc}
            </p>

            {/* 혜택 리스트 */}
            <ul className="text-left text-xs text-text-secondary space-y-1.5 mb-5 px-2">
              <li className="flex items-start gap-2">
                <span className="text-accent-warm shrink-0">✓</span>
                <span>{t.cart.loginBenefit1}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-warm shrink-0">✓</span>
                <span>{t.cart.loginBenefit2}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-warm shrink-0">✓</span>
                <span>{t.cart.loginBenefit3}</span>
              </li>
            </ul>

            <Link
              href="/login"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent-warm text-background-primary font-bold text-sm hover:bg-accent-hover active:scale-[0.98] transition-all"
            >
              {t.cart.loginCta} <span className="leading-none">→</span>
            </Link>

            <p className="text-[11px] text-text-muted mt-3">
              {t.cart.noAccountQuestion}{' '}
              <Link href="/signup" onClick={onClose} className="text-accent-warm underline">
                {t.common.signup}
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
      <div className={`rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col ${fromBottom ? 'fixed left-1/2 -translate-x-1/2 bottom-20 w-[92vw] max-w-sm' : 'absolute w-80 md:w-[30rem] max-w-[calc(100vw-2rem)] right-0 top-full mt-2'}`} style={{ maxHeight: '32rem' }}>
        {/* 헤더 */}
        <div className="px-4 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">
              {t.cart.title} {uncheckedCount > 0 && <span className="text-accent-warm">({uncheckedCount})</span>}
            </span>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors text-base"
              aria-label={t.cart.closeAria}
            >
              ✕
            </button>
          </div>

          {/* 진행률 바 — 항목이 있을 때만 */}
          {totalCount > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
                <span>{t.cart.checkedProgress.replace('{checked}', String(checkedCount)).replace('{total}', String(totalCount))}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-accent-warm transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* 그룹 모드 토글 + 액션 — 항목 있을 때 */}
          {totalCount > 0 && (
            <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
              {totalCount >= 2 ? (
                <div className="inline-flex rounded-lg bg-background-tertiary p-0.5 text-[11px]">
                  <button
                    onClick={() => switchGroupMode('recipe')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      groupMode === 'recipe'
                        ? 'bg-accent-warm/20 text-accent-warm font-medium'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {t.cart.groupByRecipe}
                  </button>
                  <button
                    onClick={() => switchGroupMode('category')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      groupMode === 'category'
                        ? 'bg-accent-warm/20 text-accent-warm font-medium'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {t.cart.groupByCategory}
                  </button>
                </div>
              ) : <span />}

              <div className="flex items-center gap-1.5 text-[11px]">
                {/* #4 완료 항목 숨김 토글 — 체크된 게 있을 때만 노출 */}
                {checkedCount > 0 && (
                  <button
                    onClick={toggleHideChecked}
                    className={`px-2 py-1 rounded-md transition-all ${
                      hideChecked
                        ? 'bg-accent-warm/20 text-accent-warm font-medium'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {hideChecked ? t.cart.showAll : t.cart.hideChecked}
                  </button>
                )}
                {/* 공유 — 가족·룸메이트 read-only 링크 */}
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  aria-label={t.cart.shareButton}
                  className="px-2 py-1 rounded-md text-text-muted hover:text-accent-warm transition-colors disabled:opacity-50"
                >
                  {sharing ? t.cart.shareGenerating : `🔗 ${t.cart.shareButton}`}
                </button>
                {/* #5 전체 비우기 */}
                <button
                  onClick={clearAll}
                  aria-label={t.cart.clearAllAria}
                  className="px-2 py-1 rounded-md text-text-muted hover:text-error transition-colors"
                >
                  🗑 {t.cart.clearAll}
                </button>
              </div>
            </div>
          )}
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
            <input
                ref={inputRef}
                type="search"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && inputText.trim()) {
                    e.preventDefault();
                    addItem(inputText, '', undefined, 'manual');
                  }
                  if (e.key === 'Escape') {
                    setInputText('');
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => { setInputFocused(true); if (suggestions.length > 0) setShowSuggestions(true); }}
                onBlur={() => setInputFocused(false)}
                placeholder={t.cart.inputPlaceholder}
                className="w-full bg-transparent text-text-primary placeholder-text-muted !outline-none !border-0 !border-none pl-3 pr-2 py-2 text-sm"
                style={{ border: 'none', outline: 'none' }}
              />
            {/* 단위 select — DetailFields 패턴 (appearance-none + ▾) */}
            <div className="relative flex-shrink-0 flex items-center mr-1.5">
              <select
                value={inputUnit}
                onChange={e => setInputUnit(e.target.value)}
                onClick={e => e.stopPropagation()}
                aria-label={t.cart.unitLabel}
                className="bg-background-tertiary text-text-secondary text-xs rounded-md appearance-none cursor-pointer outline-none border-0 pl-2 pr-5 py-1 hover:bg-background-tertiary/80"
                style={{ maxWidth: '5.5rem' }}
              >
                <option value="">{t.cart.unitLabel}</option>
                {COMMON_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-1.5 text-text-muted text-[9px]">▾</span>
            </div>
            {adding ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-warm border-t-transparent flex-shrink-0 mr-3" />
            ) : (
              <button
                onMouseDown={() => inputText.trim() && addItem(inputText, '', undefined, 'manual')}
                disabled={!inputText.trim()}
                className="flex-shrink-0 mr-2 px-3 py-1.5 text-xs rounded-lg bg-accent-warm font-semibold text-background-primary transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed !outline-none !border-0"
                style={{ border: 'none' }}
              >
                {t.cart.addButton}
              </button>
            )}
          </div>

          {/* 자동완성 목록 */}
          {showSuggestions && inputText.trim() && (
            <div className="absolute left-3 right-3 top-full mt-1 rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-10 overflow-hidden">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  onMouseDown={() => addItem(s.name, s.category, undefined, 'autocomplete')}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <span className="text-accent-warm flex-shrink-0">+</span>
                  <span className="text-text-primary flex-1 truncate">{s.name}</span>
                  {s.category && <span className="text-text-muted">{s.category}</span>}
                </button>
              ))}
              <button
                onMouseDown={() => addItem(inputText, '', undefined, 'manual')}
                className="w-full text-left px-4 py-2.5 text-xs hover:bg-accent-warm/10 transition-colors flex items-center gap-2 border-t border-white/5"
              >
                <span className="text-accent-warm flex-shrink-0">+</span>
                <span className="text-accent-warm font-medium truncate">{t.cart.directAddLabel.replace('{name}', inputText)}</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick-add 행 — 입력창 바로 아래 항상 노출. 빈 상태/항목 있는 상태 공통.
            flex-shrink-0 영역이라 cart 길어져도 스크롤로 밀려나지 않음. */}
        {quickAddItems.length > 0 && (
          <div className="px-3 py-2 border-b border-white/10 flex-shrink-0">
            <div className="flex flex-wrap gap-1">
              {quickAddItems.map(item => (
                <div
                  key={item.name}
                  className={`inline-flex items-center rounded-full text-[11px] transition-colors ${
                    item.isStarred
                      ? 'bg-yellow-400/12 hover:bg-yellow-400/20 text-text-primary'
                      : 'bg-background-tertiary hover:bg-accent-warm/15 text-text-secondary hover:text-accent-warm'
                  }`}
                >
                  {/* ⭐ 토글 — 로그인 사용자에게만 */}
                  {user && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavoriteStar(item.name, item.category, item.isStarred);
                      }}
                      aria-pressed={item.isStarred}
                      aria-label={item.isStarred ? t.cart.unstarAria : t.cart.starAria}
                      className={`pl-1.5 pr-0.5 py-1 text-xs leading-none ${item.isStarred ? 'text-yellow-400' : 'text-text-muted/60 hover:text-yellow-400'}`}
                    >
                      <span aria-hidden="true">{item.isStarred ? '⭐' : '☆'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => quickAdd(item.name, item.category)}
                    disabled={adding}
                    className={`flex items-center gap-1 ${user ? 'pl-0.5' : 'pl-2'} pr-2 py-1 disabled:opacity-50 max-w-[8rem]`}
                  >
                    <span aria-hidden="true" className="flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 내용 */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-warm border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            // 빈 상태 — quick-add는 위에서 항상 노출되므로 placeholder만 표시
            <div className="text-center py-10 px-4">
              <div className="text-3xl mb-2">🛒</div>
              <p className="text-xs text-text-muted">{t.cart.emptyHint}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-xs text-text-muted">{t.cart.noMatchHint.replace('{q}', inputText)}</p>
            </div>
          ) : (
            <div>
              {groups.map((group) => (
                <div key={group.groupKey}>
                  <div className="px-4 py-2 bg-white/5 flex items-center gap-2">
                    <span className="text-sm">{group.groupIcon}</span>
                    <span className="text-xs font-medium text-text-secondary truncate">
                      {groupMode === 'category'
                        ? (t.cart.categoryLabels[group.groupKey as keyof typeof t.cart.categoryLabels] ?? group.groupTitle)
                        : group.groupKey === '__manual__' ? t.cart.manualAdd : group.groupTitle}
                    </span>
                    <span className="text-[10px] text-text-muted ml-auto">
                      {group.items.filter(i => i.is_checked).length}/{group.items.length}
                    </span>
                  </div>
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      className="px-4 py-2 hover:bg-white/5 active:bg-white/10 transition-colors group select-none"
                    >
                    <div
                      onClick={() => toggleCheck(item)}
                      className="flex items-center gap-2.5 cursor-pointer"
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
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <span className={`text-sm truncate ${item.is_checked ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                          {item.ingredient_name}
                        </span>
                        {/* #1 보유 재료 배지 — 미체크 항목에만 (체크 후엔 곧 냉장고로 갈 거라 노이즈) */}
                        {item.is_owned && !item.is_checked && (
                          <span
                            className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-info/15 text-info text-[10px] font-medium"
                            title={t.cart.alreadyOwned}
                          >
                            <span aria-hidden="true">❄️</span>
                            <span>{t.cart.alreadyOwned}</span>
                          </span>
                        )}
                      </div>

                      {/* 수량 스테퍼 + 단위 통합 [−][수량 | 단위 ▾][+] — DetailFields와 일관 */}
                      {!item.is_checked ? (
                        <div className="inline-flex items-center rounded-lg border border-white/10 bg-background-tertiary overflow-hidden flex-shrink-0 h-7">
                          <button
                            onClick={e => { e.stopPropagation(); updateQuantity(item, -1); }}
                            disabled={(item.quantity ?? 1) <= 1}
                            className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-accent-warm hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                            aria-label={t.cart.quantityDecrease}
                          >
                            −
                          </button>
                          <span className="text-xs text-text-primary tabular-nums min-w-[1.5rem] px-1.5 text-center border-l border-white/10 h-7 leading-7">
                            {item.quantity ?? 1}
                          </span>
                          {/* 단위 드롭다운 — placeholder + 명시적 ▾ 화살표 */}
                          <div className="relative flex items-center border-l border-white/10 h-7">
                            <select
                              value={item.unit ?? ''}
                              onClick={e => e.stopPropagation()}
                              onChange={e => { e.stopPropagation(); updateUnit(item, e.target.value); }}
                              aria-label={t.cart.unitLabel}
                              className="bg-transparent text-xs text-text-secondary appearance-none cursor-pointer outline-none pl-2 pr-5 h-full"
                            >
                              <option value="">{t.cart.unitLabel}</option>
                              {COMMON_UNITS.map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-1 text-text-muted text-[9px]">▾</span>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); updateQuantity(item, 1); }}
                            className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-accent-warm hover:bg-white/5 transition-colors text-sm border-l border-white/10"
                            aria-label={t.cart.quantityIncrease}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        (item.quantity || item.unit) && (
                          <span className="text-xs text-text-muted flex-shrink-0">
                            {item.quantity}{item.unit}
                          </span>
                        )
                      )}

                      <button
                        onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                        className="flex-shrink-0 text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100 text-sm p-0.5"
                        aria-label="삭제"
                      >
                        🗑
                      </button>
                    </div>

                    {/* 메모 라인 — 체크박스 위치만큼 들여쓰기 (5+2.5=7.5 → ml-7.5 대신 pl-[1.875rem]) */}
                    <div className="pl-[1.875rem] mt-0.5">
                      {editingNoteId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingNoteValue}
                            onChange={e => setEditingNoteValue(e.target.value.slice(0, 200))}
                            onBlur={async () => {
                              const target = items.find(i => i.id === item.id);
                              if (target) await updateNote(target, editingNoteValue);
                              setEditingNoteId(null);
                              setEditingNoteValue('');
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                (e.target as HTMLInputElement).blur();
                              } else if (e.key === 'Escape') {
                                setEditingNoteId(null);
                                setEditingNoteValue('');
                              }
                            }}
                            autoFocus
                            maxLength={200}
                            placeholder={t.cart.notePlaceholder}
                            aria-label={t.cart.noteEditAria}
                            className="flex-1 min-w-0 bg-background-tertiary border border-white/15 rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent-warm/60"
                          />
                          {/* ✓ 저장 — onMouseDown preventDefault로 input focus 유지, onClick으로 명시 저장 */}
                          <button
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={async () => {
                              const target = items.find(i => i.id === item.id);
                              if (target) await updateNote(target, editingNoteValue);
                              setEditingNoteId(null);
                              setEditingNoteValue('');
                            }}
                            aria-label={t.cart.noteSaveAria}
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-text-secondary hover:text-accent-warm hover:bg-white/5 transition-colors text-xs"
                          >
                            <span aria-hidden="true">✓</span>
                          </button>
                          {/* ✕ 취소 — 저장 없이 닫기 */}
                          <button
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                              setEditingNoteId(null);
                              setEditingNoteValue('');
                            }}
                            aria-label={t.cart.noteCancelAria}
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-error hover:bg-white/5 transition-colors text-xs"
                          >
                            <span aria-hidden="true">✕</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* 카테고리 모드 한정 — 어느 레시피용인지 표시 + 클릭 시 해당 레시피로 이동 */}
                          {groupMode === 'category' && item.recipe_id && item.recipe_title && (
                            <Link
                              href={`/recipes/${item.recipe_id}`}
                              onClick={e => {
                                e.stopPropagation();
                                if (typeof window !== 'undefined') {
                                  sessionStorage.setItem('naelum_cart_restore', '1');
                                }
                                onClose();
                              }}
                              className={`inline-flex items-center gap-0.5 text-xs max-w-[15rem] transition-colors ${item.is_checked ? 'text-text-muted line-through hover:text-text-secondary' : 'text-text-muted hover:text-accent-warm hover:underline'}`}
                            >
                              <span aria-hidden="true">🍲</span>
                              <span className="truncate">{item.recipe_title}</span>
                              <span aria-hidden="true" className="opacity-70 ml-0.5">↗</span>
                            </Link>
                          )}
                          {/* divider — recipe chip + 우측에 메모(또는 + 메모) 둘 다 있을 때만 */}
                          {groupMode === 'category' && item.recipe_id && item.recipe_title && (item.note || !item.is_checked) && (
                            <span className="text-[10px] text-text-muted/50" aria-hidden="true">·</span>
                          )}
                          {/* 메모 */}
                          {item.note ? (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setEditingNoteId(item.id);
                                setEditingNoteValue(item.note ?? '');
                              }}
                              aria-label={t.cart.noteEditAria}
                              className={`inline-flex items-center gap-1 text-xs ${item.is_checked ? 'text-text-muted line-through' : 'text-text-secondary'} hover:text-accent-warm transition-colors`}
                            >
                              <span aria-hidden="true">📝</span>
                              <span className="text-left">{item.note}</span>
                            </button>
                          ) : !item.is_checked ? (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setEditingNoteId(item.id);
                                setEditingNoteValue('');
                              }}
                              className="inline-flex items-center text-[10px] text-text-muted hover:text-accent-warm transition-colors opacity-60 hover:opacity-100"
                            >
                              {t.cart.noteAddPrompt}
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>

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

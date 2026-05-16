'use client';

/**
 * 낼름 — 카툰 양문형 냉장고 v5
 *
 * 레퍼런스: 따뜻한 갈색 카툰 일러스트 양문형 냉장고.
 * 문이 기본 열려있고 재료가 선반에 바로 보임.
 * CSS로 양문 V자 + 선반 + 재료 칩 구현.
 */

import Link from '@/components/Common/LocalizedLink';
import dynamicImport from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/lib/toast/context';
import { createClient } from '@/lib/supabase/client';
import FridgeSVG from './_home/FridgeSVG';
import {
  DELETE_UNDO_WINDOW_MS,
  RECOMMENDATIONS_FETCH_DEBOUNCE_MS,
  RECOMMENDATIONS_LIMIT,
  TOAST_AUTO_HIDE_MS,
  LS_KEY_DEMO_ITEMS,
  LS_KEY_ONBOARDING_BANNER,
  LONG_PRESS_MS,
  SHELF_LEFT,
  SHELF_WIDTH,
  SHELVES,
} from './_home/constants';
import type { FridgeItem, IngredientFormData } from './_home/types';
import { freshState, formatFreshLabel, urgencyScore, getEmoji, isDemoRecord } from './_home/helpers';
import { DEMO } from './_home/demoItems';
import { track } from '@/lib/analytics/track';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import BottomNav from '@/components/BottomNav';
import IngredientDetailModal from '@/components/Ingredients/IngredientDetailModal';
import AddIngredientModal from '@/components/Ingredients/AddIngredientModal';
import AuthPromptSheet from '@/components/Auth/AuthPromptSheet';
import IngredientActionSheet from '@/components/Ingredients/IngredientActionSheet';
import FridgeAllSheet from '@/components/Ingredients/FridgeAllSheet';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

const OnboardingWizard = dynamicImport(() => import('@/components/Onboarding/OnboardingWizard'), {
  ssr: false,
});

// ── Main ──────────────────────────────────────────────────────────────────────

interface HomeClientProps {
  /** SSR에서 확인한 로그인 상태 — useAuth 초기 undefined 단계를 건너뛰고 hero/waitlist를 즉시 올바르게 렌더. */
  isAuthenticated: boolean;
  /** SSR에서 fetch한 profiles.username — 첫 렌더에서 임시 username 배너를 즉시 판정. */
  initialUsername: string | null;
  /** SSR에서 fetch한 profiles.onboarding_step — 미완료 유저 식별용(향후 배너 확장 여지). */
  initialOnboardingStep: number | null;
  /** SSR에서 fetch한 profiles.onboarding_completed — 임시 username 아니어도 온보딩 안 한 유저까지 포괄. */
  initialOnboardingCompleted: boolean | null;
  /** SSR에서 fetch한 user_ingredients — 초기 렌더에서 빈 냉장고 flicker 제거. 비로그인은 null. */
  initialItems: unknown[] | null;
}

export default function HomeClient({
  isAuthenticated,
  initialUsername,
  initialOnboardingStep: _initialOnboardingStep,
  initialOnboardingCompleted,
  initialItems,
}: HomeClientProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { success: toastSuccess } = useToast();
  // SSR prefetch된 items가 있으면 초기 렌더부터 반영, 없으면 빈 배열 + loading 상태 유지.
  const [items, setItems] = useState<FridgeItem[]>(() => (initialItems as FridgeItem[] | null) ?? []);
  const [loading, setLoading] = useState(initialItems === null);
  const [toast, setToast] = useState<string | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // 반응형 MAX — viewport width 기반. 모바일 4, 태블릿 6, 데스크톱 8.
  // 선반 폭이 비율로 스케일되므로 chip 개수도 비례 증가 가능.
  const [shelfMax, setShelfMax] = useState({ body: 4, pantry: 3, door: 2 });
  // 씬 요소(팬던트/웜스팟/콘센트) 배치용 — 데스크탑에선 냉장고 가까이, 모바일은 가장자리
  const [_isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setIsDesktop(w >= 768);
      // body=6: 데모 17개 기준 6+6+5로 본체 3단 균등 분배. 8로 두면 마지막 단이 비어 본체와 냉동실이 시각적으로 분리됨.
      if (w >= 1024) setShelfMax({ body: 6, pantry: 4, door: 3 });
      else if (w >= 768) setShelfMax({ body: 6, pantry: 3, door: 3 });
      else if (w >= 640) setShelfMax({ body: 5, pantry: 2, door: 2 });
      else setShelfMax({ body: 4, pantry: 1, door: 2 });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // 전체 재료 시트 모드 — null=닫힘, 'all'=전체 목록(펜던트 탭), 'expiring'=임박 재료만(배너 탭).
  // 같은 컴포넌트(FridgeAllSheet)를 두 모드로 재사용해 일관성 유지.
  const [allSheetMode, setAllSheetMode] = useState<null | 'all' | 'expiring'>(null);

  // 데모 칩 표시명 — DB·매칭에는 한글 ingredient_name 그대로 쓰되, 화면 표시만 locale별로.
  // 데모가 아닌 사용자 추가 재료는 사용자가 입력한 한글 이름을 그대로 사용.
  const getDisplayName = useCallback((item: { ingredient_name: string; id: string; isDemoItem?: boolean }) => {
    if (!isDemoRecord(item)) return item.ingredient_name;
    const map = (t.demoIngredients ?? {}) as Record<string, string>;
    return map[item.ingredient_name] ?? item.ingredient_name;
  }, [t]);

  // 냉장고 본체·냉동 선반 분배 + 통합 overflow — items·shelfMax 바뀔 때만 재계산.
  // 도어 선반 분배 제거 — 모든 냉장 재료는 본체 선반(3단)에 통합 표시.
  // 같은 이름끼리 그룹화해 한 chip으로 표시 (×N 배지). 클릭 시 그룹 2+면 미니 시트.
  const fridgeShelfDistribution = useMemo(() => {
    // 같은 이름끼리 그룹화 (case-insensitive). 그룹 정렬 = 그룹 내 가장 임박한 항목 기준.
    const groupByName = (list: FridgeItem[]): FridgeItem[][] => {
      const buckets = new Map<string, FridgeItem[]>();
      for (const item of list) {
        const key = item.ingredient_name.trim().toLowerCase();
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key)!.push(item);
      }
      // 그룹 내 항목 정렬 (가장 임박 우선)
      const groups = Array.from(buckets.values()).map(g => g.sort((a, b) => urgencyScore(a) - urgencyScore(b)));
      // 그룹 간 정렬 = 그룹 대표(첫 항목) 기준
      return groups.sort((a, b) => urgencyScore(a[0]) - urgencyScore(b[0]));
    };

    const nonFreezer = items.filter(i => i.storage_location !== '냉동');
    const freezerRaw = items.filter(i => i.storage_location === '냉동');

    const nonFreezerGroups = groupByName(nonFreezer);
    const freezerGroups = groupByName(freezerRaw);

    // 본체 선반 3단에 그룹 단위로 분배
    const bodyShelfGroups: FridgeItem[][][] = [[], [], []];
    nonFreezerGroups.forEach((group, i) => {
      bodyShelfGroups[Math.min(Math.floor(i / shelfMax.body), 2)].push(group);
    });

    // overflow는 그룹 단위 카운트
    let totalOverflow = 0;
    bodyShelfGroups.forEach(list => {
      if (list.length > shelfMax.body) totalOverflow += list.length - shelfMax.body;
    });
    if (freezerGroups.length > shelfMax.body) totalOverflow += freezerGroups.length - shelfMax.body;

    return { bodyShelfGroups, freezerGroups, totalOverflow };
  }, [items, shelfMax.body]);

  // 추가 모달 (사진 업로드 포함) — FAB/빈 선반/overflow 탭 시 열림
  const [addModalLocation, setAddModalLocation] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // 같은 이름 그룹 chip 클릭 시 미니 시트 (그룹 내 항목 선택)
  const [groupSheet, setGroupSheet] = useState<{ name: string; items: FridgeItem[] } | null>(null);

  // 매직 모드: 서버가 auto 판단한 결과를 받아 버블 라벨에 반영.
  // - resolvedMode: 'ready' | 'almost' | 'all' (서버가 최선 선택)
  // - matchingCount: 해당 mode의 레시피 개수
  const [matchingCount, setMatchingCount] = useState<number | null>(null);
  const [resolvedMode, setResolvedMode] = useState<'ready' | 'almost' | 'all' | null>(null);
  const showRecipeBubble = items.length > 0;

  // 만료 임박 재료 — freshState.isDanger = D-3 이내 또는 expired.
  // 펜던트 위에 만료 배너 매달기 + 시트 모드 전환에 사용.
  const expiringItems = useMemo(() => items.filter(i => freshState(i).isDanger), [items]);
  const expiringCount = expiringItems.length;

  // 임박 재료 전용 추천 매칭 — 시트의 "🔥 N개" pill에 표시.
  // 일반 추천(matchingCount)과 별도. 임박 재료만 query에 넣음.
  const [expiringRecipeMatch, setExpiringRecipeMatch] = useState<{ count: number | null; mode: 'ready' | 'almost' | 'all' | null } | null>(null);

  // 온보딩 배너 (임시 username 사용 중인 유저용)
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  // 클라이언트 hydration 후엔 useAuth의 profile을, SSR 초기 HTML에선 initialUsername을 사용.
  const currentUsername = profile?.username ?? initialUsername;
  const hasTempUsername = !!currentUsername && /^user_[a-f0-9]{12}$/.test(currentUsername);

  // 온보딩 미완료 판정:
  // - 임시 username(user_xxxxxxxxxxxx) 유저 → 임시 username 탈출 필요
  // - 또는 onboarding_completed=false (명시적 미완료. skip한 유저는 true라 대상 아님)
  const needsOnboarding = hasTempUsername || initialOnboardingCompleted === false;

  useEffect(() => {
    if (!user) return;
    if (!needsOnboarding) return;
    const dismissed = localStorage.getItem(LS_KEY_ONBOARDING_BANNER(user.id));
    if (!dismissed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage는 브라우저에서만 읽을 수 있어 render 단계에서 파생 불가
      setShowOnboardingBanner(true);
      // 자동 dismiss 제거 — X 버튼 또는 OnboardingWizard 완료 시에만 영구 dismiss.
      // 유저가 배너를 읽을 시간 충분히 보장.
    }
  }, [user, needsOnboarding]);

  // 하단 네비의 검색 아이콘 → 인라인 검색바 토글
  useEffect(() => {
    const handler = () => setShowMobileSearch((prev) => !prev);
    window.addEventListener('toggle-fridge-search', handler);
    return () => window.removeEventListener('toggle-fridge-search', handler);
  }, []);

  // ESC 키로 모바일 검색 닫기
  useEscapeKey(() => setShowMobileSearch(false), showMobileSearch);

  // 재료 액션 시트 (chip 탭 시 1차로 열림: 만들기/수정/삭제)
  const [actionItem, setActionItem] = useState<FridgeItem | null>(null);
  // 재료 상세 수정 모달 (액션 시트의 '수정' 선택 시 열림)
  const [detailItem, setDetailItem] = useState<FridgeItem | null>(null);

  const router = useRouter();

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
        await client.from('user_ingredients').delete().eq('id', item.id).eq('user_id', user.id);
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

  // DB/localStorage에서 raw items 반환 (filter는 호출부에서 적용)
  const fetchItems = useCallback(async (): Promise<FridgeItem[]> => {
    if (!user) {
      // 비로그인 체험 모드: localStorage에 저장된 데모 재료가 있으면 복원, 없으면 DEMO 기본값
      try {
        const saved = localStorage.getItem(LS_KEY_DEMO_ITEMS);
        if (saved) {
          const parsed = JSON.parse(saved) as FridgeItem[];
          if (Array.isArray(parsed)) {
            // '물' 자동 정리 + 로그아웃 race로 오염된 DB 재료(UUID id) 제거
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
      .select('id, ingredient_name, category, expiry_date, storage_location, quantity, unit, purchase_date, notes, expiry_alert')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true, nullsFirst: false });
    return (data ?? []) as FridgeItem[];
  }, [user]);

  // 비로그인 체험 모드 — items 변경 시 localStorage에 저장
  useEffect(() => {
    if (user || loading) return;
    // 로그아웃 직후 race condition 방어: DB 재료(UUID id)가 섞여 있으면 저장 금지
    if (items.some(item => !isDemoRecord(item))) return;
    try { localStorage.setItem(LS_KEY_DEMO_ITEMS, JSON.stringify(items)); } catch { /* 용량 초과 등 무시 */ }
  }, [user, loading, items]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    queueMicrotask(async () => {
      const rows = await fetchItems();
      if (cancelled) return;
      // undo 창 중인 pending-delete는 제외 (DB에는 아직 있지만 UX상 삭제된 상태)
      setItems(rows.filter(row => !pendingDeleteIdsRef.current.has(row.id)));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [authLoading, fetchItems]);

  // 외부에서 냉장고 변경 이벤트 발생 시 재fetch
  // (예: ShoppingCartDropdown에서 "냉장고에 추가" 후, 레시피 → 재료 추가 등).
  useEffect(() => {
    const handler = async () => {
      const rows = await fetchItems();
      setItems(rows.filter(row => !pendingDeleteIdsRef.current.has(row.id)));
    };
    window.addEventListener('fridge-updated', handler);
    return () => window.removeEventListener('fridge-updated', handler);
  }, [fetchItems]);

  // 임박 재료 전용 매칭 fetch — 시트 열릴 때만 fetch (불필요한 호출 방지).
  // 임박 재료 변경 시 invalidate. 시트 닫혀있어도 임박 카운트 변하면 다음 오픈 시 새로 fetch.
  // 로딩/0개 케이스에서 effect body 내 setState 발생 — 비동기 fetch 결과를 React 상태와 연동해야 하는 외부 동기화이므로 합법.
  useEffect(() => {
    if (allSheetMode !== 'expiring') return;
    if (expiringCount === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- expiringCount는 items 파생이지만 mode 전환과 결합된 외부 동기화
      setExpiringRecipeMatch({ count: 0, mode: null });
      return;
    }
    let cancelled = false;
    // 새 fetch 시작 시 stale 결과 무효화 (UI 로딩 표시 필수)
    setExpiringRecipeMatch({ count: null, mode: null });
    const names = expiringItems.map(i => i.ingredient_name).join(',');
    const url = `/api/recommendations?type=ingredients&limit=${RECOMMENDATIONS_LIMIT}&mode=auto&ingredients=${encodeURIComponent(names)}`;
    fetch(url)
      .then(r => r.ok ? r.json() : { recommendations: [], mode: null })
      .then(data => {
        if (cancelled) return;
        setExpiringRecipeMatch({
          count: Array.isArray(data.recommendations) ? data.recommendations.length : 0,
          mode: data.mode ?? null,
        });
      })
      .catch(() => { if (!cancelled) setExpiringRecipeMatch({ count: 0, mode: null }); });
    return () => { cancelled = true; };
  }, [allSheetMode, expiringCount, expiringItems]);

  // 임박 재료로 요리하기 — /recommendations 페이지로 이동(임박 재료만 query).
  const handleCookFromExpiring = useCallback(() => {
    if (expiringCount === 0) { router.push('/recommendations?mode=auto'); return; }
    const names = expiringItems.map(i => i.ingredient_name).join(',');
    router.push(`/recommendations?mode=auto&ingredients=${encodeURIComponent(names)}`);
    setAllSheetMode(null);
  }, [expiringCount, expiringItems, router]);

  // 매칭 레시피 fetch — mode=auto로 서버가 best mode 자동 선택.
  // 응답의 mode 필드로 버블 라벨 결정 (🔥 바로 가능 / 🛒 거의 가능 / 📋 추천).
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    // 500ms debounce — items가 연속 변경되면 (예: 재료 여러 개 빠르게 추가) 마지막 변경만 fetch.
    const timer = setTimeout(() => {
      if (cancelled) return;
      const base = `/api/recommendations?type=ingredients&limit=${RECOMMENDATIONS_LIMIT}&mode=auto`;
      const url = isAuthenticated
        ? base
        : `${base}&ingredients=${encodeURIComponent(items.map(i => i.ingredient_name).join(','))}`;
      fetch(url)
        .then(r => r.ok ? r.json() : { recommendations: [], mode: null })
        .then(data => {
          if (cancelled) return;
          setMatchingCount(Array.isArray(data.recommendations) ? data.recommendations.length : 0);
          setResolvedMode(data.mode ?? null);
        })
        .catch(() => {
          if (!cancelled) { setMatchingCount(0); setResolvedMode(null); }
        });
    }, RECOMMENDATIONS_FETCH_DEBOUNCE_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [isAuthenticated, items]);

  // 문 애니메이션 제거 — SVG 기본 디자인 우선

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [toast]);
  const showToast = (msg: string) => setToast(msg);

  // Supabase 에러를 사용자 친화 토스트 메시지로 변환.
  // - 네트워크 오프라인: errorOffline
  // - 23505: unique 위반(중복 재료)
  // - 42501/PGRST116: RLS/권한
  // - 그 외: fallback (updateError/addError)
  const getErrorMessage = (error: { code?: string } | null, fallback: string): string => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return t.ingredient.errorOffline;
    if (error?.code === '23505') return t.ingredient.errorDuplicate;
    if (error?.code === '42501' || error?.code === 'PGRST116') return t.ingredient.errorPermission;
    return fallback;
  };

  // IngredientDetailModal onUpdate
  const updateIngredient = async (id: string, formData: IngredientFormData) => {
    if (isDemoRecord({ id })) {
      setItems(prev => prev.map(i => (i.id === id ? { ...i, ...formData } : i)));
      setDetailItem(null);
      showToast(t.ingredient.updateSuccess.replace('{name}', formData.ingredient_name));
      return;
    }
    if (!user) {
      showToast(getErrorMessage(null, t.ingredient.updateError));
      return;
    }
    const client = createClient();
    // user_id 명시 필터로 RLS 이중 방어 (다른 유저 레코드 오수정 방지).
    const { error } = await client.from('user_ingredients').update({ ...formData }).eq('id', id).eq('user_id', user.id);
    if (error) {
      console.error('[updateIngredient] update 실패:', error);
      showToast(getErrorMessage(error, t.ingredient.updateError));
      return;
    }
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...formData } : i)));
    setDetailItem(null);
    showToast(t.ingredient.updateSuccess.replace('{name}', formData.ingredient_name));
    window.dispatchEvent(new Event('fridge-updated'));
  };

  // 실제 INSERT 수행 — 중복 다이얼로그 우회 시에도 재사용
  const performIngredientInsert = async (sanitized: IngredientFormData) => {
    if (!user) return;
    const client = createClient();
    const { data, error } = await client
      .from('user_ingredients')
      .insert({ ...sanitized, user_id: user.id })
      .select()
      .single();
    if (error) {
      console.error('[addIngredient] insert 실패:', error);
      showToast(getErrorMessage(error, t.ingredient.addError));
      return;
    }
    if (data) setItems(prev => [...prev, data as FridgeItem]);
    setAddModalLocation(null);
    showToast(t.ingredient.addSuccessShort);
    track('ingredient_add', { name: sanitized.ingredient_name, source: 'modal' });
    window.dispatchEvent(new Event('fridge-updated'));
  };

  // 기존 항목에 수량 합치기 — DB 기반 (state stale 회피)
  // currentQty는 호출자가 DB에서 가져온 값 사용 (또는 fallback으로 다시 SELECT)
  const mergeIngredientQuantity = async (
    targetItemId: string,
    pending: IngredientFormData,
    knownCurrentQty?: number | null,
  ) => {
    if (!user) return;
    const client = createClient();

    // 현재 quantity 확정 — 호출자가 전달 안 했으면 DB에서 SELECT
    let currentQty = knownCurrentQty ?? null;
    if (currentQty === null) {
      const { data } = await client
        .from('user_ingredients')
        .select('quantity')
        .eq('id', targetItemId)
        .eq('user_id', user.id)
        .single();
      currentQty = data?.quantity ?? 0;
    }
    const addQty = typeof pending.quantity === 'number' ? pending.quantity : (pending.quantity ? parseFloat(String(pending.quantity)) : 1);
    const nextQty = (currentQty ?? 0) + (isNaN(addQty) ? 1 : addQty);
    const { error } = await client
      .from('user_ingredients')
      .update({ quantity: nextQty })
      .eq('id', targetItemId)
      .eq('user_id', user.id);
    if (error) {
      console.error('[mergeIngredient] update 실패:', error);
      showToast(getErrorMessage(error, t.ingredient.addError));
      return;
    }
    setItems(prev => prev.map(i => (i.id === targetItemId ? { ...i, quantity: nextQty } : i)));
    setAddModalLocation(null);
    showToast(t.ingredient.mergedToast.replace('{name}', pending.ingredient_name));
    track('ingredient_merge', { name: pending.ingredient_name });
    window.dispatchEvent(new Event('fridge-updated'));
  };

  // AddIngredientModal onAddIngredient
  // 자동 판단: 같은 이름 + 만료일·보관위치 동일 → 수량 합치기. 다르면 따로 추가.
  // DB 직접 쿼리로 mergeTarget 찾음 — React state items는 비동기 업데이트로 stale 가능
  // (Promise.all 병렬 추가 또는 연속 추가 시 누적 안 됨)
  const addIngredientFromModal = async (formData: IngredientFormData) => {
    const sanitized: IngredientFormData = {
      ...formData,
      purchase_date: formData.purchase_date || null,
      expiry_date: formData.expiry_date || null,
      ingredient_id: formData.ingredient_id && !formData.ingredient_id.startsWith('preset-')
        ? formData.ingredient_id
        : null,
    };
    if (!user) return;

    const client = createClient();
    const name = sanitized.ingredient_name.trim();
    const expiry = sanitized.expiry_date ?? null;
    const storage = sanitized.storage_location ?? null;

    // DB에서 같은 이름 + 만료일·보관위치 동일 항목 검색 (state stale 회피)
    let q = client
      .from('user_ingredients')
      .select('id, quantity')
      .eq('user_id', user.id)
      .ilike('ingredient_name', name);
    q = expiry === null ? q.is('expiry_date', null) : q.eq('expiry_date', expiry);
    q = storage === null ? q.is('storage_location', null) : q.eq('storage_location', storage);
    const { data: matches } = await q.limit(1);
    const mergeTarget = matches?.[0];

    if (mergeTarget) {
      // 만료일·보관위치 같음 → 수량 합치기 (정보 손실 없음)
      await mergeIngredientQuantity(mergeTarget.id, sanitized, mergeTarget.quantity);
    } else {
      // 같은 이름이지만 만료일·보관위치 다름 → 별도 행으로 따로 저장
      await performIngredientInsert(sanitized);
    }
  };


  return (
    <div className="min-h-dvh bg-background-primary text-text-primary flex flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0 overflow-hidden md:overflow-visible overscroll-y-none">
      <Header />
      <div className="h-14 md:h-20 flex-shrink-0" />

      {/* 온보딩 미완료 배너 — 비 sticky (자연 flow). X 버튼 또는 온보딩 완료 시 영구 dismiss. */}
      {showOnboardingBanner && (
        <div className="w-full border-b border-accent-warm/15 bg-gradient-to-r from-accent-warm/15 via-accent-warm/8 to-accent-warm/15 flex-shrink-0">
          <div className="max-w-5xl mx-auto px-4 py-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="flex-shrink-0 text-sm leading-none" aria-hidden="true">✨</span>
              <p className="text-[12px] md:text-sm text-text-primary font-medium truncate">
                {t.home.onboardingBannerTitle}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowOnboardingModal(true)}
                className="px-2.5 py-0.5 rounded-full bg-accent-warm hover:bg-accent-hover text-background-primary text-[11px] font-bold active:scale-95 transition-all whitespace-nowrap"
              >
                {t.home.onboardingBannerCta}
              </button>
              <button
                onClick={() => {
                  if (user) localStorage.setItem(LS_KEY_ONBOARDING_BANNER(user.id), '1');
                  setShowOnboardingBanner(false);
                }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
                aria-label={t.common.close}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 온보딩 위자드 */}
      {showOnboardingModal && (
        <OnboardingWizard
          isOpen={showOnboardingModal}
          onClose={() => setShowOnboardingModal(false)}
          onComplete={() => {
            setShowOnboardingModal(false);
            setShowOnboardingBanner(false);
            if (user) localStorage.setItem(LS_KEY_ONBOARDING_BANNER(user.id), '1');
          }}
        />
      )}

      {/* 검색바 — 데스크탑 전용. 모바일은 BottomNav 검색 아이콘으로 접근 (뷰포트 절약). */}
      <div className="hidden md:block px-4 pt-8 pb-3">
        {/* 카테고리 빠른 이동 — 모바일 검색 overlay와 동일 패턴 */}
        <div className="flex items-center justify-center gap-2 mb-2.5">
          <Link
            href="/recipes"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-background-secondary hover:bg-white/10 border border-white/5 text-sm font-medium text-text-secondary hover:text-text-primary active:scale-95 transition-all"
          >
            <span aria-hidden="true">📋</span>
            <span>{t.home.navRecipes}</span>
          </Link>
          <Link
            href="/tip"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-background-secondary hover:bg-white/10 border border-white/5 text-sm font-medium text-text-secondary hover:text-text-primary active:scale-95 transition-all"
          >
            <span aria-hidden="true">💡</span>
            <span>{t.home.navTips}</span>
          </Link>
        </div>
        <div className="flex justify-center">
          <SearchBar className="w-full max-w-md" />
        </div>
      </div>

      {/* DEMO pill (PC 전용 자연 flow) — 검색바 아래. outlined + bold + 펄스로 시각 hierarchy 톤다운(부가 정보).
          핵심 액션(+/재료 추천 pill)이 solid orange라서 ✨ pill은 outlined로 차별화. */}
      {!isAuthenticated && (
        <div className="hidden md:flex px-4 pb-1 md:pb-2 justify-center flex-shrink-0">
          <Link
            href="/signup"
            className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0 px-4 py-1.5 rounded-full bg-accent-warm/10 border-2 border-accent-warm/60 text-accent-warm text-sm font-bold hover:bg-accent-warm/20 hover:scale-105 active:scale-95 transition-all text-center leading-tight shadow-md shadow-accent-warm/20"
            style={{ animation: 'naelum-bubble-pulse 2.4s ease-in-out infinite' }}
          >
            <span className="text-base" aria-hidden="true">✨</span>
            <span>{t.home.demoBadge}</span>
            <span className="opacity-60">—</span>
            <span>{t.home.demoCta}</span>
          </Link>
        </div>
      )}

      {/* 레이아웃: justify-end로 콘텐츠를 하단에 몰아붙여 냉장고가 바텀 네비 살짝 위에 위치하게. */}
      <div className="flex-1 relative flex flex-col items-center justify-end gap-0 md:px-12 pb-0 md:pb-8">
        {/* DEMO pill (모바일 전용 absolute) — fridge container 위쪽에 떠 있어 layout flow 영향 0.
            outlined + bold + 펄스로 시각 hierarchy 톤다운(부가 정보). */}
        {!isAuthenticated && (
          <div className="md:hidden absolute top-2 left-4 right-4 z-30 flex justify-center pointer-events-none">
            <Link
              href="/signup"
              className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0 px-3 py-1.5 rounded-2xl bg-accent-warm/10 border-2 border-accent-warm/60 text-accent-warm text-[11px] font-bold hover:bg-accent-warm/20 active:scale-95 transition-all max-w-full text-center leading-tight pointer-events-auto shadow-md shadow-accent-warm/20"
              style={{ animation: 'naelum-bubble-pulse 2.4s ease-in-out infinite' }}
            >
              <span className="text-sm" aria-hidden="true">✨</span>
              <span>{t.home.demoBadge}</span>
              <span>{t.home.demoCta}</span>
            </Link>
          </div>
        )}
        {/* Scene backdrop 제거됨 — body bg-background-primary(#1a1a1a) 단색으로 노출.
            냉장고 자체 디테일에만 집중. */}

        {/* 찬장(KitchenSVG) 제거 — viewport fit 우선. 상온 재료는 냉장고 본체 선반에 통합 분배.
            전체 재료 분류 확인은 헤더 ⋯ 또는 +N overflow → "재료 목록" 시트(FridgeAllSheet)에서. */}

        {/* 홈 냉장고 — 모달 없이 직접 인터랙션. 선반에 재료 chip 오버레이.
            냉장 선반 3개: storage_location이 '냉동'이 아닌 재료 전부 긴급도순 분배
            냉동 선반 1개: storage_location === '냉동'
            chip 탭 → 상세 수정 모달, 빈 선반 탭 → 재료 추가 모달

            모바일: w-full + max-h(viewport 기준) → 비율 유지하며 최대한 화면 채움
            데스크톱: max-w 고정, aspect가 height 결정 */}
        {/* maxWidth = min(--fridge-max, height_기반_식). --fridge-max·--fridge-reserved는 globals.css에서
            viewport별 media query로 분리 (모바일/태블릿/큰 데스크탑). 각 화면 크기에서 최대 fit. */}
        <div className="relative w-full mx-auto aspect-[540/670] z-10"
          style={{ maxWidth: 'min(var(--fridge-max), calc((100dvh - var(--fridge-reserved) - env(safe-area-inset-bottom)) * 540 / 670))' }}>
          <FridgeSVG />

          {/* 빈 냉장고 가이드 — 로그인 신규 유저(items=0) 전용 overlay.
              단순 CTA → 모달의 multi-select(⭐ 자주 탭)로 한 번에 여러 재료 추가 유도.
              기존 선반 overlay 경로는 items.length===0 시 자연히 렌더 결과 없으므로 영향 없음. */}
          {user && !loading && items.length === 0 && (
            <div className="absolute inset-0 z-[25] flex items-center justify-center pointer-events-none px-6">
              <div className="pointer-events-auto bg-background-secondary/95 backdrop-blur-sm border border-accent-warm/30 rounded-2xl shadow-2xl p-5 max-w-[280px] text-center">
                <div className="text-5xl mb-2" aria-hidden="true">🥕</div>
                <h2 className="text-base md:text-lg font-bold mb-1.5">{t.home.emptyFridgeTitle}</h2>
                <p className="text-xs md:text-sm text-text-secondary mb-4 leading-relaxed">{t.home.emptyFridgeDesc}</p>
                <button
                  onClick={() => { track('empty_cta_click'); if (!isAuthenticated) { setShowAuthPrompt(true); } else { setAddModalLocation('auto'); } }}
                  className="w-full px-4 py-2.5 rounded-xl bg-accent-warm hover:bg-accent-hover text-background-primary text-sm font-bold active:scale-95 transition-all"
                >
                  {t.home.emptyFridgeCta}
                </button>
              </div>
            </div>
          )}

          {/* FAB(+) 재료 추가 — 왼쪽 냉동고 도어 내부 상단 (도어 선반 바로 위). y=63% 영역.
              'auto' 센티넬 = 모달이 "재료 추가"로 generic 타이틀 표시 (폼 기본 동작=자동 분류와 일치). */}
          {/* z-[25] > pill z-20 — pill이 같은 top에서 DOM 순서상 뒤에 렌더되면 z-20끼리 pill이 FAB를 가려 클릭 가로채는 버그 방지. */}
          <button
            onClick={() => { track('fab_add_click', { items_count: items.length }); if (!isAuthenticated) { setShowAuthPrompt(true); } else { setAddModalLocation('auto'); } }}
            aria-label={t.common.addIngredient}
            className="absolute top-[63%] left-[8%] -translate-y-1/2 z-[25] w-11 h-11 md:w-12 md:h-12 rounded-full bg-accent-warm hover:bg-accent-hover shadow-lg shadow-accent-warm/40 text-background-primary flex items-center justify-center text-xl font-bold transition-all active:scale-95"
          >
            +
          </button>


          {/* 레시피 추천 말풍선 — 매직 모드. 서버가 판단한 mode에 따라 라벨/이모지 동적.
              클릭 시 /recommendations?mode=auto로 진입 → 페이지에서도 같은 판단 로직으로 pill 자동 선택. */}
          {showRecipeBubble && (() => {
            const ingQuery = isAuthenticated
              ? ''
              : `&ingredients=${encodeURIComponent(items.map(i => i.ingredient_name).join(','))}`;
            const href = `/recommendations?mode=auto${ingQuery}`;
            // 로딩 중이면 shimmer pill
            if (matchingCount === null) {
              return (
                <div className="absolute top-[63%] right-[4%] -translate-y-1/2 z-20 flex items-center gap-1.5 px-3.5 py-2 md:px-5 md:py-2.5 rounded-full bg-accent-warm/60 text-background-primary text-xs md:text-base font-bold whitespace-nowrap animate-pulse">
                  <span className="text-base md:text-lg leading-none">💡</span>
                  <span>{t.home.pillDefault}</span>
                </div>
              );
            }
            // 라벨 결정
            let icon = '💡';
            let label = t.home.pillDefault;
            if (matchingCount > 0 && resolvedMode) {
              const countStr = matchingCount >= 30 ? '30+' : String(matchingCount);
              if (resolvedMode === 'ready') { icon = '🔥'; label = t.home.pillReady.replace('{count}', countStr); }
              else if (resolvedMode === 'almost') { icon = '🛒'; label = t.home.pillAlmost.replace('{count}', countStr); }
              else { icon = '📋'; label = t.home.pillAll.replace('{count}', countStr); }
            }
            return (
              <Link
                href={href}
                onClick={() => track('recipe_pill_click', { mode: resolvedMode, count: matchingCount, items_count: items.length })}
                className="absolute top-[63%] right-[4%] -translate-y-1/2 z-20 flex items-center gap-1.5 px-3.5 py-2 md:px-5 md:py-2.5 rounded-full bg-accent-warm text-background-primary text-xs md:text-base font-bold shadow-xl shadow-accent-warm/60 ring-2 ring-accent-warm/30 hover:bg-accent-hover hover:scale-105 active:scale-95 transition-transform whitespace-nowrap"
                style={{ animation: 'naelum-bubble-pulse 2.4s ease-in-out infinite' }}
                aria-label={`${label} — ${t.home.pillAriaSuffix}`}
              >
                <span className="text-base md:text-lg leading-none">{icon}</span>
                <span>{label}</span>
                <span className="leading-none text-sm md:text-base">→</span>
              </Link>
            );
          })()}

          {/* 선반 overlay — 본체 선반(3단 냉장 + 1단 냉동) + 도어 선반(좌/우 각 2단) */}
          <div className="absolute inset-0 pointer-events-none">
            {(() => {
              // 분배된 본체·냉동 그룹 + 통합 overflow를 상단 useMemo(fridgeShelfDistribution)에서 참조.
              const { bodyShelfGroups, freezerGroups, totalOverflow } = fridgeShelfDistribution;

              // 렌더 helper — 그룹 chip (대표 항목 + ×N 배지)
              const renderGroup = (group: FridgeItem[], compact = false) => {
                const repr = group[0]; // 가장 임박한 항목
                const groupCount = group.length;
                const { border, labelKind, labelN, isDanger } = freshState(repr);
                const label = formatFreshLabel(labelKind, labelN, t);
                const emoji = getEmoji(repr.ingredient_name, repr.category);
                const displayName = getDisplayName(repr);
                const handleClick = (e: React.MouseEvent) => {
                  if (groupCount > 1) {
                    e.stopPropagation();
                    setGroupSheet({ name: displayName, items: group });
                  } else {
                    handleChipClickWithLongPress(repr, e);
                  }
                };
                return (
                  <div key={repr.id} className="relative pointer-events-auto group shrink-0 md:pt-2 md:pr-2 md:-mt-2 md:-mr-2">
                    <button
                      onClick={handleClick}
                      onTouchStart={() => groupCount === 1 && handleChipPressStart(repr)}
                      onTouchEnd={handleChipPressEnd}
                      onTouchMove={handleChipPressEnd}
                      onTouchCancel={handleChipPressEnd}
                      className={`flex items-center gap-0.5 rounded-md border-2 hover:scale-105 active:scale-95 transition-all ${isDanger ? 'animate-pulse bg-red-100/95' : (label ? 'bg-amber-100/95' : 'bg-white/90')} ${compact ? 'px-0.5 py-0.5' : 'px-1 py-0.5'}`}
                      style={{
                        borderColor: border,
                        boxShadow: isDanger ? `0 0 4px ${border}66` : undefined,
                      }}
                      title={`${displayName}${groupCount > 1 ? ` × ${groupCount}` : ''}${label ? ` · ${label}` : ''}`}
                    >
                      <span className={`leading-none ${compact ? 'text-[10px]' : 'text-sm md:text-base'}`}>{emoji}</span>
                      <span className={`font-bold text-gray-800 leading-none truncate ${compact ? 'text-[8px] max-w-[28px]' : 'text-[10px] md:text-[11px] max-w-[80px]'}`}>
                        {displayName}
                      </span>
                      {groupCount > 1 && (
                        <span className={`font-bold leading-none rounded-full bg-gray-800 text-white ${compact ? 'text-[8px] px-0.5' : 'text-[9px] px-1'}`}>
                          ×{groupCount}
                        </span>
                      )}
                      {/* 도어 선반은 공간 타이트 → compact 모드에서는 만료 라벨 숨김(툴팁/시트에서 확인 가능) */}
                      {label && !compact && (
                        <span className="font-bold leading-none text-[10px] md:text-[11px]" style={{ color: border }}>
                          {label}
                        </span>
                      )}
                    </button>
                    {/* 데스크톱 hover 시 우상단 X 버튼 — 그룹 1개일 때만 (다중은 미니 시트에서 개별 삭제) */}
                    {groupCount === 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteFromSheet(repr); }}
                        className="hidden md:flex absolute top-0 right-0 w-4 h-4 items-center justify-center rounded-full bg-error text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity shadow-md ring-2 ring-white"
                        aria-label={`${displayName} ${t.common.delete}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              };

              return (
                <>
                  {/* 본체 선반 4개 (냉장 3 + 냉동 1) — per-shelf +N 제거, 서랍에 통합 */}
                  {SHELVES.map((shelf, idx) => {
                    const list = idx < 3 ? bodyShelfGroups[idx] : freezerGroups;
                    const visible = list.slice(0, shelfMax.body);
                    return (
                      <div
                        key={`body-${idx}`}
                        className="absolute flex flex-wrap items-end justify-center gap-0.5"
                        style={{ left: SHELF_LEFT, width: SHELF_WIDTH, top: shelf.top, height: shelf.height, pointerEvents: 'none' }}
                      >
                        {visible.map(group => renderGroup(group, false))}
                      </div>
                    );
                  })}

                  {/* 도어 선반 데코는 FridgeSVG 내부에 SVG로 직접 렌더됨 (병·카톤 실루엣) */}

                  {/* 전체 재료 목록 + 만료 배너 — 카툰 스타일 대롱대롱 효과.
                      썸택(thumb-tack) → 노끈(rope) → 태그(tag).
                      bold black outline + hard cartoon shadow + 미세 흔들림 애니메이션.
                      비로그인은 데모 재료라 전체 목록 진입 필요성 낮음 + pill과 시각적 겹침 방지로 hide.

                      stack 순서 (위 → 아래):
                      1. 만료 배너 (expiringCount > 0일 때만, 빨강 톤, 펜던트보다 위)
                      2. 펜던트 (재료 목록, cream/wood 톤) */}
                  {isAuthenticated && (
                  <div
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center animate-dangle"
                    style={{ bottom: 'calc(100% - 2px)' }}
                  >
                    {/* 썸택 + 윗 노끈 (배너 위까지) — gradient는 항상 정의돼 있어야 두 SVG가 모두 참조 가능 */}
                    <svg
                      width="44"
                      height={expiringCount > 0 ? 18 : 32}
                      viewBox={`0 0 44 ${expiringCount > 0 ? 18 : 32}`}
                      style={{ overflow: 'visible', display: 'block' }}
                      aria-hidden="true"
                    >
                      <defs>
                        <radialGradient id="dangleTackG" cx="32%" cy="28%" r="72%">
                          <stop offset="0%" stopColor="#fff5c0"/>
                          <stop offset="45%" stopColor="#e0a830"/>
                          <stop offset="100%" stopColor="#5a3208"/>
                        </radialGradient>
                        <linearGradient id="dangleRopeG" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6a3a10"/>
                          <stop offset="40%" stopColor="#a8731c"/>
                          <stop offset="100%" stopColor="#5a2e08"/>
                        </linearGradient>
                      </defs>

                      {/* 노끈 (썸택 아래 ~ SVG 끝까지) — 배너 있을 땐 짧게, 없을 땐 풀 길이 */}
                      <line x1="22" y1="9" x2="22" y2={expiringCount > 0 ? 18 : 32} stroke="#000" strokeWidth="4" strokeLinecap="round"/>
                      <line x1="22" y1="9" x2="22" y2={expiringCount > 0 ? 18 : 32} stroke="url(#dangleRopeG)" strokeWidth="2.4" strokeLinecap="round"/>
                      {/* 꼬임 detail (긴 노끈일 때만 자연스러움) */}
                      {expiringCount === 0 && (
                        <>
                          <line x1="20.5" y1="13" x2="23.5" y2="15" stroke="rgba(40,20,4,0.55)" strokeWidth="0.7" strokeLinecap="round"/>
                          <line x1="20.5" y1="19" x2="23.5" y2="21" stroke="rgba(40,20,4,0.55)" strokeWidth="0.7" strokeLinecap="round"/>
                          <line x1="20.5" y1="25" x2="23.5" y2="27" stroke="rgba(40,20,4,0.55)" strokeWidth="0.7" strokeLinecap="round"/>
                          <line x1="21.5" y1="12" x2="21.5" y2="30" stroke="rgba(255,235,180,0.45)" strokeWidth="0.6" strokeLinecap="round"/>
                        </>
                      )}

                      {/* 썸택 — 항상 노끈 시작점에 */}
                      <circle cx="22" cy="7" r="7" fill="#000"/>
                      <circle cx="22" cy="7" r="6" fill="url(#dangleTackG)"/>
                      <ellipse cx="19.5" cy="4.5" rx="2.5" ry="1.8" fill="rgba(255,250,220,0.85)"/>
                      <circle cx="22" cy="7" r="1.4" fill="#3a1f08" opacity="0.5"/>
                    </svg>

                    {/* 만료 임박 배너 — 윗 노끈 끝과 아랫 노끈 시작 사이에 매달림. 한 줄에 두 태그 효과. */}
                    {expiringCount > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); track('expiring_banner_click', { expiring_count: expiringCount }); setAllSheetMode('expiring'); }}
                          className="pointer-events-auto flex items-center gap-1 px-3 py-1 rounded-2xl text-[10px] md:text-xs font-extrabold whitespace-nowrap hover:scale-105 active:scale-95 transition-all animate-pulse"
                          style={{
                            background: '#fecaca',
                            color: '#7c2d12',
                            border: '2px solid #000',
                            boxShadow: '0 3px 0 #000, 0 5px 8px rgba(0,0,0,0.3)',
                          }}
                          aria-label={t.home.expiringBannerAria.replace('{count}', String(expiringCount))}
                        >
                          <span>{t.home.expiringBannerLabel.replace('{count}', String(expiringCount))}</span>
                        </button>

                        {/* 아랫 노끈 — 배너 ~ 펜던트 태그 사이 연결. 같은 dangleRopeG 참조(첫 SVG 정의) */}
                        <svg
                          width="44"
                          height="12"
                          viewBox="0 0 44 12"
                          style={{ overflow: 'visible', display: 'block' }}
                          aria-hidden="true"
                        >
                          <line x1="22" y1="0" x2="22" y2="12" stroke="#000" strokeWidth="4" strokeLinecap="round"/>
                          <line x1="22" y1="0" x2="22" y2="12" stroke="url(#dangleRopeG)" strokeWidth="2.4" strokeLinecap="round"/>
                        </svg>
                      </>
                    )}

                    {/* 펜던트 태그 — cream/wood 톤 (빈티지 나무 명패 컨셉). 노끈·썸택 갈색 톤과 일관 + 페이지 솔리드 오렌지 분포 감소.
                        칩 truncate(60→80px 보강 후에도 정확 이름 확인) 동선의 진입점이므로 발견성 약간 강화 — 폰트 size 한 단계 ↑, padding 살짝 ↑, hover scale 더 강. */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); track('pendant_click', { items_count: items.length, overflow: totalOverflow }); setAllSheetMode('all'); }}
                      className="pointer-events-auto -mt-[3px] flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[11px] md:text-sm font-extrabold whitespace-nowrap hover:scale-110 active:scale-95 transition-all"
                      style={{
                        background: '#f4d8a0',
                        color: '#5a3208',
                        border: '2px solid #000',
                        boxShadow: '0 3px 0 #000, 0 6px 10px rgba(0,0,0,0.35)',
                      }}
                      title={t.home.ingredientList}
                      aria-label={t.home.ingredientList}
                    >
                      <span className="text-base md:text-lg leading-none">📋</span>
                      <span>{totalOverflow > 0 ? t.home.ingredientListMore.replace('{count}', String(totalOverflow)) : t.home.ingredientList}</span>
                    </button>
                  </div>
                  )}
                </>
              );
            })()}
          </div>

        </div>

      </div>

      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-background-secondary border border-accent-warm/30 text-sm shadow-2xl flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      {/* 전체 재료 보기 시트 — 두 모드:
          - 'all': 펜던트 탭 → 전체 재료 그룹별 표시
          - 'expiring': 만료 배너 탭 → 임박 재료만 + 상단 추천 매칭 pill
          chip 탭 시 액션 시트가 위에 겹쳐 열림 (이 시트는 닫지 않음) → 취소하면 다시 이 시트로 복귀. */}
      <FridgeAllSheet
        isOpen={allSheetMode !== null}
        items={items}
        onClose={() => setAllSheetMode(null)}
        onItemClick={(item) => {
          setActionItem(item as FridgeItem);
        }}
        onDelete={(item) => handleDeleteFromSheet(item as FridgeItem)}
        freshState={freshState}
        getEmoji={getEmoji}
        getDisplayName={getDisplayName}
        expiringOnly={allSheetMode === 'expiring'}
        recipeMatch={allSheetMode === 'expiring' ? expiringRecipeMatch : null}
        onCookFromExpiring={allSheetMode === 'expiring' ? handleCookFromExpiring : undefined}
      />

      {/* 재료 액션 시트 — chip 탭 시 1차로 열림 (만들기/수정/삭제) */}
      <IngredientActionSheet
        item={actionItem ? { id: actionItem.id, ingredient_name: actionItem.ingredient_name, emoji: getEmoji(actionItem.ingredient_name, actionItem.category) } : null}
        onClose={() => setActionItem(null)}
        onCook={() => actionItem && handleCook(actionItem)}
        onEdit={() => actionItem && handleEditFromSheet(actionItem)}
        onDelete={() => actionItem && handleDeleteFromSheet(actionItem)}
      />

      {/* 재료 상세 수정 모달 */}
      {detailItem && (
        <IngredientDetailModal
          ingredient={{
            id: detailItem.id,
            ingredient_name: detailItem.ingredient_name,
            category: detailItem.category,
            quantity: detailItem.quantity ?? null,
            unit: detailItem.unit ?? null,
            purchase_date: detailItem.purchase_date ?? null,
            expiry_date: detailItem.expiry_date ?? null,
            storage_location: detailItem.storage_location ?? null,
            notes: detailItem.notes ?? null,
            expiry_alert: detailItem.expiry_alert ?? false,
          }}
          isOpen={!!detailItem}
          onClose={() => setDetailItem(null)}
          onUpdate={updateIngredient}
          onDelete={(ing) => handleDeleteFromSheet(ing as FridgeItem)}
        />
      )}

      {/* 재료 추가 모달 */}
      <AddIngredientModal
        isOpen={addModalLocation !== null}
        location={addModalLocation}
        onClose={() => setAddModalLocation(null)}
        onAddIngredient={addIngredientFromModal}
      />

      {/* 비로그인 + 버튼 → 가입 유도 시트 */}
      <AuthPromptSheet
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
      />

      {/* 같은 이름 그룹 chip 클릭 시 미니 시트 — 그룹 내 항목 개별 선택 (만료일·구매일·수량 인라인 노출) */}
      {groupSheet && (
        <div className="fixed inset-0 z-[75] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setGroupSheet(null)} />
          <div className="relative w-full md:max-w-sm bg-background-secondary rounded-t-2xl md:rounded-2xl border-t md:border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[70dvh]">
            <div className="md:hidden flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {groupSheet.name} <span className="text-text-muted font-normal">×{groupSheet.items.length}</span>
              </h3>
              <button
                onClick={() => setGroupSheet(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-all"
                aria-label={t.common.close}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {groupSheet.items.map(item => {
                const { border, labelKind, labelN } = freshState(item);
                const label = formatFreshLabel(labelKind, labelN, t);
                return (
                  <button
                    key={item.id}
                    onClick={() => { setGroupSheet(null); handleChipClickWithLongPress(item, { stopPropagation() {}, preventDefault() {} } as React.MouseEvent); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background-tertiary hover:bg-white/10 transition-colors text-left"
                  >
                    <span className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: border }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">
                        {item.quantity != null ? `${item.quantity}${item.unit ?? ''}` : t.ingredient.qtyUnknown}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">
                        {item.purchase_date ? `${t.ingredient.purchasedShort} ${item.purchase_date.slice(5)}` : ''}
                        {item.expiry_date ? ` · ${t.ingredient.expiryShort} ${item.expiry_date.slice(5)}` : ''}
                        {item.storage_location ? ` · ${item.storage_location}` : ''}
                        {label ? ` · ${label}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}



      <BottomNav />

      {/* 모바일 검색 오버레이 (배경 블러 + 아이콘에서 나오는 애니메이션) */}
      <div
        onClick={() => setShowMobileSearch(false)}
        aria-hidden={!showMobileSearch}
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ease-out ${
          showMobileSearch
            ? 'opacity-100 bg-black/50 backdrop-blur-md pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        aria-hidden={!showMobileSearch}
        className={`fixed left-0 right-0 top-20 px-4 z-50 md:hidden origin-bottom transition-all duration-[450ms] ease-out ${
          showMobileSearch
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-[20vh] scale-[0.5] pointer-events-none'
        }`}
      >
        <div className="max-w-md mx-auto space-y-2">
          {/* 페이지 빠른 이동 — 홈에서 레시피·팁 페이지로 바로 이동 */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/recipes"
              onClick={() => setShowMobileSearch(false)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-background-secondary border border-white/10 shadow-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors active:scale-95"
            >
              <span>📋</span><span>{t.home.navRecipes}</span>
            </Link>
            <Link
              href="/tip"
              onClick={() => setShowMobileSearch(false)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-background-secondary border border-white/10 shadow-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors active:scale-95"
            >
              <span>💡</span><span>{t.home.navTips}</span>
            </Link>
          </div>
          {/* 검색창 */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar autoFocus={showMobileSearch} />
            </div>
            <button
              onClick={() => setShowMobileSearch(false)}
              aria-label={t.common.closeSearch}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-background-secondary border border-white/10 shadow-lg text-text-primary hover:bg-background-tertiary transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


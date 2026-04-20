'use client';

/**
 * 낼름 — 카툰 양문형 냉장고 v5
 *
 * 레퍼런스: 따뜻한 갈색 카툰 일러스트 양문형 냉장고.
 * 문이 기본 열려있고 재료가 선반에 바로 보임.
 * CSS로 양문 V자 + 선반 + 재료 칩 구현.
 */

import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useToast } from '@/lib/toast/context';
import { createClient } from '@/lib/supabase/client';
import { QUICK_ADD } from './_home/quickAddList';
import FridgeSVG from './_home/FridgeSVG';
import KitchenSVG from './_home/KitchenSVG';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import BottomNav from '@/components/BottomNav';
import IngredientDetailModal from '@/components/Ingredients/IngredientDetailModal';
import AddIngredientModal from '@/components/Ingredients/AddIngredientModal';
import IngredientActionSheet from '@/components/Ingredients/IngredientActionSheet';
import FridgeAllSheet from '@/components/Ingredients/FridgeAllSheet';
import { isFridgeDoorItem } from '@/lib/ingredients/storageMap';
import { useRouter } from 'next/navigation';

const OnboardingWizard = dynamicImport(() => import('@/components/Onboarding/OnboardingWizard'), {
  ssr: false,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type FridgeItem = {
  id: string;
  ingredient_name: string;
  category: string;
  expiry_date: string | null;
  storage_location: string | null;
  quantity?: number | null;
  unit?: string | null;
  purchase_date?: string | null;
  notes?: string | null;
  expiry_alert?: boolean;
};

type IngredientFormData = {
  ingredient_name: string;
  category: string;
  quantity?: number | null;
  unit?: string | null;
  purchase_date?: string | null;
  expiry_date?: string | null;
  storage_location?: string | null;
  notes?: string | null;
  expiry_alert?: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntilExpiry(d: string | null): number {
  if (!d) return 99;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp = new Date(d); exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** 구매 후 경과일. purchase_date 없으면 음수(미확인) 반환. */
function daysSincePurchase(d: string | null | undefined): number {
  if (!d) return -1;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const pur = new Date(d); pur.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - pur.getTime()) / (1000 * 60 * 60 * 24));
}
function addDaysISO(d: number): string {
  const date = new Date(); date.setDate(date.getDate() + d);
  return date.toISOString().slice(0, 10);
}
function getEmoji(name: string, category: string): string {
  const found = QUICK_ADD.find(q => q.name === name || name.includes(q.name) || q.name.includes(name));
  if (found) return found.emoji;
  return ({ veggie:'🥬', meat:'🥩', seafood:'🐟', dairy:'🥛', grain:'🌾', seasoning:'🧂' } as Record<string,string>)[category] ?? '📦';
}

/**
 * 재료의 신선도 상태를 결정.
 * - expiry_date가 있으면 그걸 기준으로 D-N 계산 (정확한 만료일)
 * - 없으면 purchase_date 기준 "묵힌 기간" fallback (추정)
 *     3-6일: 주의(노랑), 7일+: 위험(빨강)
 * - 둘 다 없으면: 중립(경고 없음)
 */
function freshState(item: Pick<FridgeItem, 'expiry_date' | 'purchase_date'>): {
  border: string;
  label: string;
  isDanger: boolean;
} {
  const days = daysUntilExpiry(item.expiry_date);
  if (item.expiry_date) {
    if (days <= 0) return { border: '#991b1b', label: '만료', isDanger: true };
    if (days <= 3) return { border: '#dc2626', label: `D-${days}`, isDanger: true };
    if (days <= 7) return { border: '#d97706', label: `D-${days}`, isDanger: false };
    return { border: '#4d7c0f', label: '', isDanger: false };
  }
  const since = daysSincePurchase(item.purchase_date);
  if (since >= 7) return { border: '#dc2626', label: `${since}일째`, isDanger: true };
  if (since >= 3) return { border: '#d97706', label: `${since}일째`, isDanger: false };
  // 방금 샀거나 purchase_date 없음 — 경고 없음, 기본 테두리
  return { border: '#4d7c0f', label: '', isDanger: false };
}

/** 긴급도 스코어 — 작을수록 우선(만료 임박). 선반 정렬에 사용. */
function urgencyScore(item: FridgeItem): number {
  if (item.expiry_date) return daysUntilExpiry(item.expiry_date);
  const since = daysSincePurchase(item.purchase_date);
  if (since < 0) return 99; // purchase_date 없음 → 맨 뒤
  // null expiry + 7일 지나면 "실질적 만료"로 간주해 상위로
  return Math.max(-1, 7 - since);
}

/**
 * FridgeSVG 내부 선반 좌표 매핑 (viewBox: 30 -5 540 670 기준).
 * 실제 선반 rail y좌표를 읽어 percentage로 변환.
 * - 냉장 3선반: y=35~119 / 135~213 / 230~319
 * - 냉동 1선반: y=420~525 (서랍 위)
 * - x는 모두 184~416 (width 232)
 */
// FridgeSVG 본체 선반 좌표 (viewBox="30 -5 540 670", 본체 interior x=184~416)
// 실측:
//   냉장 선반1 rail top: y=119   → chip 바닥 y=118, 선반 위 공간 y≈60~118
//   냉장 선반2 rail top: y=214   → chip 바닥 y=213, 선반 위 공간 y≈140~213
//   냉장 서랍 top:        y=320   → chip 바닥 y=319, 선반 위 공간 y≈240~319
//   냉동 서랍 top:        y=526   → chip 바닥 y=525, 선반 위 공간 y≈420~525
// viewBox height=670(y=-5~665), width=540(x=30~570). (y - (-5)) / 670 = percent.
const SHELF_LEFT = '28.5%';   // (184-30)/540 = 28.5%
const SHELF_WIDTH = '43%';    // 232/540 = 43%
const SHELVES: { top: string; height: string; kind: 'fridge' | 'freezer' }[] = [
  { top: '9.7%',  height: '8.7%',  kind: 'fridge' },   // 냉장 top    (y=60~118)
  { top: '21.6%', height: '10.9%', kind: 'fridge' },   // 냉장 middle (y=140~213)
  { top: '36.6%', height: '11.8%', kind: 'fridge' },   // 냉장 bottom (y=240~319)
  { top: '63.4%', height: '15.7%', kind: 'freezer' },  // 냉동 top    (y=420~525)
];
// 이름 전체 노출 시 한 chip이 ~90px → 반응형으로 viewport 기반 4~8.
// getShelfMax(viewportWidth) 참고.

// 냉장고 도어 선반 chip 좌표 (FridgeSVG 도어 내부).
// 좌측/우측 도어 각 2개 (상단·중단). 하단은 drawer 근처라 생략.
const DOOR_SHELVES: { side: 'left' | 'right'; left: string; width: string; top: string; height: string }[] = [
  { side: 'left',  left: '7%',  width: '16%', top: '11%', height: '6%' },
  { side: 'left',  left: '7%',  width: '16%', top: '23%', height: '6%' },
  { side: 'right', left: '77%', width: '16%', top: '11%', height: '6%' },
  { side: 'right', left: '77%', width: '16%', top: '23%', height: '6%' },
];
const MAX_DOOR_CHIPS_PER_SHELF = 2;

// KitchenSVG v14 (3x2 그리드 셀, 다크 플럼 인테리어) chip 좌표 (viewBox="0 0 660 220")
// 본체 interior: x=166~494 (width 328), y=78~194, 중간 선반 y=133~138
// 상단 row cell: y=88~130 (높이 42) / 하단 row cell: y=140~190 (높이 50)
const PANTRY_SHELVES: { top: string; height: string }[] = [
  { top: '40%',   height: '19%' },   // row 1 (y=88~130)
  { top: '63.6%', height: '22.7%' }, // row 2 (y=140~190)
];
const PANTRY_LEFT = '25.8%';
const PANTRY_WIDTH = '48.5%';
// MAX_PANTRY_PER_SHELF는 컴포넌트 내 shelfMax.pantry(반응형)로 대체됨

// DEMO 재료 — 비로그인 체험용. 목표:
//   1. 3가지 상태 섞어서 UX 보여줌: (a) expiry 임박, (b) 방금 구매, (c) 오래 묵힘
//   2. 실제 DB 레시피 여러 개와 100% 매칭 + 거의 가능 매칭 확보 (유저가 "바로 가능" 결과 확인 가능)
//      - 바로 가능: 고추장아찌, 새우죽, 당근잎 감자전 등
//      - 거의 가능: 김치찌개, 수박즙돼지목심구이 등
const DEMO: FridgeItem[] = [
  // === 냉장 (8) ===
  // (a) expiry 임박 — 위험/경고 chip 표시
  { id:'d1', ingredient_name:'돼지고기', category:'meat',    expiry_date: addDaysISO(1),  storage_location:'냉장', purchase_date: addDaysISO(-3) },
  { id:'d2', ingredient_name:'두부',     category:'other',   expiry_date: addDaysISO(2),  storage_location:'냉장', purchase_date: addDaysISO(-3) },
  { id:'d3', ingredient_name:'시금치',   category:'veggie',  expiry_date: addDaysISO(2),  storage_location:'냉장', purchase_date: addDaysISO(-5) },
  // (b) expiry null + 최근 구매 — 신선, 경고 없음
  { id:'d4', ingredient_name:'계란',     category:'dairy',   expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-2) },
  { id:'d5', ingredient_name:'마늘',     category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  { id:'d6', ingredient_name:'김치',     category:'other',   expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-2) },
  { id:'d7', ingredient_name:'고추',     category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  // (c) expiry null + 오래 묵힘 — purchase_date fallback 경고
  { id:'d8', ingredient_name:'당근',     category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-5) },
  // === 냉동 (2) ===
  { id:'d9',  ingredient_name:'새우',    category:'seafood', expiry_date: null,           storage_location:'냉동', purchase_date: addDaysISO(-4) },
  { id:'d10', ingredient_name:'만두',    category:'grain',   expiry_date: null,           storage_location:'냉동', purchase_date: addDaysISO(-3) },
  // === 상온 (10) ===
  { id:'d11', ingredient_name:'양파',    category:'veggie',    expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-1) },
  { id:'d12', ingredient_name:'감자',    category:'veggie',    expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-3) },
  { id:'d13', ingredient_name:'쌀',      category:'grain',     expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-10) },
  { id:'d14', ingredient_name:'간장',    category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-10) },
  { id:'d15', ingredient_name:'참기름',  category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-15) },
  { id:'d16', ingredient_name:'식초',    category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-20) },
  { id:'d17', ingredient_name:'설탕',    category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-30) },
  { id:'d18', ingredient_name:'소금',    category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-30) },
  { id:'d19', ingredient_name:'물',      category:'other',     expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(0) },
  { id:'d20', ingredient_name:'부침가루', category:'grain',     expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-15) },
];

// ── Main ──────────────────────────────────────────────────────────────────────

interface HomeClientProps {
  /** SSR에서 확인한 로그인 상태 — useAuth 초기 undefined 단계를 건너뛰고 hero/waitlist를 즉시 올바르게 렌더. */
  isAuthenticated: boolean;
  /** SSR에서 fetch한 profiles.username — 첫 렌더에서 임시 username 배너를 즉시 판정. */
  initialUsername: string | null;
  /** SSR에서 fetch한 profiles.onboarding_step — 미완료 유저 식별용(향후 배너 확장 여지). */
  initialOnboardingStep: number | null;
}

export default function HomeClient({
  isAuthenticated,
  initialUsername,
  initialOnboardingStep: _initialOnboardingStep,
}: HomeClientProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const { success: toastSuccess } = useToast();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // 반응형 MAX — viewport width 기반. 모바일 4, 태블릿 6, 데스크톱 8.
  // 선반 폭이 비율로 스케일되므로 chip 개수도 비례 증가 가능.
  const [shelfMax, setShelfMax] = useState({ body: 4, pantry: 3, door: 2 });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setShelfMax({ body: 8, pantry: 6, door: 3 });
      else if (w >= 768) setShelfMax({ body: 6, pantry: 5, door: 3 });
      else if (w >= 640) setShelfMax({ body: 5, pantry: 4, door: 2 });
      else setShelfMax({ body: 4, pantry: 3, door: 2 });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // +N 탭 시 열리는 전체 재료 보기 시트
  const [showAllSheet, setShowAllSheet] = useState(false);

  // DEMO 아이템 고유 id 생성용 카운터 (Date.now() 대신 — React 순수성 규칙 준수)
  const demoIdRef = useRef(0);

  // 추가 모달 (사진 업로드 포함) — FAB/빈 선반/overflow 탭 시 열림
  const [addModalLocation, setAddModalLocation] = useState<string | null>(null);

  // 매직 모드: 서버가 auto 판단한 결과를 받아 버블 라벨에 반영.
  // - resolvedMode: 'ready' | 'almost' | 'all' (서버가 최선 선택)
  // - matchingCount: 해당 mode의 레시피 개수
  const [matchingCount, setMatchingCount] = useState<number | null>(null);
  const [resolvedMode, setResolvedMode] = useState<'ready' | 'almost' | 'all' | null>(null);
  const showRecipeBubble = items.length > 0;

  // 온보딩 배너 (임시 username 사용 중인 유저용)
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  // 클라이언트 hydration 후엔 useAuth의 profile을, SSR 초기 HTML에선 initialUsername을 사용.
  const currentUsername = profile?.username ?? initialUsername;
  const hasTempUsername = !!currentUsername && /^user_[a-f0-9]{12}$/.test(currentUsername);

  useEffect(() => {
    if (!user) return;
    if (!hasTempUsername) return;
    const dismissed = localStorage.getItem(`naelum_onboarding_banner_${user.id}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage는 브라우저에서만 읽을 수 있어 render 단계에서 파생 불가
    if (!dismissed) setShowOnboardingBanner(true);
  }, [user, hasTempUsername]);

  // 하단 네비의 검색 아이콘 → 인라인 검색바 토글
  useEffect(() => {
    const handler = () => setShowMobileSearch((prev) => !prev);
    window.addEventListener('toggle-fridge-search', handler);
    return () => window.removeEventListener('toggle-fridge-search', handler);
  }, []);

  // ESC 키로 모바일 검색 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !showMobileSearch) return;
      setShowMobileSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showMobileSearch]);

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

  // 액션 시트: "삭제" → 즉시 state 제거 + undo 토스트 (5초 안에 [실행 취소] 클릭 시 복원).
  // DB 삭제는 토스트 만료 직전 (5.5초)에 비동기 실행 → undo 시 cancel.
  const handleDeleteFromSheet = (item: FridgeItem) => {
    const indexBefore = items.findIndex(i => i.id === item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    setActionItem(null);

    let cancelled = false;
    const isDemo = !user || item.id.startsWith('d');
    const dbTimer = setTimeout(async () => {
      if (cancelled) return;
      if (!isDemo) {
        const client = createClient();
        await client.from('user_ingredients').delete().eq('id', item.id);
        window.dispatchEvent(new Event('fridge-updated'));
      }
      // DEMO는 state만 변경했으므로 별도 작업 없음
    }, 5500);

    toastSuccess(`🗑 ${item.ingredient_name} 삭제됨`, {
      action: {
        label: '실행 취소',
        onClick: () => {
          cancelled = true;
          clearTimeout(dbTimer);
          // 원래 위치에 복원
          setItems(prev => {
            const next = [...prev];
            const safeIdx = Math.min(Math.max(0, indexBefore), next.length);
            next.splice(safeIdx, 0, item);
            return next;
          });
        },
      },
      duration: 5500,
    });
  };

  const fetchItems = useCallback(async () => {
    if (!user) {
      // 비로그인 체험 모드: localStorage에 저장된 데모 재료가 있으면 복원, 없으면 DEMO 기본값
      try {
        const saved = localStorage.getItem('naelum_demo_items');
        if (saved) {
          const parsed = JSON.parse(saved) as FridgeItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed);
            setLoading(false);
            return;
          }
        }
      } catch { /* localStorage 실패 시 DEMO fallback */ }
      setItems(DEMO);
      setLoading(false);
      return;
    }
    const client = createClient();
    const { data } = await client
      .from('user_ingredients')
      .select('id, ingredient_name, category, expiry_date, storage_location, quantity, unit, purchase_date, notes, expiry_alert')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true, nullsFirst: false });
    setItems((data ?? []) as FridgeItem[]);
    setLoading(false);
  }, [user]);

  // 비로그인 체험 모드 — items 변경 시 localStorage에 저장
  useEffect(() => {
    if (user || loading) return;
    try { localStorage.setItem('naelum_demo_items', JSON.stringify(items)); } catch { /* 용량 초과 등 무시 */ }
  }, [user, loading, items]);

  useEffect(() => {
    if (authLoading) return;
    queueMicrotask(() => { fetchItems(); });
  }, [authLoading, fetchItems]);

  // 외부에서 냉장고 변경 이벤트 발생 시 재fetch
  // (예: ShoppingCartDropdown에서 "냉장고에 추가" 후, 레시피 → 재료 추가 등).
  useEffect(() => {
    const handler = () => { fetchItems(); };
    window.addEventListener('fridge-updated', handler);
    return () => window.removeEventListener('fridge-updated', handler);
  }, [fetchItems]);

  // 매칭 레시피 fetch — mode=auto로 서버가 best mode 자동 선택.
  // 응답의 mode 필드로 버블 라벨 결정 (🔥 바로 가능 / 🛒 거의 가능 / 📋 추천).
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    const base = '/api/recommendations?type=ingredients&limit=30&mode=auto';
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
    return () => { cancelled = true; };
  }, [isAuthenticated, items]);

  // 문 애니메이션 제거 — SVG 기본 디자인 우선

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);
  const showToast = (msg: string) => setToast(msg);

  // IngredientDetailModal onUpdate
  const updateIngredient = async (id: string, formData: IngredientFormData) => {
    if (id.startsWith('d') || id.startsWith('demo')) {
      setItems(prev => prev.map(i => (i.id === id ? { ...i, ...formData } : i)));
      setDetailItem(null);
      showToast('✅ 수정 완료');
      return;
    }
    const client = createClient();
    await client.from('user_ingredients').update({ ...formData }).eq('id', id);
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...formData } : i)));
    setDetailItem(null);
    showToast('✅ 수정 완료');
    window.dispatchEvent(new Event('fridge-updated'));
  };

  // AddIngredientModal onAddIngredient
  const addIngredientFromModal = async (formData: IngredientFormData) => {
    if (!user) {
      const newItem: FridgeItem = {
        id: `d${++demoIdRef.current}`,
        ingredient_name: formData.ingredient_name,
        category: formData.category,
        expiry_date: formData.expiry_date ?? null,
        storage_location: formData.storage_location ?? null,
        quantity: formData.quantity ?? null,
        unit: formData.unit ?? null,
        purchase_date: formData.purchase_date ?? null,
        notes: formData.notes ?? null,
        expiry_alert: formData.expiry_alert ?? false,
      };
      setItems(prev => [...prev, newItem]);
      setAddModalLocation(null);
      showToast('👅 추가! 💡 로그인하면 계정에 영구 저장');
      return;
    }
    const client = createClient();
    const { data } = await client
      .from('user_ingredients')
      .insert({ ...formData, user_id: user.id })
      .select()
      .single();
    if (data) setItems(prev => [...prev, data as FridgeItem]);
    setAddModalLocation(null);
    showToast('👅 추가!');
    window.dispatchEvent(new Event('fridge-updated'));
  };


  return (
    <div className="min-h-dvh bg-background-primary text-text-primary flex flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0 overflow-hidden md:overflow-visible overscroll-y-none">
      <Header />
      <div className="h-14 md:h-20 flex-shrink-0" />

      {/* 온보딩 미완료 / 임시 유저명 배너 — 그라디언트 + 아이콘 + pill CTA */}
      {showOnboardingBanner && (
        <div className="sticky top-16 md:top-[68px] z-30 w-full border-b border-accent-warm/15 bg-gradient-to-r from-accent-warm/15 via-accent-warm/8 to-accent-warm/15 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="flex-shrink-0 text-base leading-none" aria-hidden="true">✨</span>
              <p className="text-[13px] md:text-sm text-text-primary font-medium truncate">
                나의 프로필 완성하기
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowOnboardingModal(true)}
                className="px-3 py-1.5 rounded-full bg-accent-warm hover:bg-accent-hover text-background-primary text-xs font-bold active:scale-95 transition-all whitespace-nowrap shadow-sm shadow-accent-warm/30"
              >
                완성하기
              </button>
              <button
                onClick={() => {
                  if (user) localStorage.setItem(`naelum_onboarding_banner_${user.id}`, '1');
                  setShowOnboardingBanner(false);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
                aria-label="닫기"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          }}
        />
      )}

      <div className="px-4 pt-8 md:pt-10 pb-3 hidden md:flex justify-center">
        <SearchBar className="w-full max-w-md" />
      </div>

      {/* 레이아웃: justify-end로 콘텐츠를 하단에 몰아붙여 냉장고가 바텀 네비 살짝 위에 위치하게. */}
      <div className="flex-1 flex flex-col items-center justify-end gap-2 md:gap-6 md:px-12 pb-0 md:pb-8">
        {/* KitchenSVG — 상온 재료 선반장 (chip overlay).
            빈 영역 탭 → 상온 재료 추가 모달, chip 탭 → 해당 재료 상세 수정 */}
        <div className="relative w-full max-w-[420px] sm:max-w-[480px] md:max-w-[560px] lg:max-w-[640px] mx-auto">
          <KitchenSVG />
          {/* 상온 영역 전체 탭 → 재료 추가 기능 제거. chip 옆 misclick으로 실수 방지.
              추가는 FAB(+) 또는 overflow(+N) 버튼으로만 가능. */}
          {/* 상온 chip overlay — 2단 선반에 분배해 선반 위에 놓인 것처럼.
              정확한 y좌표는 PANTRY_SHELVES 참고. 선반 x 영역은 SVG x=40~620 기준 (6%~94%). */}
          {(() => {
            // '상온' + 기존 DB에 남아있을 수 있는 '기타' 도 같이 표시 (기타는 이제 사용 안 함)
            const pantry = [...items]
              .filter(i => i.storage_location === '상온' || i.storage_location === '기타')
              .sort((a, b) => urgencyScore(a) - urgencyScore(b));
            const shelfItems: FridgeItem[][] = [[], []];
            pantry.forEach((it, i) => {
              const idx = Math.min(Math.floor(i / shelfMax.pantry), 1);
              shelfItems[idx].push(it);
            });
            return (
              <div className="absolute inset-0 pointer-events-none z-20">
                {PANTRY_SHELVES.map((shelf, idx) => {
                  const list = shelfItems[idx];
                  const visible = list.slice(0, shelfMax.pantry);
                  const overflow = list.length - visible.length;
                  return (
                    <div
                      key={idx}
                      className="absolute flex items-end justify-center gap-0.5 flex-wrap"
                      style={{ left: PANTRY_LEFT, width: PANTRY_WIDTH, top: shelf.top, height: shelf.height }}
                    >
                      {visible.map(item => {
                        const { border, label, isDanger } = freshState(item);
                        const emoji = getEmoji(item.ingredient_name, item.category);
                        return (
                          <div key={item.id} className="relative pointer-events-auto group shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActionItem(item); }}
                              className={`flex items-center gap-1 px-1.5 py-1 rounded-md bg-white/95 border-2 hover:scale-105 active:scale-95 transition-all ${isDanger ? 'animate-pulse' : ''}`}
                              style={{ borderColor: border, boxShadow: isDanger ? `0 0 4px ${border}66` : '0 1px 2px rgba(0,0,0,0.25)' }}
                              title={`${item.ingredient_name}${label ? ` · ${label}` : ''}`}
                            >
                              <span className="text-base md:text-lg leading-none">{emoji}</span>
                              <span className="text-[11px] md:text-xs font-bold text-gray-800 leading-none max-w-[72px] truncate">
                                {item.ingredient_name}
                              </span>
                              {label && (
                                <span className="text-[9px] md:text-[10px] font-bold leading-none" style={{ color: border }}>{label}</span>
                              )}
                            </button>
                            {/* 데스크톱 hover X 삭제 */}
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteFromSheet(item); }}
                              className="hidden md:flex absolute top-0 right-0 w-4 h-4 items-center justify-center rounded-full bg-error text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md ring-2 ring-white"
                              aria-label={`${item.ingredient_name} 삭제`}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                      {overflow > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowAllSheet(true); }}
                          className="pointer-events-auto flex items-center px-2 py-1 rounded-md bg-black/60 text-white text-[11px] font-bold shrink-0 hover:bg-black/80 transition-colors"
                          title={`${overflow}개 더 보기`}
                        >
                          +{overflow}
                        </button>
                      )}
                      {/* 빈 상온 선반 — 탭해서 추가 안내 제거됨. FAB(+)로 추가. */}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* 홈 냉장고 — 모달 없이 직접 인터랙션. 선반에 재료 chip 오버레이.
            냉장 선반 3개: storage_location이 '냉동'이 아닌 재료 전부 긴급도순 분배
            냉동 선반 1개: storage_location === '냉동'
            chip 탭 → 상세 수정 모달, 빈 선반 탭 → 재료 추가 모달

            모바일: w-full + max-h(viewport 기준) → 비율 유지하며 최대한 화면 채움
            데스크톱: max-w 고정, aspect가 height 결정 */}
        {/* maxHeight: header(56) + 찬장(~130~140) + gap(8) + BottomNav(56) ≈ 250.
            주요 기종(iPhone 12+)에서 스크롤 없이 fit. SE는 약간의 스크롤 허용. */}
        <div className="relative w-full md:max-w-[560px] lg:max-w-[640px] mx-auto aspect-[540/670]"
          style={{ maxHeight: 'calc(100dvh - 250px - env(safe-area-inset-bottom))' }}>
          <FridgeSVG />

          {/* FAB(+) 재료 추가 — 왼쪽 냉동고 도어 내부 상단 (도어 선반 바로 위). y=63% 영역.
              'auto' 센티넬 = 모달이 "재료 추가"로 generic 타이틀 표시 (폼 기본 동작=자동 분류와 일치). */}
          <button
            onClick={() => setAddModalLocation('auto')}
            aria-label="재료 추가"
            className="absolute top-[63%] left-[8%] -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full bg-accent-warm hover:bg-accent-hover shadow-lg shadow-accent-warm/40 text-background-primary flex items-center justify-center text-xl font-bold transition-all active:scale-95"
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
            // 라벨 결정
            let icon = '💡';
            let label = '레시피 찾기';
            if (matchingCount !== null && matchingCount > 0 && resolvedMode) {
              const countStr = matchingCount >= 30 ? '30+' : String(matchingCount);
              if (resolvedMode === 'ready') { icon = '🔥'; label = `바로 가능 ${countStr}개`; }
              else if (resolvedMode === 'almost') { icon = '🛒'; label = `거의 가능 ${countStr}개`; }
              else { icon = '📋'; label = `레시피 ${countStr}개`; }
            }
            return (
              <Link
                href={href}
                className="absolute top-[63%] right-[4%] -translate-y-1/2 z-20 flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-accent-warm text-background-primary text-[11px] md:text-sm font-bold shadow-lg shadow-accent-warm/50 hover:bg-accent-hover hover:scale-105 active:scale-95 transition-transform whitespace-nowrap"
                style={{ animation: 'naelum-bubble-pulse 2.4s ease-in-out infinite' }}
                aria-label={`${label} — 레시피 보기`}
              >
                <span className="text-sm md:text-base leading-none">{icon}</span>
                <span>{label}</span>
                <span className="leading-none">→</span>
              </Link>
            );
          })()}

          {/* 선반 overlay — 본체 선반(3단 냉장 + 1단 냉동) + 도어 선반(좌/우 각 2단) */}
          <div className="absolute inset-0 pointer-events-none">
            {(() => {
              // 냉장 재료를 본체 vs 도어로 분류 (도어: 계란·소스·음료 등 isFridgeDoorItem)
              const allFridge = items.filter(i => i.storage_location === '냉장' || !i.storage_location);
              const bodyFridge = allFridge.filter(i => !isFridgeDoorItem(i.ingredient_name)).sort((a, b) => urgencyScore(a) - urgencyScore(b));
              const doorFridge = allFridge.filter(i => isFridgeDoorItem(i.ingredient_name)).sort((a, b) => urgencyScore(a) - urgencyScore(b));
              const freezerItems = [...items].filter(i => i.storage_location === '냉동').sort((a, b) => urgencyScore(a) - urgencyScore(b));

              // 본체 선반 3단 분배
              const bodyShelfItems: FridgeItem[][] = [[], [], []];
              bodyFridge.forEach((it, i) => {
                const shelfIdx = Math.min(Math.floor(i / shelfMax.body), 2);
                bodyShelfItems[shelfIdx].push(it);
              });

              // 도어 선반 4개에 도어 아이템 분배
              const doorShelfItems: FridgeItem[][] = [[], [], [], []];
              doorFridge.forEach((it, i) => {
                const idx = Math.min(Math.floor(i / shelfMax.door), 3);
                doorShelfItems[idx].push(it);
              });

              // 렌더 helper — chip 버튼 하나
              const renderChip = (item: FridgeItem, compact = false) => {
                const { border, label, isDanger } = freshState(item);
                const emoji = getEmoji(item.ingredient_name, item.category);
                return (
                  <div key={item.id} className="relative pointer-events-auto group shrink-0 md:pt-2 md:pr-2 md:-mt-2 md:-mr-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActionItem(item); }}
                      className={`flex items-center gap-0.5 rounded-md bg-white/90 border-2 hover:scale-105 active:scale-95 transition-all ${isDanger ? 'animate-pulse' : ''} ${compact ? 'px-0.5 py-0.5' : 'px-1 py-0.5'}`}
                      style={{
                        borderColor: border,
                        boxShadow: isDanger ? `0 0 4px ${border}66` : undefined,
                      }}
                      title={`${item.ingredient_name}${label ? ` · ${label}` : ''}`}
                    >
                      <span className={`leading-none ${compact ? 'text-xs' : 'text-sm md:text-base'}`}>{emoji}</span>
                      <span className={`font-bold text-gray-800 leading-none truncate ${compact ? 'text-[8px] max-w-[40px]' : 'text-[9px] md:text-[10px] max-w-[60px]'}`}>
                        {item.ingredient_name}
                      </span>
                      {label && (
                        <span className={`font-bold leading-none ${compact ? 'text-[7px]' : 'text-[8px] md:text-[9px]'}`} style={{ color: border }}>
                          {label}
                        </span>
                      )}
                    </button>
                    {/* 데스크톱 hover 시 우상단 X 버튼 — 빠른 삭제 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteFromSheet(item); }}
                      className="hidden md:flex absolute top-0 right-0 w-4 h-4 items-center justify-center rounded-full bg-error text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md ring-2 ring-white"
                      aria-label={`${item.ingredient_name} 삭제`}
                    >
                      ✕
                    </button>
                  </div>
                );
              };

              // 전체 오버플로우 합계 — 서랍 영역에 통합 표시
              let totalOverflow = 0;
              bodyShelfItems.forEach(list => {
                if (list.length > shelfMax.body) totalOverflow += list.length - shelfMax.body;
              });
              if (freezerItems.length > shelfMax.body) totalOverflow += freezerItems.length - shelfMax.body;
              doorShelfItems.forEach(list => {
                if (list.length > shelfMax.door) totalOverflow += list.length - shelfMax.door;
              });

              return (
                <>
                  {/* 본체 선반 4개 (냉장 3 + 냉동 1) — per-shelf +N 제거, 서랍에 통합 */}
                  {SHELVES.map((shelf, idx) => {
                    const list = idx < 3 ? bodyShelfItems[idx] : freezerItems;
                    const visible = list.slice(0, shelfMax.body);
                    return (
                      <div
                        key={`body-${idx}`}
                        className="absolute flex flex-wrap items-end justify-center gap-0.5"
                        style={{ left: SHELF_LEFT, width: SHELF_WIDTH, top: shelf.top, height: shelf.height, pointerEvents: 'none' }}
                      >
                        {visible.map(item => renderChip(item, false))}
                      </div>
                    );
                  })}

                  {/* 도어 선반 4개 (좌·우 각 2개, 소스·음료 전용) */}
                  {DOOR_SHELVES.map((shelf, idx) => {
                    const list = doorShelfItems[idx];
                    const visible = list.slice(0, shelfMax.door);
                    return (
                      <div
                        key={`door-${idx}`}
                        className="absolute flex flex-wrap items-end justify-center gap-0.5"
                        style={{ left: shelf.left, width: shelf.width, top: shelf.top, height: shelf.height, pointerEvents: 'none' }}
                      >
                        {visible.map(item => renderChip(item, true))}
                      </div>
                    );
                  })}

                  {/* 통합 오버플로우 — 냉장 서랍 영역 위에 단일 배지로 표시.
                      각 선반마다 +N 산발 대신, 서랍 = "추가 수납 공간" 메타포 활용.
                      클릭 시 FridgeAllSheet 오픈 → 그룹별 전체 리스트. */}
                  {totalOverflow > 0 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowAllSheet(true); }}
                      className="pointer-events-auto absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent-warm text-background-primary text-[10px] md:text-xs font-bold shadow-lg shadow-accent-warm/50 hover:bg-accent-hover hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                      style={{ top: '54%' }}
                      title="냉장고 안 모든 재료 보기"
                    >
                      <span>📂</span>
                      <span>+{totalOverflow}개 더 보기</span>
                    </button>
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

      {/* 전체 재료 보기 시트 — +N 오버플로우 탭 시 열림.
          chip 탭 시 액션 시트가 위에 겹쳐 열림 (이 시트는 닫지 않음) → 취소하면 다시 이 시트로 복귀. */}
      <FridgeAllSheet
        isOpen={showAllSheet}
        items={items}
        onClose={() => setShowAllSheet(false)}
        onItemClick={(item) => {
          setActionItem(item as FridgeItem);
        }}
        onDelete={(item) => handleDeleteFromSheet(item as FridgeItem)}
        freshState={freshState}
        getEmoji={getEmoji}
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
        />
      )}

      {/* 재료 추가 모달 */}
      <AddIngredientModal
        isOpen={addModalLocation !== null}
        location={addModalLocation}
        onClose={() => setAddModalLocation(null)}
        onAddIngredient={addIngredientFromModal}
      />

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
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <div className="flex-1">
            <SearchBar autoFocus={showMobileSearch} />
          </div>
          <button
            onClick={() => setShowMobileSearch(false)}
            aria-label="검색 닫기"
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-background-secondary border border-white/10 shadow-lg text-text-primary hover:bg-background-tertiary transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}


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
import { useI18n } from '@/lib/i18n/context';
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

// KitchenSVG landscape viewBox="0 -35 640 200" (y: -35~165, x: 0~640)
// 찬장 translate(230) → cabinet x=232~408
// items-end → 칩 바닥이 선반 상면에 닿도록 (top% = (shelfY+35)/200*100, zone는 그 위)
//   좌상단(olive)   visible x=2~232   shelf top y=45  → left=0%  w=36% top=22% h=18%
//   좌하단(terra)   visible x=90~232  shelf top y=130 → left=14% w=22% top=67% h=16% (화분 우측)
//   우상단(mauve)   visible x=408~565 shelf top y=30  → left=64% w=25% top=15% h=18%
//   우하단(slate)   visible x=408~638 shelf top y=120 → left=64% w=36% top=63% h=15%
const PANTRY_SHELVES: { top: string; height: string; left: string; width: string }[] = [
  { left: '0%',  width: '36%', top: '22%', height: '18%' }, // 좌상단 olive
  { left: '14%', width: '22%', top: '67%', height: '16%' }, // 좌하단 terracotta (화분 우측)
  { left: '64%', width: '25%', top: '15%', height: '18%' }, // 우상단 mauve
  { left: '64%', width: '36%', top: '63%', height: '15%' }, // 우하단 slate
];
// MAX_PANTRY_PER_SHELF는 컴포넌트 내 shelfMax.pantry(반응형)로 대체됨

// DEMO 재료 — 비로그인 체험용. 14개로 균형:
//   - 2개 D-day 경고(돼지고기 위험·두부 주의) — 신선도 UX 시연
//   - 나머지 12개는 깨끗한 신선 상태 (첫인상 부담 최소화)
//   - 한국 레시피 필수재료 포함 (김치찌개 등 "바로 가능" 매칭 확보)
const DEMO: FridgeItem[] = [
  // === 냉장 (7) ===
  { id:'d1', ingredient_name:'돼지고기', category:'meat',    expiry_date: addDaysISO(1),  storage_location:'냉장', purchase_date: addDaysISO(-3) },
  { id:'d2', ingredient_name:'두부',     category:'other',   expiry_date: addDaysISO(3),  storage_location:'냉장', purchase_date: addDaysISO(-2) },
  { id:'d3', ingredient_name:'계란',     category:'dairy',   expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  { id:'d4', ingredient_name:'김치',     category:'other',   expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-2) },
  { id:'d5', ingredient_name:'당근',     category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  { id:'d6', ingredient_name:'마늘',     category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  { id:'d7', ingredient_name:'고추',     category:'veggie',  expiry_date: null,           storage_location:'냉장', purchase_date: addDaysISO(-1) },
  // === 냉동 (1) ===
  { id:'d8', ingredient_name:'새우',     category:'seafood', expiry_date: null,           storage_location:'냉동', purchase_date: addDaysISO(-2) },
  // === 상온 (6) ===
  { id:'d9',  ingredient_name:'감자',    category:'veggie',    expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-2) },
  { id:'d10', ingredient_name:'양파',    category:'veggie',    expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-1) },
  { id:'d11', ingredient_name:'쌀',      category:'grain',     expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-1) },
  { id:'d12', ingredient_name:'부침가루', category:'grain',    expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-1) },
  { id:'d13', ingredient_name:'간장',    category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-2) },
  { id:'d14', ingredient_name:'참기름',  category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-2) },
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
  const { t } = useI18n();
  const { success: toastSuccess } = useToast();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // 반응형 MAX — viewport width 기반. 모바일 4, 태블릿 6, 데스크톱 8.
  // 선반 폭이 비율로 스케일되므로 chip 개수도 비례 증가 가능.
  const [shelfMax, setShelfMax] = useState({ body: 4, pantry: 3, door: 2 });
  // 씬 요소(팬던트/웜스팟/콘센트) 배치용 — 데스크탑에선 냉장고 가까이, 모바일은 가장자리
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setIsDesktop(w >= 768);
      if (w >= 1024) setShelfMax({ body: 8, pantry: 4, door: 3 });
      else if (w >= 768) setShelfMax({ body: 6, pantry: 3, door: 3 });
      else if (w >= 640) setShelfMax({ body: 5, pantry: 2, door: 2 });
      else setShelfMax({ body: 4, pantry: 1, door: 2 });
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
  const [showFirstVisitTip, setShowFirstVisitTip] = useState(false);
  // 클라이언트 hydration 후엔 useAuth의 profile을, SSR 초기 HTML에선 initialUsername을 사용.
  const currentUsername = profile?.username ?? initialUsername;
  const hasTempUsername = !!currentUsername && /^user_[a-f0-9]{12}$/.test(currentUsername);

  useEffect(() => {
    if (!user) return;
    if (!hasTempUsername) return;
    const dismissed = localStorage.getItem(`naelum_onboarding_banner_${user.id}`);
    if (!dismissed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage는 브라우저에서만 읽을 수 있어 render 단계에서 파생 불가
      setShowOnboardingBanner(true);
      // 최초 1회만 노출 — 10초 후 자동 dismiss (사용자가 못 봤어도 이후 방문에서 반복 노출 안 함).
      // 프로필 완성은 UserDropdown 메뉴에서 접근 가능.
      const timer = setTimeout(() => {
        localStorage.setItem(`naelum_onboarding_banner_${user.id}`, '1');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [user, hasTempUsername]);

  // 하단 네비의 검색 아이콘 → 인라인 검색바 토글
  useEffect(() => {
    const handler = () => setShowMobileSearch((prev) => !prev);
    window.addEventListener('toggle-fridge-search', handler);
    return () => window.removeEventListener('toggle-fridge-search', handler);
  }, []);

  // 비로그인 첫방문 가이드 툴팁 — "바로 가능 X개" pill을 알려주는 1회용 말풍선
  useEffect(() => {
    if (isAuthenticated) return;
    try {
      const seen = localStorage.getItem('naelum_seen_home_tip');
      if (seen) return;
    } catch { return; }
    const showTimer = setTimeout(() => setShowFirstVisitTip(true), 900);
    const hideTimer = setTimeout(() => {
      setShowFirstVisitTip(false);
      try { localStorage.setItem('naelum_seen_home_tip', '1'); } catch {}
    }, 8000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [isAuthenticated]);

  const dismissFirstVisitTip = () => {
    setShowFirstVisitTip(false);
    try { localStorage.setItem('naelum_seen_home_tip', '1'); } catch {}
  };

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
      showToast(`✅ ${formData.ingredient_name} 수정됐어요`);
      return;
    }
    const client = createClient();
    const { error } = await client.from('user_ingredients').update({ ...formData }).eq('id', id);
    if (error) {
      console.error('[updateIngredient] update 실패:', error);
      showToast('❌ 수정 실패. 다시 시도해주세요.');
      return;
    }
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...formData } : i)));
    setDetailItem(null);
    showToast(`✅ ${formData.ingredient_name} 수정됐어요`);
    window.dispatchEvent(new Event('fridge-updated'));
  };

  // AddIngredientModal onAddIngredient
  const addIngredientFromModal = async (formData: IngredientFormData) => {
    // isAuthenticated(SSR 기준)가 false거나 user(클라이언트 세션)가 없으면 demo 모드
    if (!isAuthenticated || !user) {
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
      toastSuccess(`👅 ${formData.ingredient_name} 추가됐어요`, {
        action: {
          label: '로그인하면 저장돼요 →',
          onClick: () => router.push('/login'),
        },
        duration: 6000,
      });
      return;
    }
    const client = createClient();
    const { data, error } = await client
      .from('user_ingredients')
      .insert({ ...formData, user_id: user.id })
      .select()
      .single();
    if (error) {
      console.error('[addIngredient] insert 실패:', error);
      showToast('❌ 저장 실패. 다시 시도해주세요.');
      return;
    }
    if (data) setItems(prev => [...prev, data as FridgeItem]);
    setAddModalLocation(null);
    showToast('👅 추가!');
    window.dispatchEvent(new Event('fridge-updated'));
  };


  return (
    <div className="min-h-dvh bg-background-primary text-text-primary flex flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0 overflow-hidden md:overflow-visible overscroll-y-none">
      <Header />
      <div className="h-14 md:h-20 flex-shrink-0" />

      {/* 온보딩 미완료 배너 — 비 sticky (자연 flow) + 최초 1회만 노출 (useEffect에서 10초 후 자동 영구 dismiss).
          냉장고 영역 가리지 않도록 compact 버전. */}
      {showOnboardingBanner && (
        <div className="w-full border-b border-accent-warm/15 bg-gradient-to-r from-accent-warm/15 via-accent-warm/8 to-accent-warm/15 flex-shrink-0">
          <div className="max-w-5xl mx-auto px-4 py-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="flex-shrink-0 text-sm leading-none" aria-hidden="true">✨</span>
              <p className="text-[12px] md:text-sm text-text-primary font-medium truncate">
                나의 프로필 완성하기
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowOnboardingModal(true)}
                className="px-2.5 py-0.5 rounded-full bg-accent-warm hover:bg-accent-hover text-background-primary text-[11px] font-bold active:scale-95 transition-all whitespace-nowrap"
              >
                완성하기
              </button>
              <button
                onClick={() => {
                  if (user) localStorage.setItem(`naelum_onboarding_banner_${user.id}`, '1');
                  setShowOnboardingBanner(false);
                }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
                aria-label="닫기"
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
          }}
        />
      )}

      {/* 검색바 — 데스크탑 전용. 모바일은 BottomNav 검색 아이콘으로 접근 (뷰포트 절약). */}
      <div className="px-4 pt-8 md:pt-10 pb-3 hidden md:flex justify-center">
        <SearchBar className="w-full max-w-md" />
      </div>

      {/* DEMO 모드 라벨 — 비로그인 사용자에게만 노출. 앱 가치 제안 + 로그인 CTA. */}
      {!isAuthenticated && (
        <div className="px-4 pb-1 md:pb-2 flex flex-col items-center gap-1.5 flex-shrink-0">
          <p className="text-[11px] md:text-xs text-text-muted text-center leading-tight">
            {t.home.demoTaglinePre}<span className="text-accent-warm font-medium">{t.home.demoTaglineAccent}</span>{t.home.demoTaglinePost}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-warm/10 border border-accent-warm/30 text-[11px] md:text-xs text-accent-warm hover:bg-accent-warm/20 active:scale-95 transition-all"
          >
            <span className="text-xs" aria-hidden="true">✨</span>
            <span>{t.home.demoBadge}</span>
            <span className="text-text-muted">·</span>
            <span className="font-semibold">{t.home.demoCta}</span>
          </Link>
        </div>
      )}

      {/* 레이아웃: justify-end로 콘텐츠를 하단에 몰아붙여 냉장고가 바텀 네비 살짝 위에 위치하게. */}
      <div className="flex-1 relative flex flex-col items-center justify-end gap-0 md:px-12 pb-0 md:pb-8">
        {/* Scene backdrop — 벽·바닥·몰딩. CSS 변수로 라이트·다크 양 테마 대응. */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {/* 벽지 — 상단 12%까지 완전 투명 유지 후 천천히 fade in (경계선 완화) */}
          <div
            className="absolute inset-x-0 top-0 bottom-[26px]"
            style={{
              background: `
                linear-gradient(to bottom,
                  transparent 0%,
                  transparent 12%,
                  var(--scene-wall-mid) 60%,
                  var(--scene-wall-bot) 100%),
                repeating-linear-gradient(90deg, transparent 0 44px, var(--scene-wall-stripe) 44px 45px),
                repeating-linear-gradient(0deg, transparent 0 78px, var(--scene-wall-stripe) 78px 79px)
              `,
            }}
          />
          {/* 코니스 몰딩 */}
          <div
            className="absolute inset-x-0 top-[7%] h-[2px]"
            style={{ background: 'var(--scene-cornice-1)' }}
          />
          <div
            className="absolute inset-x-0 top-[7.6%] h-px"
            style={{ background: 'var(--scene-cornice-2)' }}
          />
          {/* 팬던트 웜 스팟 — React state로 뷰포트 대응 */}
          <div
            className="absolute"
            style={{
              top: '7%',
              ...(isDesktop ? { left: 'calc(50% + 230px)' } : { right: '4%' }),
              width: 'clamp(140px, 30vw, 200px)',
              height: 'clamp(160px, 32vw, 220px)',
              background: 'radial-gradient(ellipse at 50% 30%, var(--scene-warm-spot), transparent 60%)',
              filter: 'blur(2px)',
            }}
          />
          {/* 벽 콘센트 — 데스크탑은 스크롤 아래로 밀려 숨김 */}
          <div
            className="absolute md:hidden"
            style={{
              bottom: '32px',
              left: '8%',
              width: '18px',
              height: '22px',
              background: 'var(--scene-outlet-bg)',
              border: '1px solid var(--scene-outlet-border)',
              borderRadius: '2px',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ position: 'absolute', top: '5px', left: '3px', width: '4px', height: '6px', background: 'rgba(0,0,0,0.85)', borderRadius: '1px' }} />
            <div style={{ position: 'absolute', top: '5px', right: '3px', width: '4px', height: '6px', background: 'rgba(0,0,0,0.85)', borderRadius: '1px' }} />
            <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '2px', background: 'rgba(0,0,0,0.85)', borderRadius: '0.5px' }} />
          </div>
          {/* 베이스보드 2단 */}
          <div
            className="absolute inset-x-0 bottom-[32px] h-[8px]"
            style={{ background: 'linear-gradient(to bottom, var(--scene-bb-outer-top), var(--scene-bb-outer-bot))' }}
          />
          <div
            className="absolute inset-x-0 bottom-[40px] h-[1px]"
            style={{ background: 'var(--scene-bb-divider)' }}
          />
          <div
            className="absolute inset-x-0 bottom-[26px] h-[3px]"
            style={{ background: 'linear-gradient(to bottom, var(--scene-bb-inner-top), var(--scene-bb-inner-bot))' }}
          />
          <div
            className="absolute inset-x-0 bottom-[39px] h-[0.5px]"
            style={{ background: 'var(--scene-bb-hl)' }}
          />
          {/* 바닥 */}
          <div
            className="absolute inset-x-0 bottom-0 h-[26px]"
            style={{ background: 'linear-gradient(to bottom, var(--scene-floor-top), var(--scene-floor-bot))' }}
          />
          {/* 바닥 specular */}
          <div
            className="absolute inset-x-0 bottom-[20px] h-[2px]"
            style={{ background: 'linear-gradient(to right, transparent 0%, var(--scene-floor-specular) 30%, var(--scene-floor-specular) 70%, transparent 100%)' }}
          />
          {/* 냉장고 바닥 리플렉션 */}
          <div
            className="absolute bottom-[2px] left-1/2 -translate-x-1/2"
            style={{
              width: '54%',
              maxWidth: '360px',
              height: '14px',
              background: 'linear-gradient(to bottom, var(--scene-fridge-reflect) 0%, transparent 100%)',
              filter: 'blur(3px)',
              opacity: 0.7,
            }}
          />
          {/* 바닥 plank 소실점 라인 + 나뭇결 옹이 */}
          <svg
            className="absolute inset-x-0 bottom-0 h-[26px] w-full"
            viewBox="0 0 400 26"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1="0" y1="26" x2="180" y2="0" stroke="var(--scene-floor-plank)" strokeWidth="0.45"/>
            <line x1="60" y1="26" x2="188" y2="0" stroke="var(--scene-floor-plank)" strokeWidth="0.4" opacity="0.85"/>
            <line x1="130" y1="26" x2="196" y2="0" stroke="var(--scene-floor-plank)" strokeWidth="0.35" opacity="0.7"/>
            <line x1="400" y1="26" x2="220" y2="0" stroke="var(--scene-floor-plank)" strokeWidth="0.45"/>
            <line x1="340" y1="26" x2="212" y2="0" stroke="var(--scene-floor-plank)" strokeWidth="0.4" opacity="0.85"/>
            <line x1="270" y1="26" x2="204" y2="0" stroke="var(--scene-floor-plank)" strokeWidth="0.35" opacity="0.7"/>
            {/* 나뭇결 옹이 — 미세 */}
            <ellipse cx="35" cy="20" rx="2.5" ry="0.5" fill="var(--scene-floor-plank)" opacity="0.6"/>
            <ellipse cx="110" cy="16" rx="2" ry="0.4" fill="var(--scene-floor-plank)" opacity="0.55"/>
            <ellipse cx="295" cy="22" rx="2.2" ry="0.5" fill="var(--scene-floor-plank)" opacity="0.5"/>
            <ellipse cx="365" cy="14" rx="1.8" ry="0.4" fill="var(--scene-floor-plank)" opacity="0.6"/>
            {/* 가로 plank seams */}
            <line x1="0" y1="10" x2="400" y2="10" stroke="var(--scene-floor-plank)" strokeWidth="0.2" opacity="0.6"/>
            <line x1="0" y1="19" x2="400" y2="19" stroke="var(--scene-floor-plank)" strokeWidth="0.2" opacity="0.45"/>
          </svg>
          {/* 냉장고 접지 2-layer 섀도우 */}
          <div
            className="absolute bottom-[22px] left-1/2 -translate-x-1/2 w-[48%] h-[6px] rounded-[50%]"
            style={{ background: 'radial-gradient(closest-side, rgba(0,0,0,0.55), rgba(0,0,0,0) 75%)', maxWidth: '330px' }}
          />
          <div
            className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[62%] h-[16px] rounded-[50%]"
            style={{ background: 'radial-gradient(closest-side, rgba(0,0,0,0.4), rgba(0,0,0,0) 80%)', maxWidth: '440px' }}
          />

          {/* 팬던트 조명 — React state로 뷰포트 대응 */}
          <div
            className="absolute top-0"
            style={{
              ...(isDesktop ? { left: 'calc(50% + 290px)' } : { right: '10%' }),
              width: 'clamp(40px, 8vw, 58px)',
              filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.35))',
            }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 60 170" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lampShadeG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f2c868" />
                  <stop offset="100%" stopColor="#a87230" />
                </linearGradient>
                <linearGradient id="lampShadeInnerG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3a2418" />
                  <stop offset="100%" stopColor="#1a0d04" />
                </linearGradient>
                <radialGradient id="lampGlowG" cx="50%" cy="20%" r="80%">
                  <stop offset="0%" stopColor="rgba(255,215,140,0.45)" />
                  <stop offset="50%" stopColor="rgba(255,200,120,0.2)" />
                  <stop offset="100%" stopColor="rgba(255,200,120,0)" />
                </radialGradient>
                <radialGradient id="lampBulbG" cx="50%" cy="45%" r="65%">
                  <stop offset="0%" stopColor="#fffae0" />
                  <stop offset="60%" stopColor="#ffe49a" />
                  <stop offset="100%" stopColor="#f5b850" />
                </radialGradient>
              </defs>
              {/* 발광 (뒤쪽) */}
              <ellipse cx="30" cy="130" rx="40" ry="42" fill="url(#lampGlowG)" />
              {/* 천장 부속 */}
              <rect x="23" y="0" width="14" height="3.5" fill="#1a0d04" />
              <rect x="25" y="3.5" width="10" height="1.8" fill="rgba(255,255,255,0.12)" />
              {/* 코드 */}
              <line x1="30" y1="5" x2="30" y2="82" stroke="#1a0d04" strokeWidth="1.6" />
              {/* 연결 고리 */}
              <rect x="27" y="80" width="6" height="4" rx="0.5" fill="#3a2418" stroke="#1a0d04" strokeWidth="0.8" />
              {/* 쉐이드 종 모양 */}
              <path
                d="M 13,86 Q 8,106 16,120 L 44,120 Q 52,106 47,86 Z"
                fill="url(#lampShadeG)"
                stroke="#1a0d04"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {/* 쉐이드 상단 하이라이트 */}
              <ellipse cx="30" cy="89" rx="14" ry="2.2" fill="rgba(255,255,255,0.3)" />
              <path
                d="M 15,92 Q 11,106 18,118"
                fill="none"
                stroke="rgba(255,245,200,0.35)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* 쉐이드 하단 내부 그늘 */}
              <path
                d="M 16,120 L 44,120 L 42,122 L 18,122 Z"
                fill="url(#lampShadeInnerG)"
              />
              {/* 전구 (쉐이드 아래로 살짝 보임) */}
              <ellipse cx="30" cy="124" rx="8" ry="4.5" fill="url(#lampBulbG)" />
              <ellipse cx="30" cy="124" rx="8" ry="4.5" fill="none" stroke="rgba(26,13,4,0.5)" strokeWidth="0.6" />
              {/* 전구 반사 */}
              <ellipse cx="27" cy="123" rx="2.5" ry="1.2" fill="rgba(255,255,255,0.6)" />
            </svg>
          </div>
        </div>

        {/* KitchenSVG — 상온 재료 선반장 (chip overlay). 냉장고와 동일 너비로 상판이 냉장고 상단에 연결됨 */}
        <div className="relative w-full mx-auto z-10" style={{ maxWidth: 'min(640px, calc((100dvh - 224px - env(safe-area-inset-bottom)) * 540 / 670))' }}>
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
            const shelfItems: FridgeItem[][] = [[], [], [], []];
            pantry.forEach((it, i) => {
              const idx = Math.min(Math.floor(i / shelfMax.pantry), 3);
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
                      style={{ left: shelf.left, width: shelf.width, top: shelf.top, height: shelf.height }}
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
                          title={t.home.ingredientListMore.replace('{count}', String(overflow))}
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
        {/* maxWidth = min(640px, 높이_기반_너비) 방식으로 letterbox 방지.
            maxHeight 대신 maxWidth로 크기 제약 → SVG가 컨테이너를 꽉 채워 overlay %좌표가 정확히 일치.
            모바일 기준: header(56) + 찬장(~100) + BottomNav(60) + 여유 ≈ 224px */}
        <div className="relative w-full mx-auto aspect-[540/670] z-10"
          style={{ maxWidth: 'min(640px, calc((100dvh - 224px - env(safe-area-inset-bottom)) * 540 / 670))' }}>
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
            let label = t.home.pillDefault;
            if (matchingCount !== null && matchingCount > 0 && resolvedMode) {
              const countStr = matchingCount >= 30 ? '30+' : String(matchingCount);
              if (resolvedMode === 'ready') { icon = '🔥'; label = t.home.pillReady.replace('{count}', countStr); }
              else if (resolvedMode === 'almost') { icon = '🛒'; label = t.home.pillAlmost.replace('{count}', countStr); }
              else { icon = '📋'; label = t.home.pillAll.replace('{count}', countStr); }
            }
            return (
              <Link
                href={href}
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

          {/* 첫 방문 가이드 툴팁 — 비로그인 유저 최초 1회. pill 위에 말풍선 + 꼬리. */}
          {showFirstVisitTip && showRecipeBubble && matchingCount !== null && matchingCount > 0 && (
            <div
              className="absolute right-[4%] z-30 pointer-events-auto"
              style={{ top: 'calc(63% - 62px)' }}
              role="dialog"
              aria-live="polite"
            >
              <div className="relative bg-background-secondary border-2 border-accent-warm rounded-xl px-3 py-2 shadow-xl shadow-accent-warm/30 animate-[naelum-bubble-pulse_2.4s_ease-in-out_infinite]">
                <button
                  onClick={dismissFirstVisitTip}
                  aria-label={t.home.firstVisitTipClose}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-background-primary border border-accent-warm text-text-primary flex items-center justify-center text-[10px] font-bold hover:bg-accent-warm hover:text-background-primary transition-colors"
                >
                  ×
                </button>
                <p className="text-[11px] md:text-sm font-medium text-text-primary whitespace-nowrap">
                  {t.home.firstVisitTip}
                </p>
                <div className="absolute -bottom-[7px] right-8 w-3 h-3 bg-background-secondary border-r-2 border-b-2 border-accent-warm rotate-45" />
              </div>
            </div>
          )}

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
                      <span className={`leading-none ${compact ? 'text-[10px]' : 'text-sm md:text-base'}`}>{emoji}</span>
                      <span className={`font-bold text-gray-800 leading-none truncate ${compact ? 'text-[8px] max-w-[28px]' : 'text-[9px] md:text-[10px] max-w-[60px]'}`}>
                        {item.ingredient_name}
                      </span>
                      {/* 도어 선반은 공간 타이트 → compact 모드에서는 만료 라벨 숨김(툴팁/시트에서 확인 가능) */}
                      {label && !compact && (
                        <span className="font-bold leading-none text-[8px] md:text-[9px]" style={{ color: border }}>
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

                  {/* 도어 선반 4개 (좌·우 각 2개, 소스·음료 전용).
                      overflow-hidden — chip이 도어 본체 밖으로 삐져나가는 현상 방지 */}
                  {DOOR_SHELVES.map((shelf, idx) => {
                    const list = doorShelfItems[idx];
                    const visible = list.slice(0, shelfMax.door);
                    return (
                      <div
                        key={`door-${idx}`}
                        className="absolute flex flex-wrap items-end justify-center gap-0.5 overflow-hidden"
                        style={{ left: shelf.left, width: shelf.width, top: shelf.top, height: shelf.height, pointerEvents: 'none' }}
                      >
                        {visible.map(item => renderChip(item, true))}
                      </div>
                    );
                  })}

                  {/* 통합 오버플로우 — 냉장 서랍 영역 위에 단일 배지로 표시.
                      각 선반마다 +N 산발 대신, 서랍 = "추가 수납 공간" 메타포 활용.
                      클릭 시 FridgeAllSheet 오픈 → 그룹별 전체 리스트. */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowAllSheet(true); }}
                    className="pointer-events-auto absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent-warm text-background-primary text-[10px] md:text-xs font-bold shadow-lg shadow-accent-warm/50 hover:bg-accent-hover hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                    style={{ top: '54%' }}
                    title={t.home.ingredientList}
                  >
                    <span>📋</span>
                    <span>{totalOverflow > 0 ? t.home.ingredientListMore.replace('{count}', String(totalOverflow)) : t.home.ingredientList}</span>
                  </button>
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
              <span>📋</span><span>레시피</span>
            </Link>
            <Link
              href="/tip"
              onClick={() => setShowMobileSearch(false)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-background-secondary border border-white/10 shadow-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors active:scale-95"
            >
              <span>💡</span><span>팁</span>
            </Link>
          </div>
          {/* 검색창 */}
          <div className="flex items-center gap-2">
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
    </div>
  );
}


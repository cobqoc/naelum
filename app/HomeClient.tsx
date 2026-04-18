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
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/client';
import { QUICK_ADD } from './_home/quickAddList';
import FridgeSVG from './_home/FridgeSVG';
import KitchenSVG from './_home/KitchenSVG';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import BottomNav from '@/components/BottomNav';
import IngredientDetailModal from '@/components/Ingredients/IngredientDetailModal';
import AddIngredientModal from '@/components/Ingredients/AddIngredientModal';

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

type PhotoLabel = {
  name: string;
  category: string;
  quantity?: number | null;
  unit?: string | null;
  storage_location?: string | null;
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
const SHELF_LEFT = '28.5%';
const SHELF_WIDTH = '43%';
const SHELVES: { top: string; height: string; kind: 'fridge' | 'freezer' }[] = [
  { top: '6%',  height: '12%', kind: 'fridge' },   // 냉장 top
  { top: '21%', height: '12%', kind: 'fridge' },   // 냉장 middle
  { top: '35%', height: '13%', kind: 'fridge' },   // 냉장 bottom (drawer 위)
  { top: '63%', height: '16%', kind: 'freezer' },  // 냉동 top
];
const MAX_CHIPS_PER_SHELF = 5;

// DEMO 재료 — 비로그인 체험용. 3가지 상태 섞어서 실제 UX 보여줌:
//   (a) expiry 설정됨 + 만료 임박 (유저가 명시 입력한 경우)
//   (b) expiry null + purchase_date 최근 (안전/신선)
//   (c) expiry null + purchase_date 오래됨 (fallback으로 노랑/빨강)
const DEMO: FridgeItem[] = [
  // (a) 유저가 expiry 입력한 case — 긴급도 표시
  { id:'d1', ingredient_name:'두부', category:'other', expiry_date: addDaysISO(1), storage_location:'냉장', purchase_date: addDaysISO(-3) },
  { id:'d2', ingredient_name:'우유', category:'dairy', expiry_date: addDaysISO(3), storage_location:'냉장', purchase_date: addDaysISO(-4) },
  { id:'d3', ingredient_name:'돼지고기', category:'meat', expiry_date: addDaysISO(2), storage_location:'냉장', purchase_date: addDaysISO(-3) },
  { id:'d4', ingredient_name:'시금치', category:'veggie', expiry_date: addDaysISO(2), storage_location:'냉장', purchase_date: addDaysISO(-5) },
  // (b) expiry 없음 + 방금 산 것 — 표시 없음
  { id:'d5', ingredient_name:'양파', category:'veggie', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(0) },
  { id:'d6', ingredient_name:'마늘', category:'veggie', expiry_date: null, storage_location:'냉장', purchase_date: addDaysISO(-1) },
  { id:'d7', ingredient_name:'김치', category:'other', expiry_date: null, storage_location:'냉장', purchase_date: addDaysISO(-2) },
  { id:'d8', ingredient_name:'간장', category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-1) },
  { id:'d9', ingredient_name:'참기름', category:'seasoning', expiry_date: null, storage_location:'상온', purchase_date: addDaysISO(-1) },
  { id:'d10', ingredient_name:'고추장', category:'seasoning', expiry_date: null, storage_location:'냉장', purchase_date: addDaysISO(-2) },
  // (c) expiry 없음 + 묵힌 것 — purchase_date fallback으로 색 표시
  { id:'d11', ingredient_name:'당근', category:'veggie', expiry_date: null, storage_location:'냉장', purchase_date: addDaysISO(-5) },
  { id:'d12', ingredient_name:'계란', category:'dairy', expiry_date: null, storage_location:'냉장', purchase_date: addDaysISO(-8) },
  { id:'d13', ingredient_name:'만두', category:'grain', expiry_date: null, storage_location:'냉동', purchase_date: addDaysISO(-3) },
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
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // 추가 모달 (사진 업로드 포함) — FAB/빈 선반/overflow 탭 시 열림
  const [addModalLocation, setAddModalLocation] = useState<string | null>(null);

  // 현재 재료로 만들 수 있는 레시피 개수 — 말풍선 CTA 노출 + "N개 가능!" 숫자 표시에 사용.
  // 비로그인: API 호출 불가(로그인 필요). count는 null로 두고 "레시피 추천 →" 일반 문구 표시.
  // 로그인 + 빈 냉장고: fetch 스킵, count 0 (bubble 숨김).
  // 로그인 + 재료 있음: fetch로 count 채움.
  const [matchingCount, setMatchingCount] = useState<number | null>(null);
  const showRecipeBubble = items.length > 0 && (
    !isAuthenticated || (matchingCount !== null && matchingCount > 0)
  );

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

  // 재료 상세 수정 모달 (chip 탭 시 열림)
  const [detailItem, setDetailItem] = useState<FridgeItem | null>(null);

  const fetchItems = useCallback(async () => {
    if (!user) { setItems(DEMO); setLoading(false); return; }
    const client = createClient();
    const { data } = await client
      .from('user_ingredients')
      .select('id, ingredient_name, category, expiry_date, storage_location, quantity, unit, purchase_date, notes, expiry_alert')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true, nullsFirst: false });
    setItems((data ?? []) as FridgeItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    queueMicrotask(() => { fetchItems(); });
  }, [authLoading, fetchItems]);

  // 매칭 레시피 개수 fetch — 로그인 + 재료 있음일 때만. limit=30은 "30+개"로 cap.
  useEffect(() => {
    if (!isAuthenticated || items.length === 0) return;
    let cancelled = false;
    fetch('/api/recommendations?type=ingredients&limit=30')
      .then(r => r.ok ? r.json() : { recommendations: [] })
      .then(data => {
        if (cancelled) return;
        setMatchingCount(Array.isArray(data.recommendations) ? data.recommendations.length : 0);
      })
      .catch(() => {
        if (!cancelled) setMatchingCount(0);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, items.length]);

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
        id: `d${Date.now()}`,
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
      showToast('👅 추가!');
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

  // AddIngredientModal onAddFromPhoto
  const addIngredientsFromPhoto = async (labels: PhotoLabel[]) => {
    if (!user) {
      const newItems: FridgeItem[] = labels.map((lbl, i) => ({
        id: `d${Date.now()}-${i}`,
        ingredient_name: lbl.name,
        category: lbl.category,
        expiry_date: null,
        storage_location: lbl.storage_location ?? addModalLocation ?? null,
        quantity: lbl.quantity ?? null,
        unit: lbl.unit ?? null,
      }));
      setItems(prev => [...prev, ...newItems]);
      setAddModalLocation(null);
      showToast(`📸 ${labels.length}개 추가!`);
      return;
    }
    const client = createClient();
    const rows = labels.map(lbl => ({
      user_id: user.id,
      ingredient_name: lbl.name,
      category: lbl.category,
      quantity: lbl.quantity ?? null,
      unit: lbl.unit ?? null,
      storage_location: lbl.storage_location ?? addModalLocation ?? null,
    }));
    const { data } = await client.from('user_ingredients').insert(rows).select();
    if (data) setItems(prev => [...prev, ...(data as FridgeItem[])]);
    setAddModalLocation(null);
    showToast(`📸 ${labels.length}개 추가!`);
    window.dispatchEvent(new Event('fridge-updated'));
  };

  return (
    <div className="min-h-dvh bg-background-primary text-text-primary flex flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0 overflow-hidden md:overflow-visible overscroll-y-none">
      <Header />
      <div className="h-14 md:h-20 flex-shrink-0" />

      {/* 온보딩 미완료 / 임시 유저명 배너 */}
      {showOnboardingBanner && (
        <div className="sticky top-16 md:top-[68px] z-30 w-full bg-accent-warm/10 border-b border-accent-warm/20 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
            <p className="text-sm text-text-secondary truncate">
              아직 기본 이름 <span className="font-mono text-accent-warm">@{currentUsername}</span>을 쓰고 있어요. <span className="text-accent-warm font-medium">진짜 이름</span>으로 바꿔볼까요?
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowOnboardingModal(true)}
                className="text-xs font-medium text-accent-warm hover:underline whitespace-nowrap"
              >
                완성하기 →
              </button>
              <button
                onClick={() => {
                  if (user) localStorage.setItem(`naelum_onboarding_banner_${user.id}`, '1');
                  setShowOnboardingBanner(false);
                }}
                className="text-text-muted hover:text-text-primary transition-colors"
                aria-label="닫기"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
        <div className="relative w-full max-w-[280px] sm:max-w-sm md:max-w-xl lg:max-w-2xl mx-auto">
          <KitchenSVG />
          {/* 탭 가능 투명 오버레이 — 빈 영역/선반장 전체 탭 시 상온 재료 추가 모달 */}
          <button
            type="button"
            onClick={() => setAddModalLocation('상온')}
            aria-label="상온 재료 추가"
            className="absolute inset-0 z-10 w-full h-full cursor-pointer"
          />
          {/* 상온 chip overlay — 하단 중앙에 가로로 배치 (상온 재료가 "선반 위에 놓인" 느낌) */}
          {(() => {
            const pantry = [...items]
              .filter(i => i.storage_location === '상온')
              .sort((a, b) => urgencyScore(a) - urgencyScore(b));
            const MAX = 6;
            const visible = pantry.slice(0, MAX);
            const overflow = pantry.length - visible.length;
            return (
              <div className="absolute inset-x-1 bottom-[6%] z-20 flex items-end justify-center gap-0.5 flex-wrap pointer-events-none">
                {visible.map(item => {
                  const { border, label, isDanger } = freshState(item);
                  const emoji = getEmoji(item.ingredient_name, item.category);
                  return (
                    <button
                      key={item.id}
                      onClick={(e) => { e.stopPropagation(); setDetailItem(item); }}
                      className={`pointer-events-auto flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-white/95 border-2 hover:scale-105 active:scale-95 transition-all shrink-0 ${isDanger ? 'animate-pulse' : ''}`}
                      style={{ borderColor: border, boxShadow: isDanger ? `0 0 4px ${border}66` : '0 1px 2px rgba(0,0,0,0.25)' }}
                      title={`${item.ingredient_name}${label ? ` · ${label}` : ''}`}
                    >
                      <span className="text-sm md:text-base leading-none">{emoji}</span>
                      {isDanger && (
                        <span className="text-[8px] md:text-[9px] font-bold text-gray-800 leading-none max-w-[40px] truncate">
                          {item.ingredient_name}
                        </span>
                      )}
                      {label && (
                        <span className="text-[7px] md:text-[8px] font-bold leading-none" style={{ color: border }}>{label}</span>
                      )}
                    </button>
                  );
                })}
                {overflow > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setAddModalLocation('상온'); }}
                    className="pointer-events-auto flex items-center px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold shrink-0"
                    title={`${overflow}개 더 보기`}
                  >
                    +{overflow}
                  </button>
                )}
                {pantry.length === 0 && (
                  <span className="text-[10px] italic text-white/80 select-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                    + 상온 재료 추가
                  </span>
                )}
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
        <div className="relative w-full md:max-w-[560px] lg:max-w-[640px] mx-auto aspect-[540/670]"
          style={{ maxHeight: 'calc(100dvh - 213px - env(safe-area-inset-bottom))' }}>
          <FridgeSVG />

          {/* 냉동고 문 중앙 액션 — 레시피 추천 말풍선 + 재료 추가 FAB을 한 줄로 배치.
              freezer 선반이 SVG 내부적으로 y=63~79% 영역. 중앙은 약 72%. */}
          <div className="absolute top-[72%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-2.5">
            {showRecipeBubble && (
              <Link
                href="/recommendations"
                className="flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-accent-warm text-background-primary text-[11px] md:text-sm font-bold shadow-lg shadow-accent-warm/50 hover:bg-accent-hover hover:scale-105 active:scale-95 transition-transform whitespace-nowrap"
                style={{ animation: 'naelum-bubble-pulse 2.4s ease-in-out infinite' }}
                aria-label="재료로 만들 수 있는 레시피 보기"
              >
                <span className="text-sm md:text-base leading-none">💡</span>
                <span>
                  {matchingCount !== null && matchingCount > 0
                    ? `${matchingCount >= 30 ? '30+' : matchingCount}개 가능!`
                    : '레시피 추천'}
                </span>
                <span className="leading-none">→</span>
              </Link>
            )}
            <button
              onClick={() => setAddModalLocation('냉장')}
              aria-label="재료 추가"
              className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-accent-warm hover:bg-accent-hover shadow-lg shadow-accent-warm/40 text-background-primary flex items-center justify-center text-xl font-bold transition-all active:scale-95 flex-shrink-0"
            >
              +
            </button>
          </div>

          {/* 선반 overlay — pointerEvents-none 컨테이너 + 각 선반만 pointer-events 활성 */}
          <div className="absolute inset-0 pointer-events-none">
            {(() => {
              // 선반별 아이템 분배: 냉장은 '냉장' 또는 미지정만 (상온은 KitchenSVG 선반장으로 분리), 냉동은 '냉동'.
              const fridgeItems = [...items].filter(i => i.storage_location === '냉장' || !i.storage_location).sort((a, b) => urgencyScore(a) - urgencyScore(b));
              const freezerItems = [...items].filter(i => i.storage_location === '냉동').sort((a, b) => urgencyScore(a) - urgencyScore(b));
              const shelfItems: FridgeItem[][] = [[], [], [], []];
              fridgeItems.forEach((it, i) => {
                const shelfIdx = Math.min(Math.floor(i / MAX_CHIPS_PER_SHELF), 2);
                shelfItems[shelfIdx].push(it);
              });
              shelfItems[3] = freezerItems;

              return SHELVES.map((shelf, idx) => {
                const list = shelfItems[idx];
                const visible = list.slice(0, MAX_CHIPS_PER_SHELF);
                const overflow = list.length - visible.length;
                const isEmpty = list.length === 0;
                const addLocation = shelf.kind === 'freezer' ? '냉동' : '냉장';
                return (
                  <div
                    key={idx}
                    className="absolute flex flex-wrap items-end justify-center gap-0.5 pointer-events-auto cursor-pointer"
                    style={{
                      left: SHELF_LEFT,
                      width: SHELF_WIDTH,
                      top: shelf.top,
                      height: shelf.height,
                    }}
                    onClick={(e) => {
                      // 빈 선반 영역 탭 시에만 add modal. chip 자체 탭은 handler에서 stopPropagation.
                      if (isEmpty) {
                        e.stopPropagation();
                        setAddModalLocation(addLocation);
                      }
                    }}
                  >
                    {visible.map(item => {
                      const { border, label, isDanger } = freshState(item);
                      const emoji = getEmoji(item.ingredient_name, item.category);
                      return (
                        <button
                          key={item.id}
                          onClick={(e) => { e.stopPropagation(); setDetailItem(item); }}
                          className={`flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-white/90 border-2 hover:scale-105 active:scale-95 transition-all shrink-0 ${isDanger ? 'animate-pulse' : ''}`}
                          style={{
                            borderColor: border,
                            boxShadow: isDanger ? `0 0 4px ${border}66` : undefined,
                          }}
                          title={`${item.ingredient_name}${label ? ` · ${label}` : ''}`}
                        >
                          <span className="text-sm md:text-base leading-none">{emoji}</span>
                          {isDanger && (
                            <span className="text-[8px] md:text-[9px] font-bold text-gray-800 leading-none max-w-[40px] truncate">
                              {item.ingredient_name}
                            </span>
                          )}
                          {label && (
                            <span className="text-[7px] md:text-[8px] font-bold leading-none" style={{ color: border }}>
                              {label}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {overflow > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setAddModalLocation(addLocation); }}
                        className="flex items-center px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold shrink-0"
                        title={`${overflow}개 더 보기`}
                      >
                        +{overflow}
                      </button>
                    )}
                    {isEmpty && (
                      <span className="text-[9px] italic text-black/40 select-none">+ 탭해서 추가</span>
                    )}
                  </div>
                );
              });
            })()}
          </div>

        </div>

      </div>

      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-background-secondary border border-accent-warm/30 text-sm shadow-2xl flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

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

      {/* 재료 추가 모달 (사진 업로드 포함) */}
      <AddIngredientModal
        isOpen={addModalLocation !== null}
        location={addModalLocation}
        onClose={() => setAddModalLocation(null)}
        onAddIngredient={addIngredientFromModal}
        onAddFromPhoto={addIngredientsFromPhoto}
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


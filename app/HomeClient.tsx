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
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/client';
import { QUICK_ADD, quickAddToPayload, type QuickAddIngredient } from './_home/quickAddList';
import FridgeSVG from './_home/FridgeSVG';
import KitchenSVG from './_home/KitchenSVG';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import BottomNav from '@/components/BottomNav';
import WaitlistForm from '@/components/WaitlistForm';
import ExpiringIngredientsAlert from '@/components/Ingredients/ExpiringIngredientsAlert';
import IngredientDetailModal from '@/components/Ingredients/IngredientDetailModal';
import AddIngredientModal from '@/components/Ingredients/AddIngredientModal';
import IngredientCategoryFilter from '@/components/Ingredients/IngredientCategoryFilter';

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

type Section = 'freezer' | 'main' | 'veggie' | 'doorL' | 'doorR' | 'pantry';

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntilExpiry(d: string | null): number {
  if (!d) return 99;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp = new Date(d); exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
function addDaysISO(d: number): string {
  const date = new Date(); date.setDate(date.getDate() + d);
  return date.toISOString().slice(0, 10);
}
function genDemoId(): string { return `demo-${Math.random().toString(36).slice(2, 10)}`; }
function parseMultiInput(text: string): string[] {
  return text.split(/[\s,，、]+/)
    .map(t => t.replace(/\d+(개|g|kg|ml|l|모|장|컵|큰술|작은술|줌|봉|통|병|포기)?$/i, '').trim())
    .filter(t => t.length > 0 && t.length <= 30);
}
function getEmoji(name: string, category: string): string {
  const found = QUICK_ADD.find(q => q.name === name || name.includes(q.name) || q.name.includes(name));
  if (found) return found.emoji;
  return ({ veggie:'🥬', meat:'🥩', seafood:'🐟', dairy:'🥛', grain:'🌾', seasoning:'🧂' } as Record<string,string>)[category] ?? '📦';
}

function assignSection(item: FridgeItem, idx: number): Section {
  if (item.storage_location === '상온') return 'pantry';
  if (item.storage_location === '냉동') return 'freezer';
  if (item.category === 'seasoning' || item.category === 'condiment') {
    if (item.storage_location === '냉장') return idx % 2 === 0 ? 'doorL' : 'doorR';
    return 'pantry';
  }
  if (item.category === 'veggie' || item.category === 'fruit') return 'veggie';
  return 'main';
}

function freshBorder(days: number): string {
  if (days <= 0) return '#991b1b';
  if (days <= 3) return '#dc2626';
  if (days <= 7) return '#d97706';
  return '#4d7c0f';
}
function freshLabel(days: number): string {
  if (days <= 0) return '만료';
  if (days <= 7) return `D-${days}`;
  return '';
}

const DEMO: FridgeItem[] = [
  { id:'d1', ingredient_name:'아이스크림', category:'dairy', expiry_date: addDaysISO(30), storage_location:'냉동' },
  { id:'d2', ingredient_name:'만두', category:'grain', expiry_date: addDaysISO(60), storage_location:'냉동' },
  { id:'d3', ingredient_name:'두부', category:'other', expiry_date: addDaysISO(1), storage_location:'냉장' },
  { id:'d4', ingredient_name:'계란', category:'dairy', expiry_date: addDaysISO(10), storage_location:'냉장' },
  { id:'d5', ingredient_name:'우유', category:'dairy', expiry_date: addDaysISO(3), storage_location:'냉장' },
  { id:'d6', ingredient_name:'김치', category:'other', expiry_date: addDaysISO(14), storage_location:'냉장' },
  { id:'d7', ingredient_name:'돼지고기', category:'meat', expiry_date: addDaysISO(2), storage_location:'냉장' },
  { id:'d8', ingredient_name:'시금치', category:'veggie', expiry_date: addDaysISO(2), storage_location:'냉장' },
  { id:'d9', ingredient_name:'당근', category:'veggie', expiry_date: addDaysISO(8), storage_location:'냉장' },
  { id:'d10', ingredient_name:'양파', category:'veggie', expiry_date: addDaysISO(12), storage_location:'냉장' },
  { id:'d11', ingredient_name:'간장', category:'seasoning', expiry_date: addDaysISO(90), storage_location:'상온' },
  { id:'d12', ingredient_name:'참기름', category:'seasoning', expiry_date: addDaysISO(60), storage_location:'상온' },
  { id:'d13', ingredient_name:'고추장', category:'seasoning', expiry_date: addDaysISO(45), storage_location:'냉장' },
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
  const [adding, setAdding] = useState(false);
  const [multiInput, setMultiInput] = useState('');
  const [showAllChips, setShowAllChips] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [inlineAddSection, setInlineAddSection] = useState<'fridge' | 'freezer' | null>(null);
  const [inlineSearch, setInlineSearch] = useState('');

  // 추가 모달 (사진 업로드 포함)
  const [addModalLocation, setAddModalLocation] = useState<string | null>(null);

  // 큰 냉장고 모달 (홈에서 작은 냉장고 탭 시)
  const [showFridgeModal, setShowFridgeModal] = useState(false);

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
    if (!dismissed) setShowOnboardingBanner(true);
  }, [user, hasTempUsername]);

  // 하단 네비의 검색 아이콘 → 인라인 검색바 토글
  useEffect(() => {
    const handler = () => setShowMobileSearch((prev) => !prev);
    window.addEventListener('toggle-fridge-search', handler);
    return () => window.removeEventListener('toggle-fridge-search', handler);
  }, []);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showFridgeModal) setShowFridgeModal(false);
      else if (showMobileSearch) setShowMobileSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showFridgeModal, showMobileSearch]);

  // 재료 상세 수정 모달
  const [detailItem, setDetailItem] = useState<FridgeItem | null>(null);

  // 카테고리 필터
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // 장보기 모드
  const [shoppingMode, setShoppingMode] = useState(false);
  const [selectedForShopping, setSelectedForShopping] = useState<string[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);

  // 삭제 undo
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const deletedItemRef = useRef<FridgeItem | null>(null);

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

  // 문 애니메이션 제거 — SVG 기본 디자인 우선

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);
  const showToast = (msg: string) => setToast(msg);

  const addQuickItem = async (item: QuickAddIngredient) => {
    if (adding) return;
    setAdding(true);
    if (!user) {
      setItems(prev => [...prev, {
        id: genDemoId(), ingredient_name: item.name, category: item.category,
        expiry_date: addDaysISO(item.category === 'seasoning' ? 14 : item.category === 'dairy' ? 7 : 5),
        storage_location: item.storage,
      }]);
      showToast(`${item.name} 추가 (체험)`);

      setAdding(false); return;
    }
    const client = createClient();
    const { error } = await client.from('user_ingredients').insert(quickAddToPayload(item, user.id));
    if (error) showToast('추가 실패');
    else {
      showToast(`${item.name} 추가`);
      window.dispatchEvent(new Event('fridge-updated'));
      await fetchItems();

    }
    setAdding(false);
  };

  const addMultiFromText = async () => {
    const tokens = parseMultiInput(multiInput);
    if (tokens.length === 0) return;
    setAdding(true);
    let added = 0;
    for (const token of tokens) {
      const match = QUICK_ADD.find(q => q.name === token || q.name.includes(token) || token.includes(q.name));
      const fb: QuickAddIngredient = match ?? { name: token, emoji:'📦', category:'other', storage:'냉장' };
      if (!user) {
        setItems(prev => [...prev, { id: genDemoId(), ingredient_name: fb.name, category: fb.category, expiry_date: addDaysISO(5), storage_location: fb.storage }]);
      } else {
        const client = createClient();
        await client.from('user_ingredients').insert(quickAddToPayload(fb, user.id));
      }
      added++;
    }
    if (user) { window.dispatchEvent(new Event('fridge-updated')); await fetchItems(); }
    showToast(`${added}개 추가`);
    setMultiInput('');
    setAdding(false);
  };

  const removeItem = async (id: string) => {
    const target = items.find(i => i.id === id);
    if (!target) return;

    // 낙관적 제거 + undo 타이머
    setItems(prev => prev.filter(i => i.id !== id));
    deletedItemRef.current = target;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    showToast('👅 낼름! · 되돌리기 4초');

    undoTimerRef.current = setTimeout(async () => {
      deletedItemRef.current = null;
      if (id.startsWith('d') || id.startsWith('demo')) return;
      const client = createClient();
      await client.from('user_ingredients').delete().eq('id', id);
      window.dispatchEvent(new Event('fridge-updated'));
    }, 4000);
  };

  const undoDelete = () => {
    const restored = deletedItemRef.current;
    if (!restored) return;
    setItems(prev => [...prev, restored]);
    deletedItemRef.current = null;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setToast(null);
  };

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

  // 장보기 모드 토글
  const toggleShoppingSelect = (id: string) => {
    setSelectedForShopping(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const addSelectedToCart = async () => {
    if (selectedForShopping.length === 0 || addingToCart) return;
    setAddingToCart(true);
    const selected = items.filter(i => selectedForShopping.includes(i.id));
    try {
      if (user) {
        const client = createClient();
        const rows = selected.map(i => ({
          user_id: user.id,
          ingredient_name: i.ingredient_name,
          category: i.category,
          quantity: i.quantity ?? 1,
          unit: i.unit ?? null,
        }));
        await client.from('shopping_cart').insert(rows);
      }
      showToast(`🛒 ${selected.length}개 추가!`);
      setSelectedForShopping([]);
      setShoppingMode(false);
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      showToast('❌ 장보기 추가 실패');
    } finally {
      setAddingToCart(false);
    }
  };

  // 선반별 추천 칩 (빈 선반 탭 시 표시)
  const FRIDGE_RECO: QuickAddIngredient[] = QUICK_ADD.filter(q => q.storage === '냉장').slice(0, 6);
  const FREEZER_RECO: QuickAddIngredient[] = [
    { name: '만두', emoji: '🥟', category: 'grain', storage: '냉동' },
    { name: '아이스크림', emoji: '🍦', category: 'dairy', storage: '냉동' },
    { name: '새우', emoji: '🦐', category: 'seafood', storage: '냉동' },
    { name: '냉동블루베리', emoji: '🫐', category: 'other', storage: '냉동' },
  ];
  const PANTRY_RECO: QuickAddIngredient[] = QUICK_ADD.filter(q => q.storage === '상온').slice(0, 6);

  const handleInlineAdd = async (item: QuickAddIngredient) => {
    await addQuickItem(item);
    setInlineAddSection(null);
    setInlineSearch('');
  };

  const sections = useMemo(() => {
    const m: Record<Section, FridgeItem[]> = { freezer:[], main:[], veggie:[], doorL:[], doorR:[], pantry:[] };
    items.forEach((item, idx) => m[assignSection(item, idx)].push(item));
    return m;
  }, [items]);

  const dangerCount = items.filter(i => daysUntilExpiry(i.expiry_date) <= 3).length;
  const visibleChips = showAllChips ? QUICK_ADD : QUICK_ADD.slice(0, 12);

  // 카테고리 필터 적용된 섹션별 재료
  const applyFilter = (arr: FridgeItem[]) =>
    selectedCategories.length === 0 ? arr : arr.filter(i => selectedCategories.includes(i.category));

  const filteredPantry = useMemo(() => applyFilter(sections.pantry), [sections.pantry, selectedCategories]);
  const filteredFridge = useMemo(
    () => applyFilter([...sections.main, ...sections.veggie, ...sections.doorL, ...sections.doorR]),
    [sections.main, sections.veggie, sections.doorL, sections.doorR, selectedCategories]
  );
  const filteredFreezer = useMemo(() => applyFilter(sections.freezer), [sections.freezer, selectedCategories]);

  return (
    <div className="min-h-dvh bg-background-primary text-text-primary flex flex-col pb-20 md:pb-0">
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

      {/* Hero Tagline — 비로그인 유저한테만 노출. SSR에서 isAuthenticated로 판정해 flicker 제거.
          (이전엔 !user만 썼는데, useAuth의 초기 undefined 단계에서 로그인 유저에게 잠깐 노출됨) */}
      {!isAuthenticated && (
        <div className="px-4 pt-3 pb-1 text-center">
          <h1 className="text-lg md:text-2xl font-bold text-text-primary">
            냉장고 열고 <span className="text-accent-warm">바로 만드는</span> 한식
          </h1>
          <p className="mt-1 text-xs md:text-sm text-text-muted">
            재료 등록하면 내 냉장고로 만들 수 있는 레시피를 추천해드려요
          </p>
        </div>
      )}

      <div className="px-4 pt-8 md:pt-10 pb-3 hidden md:flex justify-center">
        <SearchBar className="w-full max-w-md" />
      </div>

      {/* 만료 임박 알림 배너 */}
      <div className="px-4 pt-2">
        <ExpiringIngredientsAlert />
      </div>

      <div className="flex-1 flex flex-col items-center md:px-12 pb-4 md:pb-8">
        <div className="flex-1 w-full" />
        <div className="w-full max-w-xs md:max-w-xl lg:max-w-2xl mx-auto">
          <KitchenSVG />
        </div>
        <div className="flex-1 w-full" />
        {/* 홈: 작은 냉장고 (클릭하면 모달로 확대) */}
        <button
          onClick={() => setShowFridgeModal(true)}
          aria-label="냉장고 크게 보기"
          className="relative w-full max-w-[280px] md:max-w-md mx-auto aspect-[540/670] md:aspect-[660/670] max-h-[50vh] md:max-h-[58vh] cursor-pointer group"
        >
          <FridgeSVG />
          <div className="absolute inset-0 rounded-xl group-hover:bg-accent-warm/5 transition-all" />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-background-secondary/80 backdrop-blur-sm border border-white/10 text-[10px] text-text-muted whitespace-nowrap">
            탭해서 크게 보기 🔍
          </span>
        </button>

        {/* 비로그인 유저: Waitlist + 회원가입 CTA — SSR isAuthenticated로 즉시 판정 */}
        {!isAuthenticated && (
          <div className="w-full max-w-md md:max-w-xl px-4 mt-6">
            <WaitlistForm source="fridge_home" compact />
          </div>
        )}

        {/* 레시피 추천 버튼 — 냉장고에 재료가 있을 때만 노출.
            비로그인 유저는 DEMO 13개가 초기 상태라 항상 보임(체험 유도).
            로그인 후 빈 냉장고면 숨겨서 "먼저 재료 넣기"를 자연스럽게 유도. */}
        {items.length > 0 && (
          <div className="w-full max-w-md md:max-w-xl px-4 mt-6">
            <Link
              href="/recommendations"
              className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl bg-accent-warm text-background-primary font-bold text-sm hover:bg-accent-hover active:scale-[0.98] transition-all shadow-lg shadow-accent-warm/30"
            >
              🔍 이 재료로 만들 수 있는 레시피 보기
            </Link>
          </div>
        )}
      </div>

      {/* === 재료 추가 바텀시트 === */}
      {showAddSheet && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAddSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background-secondary rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto animate-slideUp">
            <div className="p-4 pb-8">
              {/* 핸들 */}
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <h2 className="text-sm font-bold text-text-primary mb-3">재료 추가</h2>

              {/* 한 줄 입력 */}
              <div className="flex gap-2 mb-4">
                <input type="text" value={multiInput} onChange={e => setMultiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { addMultiFromText(); setShowAddSheet(false); } }}
                  placeholder="양파2 두부 김치 계란5"
                  aria-label="한 줄에 여러 재료 입력"
                  className="flex-1 rounded-xl bg-background-tertiary border border-white/10 px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-warm/50"
                  autoFocus
                />
                <button onClick={() => { addMultiFromText(); setShowAddSheet(false); }}
                  disabled={adding || multiInput.trim().length === 0}
                  className="px-4 py-3 rounded-xl bg-accent-warm text-background-primary text-sm font-bold disabled:opacity-50"
                >추가</button>
              </div>

              {/* Quick-add 칩 */}
              <p className="text-xs text-text-muted mb-2">빠른 추가</p>
              <div className="flex flex-wrap gap-1.5">
                {visibleChips.map(item => (
                  <button key={item.name} onClick={() => { addQuickItem(item); }}
                    disabled={adding}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-background-tertiary border border-white/10 text-xs hover:border-accent-warm/50 active:scale-95 transition-all disabled:opacity-50"
                  ><span>{item.emoji}</span><span>{item.name}</span></button>
                ))}
                {!showAllChips && (
                  <button onClick={() => setShowAllChips(true)}
                    className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-text-muted">+ 더보기</button>
                )}
              </div>
              <p className="mt-3 text-[10px] text-text-muted">
                공백/콤마로 구분 · 숫자/단위 자동 무시 {!user && '· 체험 모드'}
              </p>
            </div>
          </div>
          <style jsx>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            .animate-slideUp {
              animation: slideUp 0.3s ease-out;
            }
          `}</style>
          <style jsx global>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </>
      )}

      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-background-secondary border border-accent-warm/30 text-sm shadow-2xl flex items-center gap-2">
          <span>{toast}</span>
          {deletedItemRef.current && (
            <button onClick={undoDelete} className="text-accent-warm font-bold hover:underline">
              되돌리기
            </button>
          )}
        </div>
      )}

      {/* 장보기 모드 하단 액션 바 */}
      {shoppingMode && selectedForShopping.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto">
          <button
            onClick={addSelectedToCart}
            disabled={addingToCart}
            className="w-full md:w-auto md:min-w-[280px] px-6 py-3.5 rounded-xl bg-accent-warm text-background-primary font-bold text-sm shadow-2xl hover:bg-accent-hover disabled:opacity-50 transition-all"
          >
            🛒 장보기 목록에 추가 ({selectedForShopping.length}개)
          </button>
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

      {/* 큰 냉장고 모달 (홈 작은 냉장고 탭 시 확대) */}
      {showFridgeModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-md"
          onClick={() => setShowFridgeModal(false)}
          role="dialog"
          aria-label="냉장고 크게 보기"
        >
          <div
            className="relative w-full max-w-md md:max-w-2xl max-h-[95vh] flex flex-col bg-background-secondary rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더: 타이틀 + 장보기 토글 + 닫기 */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10">
              <span className="text-sm font-bold text-text-primary flex-shrink-0">🧊 내 냉장고</span>
              <button
                onClick={() => { setShoppingMode(m => !m); setSelectedForShopping([]); }}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  shoppingMode
                    ? 'bg-accent-warm text-background-primary'
                    : 'bg-white/10 text-text-secondary hover:bg-white/15'
                }`}
                title={shoppingMode ? '장보기 모드 끄기' : '장보기 모드'}
              >
                🛒 {shoppingMode ? '취소' : '장보기'}
              </button>
              <button
                onClick={() => setShowFridgeModal(false)}
                aria-label="닫기"
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10 text-text-primary transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 카테고리 필터 */}
            <div className="px-3 pt-3">
              <IngredientCategoryFilter
                selectedCategories={selectedCategories}
                onChange={setSelectedCategories}
              />
            </div>

            {/* 스크롤 가능 콘텐츠 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 큰 냉장고 + 섹션별 추가 버튼 */}
              <div className="relative w-full aspect-[540/670] md:aspect-[660/670] max-h-[45vh] md:max-h-[50vh] mx-auto">
                <FridgeSVG />
                <button
                  onClick={() => setAddModalLocation('냉장')}
                  aria-label="냉장실에 재료 추가"
                  className="absolute top-[26%] left-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-accent-warm hover:bg-accent-hover shadow-lg shadow-accent-warm/40 text-background-primary flex items-center justify-center text-xl font-bold transition-all active:scale-95"
                >
                  +
                </button>
                <button
                  onClick={() => setAddModalLocation('냉동')}
                  aria-label="냉동실에 재료 추가"
                  className="absolute top-[72%] left-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-accent-warm hover:bg-accent-hover shadow-lg shadow-accent-warm/40 text-background-primary flex items-center justify-center text-xl font-bold transition-all active:scale-95"
                >
                  +
                </button>
              </div>

              {/* 3섹션 리스트 (냉장/냉동/상온) */}
              <div className="space-y-2">
                <SectionRow
                  title="냉장"
                  icon="❄️"
                  items={filteredFridge}
                  onAdd={() => setAddModalLocation('냉장')}
                  onSelect={(item) => shoppingMode ? toggleShoppingSelect(item.id) : setDetailItem(item)}
                  shoppingMode={shoppingMode}
                  selectedIds={selectedForShopping}
                  hasFilter={selectedCategories.length > 0}
                  onResetFilter={() => setSelectedCategories([])}
                  recommendedChips={FRIDGE_RECO}
                  onQuickAdd={addQuickItem}
                />
                <SectionRow
                  title="냉동"
                  icon="🧊"
                  items={filteredFreezer}
                  onAdd={() => setAddModalLocation('냉동')}
                  onSelect={(item) => shoppingMode ? toggleShoppingSelect(item.id) : setDetailItem(item)}
                  shoppingMode={shoppingMode}
                  selectedIds={selectedForShopping}
                  hasFilter={selectedCategories.length > 0}
                  onResetFilter={() => setSelectedCategories([])}
                  recommendedChips={FREEZER_RECO}
                  onQuickAdd={addQuickItem}
                />
                <SectionRow
                  title="상온"
                  icon="🏠"
                  items={filteredPantry}
                  onAdd={() => setAddModalLocation('상온')}
                  onSelect={(item) => shoppingMode ? toggleShoppingSelect(item.id) : setDetailItem(item)}
                  shoppingMode={shoppingMode}
                  selectedIds={selectedForShopping}
                  hasFilter={selectedCategories.length > 0}
                  onResetFilter={() => setSelectedCategories([])}
                  recommendedChips={PANTRY_RECO}
                  onQuickAdd={addQuickItem}
                />
              </div>

              {/* 팁 섹션 (상세) */}
              <div className="px-3 py-2.5 rounded-lg bg-background-tertiary/50 border border-white/5 space-y-1">
                <p className="text-[11px] text-text-muted leading-relaxed">
                  💡 <strong className="text-text-secondary">칩 탭</strong> — 재료 수정/삭제
                </p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  ⚠️ <strong className="text-text-secondary">만료 임박</strong> — D-Day 색상으로 상단 배너에 표시
                </p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  🔍 <strong className="text-text-secondary">레시피 찾기</strong> — 홈 CTA에서 현재 재료 기반 추천
                </p>
              </div>
            </div>
          </div>
        </div>
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
        className={`fixed left-0 right-0 top-[50vh] px-4 z-50 md:hidden origin-bottom transition-all duration-[450ms] ease-out ${
          showMobileSearch
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-[45vh] scale-[0.25] pointer-events-none'
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

// ── SectionRow: 모달 안에서 섹션별 재료 표시 ───────────────────────────
function SectionRow({
  title,
  icon,
  items,
  onAdd,
  onSelect,
  shoppingMode = false,
  selectedIds = [],
  hasFilter = false,
  onResetFilter,
  recommendedChips = [],
  onQuickAdd,
}: {
  title: string;
  icon: string;
  items: FridgeItem[];
  onAdd: () => void;
  onSelect: (item: FridgeItem) => void;
  shoppingMode?: boolean;
  selectedIds?: string[];
  hasFilter?: boolean;
  onResetFilter?: () => void;
  recommendedChips?: QuickAddIngredient[];
  onQuickAdd?: (item: QuickAddIngredient) => void | Promise<void>;
}) {
  const isEmpty = items.length === 0;
  return (
    <div className="rounded-xl bg-background-primary/40 border border-white/5">
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-xs font-bold text-text-secondary">
          {icon} {title} <span className="text-text-muted">({items.length})</span>
        </span>
        <button
          onClick={onAdd}
          className="text-[11px] text-accent-warm font-semibold hover:text-accent-hover px-2 py-0.5 rounded"
        >
          + 추가
        </button>
      </div>
      {isEmpty ? (
        hasFilter ? (
          <div className="px-3 pb-2 flex items-center gap-2">
            <span className="flex-1 text-[11px] text-text-muted">필터 결과 없음</span>
            <button
              onClick={onResetFilter}
              className="text-[11px] px-2 py-1 rounded-md bg-accent-warm/15 text-accent-warm font-semibold hover:bg-accent-warm/25 transition-colors"
            >
              모두 보기
            </button>
          </div>
        ) : (
          <div className="px-3 pb-2">
            <p className="text-[10px] text-text-muted mb-1">빈 선반 — 자주 쓰는 재료로 빠르게 추가</p>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {recommendedChips.map((chip) => (
                <button
                  key={chip.name}
                  onClick={() => onQuickAdd?.(chip)}
                  className="flex items-center gap-0.5 px-2 py-1 rounded-full border border-white/10 bg-background-tertiary/60 hover:border-accent-warm/50 active:scale-95 transition-all whitespace-nowrap"
                  title={`${chip.name} 추가`}
                >
                  <span className="text-sm">{chip.emoji}</span>
                  <span className="text-[9px] font-bold text-text-secondary">{chip.name}</span>
                </button>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-hide">
          {items.map((item) => {
            const days = daysUntilExpiry(item.expiry_date);
            const border = freshBorder(days);
            const label = freshLabel(days);
            const emoji = getEmoji(item.ingredient_name, item.category);
            const isSelected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className={`flex items-center gap-0.5 px-2 py-1 rounded-full border bg-background-secondary active:scale-95 transition-all whitespace-nowrap ${
                  shoppingMode && isSelected
                    ? 'border-accent-warm ring-2 ring-accent-warm line-through'
                    : 'border-accent-warm/20 hover:border-accent-warm/50'
                }`}
                title={`${item.ingredient_name} ${label}`}
              >
                <span className="text-sm">{emoji}</span>
                <span className="text-[9px] font-bold text-text-secondary">{item.ingredient_name}</span>
                {label && (
                  <span className="text-[7px] font-bold ml-0.5" style={{ color: border }}>
                    {label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

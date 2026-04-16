'use client';

/**
 * 낼름 — 카툰 양문형 냉장고 v5
 *
 * 레퍼런스: 따뜻한 갈색 카툰 일러스트 양문형 냉장고.
 * 문이 기본 열려있고 재료가 선반에 바로 보임.
 * CSS로 양문 V자 + 선반 + 재료 칩 구현.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/client';
import { QUICK_ADD, quickAddToPayload, type QuickAddIngredient } from './quickAddList';

// ── Types ─────────────────────────────────────────────────────────────────────

type FridgeItem = {
  id: string;
  ingredient_name: string;
  category: string;
  expiry_date: string | null;
  storage_location: string | null;
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

export default function FridgeHomeClient() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [multiInput, setMultiInput] = useState('');
  const [showAllChips, setShowAllChips] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [doorAnimated, setDoorAnimated] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!user) { setItems(DEMO); setLoading(false); return; }
    const client = createClient();
    const { data } = await client
      .from('user_ingredients')
      .select('id, ingredient_name, category, expiry_date, storage_location')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true, nullsFirst: false });
    setItems((data ?? []) as FridgeItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    queueMicrotask(() => { fetchItems(); });
  }, [authLoading, fetchItems]);

  // 페이지 로드 시 문 열기 애니메이션
  useEffect(() => {
    const timer = setTimeout(() => setDoorAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

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
    if (id.startsWith('d') && !id.startsWith('demo')) {
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('👅 낼름!'); return;
    }
    if (id.startsWith('demo')) {
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('👅 낼름!'); return;
    }
    setItems(prev => prev.filter(i => i.id !== id));
    const client = createClient();
    await client.from('user_ingredients').delete().eq('id', id);
    window.dispatchEvent(new Event('fridge-updated'));
    showToast('👅 낼름!');
  };

  const sections = useMemo(() => {
    const m: Record<Section, FridgeItem[]> = { freezer:[], main:[], veggie:[], doorL:[], doorR:[], pantry:[] };
    items.forEach((item, idx) => m[assignSection(item, idx)].push(item));
    return m;
  }, [items]);

  const dangerCount = items.filter(i => daysUntilExpiry(i.expiry_date) <= 3).length;
  const visibleChips = showAllChips ? QUICK_ADD : QUICK_ADD.slice(0, 12);

  return (
    <div
      className="h-dvh overflow-hidden bg-background-primary text-text-primary transition-all"
      style={{
        filter: doorAnimated ? 'brightness(1)' : 'brightness(0)',
        transition: 'filter 1.8s ease-out',
      }}
    >
      {/* 헤더 */}
      <header className="relative z-20 px-4 pt-3 pb-1 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-accent-warm">낼름</Link>
        {dangerCount > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-error/15 text-error text-xs font-bold animate-pulse">
            ⚠️ {dangerCount}개 임박
          </span>
        )}
      </header>

      {/* === 상온 벽 선반 (위) — 컴팩트 === */}
      <KitchenShelf items={sections.pantry} onRemove={removeItem} compact />

      {/* === 냉장고 + 열린 문 === */}
      <div className="flex justify-center px-[72px] md:px-24 mb-2">
        <div className="relative w-full mx-auto" style={{ perspective: '1200px' }}>

          {/* 좌측 문 */}
          <div
            className="absolute top-0 bottom-[10px] z-10"
            style={{
              width: '90px',
              left: doorAnimated ? '-68px' : '0px',
              transform: doorAnimated ? 'rotateY(42deg)' : 'rotateY(0deg)',
              transformOrigin: 'right center',
              transformStyle: 'preserve-3d',
              transition: 'all 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          >
            <div className="w-full h-full rounded-l-xl overflow-hidden" style={{
              background: 'linear-gradient(180deg, #e8756a 0%, #d4635a 50%, #c75550 100%)',
              boxShadow: 'inset 2px 0 6px rgba(255,255,255,0.2), -4px 0 12px rgba(0,0,0,0.3)',
              border: '2px solid #b84a42',
              borderRight: 'none',
            }}>
              <div className="h-full flex flex-col">
                <DoorShelfSlot items={sections.doorL.slice(0, 1)} onRemove={removeItem} decoEmoji="🍶" />
                <DoorRail />
                <DoorShelfSlot items={sections.doorL.slice(1, 2)} onRemove={removeItem} decoEmoji="🧴" />
                <DoorRail />
                <DoorShelfSlot items={sections.doorL.slice(2)} onRemove={removeItem} decoEmoji="🫙" />
                <DoorRail />
              </div>
            </div>
          </div>

          {/* 우측 문 */}
          <div
            className="absolute top-0 bottom-[10px] z-10"
            style={{
              width: '90px',
              right: doorAnimated ? '-68px' : '0px',
              transform: doorAnimated ? 'rotateY(-42deg)' : 'rotateY(0deg)',
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              transition: 'all 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          >
            <div className="w-full h-full rounded-r-xl overflow-hidden" style={{
              background: 'linear-gradient(180deg, #e8756a 0%, #d4635a 50%, #c75550 100%)',
              boxShadow: 'inset -2px 0 6px rgba(255,255,255,0.2), 4px 0 12px rgba(0,0,0,0.3)',
              border: '2px solid #b84a42',
              borderLeft: 'none',
            }}>
              <div className="h-full flex flex-col">
                <DoorShelfSlot items={sections.doorR.slice(0, 1)} onRemove={removeItem} decoEmoji="🥫" />
                <DoorRail />
                <DoorShelfSlot items={sections.doorR.slice(1, 2)} onRemove={removeItem} decoEmoji="🧈" />
                <DoorRail />
                <DoorShelfSlot items={sections.doorR.slice(2)} onRemove={removeItem} decoEmoji="🍯" />
                <DoorRail />
              </div>
            </div>
          </div>

          {/* 냉장고 본체 (약간 작게) */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              height: 'calc(100dvh - 260px)',
              maxHeight: '520px',
              background: 'linear-gradient(180deg, #e8756a 0%, #d4635a 50%, #c75550 100%)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.2)',
              border: '2px solid #b84a42',
            }}
          >
            {/* 브랜드 */}
            <div className="absolute top-1 left-0 right-0 z-10 text-center">
              <span className="text-[9px] font-bold tracking-[0.2em] text-white/50">NAELUM</span>
            </div>

            {/* 프레임 상단 곡선 */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-white/10 to-transparent rounded-t-xl" />

            {/* 내부 */}
            <div
              className="absolute inset-[3px] rounded-lg overflow-hidden flex flex-col"
              style={{ opacity: doorAnimated ? 1 : 0, transition: 'opacity 1.8s ease-out 0.3s' }}
            >
              {/* 내부 조명 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-6 z-10" style={{
                background: 'radial-gradient(ellipse, rgba(255,248,220,0.5) 0%, transparent 100%)',
              }} />

              {/* 🧊 냉장칸 */}
              <FridgeInterior
                label="냉장"
                icon="🧊"
                items={[...sections.main, ...sections.veggie]}
                onRemove={removeItem}
                loading={loading}
                style={FRIDGE_STYLE}
                shelfCount={3}
                shelfCap={4}
                flex="1 1 auto"
              />

              {/* ❄️ 냉동칸 */}
              <FridgeInterior
                label="냉동"
                icon="❄️"
                items={sections.freezer}
                onRemove={removeItem}
                loading={loading}
                style={FREEZER_STYLE}
                shelfCount={2}
                shelfCap={3}
                flex="0 0 32%"
              />
            </div>

            {/* + 추가 버튼 (냉장고 우하단) */}
            <button
              onClick={() => setShowAddSheet(true)}
              className="absolute bottom-2 right-2 z-20 w-10 h-10 rounded-full bg-accent-warm text-background-primary text-xl font-bold shadow-lg hover:bg-accent-hover active:scale-90 transition-all flex items-center justify-center"
              aria-label="재료 추가"
            >
              +
            </button>
          </div>

          {/* 냉장고 다리 */}
          <div className="flex justify-between px-8 -mt-0.5">
            <div className="w-6 h-2 rounded-b-sm" style={{ background: '#9a4a44' }} />
            <div className="w-6 h-2 rounded-b-sm" style={{ background: '#9a4a44' }} />
          </div>
        </div>
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
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-background-secondary border border-accent-warm/30 text-sm shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

// 선반별 아이템 분배: 한 선반에 최대 shelfCap개씩
function splitToShelves(items: FridgeItem[], shelfCount: number, shelfCap: number): FridgeItem[][] {
  const shelves: FridgeItem[][] = Array.from({ length: shelfCount }, () => []);
  items.forEach((item, i) => {
    const idx = Math.min(Math.floor(i / shelfCap), shelfCount - 1);
    shelves[idx].push(item);
  });
  return shelves;
}

// 냉장 스타일
const FRIDGE_STYLE = {
  bg: 'linear-gradient(180deg, rgba(244,249,255,0.97) 0%, rgba(226,240,252,0.97) 100%)',
  headerColor: '#4a7a9a',
  subColor: '#7aa8c0',
  divider: 'linear-gradient(180deg, #8ab4d4 0%, #6a94b4 100%)',
  emptyText: '#7aa8c0',
};

// 냉동 스타일
const FREEZER_STYLE = {
  bg: 'linear-gradient(180deg, rgba(141,189,224,0.90) 0%, rgba(106,158,200,0.90) 100%)',
  headerColor: '#1a3a6a',
  subColor: 'rgba(42,90,154,0.7)',
  divider: 'linear-gradient(180deg, rgba(70,120,170,0.92) 0%, rgba(50,90,140,0.92) 100%)',
  emptyText: 'rgba(255,255,255,0.4)',
};

function FridgeInterior({
  label, icon, items, onRemove, loading, style, shelfCount, shelfCap, flex,
}: {
  label: string; icon: string; items: FridgeItem[]; onRemove: (id: string) => void;
  loading: boolean; flex: string; shelfCount: number; shelfCap: number;
  style: typeof FRIDGE_STYLE;
}) {
  const shelves = splitToShelves(items, shelfCount, shelfCap);

  return (
    <div className="relative overflow-hidden" style={{ flex, background: style.bg }}>
      <div className="h-full flex flex-col">
          {/* 섹션 헤더 */}
          <div className="flex items-center justify-between px-2.5 pt-1.5 pb-1">
            <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: style.headerColor }}>
              {icon} {label}
              <span className="font-normal" style={{ color: style.subColor }}>({items.length})</span>
            </span>
          </div>

          {/* 선반들 */}
          <div className="flex-1 flex flex-col">
            {shelves.map((shelfItems, idx) => (
              <div key={idx} className="flex-1 flex flex-col">
                {/* 선반 내용 */}
                <div className="flex-1 flex flex-wrap gap-1 items-end px-2.5 pb-1 min-h-[28px]">
                  {loading && idx === 0 ? (
                    <span className="text-[9px]" style={{ color: style.emptyText }}>로딩...</span>
                  ) : shelfItems.length === 0 ? null : (
                    shelfItems.map(item => <ItemChip key={item.id} item={item} onRemove={onRemove} />)
                  )}
                </div>
                {/* 선반 구분선 */}
                <div className="h-[4px] flex-shrink-0" style={{
                  background: style.divider,
                  boxShadow: '0 3px 6px rgba(0,0,0,0.2)',
                }} />
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}

function ItemChip({ item, onRemove }: { item: FridgeItem; onRemove: (id: string) => void }) {
  const days = daysUntilExpiry(item.expiry_date);
  const border = freshBorder(days);
  const label = freshLabel(days);
  const emoji = getEmoji(item.ingredient_name, item.category);
  const isDanger = days <= 3;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
      className={`flex items-center gap-0.5 pl-1 pr-1.5 py-0.5 rounded-lg transition-all hover:scale-105 active:scale-95 ${isDanger ? 'animate-pulse' : ''}`}
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: `2px solid ${border}`,
        boxShadow: isDanger ? `0 0 6px ${border}40` : '0 1px 2px rgba(0,0,0,0.1)',
      }}
      title={`${item.ingredient_name} ${label} · 탭해서 먹기`}
    >
      <span className="text-sm">{emoji}</span>
      <span className="text-[9px] font-bold text-gray-700">{item.ingredient_name}</span>
      {label && (
        <span className="text-[7px] font-bold ml-0.5" style={{ color: border }}>{label}</span>
      )}
    </button>
  );
}

function DoorRail() {
  return (
    <div className="h-[6px] flex-shrink-0 mx-1.5 rounded-sm" style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 50%, rgba(0,0,0,0.15) 100%)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.4)',
    }} />
  );
}

function DoorShelfSlot({ items, onRemove, decoEmoji }: {
  items: FridgeItem[]; onRemove: (id: string) => void; decoEmoji: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-end pb-1 px-1">
      {items.length > 0 ? (
        items.map(item => {
          const emoji = getEmoji(item.ingredient_name, item.category);
          return (
            <button
              key={item.id}
              onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
              className="flex flex-col items-center hover:scale-110 active:scale-90 transition-transform"
              title={`${item.ingredient_name} · 탭해서 먹기`}
            >
              <span className="text-2xl drop-shadow-md">{emoji}</span>
              <span className="text-[7px] text-white/80 font-bold">{item.ingredient_name.slice(0, 3)}</span>
            </button>
          );
        })
      ) : (
        <span className="text-2xl opacity-60">{decoEmoji}</span>
      )}
    </div>
  );
}

// 주방 데코 아이템 (선반 빈 공간에 배치)
const DECO_TOP = ['🪴', '🫕', '☕'];
const DECO_BOTTOM = ['🍳', '🔪', '🥄', '🧤'];

function KitchenShelf({ items, onRemove, compact }: { items: FridgeItem[]; onRemove: (id: string) => void; compact?: boolean }) {
  const mid = Math.ceil(items.length / 2);
  const topItems = items.slice(0, mid);
  const bottomItems = items.slice(mid);

  return (
    <div className={`flex justify-center px-4 ${compact ? 'mb-1' : 'mb-6'}`}>
      <div className="w-full">
        {/* 상단 선반 */}
        <WallShelf items={topItems} deco={DECO_TOP} onRemove={onRemove} compact={compact} />

        {/* 하단 선반 */}
        <div className={compact ? 'mt-0.5' : 'mt-1'}>
          <WallShelf items={bottomItems} deco={DECO_BOTTOM} onRemove={onRemove} compact={compact} />
        </div>

        {/* 걸이형 주방 도구 */}
        <div className={`flex justify-center gap-4 ${compact ? 'mt-0.5 mb-1' : 'mt-1 mb-2'}`}>
          {['🍴', '🥊', '🫙'].map((e, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-px bg-text-muted/20 ${compact ? 'h-2' : 'h-3'}`} />
              <span className={`opacity-70 ${compact ? 'text-sm' : 'text-lg'}`}>{e}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WallShelf({ items, deco, onRemove, compact }: {
  items: FridgeItem[]; deco: string[]; onRemove: (id: string) => void; compact?: boolean;
}) {
  const emojiSize = compact ? 'text-xl' : 'text-2xl';
  const decoSize = compact ? 'text-base' : 'text-xl';

  return (
    <div className="relative">
      {/* 재료 + 데코 아이템 */}
      <div className={`flex items-end gap-2 px-2 pb-0.5 ${compact ? 'min-h-[36px]' : 'min-h-[48px]'}`}>
        {/* 데코 (왼쪽 끝) */}
        {deco[0] && items.length === 0 && (
          <span className={`${emojiSize} opacity-60 mb-0.5`}>{deco[0]}</span>
        )}

        {/* 실제 재료 */}
        {items.map(item => {
          const days = daysUntilExpiry(item.expiry_date);
          const border = freshBorder(days);
          const label = freshLabel(days);
          const emoji = getEmoji(item.ingredient_name, item.category);
          const isDanger = days <= 3;
          return (
            <button
              key={item.id}
              onClick={() => onRemove(item.id)}
              className={`flex flex-col items-center hover:scale-110 active:scale-90 transition-transform ${isDanger ? 'animate-pulse' : ''}`}
              title={`${item.ingredient_name} ${label}`}
            >
              <span className={`${emojiSize} drop-shadow-md`}>{emoji}</span>
              <span className="text-[7px] font-bold text-text-secondary whitespace-nowrap">{item.ingredient_name.slice(0, 4)}</span>
              {label && <span className="text-[5px] font-bold" style={{ color: border }}>{label}</span>}
            </button>
          );
        })}

        {/* 데코 (오른쪽) */}
        {deco.slice(items.length > 0 ? 0 : 1).map((e, i) => (
          <span key={i} className={`${decoSize} opacity-60 mb-0.5`}>{e}</span>
        ))}
      </div>

      {/* 나무 선반 판 */}
      <div className={`relative ${compact ? 'h-[5px]' : 'h-[7px]'} rounded-sm`} style={{
        background: 'linear-gradient(180deg, #a0764a 0%, #7a5a34 60%, #6a4c2c 100%)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
      }} />

      {/* 브래킷 */}
      <div className="absolute -bottom-3 left-4">
        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[12px] border-t-[#6a4c2c] border-r-[8px] border-r-transparent" style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.2))' }} />
      </div>
      <div className="absolute -bottom-3 right-4">
        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[12px] border-t-[#6a4c2c] border-r-[8px] border-r-transparent" style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.2))' }} />
      </div>
    </div>
  );
}

'use client';

/**
 * 낼름 — 카툰 양문형 냉장고 v5
 *
 * 레퍼런스: 따뜻한 갈색 카툰 일러스트 양문형 냉장고.
 * 문이 기본 열려있고 재료가 선반에 바로 보임.
 * CSS로 양문 V자 + 선반 + 재료 칩 구현.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/client';
import { QUICK_ADD, quickAddToPayload, type QuickAddIngredient } from './quickAddList';
import FridgeSVG from './FridgeSVG';
import KitchenSVG from './KitchenSVG';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import BottomNav from '@/components/BottomNav';

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
  // doorOpen 제거 — SVG가 항상 열린 상태
  const [inlineAddSection, setInlineAddSection] = useState<'fridge' | 'freezer' | null>(null);
  const [inlineSearch, setInlineSearch] = useState('');

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

  // 선반별 추천 칩 (빈 선반 탭 시 표시)
  const FRIDGE_CHIPS = QUICK_ADD.filter(q => q.storage !== '상온' && q.category !== 'seasoning').slice(0, 6);
  const FREEZER_CHIPS = [
    { name: '만두', emoji: '🥟', category: 'grain' as const, storage: '냉동' as const },
    { name: '아이스크림', emoji: '🍦', category: 'dairy' as const, storage: '냉동' as const },
    ...QUICK_ADD.filter(q => q.storage === '냉동').slice(0, 2),
  ];

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

  return (
    <div className="min-h-dvh bg-background-primary text-text-primary flex flex-col pb-20 md:pb-0">
      <Header />
      <div className="h-14 md:h-20 flex-shrink-0" />

      <div className="px-4 pt-8 md:pt-10 pb-3 flex justify-center">
        <SearchBar className="w-full max-w-md" />
      </div>

      {dangerCount > 0 && (
        <div className="px-4 pt-2 flex justify-end">
          <span className="px-2.5 py-1 rounded-full bg-error/15 text-error text-xs font-bold animate-pulse">
            ⚠️ {dangerCount}개 임박
          </span>
        </div>
      )}

      <KitchenCounter items={sections.pantry} onRemove={removeItem} />

      <div className="flex-1 flex flex-col items-center px-4 md:px-12 pb-4 md:pb-8">
        <div className="flex-1 w-full" />
        <div className="w-full max-w-xs md:max-w-xl lg:max-w-2xl mx-auto">
          <KitchenSVG />
        </div>
        <div className="flex-1 w-full" />
        <div className="relative w-full max-w-xs md:max-w-xl lg:max-w-2xl mx-auto aspect-[660/670] max-h-[55vh]">
          <FridgeSVG />
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
          <style jsx global>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </>
      )}

      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-background-secondary border border-accent-warm/30 text-sm shadow-2xl">
          {toast}
        </div>
      )}

      <BottomNav />
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
  inlineActive, inlineChips, inlineSearch, onInlineSearchChange, onShelfTap, onInlineAdd,
}: {
  label: string; icon: string; items: FridgeItem[]; onRemove: (id: string) => void;
  loading: boolean; flex: string; shelfCount: number; shelfCap: number;
  style: typeof FRIDGE_STYLE;
  inlineActive?: boolean;
  inlineChips?: QuickAddIngredient[];
  inlineSearch?: string;
  onInlineSearchChange?: (v: string) => void;
  onShelfTap?: () => void;
  onInlineAdd?: (item: QuickAddIngredient) => void;
}) {
  const shelves = splitToShelves(items, shelfCount, shelfCap);

  // 인라인 검색 필터
  const filteredChips = inlineChips?.filter(c =>
    !inlineSearch || c.name.includes(inlineSearch)
  ) ?? [];

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
                {/* 선반 내용 — 빈 선반은 탭 가능 */}
                <div
                  className={`flex-1 flex flex-wrap gap-1 items-end px-2.5 pb-1 min-h-[28px] ${
                    shelfItems.length === 0 && !loading ? 'cursor-pointer hover:bg-white/10 transition-colors rounded' : ''
                  }`}
                  onClick={() => {
                    if (shelfItems.length === 0 && !loading && onShelfTap) onShelfTap();
                  }}
                >
                  {loading && idx === 0 ? (
                    <span className="text-[9px]" style={{ color: style.emptyText }}>로딩...</span>
                  ) : shelfItems.length === 0 ? (
                    !inlineActive && (
                      <span className="text-[9px] italic" style={{ color: style.emptyText, opacity: 0.5 }}>
                        + 탭해서 추가
                      </span>
                    )
                  ) : (
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

          {/* 인라인 추가 UI (선반 탭 시 표시) */}
          {inlineActive && (
            <div className="absolute inset-x-0 bottom-0 z-20 p-2 rounded-b-lg" style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
            }}>
              <input
                type="text"
                value={inlineSearch ?? ''}
                onChange={e => onInlineSearchChange?.(e.target.value)}
                placeholder="재료 검색..."
                autoFocus
                className="w-full rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-warm/50 mb-2"
              />
              <div className="flex flex-wrap gap-1">
                {filteredChips.slice(0, 8).map(chip => (
                  <button
                    key={chip.name}
                    onClick={() => onInlineAdd?.(chip)}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-[10px] text-gray-700 hover:bg-accent-warm/20 active:scale-95 transition-all"
                  >
                    <span>{chip.emoji}</span>
                    <span>{chip.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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

function KitchenCounter({ items, onRemove }: { items: FridgeItem[]; onRemove: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="flex justify-center px-4 mb-0">
      <div className="w-full max-w-xs md:max-w-xl lg:max-w-2xl mx-auto">
        <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] text-text-muted whitespace-nowrap mr-1">🏠 상온</span>
          {items.map(item => {
            const days = daysUntilExpiry(item.expiry_date);
            const border = freshBorder(days);
            const label = freshLabel(days);
            const emoji = getEmoji(item.ingredient_name, item.category);
            return (
              <button key={item.id} onClick={() => onRemove(item.id)}
                className="flex items-center gap-0.5 px-2 py-1 rounded-full border border-accent-warm/20 bg-background-secondary hover:border-accent-warm/50 active:scale-95 transition-all whitespace-nowrap"
                title={`${item.ingredient_name} ${label}`}
              >
                <span className="text-sm">{emoji}</span>
                <span className="text-[9px] font-bold text-text-secondary">{item.ingredient_name}</span>
                {label && <span className="text-[7px] font-bold ml-0.5" style={{ color: border }}>{label}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

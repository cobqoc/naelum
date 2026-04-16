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
  const [doorOpen, setDoorOpen] = useState(false);

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
      if (!doorOpen) setDoorOpen(true);
      setAdding(false); return;
    }
    const client = createClient();
    const { error } = await client.from('user_ingredients').insert(quickAddToPayload(item, user.id));
    if (error) showToast('추가 실패');
    else {
      showToast(`${item.name} 추가`);
      window.dispatchEvent(new Event('fridge-updated'));
      await fetchItems();
      if (!doorOpen) setDoorOpen(true);
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
    if (!doorOpen) setDoorOpen(true);
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
    <div className="min-h-screen bg-background-primary text-text-primary">
      {/* 헤더 */}
      <header className="relative z-20 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-accent-warm">낼름</Link>
        {dangerCount > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-error/15 text-error text-xs font-bold animate-pulse">
            ⚠️ {dangerCount}개 임박
          </span>
        )}
      </header>

      {/* === 양문형 냉장고 === */}
      <div className="flex justify-center px-2 mb-4">
        <div className="relative" style={{ width: '340px', maxWidth: '92vw', perspective: '900px' }}>

          {/* 좌측 문 */}
          <div
            className="absolute top-0 bottom-[22%] z-20 cursor-pointer"
            onClick={() => setDoorOpen(o => !o)}
            style={{
              width: doorOpen ? '48px' : '50%',
              left: doorOpen ? '-36px' : '0',
              transform: doorOpen ? 'rotateY(55deg)' : 'rotateY(0deg)',
              transformOrigin: 'right center',
              transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="w-full h-full rounded-l-xl relative" style={{
              background: 'linear-gradient(180deg, #c0623a 0%, #a8502e 50%, #964828 100%)',
              boxShadow: doorOpen
                ? 'inset 2px 0 6px rgba(255,255,255,0.15), -3px 0 10px rgba(0,0,0,0.3)'
                : 'inset -1px 0 4px rgba(0,0,0,0.2), 2px 0 8px rgba(0,0,0,0.15)',
            }}>
              {/* 문 앞면 (닫혀있을 때만 보임) */}
              {!doorOpen && (
                <>
                  <div className="absolute top-3 left-3 text-[9px] font-bold tracking-[0.15em] text-white/50">NAELUM</div>
                  <div className="absolute right-2 top-[40%] w-[5px] h-[50px] rounded-full"
                    style={{ background: 'linear-gradient(180deg, #6a7a80 0%, #4a5a60 100%)', boxShadow: '1px 1px 4px rgba(0,0,0,0.4)' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-3xl mb-1">🧊</p>
                      <p className="text-[10px] text-white/50">탭해서 열기</p>
                    </div>
                  </div>
                </>
              )}
              {/* 문 안쪽 (열려있을 때 보임) */}
              {doorOpen && (
                <div className="p-1 flex flex-col justify-around h-full">
                  {sections.doorL.map(item => (
                    <DoorItem key={item.id} item={item} onRemove={removeItem} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 우측 문 */}
          <div
            className="absolute top-0 bottom-[22%] z-20 cursor-pointer"
            onClick={() => setDoorOpen(o => !o)}
            style={{
              width: doorOpen ? '48px' : '50%',
              right: doorOpen ? '-36px' : '0',
              transform: doorOpen ? 'rotateY(-55deg)' : 'rotateY(0deg)',
              transformOrigin: 'left center',
              transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="w-full h-full rounded-r-xl relative" style={{
              background: 'linear-gradient(180deg, #c0623a 0%, #a8502e 50%, #964828 100%)',
              boxShadow: doorOpen
                ? 'inset -2px 0 6px rgba(255,255,255,0.15), 3px 0 10px rgba(0,0,0,0.3)'
                : 'inset 1px 0 4px rgba(0,0,0,0.2), -2px 0 8px rgba(0,0,0,0.15)',
            }}>
              {/* 문 앞면 (닫혀있을 때) */}
              {!doorOpen && (
                <>
                  <div className="absolute left-2 top-[40%] w-[5px] h-[50px] rounded-full"
                    style={{ background: 'linear-gradient(180deg, #6a7a80 0%, #4a5a60 100%)', boxShadow: '-1px 1px 4px rgba(0,0,0,0.4)' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-sm font-bold text-white/70">{items.length}개</p>
                      {dangerCount > 0 && (
                        <p className="text-[9px] text-red-300 animate-pulse mt-0.5">⚠️ {dangerCount} 임박</p>
                      )}
                    </div>
                  </div>
                </>
              )}
              {/* 문 안쪽 */}
              {doorOpen && (
                <div className="p-1 flex flex-col justify-around h-full">
                  {sections.doorR.map(item => (
                    <DoorItem key={item.id} item={item} onRemove={removeItem} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 냉장고 본체 */}
          <div
            onClick={() => { if (!doorOpen) setDoorOpen(true); }}
            className={`relative rounded-xl overflow-hidden ${!doorOpen ? 'cursor-pointer' : ''}`}
            style={{
              aspectRatio: '5 / 6',
              background: 'linear-gradient(180deg, #8B4513 0%, #7a3b10 100%)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.1)',
              border: '3px solid #6b3410',
            }}
          >
            {/* 프레임 상단 곡선 */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-white/10 to-transparent rounded-t-xl" />

            {/* 내부 */}
            <div
              className="absolute inset-[6px] rounded-lg overflow-hidden flex flex-col transition-all duration-500"
              style={{
                background: doorOpen
                  ? 'linear-gradient(180deg, #e8e0d0 0%, #ddd5c5 100%)'
                  : '#444',
                opacity: doorOpen ? 1 : 0.3,
              }}
            >
              {/* 내부 조명 (문 열릴 때) */}
              {doorOpen && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-6" style={{
                  background: 'radial-gradient(ellipse, rgba(255,248,220,0.6) 0%, transparent 100%)',
                }} />
              )}

              {/* 🧊 냉장칸 (메인, 선반 4단) */}
              <FridgeInterior
                label="냉장"
                icon="🧊"
                items={[...sections.main, ...sections.veggie]}
                onRemove={removeItem}
                loading={loading}
                doorOpen={doorOpen}
                style={FRIDGE_STYLE}
                shelfCount={4}
                shelfCap={4}
                flex="1 1 auto"
              />

              {/* 냉장/냉동 구분 */}
              <div className="h-[6px] flex-shrink-0" style={{
                background: 'linear-gradient(180deg, #7a5a30 0%, #5a3f1a 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }} />

              {/* ❄️ 냉동칸 (선반 2단) */}
              <FridgeInterior
                label="냉동"
                icon="❄️"
                items={sections.freezer}
                onRemove={removeItem}
                loading={loading}
                doorOpen={doorOpen}
                style={FREEZER_STYLE}
                shelfCount={2}
                shelfCap={3}
                flex="0 0 32%"
              />
            </div>
          </div>

          {/* 냉장고 다리 */}
          <div className="flex justify-between px-8 -mt-0.5">
            <div className="w-6 h-2 rounded-b-sm" style={{ background: '#5a2d0e' }} />
            <div className="w-6 h-2 rounded-b-sm" style={{ background: '#5a2d0e' }} />
          </div>
        </div>
      </div>

      {/* === 상온 선반 (냉장고 밖) === */}
      <PantryShelf items={sections.pantry} onRemove={removeItem} />

      {/* === 재료 추가 === */}
      <section className="relative z-20 max-w-sm mx-auto px-4 mt-2 pb-32">
        <h2 className="text-sm font-bold text-text-secondary mb-2">⚡ 빠른 추가</h2>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {visibleChips.map(item => (
            <button key={item.name} onClick={() => addQuickItem(item)} disabled={adding}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-background-secondary border border-white/10 text-xs hover:border-accent-warm/50 hover:bg-accent-warm/10 transition-all disabled:opacity-50 active:scale-95"
            ><span>{item.emoji}</span><span>{item.name}</span></button>
          ))}
          {!showAllChips && (
            <button onClick={() => setShowAllChips(true)}
              className="px-3 py-1.5 rounded-full bg-background-tertiary text-xs text-text-muted">+ 더보기</button>
          )}
        </div>
        <div className="flex gap-2">
          <input type="text" value={multiInput} onChange={e => setMultiInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addMultiFromText(); }}
            placeholder="양파2 두부 김치 계란5" aria-label="한 줄에 여러 재료 입력"
            className="flex-1 rounded-xl bg-background-secondary border border-white/10 px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-warm/50"
          />
          <button onClick={addMultiFromText} disabled={adding || multiInput.trim().length === 0}
            className="px-5 py-3 rounded-xl bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-50"
          >추가</button>
        </div>
        <p className="mt-2 text-[11px] text-text-muted">
          공백/콤마로 구분 {!user && '· 체험 모드'}
        </p>
      </section>

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
  label, icon, items, onRemove, loading, doorOpen, style, shelfCount, shelfCap, flex,
}: {
  label: string; icon: string; items: FridgeItem[]; onRemove: (id: string) => void;
  loading: boolean; doorOpen: boolean; flex: string; shelfCount: number; shelfCap: number;
  style: typeof FRIDGE_STYLE;
}) {
  const shelves = splitToShelves(items, shelfCount, shelfCap);

  return (
    <div className="relative overflow-hidden" style={{ flex, background: doorOpen ? style.bg : 'transparent' }}>
      {doorOpen && (
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
                  ) : shelfItems.length === 0 ? (
                    <span className="text-[9px] italic" style={{ color: style.emptyText }}>
                      빈 선반 — 재료를 추가해보세요
                    </span>
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
        </div>
      )}
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

function DoorItem({ item, onRemove }: { item: FridgeItem; onRemove: (id: string) => void }) {
  const emoji = getEmoji(item.ingredient_name, item.category);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
      className="flex flex-col items-center hover:scale-110 active:scale-90 transition-transform"
      title={`${item.ingredient_name} · 탭해서 먹기`}
    >
      <span className="text-lg drop-shadow">{emoji}</span>
      <span className="text-[7px] text-white/70 font-medium truncate w-full text-center">
        {item.ingredient_name.slice(0, 3)}
      </span>
    </button>
  );
}

function PantryShelf({ items, onRemove }: { items: FridgeItem[]; onRemove: (id: string) => void }) {
  // 2단 선반으로 나누기
  const mid = Math.ceil(items.length / 2);
  const top = items.slice(0, mid);
  const bottom = items.slice(mid);

  return (
    <div className="flex justify-center px-4 mb-4">
      <div className="w-full max-w-xs md:max-w-sm">
        <h3 className="text-xs font-bold text-text-secondary mb-2 flex items-center gap-1.5">
          <span>🏠</span> 상온 선반
        </h3>

        {/* 벽 배경 */}
        <div
          className="relative rounded-xl p-3 pb-4"
          style={{
            background: 'linear-gradient(180deg, #f5e6c8 0%, #e8d5b0 100%)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid rgba(180,150,100,0.3)',
          }}
        >
          {/* 벽 패턴 (미세한 다이아몬드) */}
          <div className="absolute inset-0 rounded-xl opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '16px 16px' }}
          />

          {/* 상단 선반 */}
          <WoodShelf items={top} onRemove={onRemove} />

          {/* 하단 선반 */}
          {bottom.length > 0 && (
            <div className="mt-3">
              <WoodShelf items={bottom} onRemove={onRemove} />
            </div>
          )}

          {/* 비어있을 때 */}
          {items.length === 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-amber-800/40 italic">상온 재료가 없어요</p>
              <p className="text-[10px] text-amber-800/30 mt-1">양파, 감자, 간장 같은 재료를 추가해보세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WoodShelf({ items, onRemove }: { items: FridgeItem[]; onRemove: (id: string) => void }) {
  return (
    <div className="relative">
      {/* 재료들 */}
      <div className="flex flex-wrap gap-1.5 px-1 pb-2 min-h-[36px] items-end">
        {items.map(item => (
          <PantryItem key={item.id} item={item} onRemove={onRemove} />
        ))}
      </div>
      {/* 나무 선반 판 */}
      <div className="relative h-[6px] rounded-sm" style={{
        background: 'linear-gradient(180deg, #8B6914 0%, #6b4f10 60%, #5a3f0e 100%)',
        boxShadow: '0 3px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
      }} />
      {/* 선반 브래킷 (좌/우) */}
      <div className="absolute -bottom-2 left-2 w-3 h-4 rounded-b-sm" style={{
        background: 'linear-gradient(180deg, #6b4f10 0%, #5a3f0e 100%)',
        boxShadow: '1px 2px 3px rgba(0,0,0,0.2)',
      }} />
      <div className="absolute -bottom-2 right-2 w-3 h-4 rounded-b-sm" style={{
        background: 'linear-gradient(180deg, #6b4f10 0%, #5a3f0e 100%)',
        boxShadow: '-1px 2px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function PantryItem({ item, onRemove }: { item: FridgeItem; onRemove: (id: string) => void }) {
  const days = daysUntilExpiry(item.expiry_date);
  const border = freshBorder(days);
  const label = freshLabel(days);
  const emoji = getEmoji(item.ingredient_name, item.category);

  return (
    <button
      onClick={() => onRemove(item.id)}
      className="flex flex-col items-center gap-0 hover:scale-110 active:scale-90 transition-transform"
      title={`${item.ingredient_name} ${label} · 탭해서 먹기`}
    >
      <span className="text-2xl drop-shadow-md">{emoji}</span>
      <span className="text-[8px] font-bold text-amber-900/70 whitespace-nowrap">{item.ingredient_name}</span>
      {label && <span className="text-[7px] font-bold" style={{ color: border }}>{label}</span>}
    </button>
  );
}

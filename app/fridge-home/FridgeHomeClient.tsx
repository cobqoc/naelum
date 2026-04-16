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

type Section = 'freezer' | 'main' | 'veggie' | 'doorL' | 'doorR';

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
  if (item.storage_location === '냉동') return 'freezer';
  if (item.category === 'seasoning' || item.category === 'condiment') return idx % 2 === 0 ? 'doorL' : 'doorR';
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
      setAdding(false); return;
    }
    const client = createClient();
    const { error } = await client.from('user_ingredients').insert(quickAddToPayload(item, user.id));
    if (error) showToast('추가 실패');
    else { showToast(`${item.name} 추가`); window.dispatchEvent(new Event('fridge-updated')); await fetchItems(); }
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
    const m: Record<Section, FridgeItem[]> = { freezer:[], main:[], veggie:[], doorL:[], doorR:[] };
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
        <div className="relative" style={{ width: '340px', maxWidth: '92vw' }}>
          {/* 좌측 문 (열린 상태) */}
          <div
            className="absolute top-0 bottom-[22%] z-10"
            style={{
              width: '48px',
              left: '-36px',
              transform: 'perspective(600px) rotateY(55deg)',
              transformOrigin: 'right center',
            }}
          >
            <div className="w-full h-full rounded-l-xl" style={{
              background: 'linear-gradient(180deg, #c0623a 0%, #a8502e 50%, #964828 100%)',
              boxShadow: 'inset 2px 0 6px rgba(255,255,255,0.15), -3px 0 10px rgba(0,0,0,0.3)',
            }}>
              {/* 문 안쪽 선반들 */}
              <div className="p-1 flex flex-col justify-around h-full">
                {sections.doorL.map(item => (
                  <DoorItem key={item.id} item={item} onRemove={removeItem} />
                ))}
              </div>
            </div>
          </div>

          {/* 우측 문 (열린 상태) */}
          <div
            className="absolute top-0 bottom-[22%] z-10"
            style={{
              width: '48px',
              right: '-36px',
              transform: 'perspective(600px) rotateY(-55deg)',
              transformOrigin: 'left center',
            }}
          >
            <div className="w-full h-full rounded-r-xl" style={{
              background: 'linear-gradient(180deg, #c0623a 0%, #a8502e 50%, #964828 100%)',
              boxShadow: 'inset -2px 0 6px rgba(255,255,255,0.15), 3px 0 10px rgba(0,0,0,0.3)',
            }}>
              <div className="p-1 flex flex-col justify-around h-full">
                {sections.doorR.map(item => (
                  <DoorItem key={item.id} item={item} onRemove={removeItem} />
                ))}
              </div>
            </div>
          </div>

          {/* 냉장고 본체 */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              aspectRatio: '5 / 8',
              background: 'linear-gradient(180deg, #8B4513 0%, #7a3b10 100%)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.1)',
              border: '3px solid #6b3410',
            }}
          >
            {/* 프레임 상단 곡선 */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-white/10 to-transparent rounded-t-xl" />

            {/* 내부 */}
            <div className="absolute inset-[6px] rounded-lg overflow-hidden flex flex-col" style={{
              background: 'linear-gradient(180deg, #e8e0d0 0%, #ddd5c5 100%)',
            }}>
              {/* 내부 조명 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-6" style={{
                background: 'radial-gradient(ellipse, rgba(255,248,220,0.6) 0%, transparent 100%)',
              }} />

              {/* ❄️ 냉동칸 */}
              <FridgeShelf
                label="❄️ 냉동"
                items={sections.freezer}
                onRemove={removeItem}
                loading={loading}
                color="#c8d8e8"
                flex="0 0 18%"
              />
              <ShelfDivider />

              {/* 🧊 냉장 칸 (가장 큼) */}
              <FridgeShelf
                label="🧊 냉장"
                items={sections.main}
                onRemove={removeItem}
                loading={loading}
                color="#d8dce0"
                flex="1 1 auto"
              />
              <ShelfDivider />

              {/* 🥬 야채칸 (서랍형) */}
              <div className="relative" style={{ flex: '0 0 24%' }}>
                {/* 서랍 프레임 */}
                <div className="absolute inset-1 rounded-lg overflow-hidden" style={{
                  background: 'linear-gradient(180deg, rgba(200,220,200,0.4) 0%, rgba(180,210,180,0.3) 100%)',
                  border: '2px solid rgba(160,180,160,0.3)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                }}>
                  {/* 서랍 손잡이 */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-b bg-gray-400/40" />
                  <div className="px-2 pt-3 pb-1">
                    <span className="text-[8px] font-bold text-green-800/40 tracking-wider">🥬 야채칸</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sections.veggie.length === 0 && !loading && (
                        <span className="text-[9px] text-gray-400 italic">비어있음</span>
                      )}
                      {sections.veggie.map(item => (
                        <ItemChip key={item.id} item={item} onRemove={removeItem} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 냉장고 다리 */}
          <div className="flex justify-between px-8 -mt-0.5">
            <div className="w-6 h-2 rounded-b-sm" style={{ background: '#5a2d0e' }} />
            <div className="w-6 h-2 rounded-b-sm" style={{ background: '#5a2d0e' }} />
          </div>
        </div>
      </div>

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

function ShelfDivider() {
  return (
    <div className="relative h-[3px] flex-shrink-0" style={{
      background: 'linear-gradient(180deg, #b8b0a0 0%, #a8a090 100%)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
    }} />
  );
}

function FridgeShelf({ label, items, onRemove, loading, color, flex }: {
  label: string; items: FridgeItem[]; onRemove: (id: string) => void;
  loading: boolean; color: string; flex: string;
}) {
  return (
    <div className="relative overflow-hidden" style={{ flex, background: color }}>
      <div className="px-2 pt-1">
        <span className="text-[8px] font-bold text-black/30 tracking-wider">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1 px-2 pt-0.5 pb-1 overflow-y-auto" style={{ maxHeight: 'calc(100% - 20px)' }}>
        {loading ? (
          <span className="text-[9px] text-black/30">로딩...</span>
        ) : items.length === 0 ? (
          <span className="text-[9px] text-black/20 italic">비어있음</span>
        ) : (
          items.map(item => <ItemChip key={item.id} item={item} onRemove={onRemove} />)
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

'use client';

/**
 * 낼름 — 진짜 냉장고처럼 보이는 실험 홈 v4
 *
 * CSS 3D perspective로 문이 진짜로 열리는 프리미엄 냉장고.
 * 브랜드 청록색 + 선반 3단 + 재료가 선반에 앉아있는 구조.
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

type Shelf = '냉동' | '냉장' | '야채칸';

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

function genDemoId(): string {
  return `demo-${Math.random().toString(36).slice(2, 10)}`;
}

function parseMultiInput(text: string): string[] {
  return text
    .split(/[\s,，、]+/)
    .map(t => t.replace(/\d+(개|g|kg|ml|l|모|장|컵|큰술|작은술|줌|봉|통|병|포기)?$/i, '').trim())
    .filter(t => t.length > 0 && t.length <= 30);
}

function getEmojiForName(name: string, category: string): string {
  const found = QUICK_ADD.find(q => q.name === name || name.includes(q.name) || q.name.includes(name));
  if (found) return found.emoji;
  const cat: Record<string, string> = {
    veggie: '🥬', meat: '🥩', seafood: '🐟', dairy: '🥛',
    grain: '🌾', seasoning: '🧂', other: '📦',
  };
  return cat[category] ?? '📦';
}

function itemToShelf(item: FridgeItem): Shelf {
  if (item.storage_location === '냉동') return '냉동';
  if (item.category === 'veggie' || item.category === 'fruit') return '야채칸';
  return '냉장';
}

function freshnessStyle(days: number): { ring: string; text: string; badge: string; pulse: boolean } {
  if (days <= 0) return { ring: '#991b1b', text: '#fca5a5', badge: '만료', pulse: true };
  if (days <= 3) return { ring: '#dc2626', text: '#fca5a5', badge: `D-${days}`, pulse: true };
  if (days <= 7) return { ring: '#ca8a04', text: '#fde68a', badge: `D-${days}`, pulse: false };
  return { ring: '#16a34a', text: '#bbf7d0', badge: '', pulse: false };
}

const DEMO_ITEMS: FridgeItem[] = [
  { id: 'demo-1', ingredient_name: '아이스크림', category: 'dairy', expiry_date: addDaysISO(30), storage_location: '냉동' },
  { id: 'demo-2', ingredient_name: '새우', category: 'seafood', expiry_date: addDaysISO(8), storage_location: '냉동' },
  { id: 'demo-3', ingredient_name: '두부', category: 'other', expiry_date: addDaysISO(1), storage_location: '냉장' },
  { id: 'demo-4', ingredient_name: '계란', category: 'dairy', expiry_date: addDaysISO(10), storage_location: '냉장' },
  { id: 'demo-5', ingredient_name: '우유', category: 'dairy', expiry_date: addDaysISO(3), storage_location: '냉장' },
  { id: 'demo-6', ingredient_name: '김치', category: 'other', expiry_date: addDaysISO(14), storage_location: '냉장' },
  { id: 'demo-7', ingredient_name: '시금치', category: 'veggie', expiry_date: addDaysISO(2), storage_location: '냉장' },
  { id: 'demo-8', ingredient_name: '당근', category: 'veggie', expiry_date: addDaysISO(6), storage_location: '냉장' },
  { id: 'demo-9', ingredient_name: '양파', category: 'veggie', expiry_date: addDaysISO(12), storage_location: '상온' },
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
    if (!user) { setItems(DEMO_ITEMS); setLoading(false); return; }
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
      showToast(`${item.name} 추가 (체험 모드)`);
      if (!doorOpen) setDoorOpen(true);
      setAdding(false);
      return;
    }
    const client = createClient();
    const { error } = await client.from('user_ingredients').insert(quickAddToPayload(item, user.id));
    if (error) showToast('추가 실패');
    else {
      showToast(`${item.name} 추가 완료`);
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
      const fallback: QuickAddIngredient = match ?? { name: token, emoji: '📦', category: 'other', storage: '냉장' };
      if (!user) {
        setItems(prev => [...prev, {
          id: genDemoId(), ingredient_name: fallback.name, category: fallback.category,
          expiry_date: addDaysISO(5), storage_location: fallback.storage,
        }]);
      } else {
        const client = createClient();
        await client.from('user_ingredients').insert(quickAddToPayload(fallback, user.id));
      }
      added++;
    }
    if (user) { window.dispatchEvent(new Event('fridge-updated')); await fetchItems(); }
    showToast(`${added}개 재료 추가`);
    setMultiInput('');
    if (!doorOpen) setDoorOpen(true);
    setAdding(false);
  };

  const removeItem = async (id: string) => {
    if (id.startsWith('demo-')) {
      setItems(prev => prev.filter(i => i.id !== id));
    } else {
      setItems(prev => prev.filter(i => i.id !== id));
      const client = createClient();
      await client.from('user_ingredients').delete().eq('id', id);
      window.dispatchEvent(new Event('fridge-updated'));
    }
    showToast('👅 낼름!');
  };

  // 선반별 재료 분류
  const shelves = useMemo(() => {
    const map: Record<Shelf, FridgeItem[]> = { '냉동': [], '냉장': [], '야채칸': [] };
    for (const item of items) map[itemToShelf(item)].push(item);
    return map;
  }, [items]);

  const dangerCount = items.filter(i => daysUntilExpiry(i.expiry_date) <= 3).length;
  const visibleChips = showAllChips ? QUICK_ADD : QUICK_ADD.slice(0, 12);

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      {/* 헤더 */}
      <header className="relative z-20 px-4 pt-4 md:pt-6 pb-2 flex items-center justify-between">
        <Link href="/" className="text-xl md:text-2xl font-bold text-accent-warm">낼름</Link>
        {dangerCount > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-error/15 text-error text-xs font-bold animate-pulse">
            ⚠️ {dangerCount}개 임박
          </span>
        )}
      </header>

      {/* === 냉장고 === */}
      <div className="flex justify-center px-4 mb-4">
        <div
          style={{ perspective: '1200px' }}
          className="relative w-full max-w-xs md:max-w-sm"
        >
          {/* 냉장고 본체 */}
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{
              aspectRatio: '3 / 5',
              background: '#3a3a3a',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {/* 내부 — 선반 3단 */}
            <div
              className="absolute inset-1 rounded-xl overflow-hidden"
              style={{
                background: doorOpen
                  ? 'linear-gradient(180deg, #f5f0e0 0%, #ede5d0 50%, #e8dfc5 100%)'
                  : '#333',
                transition: 'background 0.5s ease',
              }}
            >
              {/* 내부 조명 (문 열릴 때) */}
              {doorOpen && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-b-full"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(255,248,200,0.7) 0%, transparent 100%)',
                  }}
                />
              )}

              {/* 냉동 칸 */}
              <ShelfSection
                label="❄️ 냉동"
                items={shelves['냉동']}
                onRemove={removeItem}
                doorOpen={doorOpen}
                style={{ height: '22%' }}
                bgColor="rgba(180,210,230,0.3)"
              />

              {/* 냉동/냉장 구분선 */}
              <div className="relative h-[3%]" style={{ background: doorOpen ? 'linear-gradient(90deg, #c0b090, #a89878, #c0b090)' : '#444' }} />

              {/* 냉장 칸 */}
              <ShelfSection
                label="🧊 냉장"
                items={shelves['냉장']}
                onRemove={removeItem}
                doorOpen={doorOpen}
                style={{ height: '45%' }}
                bgColor="rgba(200,220,240,0.15)"
              />

              {/* 냉장/야채 구분선 */}
              <div className="relative h-[3%]" style={{ background: doorOpen ? 'linear-gradient(90deg, #c0b090, #a89878, #c0b090)' : '#444' }} />

              {/* 야채칸 */}
              <ShelfSection
                label="🥬 야채칸"
                items={shelves['야채칸']}
                onRemove={removeItem}
                doorOpen={doorOpen}
                style={{ height: '27%' }}
                bgColor="rgba(180,220,180,0.15)"
              />
            </div>

            {/* === 문 (3D 회전) === */}
            <div
              onClick={() => setDoorOpen(o => !o)}
              className="absolute inset-0 cursor-pointer"
              style={{
                transformOrigin: 'left center',
                transform: doorOpen ? 'rotateY(-75deg)' : 'rotateY(0deg)',
                transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                zIndex: 10,
              }}
            >
              {/* 문 외관 */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #65b5c0 0%, #4a9aa5 30%, #3d8690 60%, #357a84 100%)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)',
                }}
              >
                {/* 상/하 분할선 */}
                <div className="absolute top-[25%] left-3 right-3 h-[2px] bg-black/15 rounded-full" />

                {/* 브랜드 */}
                <div className="absolute top-3 left-4 text-[11px] font-bold tracking-[0.15em] text-white/60">
                  NAELUM
                </div>

                {/* 상태 LED */}
                <div className="absolute top-3.5 right-4 flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${dangerCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-400'}`} />
                </div>

                {/* 손잡이 (상단) */}
                <div
                  className="absolute right-4 top-[8%] w-[6px] rounded-full"
                  style={{
                    height: '14%',
                    background: 'linear-gradient(180deg, #6a7a80 0%, #4a5a60 100%)',
                    boxShadow: '2px 2px 6px rgba(0,0,0,0.4), inset 1px 0 0 rgba(255,255,255,0.2)',
                  }}
                />

                {/* 손잡이 (하단) */}
                <div
                  className="absolute right-4 top-[35%] w-[6px] rounded-full"
                  style={{
                    height: '14%',
                    background: 'linear-gradient(180deg, #6a7a80 0%, #4a5a60 100%)',
                    boxShadow: '2px 2px 6px rgba(0,0,0,0.4), inset 1px 0 0 rgba(255,255,255,0.2)',
                  }}
                />

                {/* 문 중앙 정보 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-5xl mb-3 drop-shadow-lg">🧊</p>
                  <p className="text-sm font-bold text-white/80 mb-1">
                    {items.length > 0 ? `${items.length}개 재료` : '비어있어요'}
                  </p>
                  <p className="text-xs text-white/50">탭해서 열기</p>
                </div>
              </div>
            </div>

            {/* 문 그림자 (열릴 때 바닥에 생김) */}
            {doorOpen && (
              <div
                className="absolute -left-4 top-[5%] bottom-[5%] w-8 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, transparent 100%)',
                  zIndex: 9,
                }}
              />
            )}
          </div>

          {/* 냉장고 다리 */}
          <div className="flex justify-between px-6 -mt-1">
            <div className="w-5 h-2 rounded-b bg-[#2a2a2a]" />
            <div className="w-5 h-2 rounded-b bg-[#2a2a2a]" />
          </div>
        </div>
      </div>

      {/* === 재료 추가 === */}
      <section className="relative z-20 max-w-sm md:max-w-md mx-auto px-4 mt-2 pb-32">
        <h2 className="text-sm font-bold text-text-secondary mb-2">⚡ 빠른 추가</h2>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {visibleChips.map(item => (
            <button
              key={item.name}
              onClick={() => addQuickItem(item)}
              disabled={adding}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-background-secondary border border-white/10 text-xs hover:border-accent-warm/50 hover:bg-accent-warm/10 transition-all disabled:opacity-50 active:scale-95"
            >
              <span>{item.emoji}</span>
              <span>{item.name}</span>
            </button>
          ))}
          {!showAllChips && (
            <button onClick={() => setShowAllChips(true)}
              className="px-3 py-1.5 rounded-full bg-background-tertiary text-xs text-text-muted"
            >+ 더보기</button>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={multiInput}
            onChange={e => setMultiInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addMultiFromText(); }}
            placeholder="양파2 두부 김치 계란5"
            aria-label="한 줄에 여러 재료 입력"
            className="flex-1 rounded-xl bg-background-secondary border border-white/10 px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-warm/50"
          />
          <button onClick={addMultiFromText} disabled={adding || multiInput.trim().length === 0}
            className="px-5 py-3 rounded-xl bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-50"
          >추가</button>
        </div>
        <p className="mt-2 text-[11px] text-text-muted">
          공백/콤마로 구분 {!user && '· 체험 모드 (로그인 시 저장)'}
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

// ── Shelf Section ─────────────────────────────────────────────────────────────

function ShelfSection({
  label, items, onRemove, doorOpen, style, bgColor,
}: {
  label: string;
  items: FridgeItem[];
  onRemove: (id: string) => void;
  doorOpen: boolean;
  style: React.CSSProperties;
  bgColor: string;
}) {
  return (
    <div className="relative overflow-hidden" style={{ ...style, background: doorOpen ? bgColor : 'transparent' }}>
      {doorOpen && (
        <>
          {/* 선반 라벨 */}
          <div className="px-2 pt-1">
            <span className="text-[9px] font-bold text-black/40 tracking-wider uppercase">{label}</span>
          </div>
          {/* 재료 목록 */}
          <div className="flex flex-wrap gap-1 px-2 pt-1 pb-1 overflow-y-auto" style={{ maxHeight: 'calc(100% - 24px)' }}>
            {items.length === 0 ? (
              <span className="text-[10px] text-black/25 italic">비어있음</span>
            ) : (
              items.map(item => <IngredientChip key={item.id} item={item} onRemove={onRemove} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}

function IngredientChip({ item, onRemove }: { item: FridgeItem; onRemove: (id: string) => void }) {
  const days = daysUntilExpiry(item.expiry_date);
  const f = freshnessStyle(days);
  const emoji = getEmojiForName(item.ingredient_name, item.category);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:scale-105 active:scale-95 ${f.pulse ? 'animate-pulse' : ''}`}
      style={{
        background: 'rgba(255,255,255,0.75)',
        border: `1.5px solid ${f.ring}`,
        boxShadow: f.pulse ? `0 0 8px ${f.ring}50` : '0 1px 3px rgba(0,0,0,0.1)',
      }}
      title={`${item.ingredient_name} ${f.badge} · 탭해서 먹기`}
    >
      <span className="text-base">{emoji}</span>
      <span className="text-[10px] font-semibold text-gray-800">{item.ingredient_name}</span>
      {f.badge && (
        <span className="text-[8px] font-bold px-1 rounded" style={{ color: f.ring, background: `${f.ring}15` }}>
          {f.badge}
        </span>
      )}
    </button>
  );
}

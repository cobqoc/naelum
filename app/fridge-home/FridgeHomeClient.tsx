'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

type RecipeCard = {
  id: string;
  title: string;
  thumbnail_url: string | null;
};

type DesignTone = 'skeuomorphic' | 'minimal';

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntilExpiry(expiry_date: string | null): number | null {
  if (!expiry_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiry_date);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function freshnessColor(days: number | null): { ring: string; bg: string; label: string } {
  if (days === null) return { ring: 'rgba(255,255,255,0.15)', bg: 'rgba(255,255,255,0.05)', label: '' };
  if (days < 0) return { ring: '#7a1f1f', bg: 'rgba(122,31,31,0.25)', label: '만료' };
  if (days <= 1) return { ring: '#dc2626', bg: 'rgba(220,38,38,0.20)', label: `D-${Math.max(days, 0)}` };
  if (days <= 3) return { ring: '#f97316', bg: 'rgba(249,115,22,0.18)', label: `D-${days}` };
  if (days <= 7) return { ring: '#eab308', bg: 'rgba(234,179,8,0.15)', label: `D-${days}` };
  return { ring: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: `D-${days}` };
}

const DEMO_ITEMS: FridgeItem[] = [
  { id: 'demo-1', ingredient_name: '양파', category: 'veggie', expiry_date: addDaysISO(2), storage_location: '상온' },
  { id: 'demo-2', ingredient_name: '두부', category: 'other', expiry_date: addDaysISO(1), storage_location: '냉장' },
  { id: 'demo-3', ingredient_name: '계란', category: 'dairy', expiry_date: addDaysISO(10), storage_location: '냉장' },
  { id: 'demo-4', ingredient_name: '김치', category: 'other', expiry_date: addDaysISO(20), storage_location: '냉장' },
  { id: 'demo-5', ingredient_name: '대파', category: 'veggie', expiry_date: addDaysISO(4), storage_location: '냉장' },
];

function addDaysISO(d: number): string {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date.toISOString().slice(0, 10);
}

function genDemoId(): string {
  return `demo-${Math.random().toString(36).slice(2, 10)}`;
}

// 한 줄 다중 입력 파서: "양파2 두부 김치, 계란5" → ["양파", "두부", "김치", "계란"]
function parseMultiInput(text: string): string[] {
  return text
    .split(/[\s,，、]+/)
    .map(t => t.replace(/\d+(개|g|kg|ml|l|모|장|컵|큰술|작은술|줌|봉|통|병|포기)?$/i, '').trim())
    .filter(t => t.length > 0 && t.length <= 30);
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function FridgeHomeClient() {
  const { user, loading: authLoading } = useAuth();
  const [tone, setTone] = useState<DesignTone>('skeuomorphic');
  const [doorOpen, setDoorOpen] = useState(false);
  const [emptyMode, setEmptyMode] = useState(false);
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<RecipeCard[]>([]);
  const [adding, setAdding] = useState(false);
  const [multiInput, setMultiInput] = useState('');
  const [showAllChips, setShowAllChips] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Fetch real ingredients for authenticated users
  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems(DEMO_ITEMS);
      setLoading(false);
      return;
    }
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

  // Fetch matching recipes (background marquee)
  useEffect(() => {
    if (items.length === 0) {
      queueMicrotask(() => setRecipes([]));
      return;
    }
    const ingredientNames = items.map(i => i.ingredient_name).slice(0, 10).join(',');
    fetch(`/api/recommendations?type=ingredients&limit=10&ingredients=${encodeURIComponent(ingredientNames)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.recipes) setRecipes(data.recipes.slice(0, 10));
      })
      .catch(() => {});
  }, [items]);

  // Toast auto-dismiss
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
      // demo mode: local only
      const newItem: FridgeItem = {
        id: genDemoId(),
        ingredient_name: item.name,
        category: item.category,
        expiry_date: addDaysISO(item.category === 'seasoning' ? 30 : item.category === 'dairy' ? 7 : 5),
        storage_location: item.storage,
      };
      setItems(prev => [...prev, newItem]);
      showToast(`${item.name} 추가 (체험 모드)`);
      setAdding(false);
      setDoorOpen(true);
      return;
    }
    const client = createClient();
    const payload = quickAddToPayload(item, user.id);
    const { error } = await client.from('user_ingredients').insert(payload);
    if (error) {
      showToast('추가 실패: ' + error.message);
    } else {
      showToast(`${item.name} 추가 완료`);
      window.dispatchEvent(new Event('fridge-updated'));
      await fetchItems();
      setDoorOpen(true);
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
      const fallback: QuickAddIngredient = match ?? {
        name: token,
        emoji: '📦',
        category: 'other',
        storage: '냉장',
      };
      if (!user) {
        const newItem: FridgeItem = {
          id: genDemoId(),
          ingredient_name: fallback.name,
          category: fallback.category,
          expiry_date: addDaysISO(5),
          storage_location: fallback.storage,
        };
        setItems(prev => [...prev, newItem]);
      } else {
        const client = createClient();
        await client.from('user_ingredients').insert(quickAddToPayload(fallback, user.id));
      }
      added++;
    }
    if (user) {
      window.dispatchEvent(new Event('fridge-updated'));
      await fetchItems();
    }
    showToast(`${added}개 재료 추가`);
    setMultiInput('');
    setDoorOpen(true);
    setAdding(false);
  };

  const removeItem = async (id: string) => {
    if (id.startsWith('demo-')) {
      setItems(prev => prev.filter(i => i.id !== id));
      return;
    }
    const client = createClient();
    setItems(prev => prev.filter(i => i.id !== id));
    await client.from('user_ingredients').delete().eq('id', id);
    window.dispatchEvent(new Event('fridge-updated'));
  };

  // 비우기 모드: 시들 직전 재료 우선 정렬
  const sortedItems = useMemo(() => {
    if (!emptyMode) return items;
    return [...items].sort((a, b) => {
      const da = daysUntilExpiry(a.expiry_date) ?? 999;
      const db = daysUntilExpiry(b.expiry_date) ?? 999;
      return da - db;
    });
  }, [items, emptyMode]);

  const visibleChips = showAllChips ? QUICK_ADD : QUICK_ADD.slice(0, 12);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen overflow-hidden bg-background-primary text-text-primary">
      {/* 배경 — 매칭 레시피 marquee */}
      <RecipeMarquee recipes={recipes} active={items.length > 0} />

      {/* 상단 — 타이틀 + 디자인 토글 + 비우기 모드 */}
      <header className="relative z-10 px-4 pt-4 md:pt-6 pb-2 flex items-center justify-between gap-3">
        <Link href="/" className="text-xl md:text-2xl font-bold text-accent-warm">낼름</Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEmptyMode(m => !m)}
            className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
              emptyMode
                ? 'bg-error/20 text-error ring-1 ring-error/40'
                : 'bg-white/5 text-text-muted hover:text-text-primary'
            }`}
            aria-pressed={emptyMode}
          >
            🔥 비우기 모드
          </button>
          <DesignToggle tone={tone} setTone={setTone} />
        </div>
      </header>

      {/* 메인 — 80% 화면 냉장고 */}
      <main className="relative z-10 flex flex-col items-center justify-start px-4 pb-32">
        <div className="w-full max-w-md md:max-w-lg">
          <p className="text-center text-xs md:text-sm text-text-muted mb-2">
            {emptyMode ? '시들 직전 재료부터 정렬됩니다' : '냉장고 문을 탭하거나 위로 스와이프해서 열어보세요'}
          </p>

          <FridgeBigVisual
            tone={tone}
            doorOpen={doorOpen}
            onToggleDoor={() => setDoorOpen(o => !o)}
            items={sortedItems}
            onRemove={removeItem}
            loading={loading}
          />
        </div>

        {/* 재료 추가 패널 */}
        <section className="w-full max-w-md md:max-w-lg mt-6">
          <h2 className="text-sm font-bold text-text-secondary mb-2">⚡ 빠른 추가</h2>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {visibleChips.map(item => (
              <button
                key={item.name}
                onClick={() => addQuickItem(item)}
                disabled={adding}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-background-secondary border border-white/10 text-xs hover:border-accent-warm/50 hover:bg-accent-warm/10 transition-all disabled:opacity-50"
              >
                <span>{item.emoji}</span>
                <span>{item.name}</span>
              </button>
            ))}
            {!showAllChips && (
              <button
                onClick={() => setShowAllChips(true)}
                className="px-3 py-1.5 rounded-full bg-background-tertiary text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                + 더보기
              </button>
            )}
          </div>

          {/* 한 줄 다중 입력 */}
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
            <button
              onClick={addMultiFromText}
              disabled={adding || multiInput.trim().length === 0}
              className="px-5 py-3 rounded-xl bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-50"
            >
              추가
            </button>
          </div>
          <p className="mt-2 text-[11px] text-text-muted">
            공백/콤마로 구분 · 숫자/단위 자동 무시 · {!user && '체험 모드 (로그인하면 저장됩니다)'}
          </p>
        </section>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-background-secondary border border-accent-warm/30 text-sm shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function DesignToggle({ tone, setTone }: { tone: DesignTone; setTone: (t: DesignTone) => void }) {
  return (
    <div className="flex bg-background-secondary rounded-full p-0.5 border border-white/10">
      <button
        onClick={() => setTone('skeuomorphic')}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          tone === 'skeuomorphic' ? 'bg-accent-warm text-background-primary' : 'text-text-muted'
        }`}
      >
        리얼
      </button>
      <button
        onClick={() => setTone('minimal')}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          tone === 'minimal' ? 'bg-accent-warm text-background-primary' : 'text-text-muted'
        }`}
      >
        미니멀
      </button>
    </div>
  );
}

function FridgeBigVisual({
  tone, doorOpen, onToggleDoor, items, onRemove, loading,
}: {
  tone: DesignTone;
  doorOpen: boolean;
  onToggleDoor: () => void;
  items: FridgeItem[];
  onRemove: (id: string) => void;
  loading: boolean;
}) {
  // 스와이프 다운으로 열기, 위로 스와이프로 닫기
  const touchStartY = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > 40) {
      if (dy > 0 && !doorOpen) onToggleDoor();
      else if (dy < 0 && doorOpen) onToggleDoor();
    }
    touchStartY.current = null;
  };

  if (tone === 'minimal') {
    return (
      <div
        className="relative w-full aspect-[3/4] cursor-pointer select-none"
        onClick={onToggleDoor}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="button"
        aria-label={doorOpen ? '냉장고 닫기' : '냉장고 열기'}
      >
        {/* 미니멀: 라인 아트 + 깔끔한 배경 */}
        <div className="absolute inset-0 rounded-3xl border-2 border-white/20 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm overflow-hidden">
          {/* 손잡이 */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-white/30 rounded-full" />
          {/* 분할선 */}
          <div className="absolute top-[35%] left-0 right-0 h-px bg-white/15" />

          {/* 문 (닫힌 상태 오버레이) */}
          <div
            className={`absolute inset-0 transition-transform duration-700 ease-out ${
              doorOpen ? '-translate-y-full' : 'translate-y-0'
            }`}
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)' }}
          >
            {!doorOpen && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="text-5xl opacity-30">🧊</div>
                <p className="text-sm text-text-muted">탭해서 열기</p>
                {items.length > 0 && (
                  <p className="text-xs text-accent-warm">{items.length}개 재료</p>
                )}
              </div>
            )}
          </div>

          {/* 안쪽 — 재료 그리드 */}
          <FridgeContents items={items} onRemove={onRemove} loading={loading} variant="minimal" />
        </div>
      </div>
    );
  }

  // Skeuomorphic
  return (
    <div
      className="relative w-full aspect-[3/4] cursor-pointer select-none"
      onClick={onToggleDoor}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="button"
      aria-label={doorOpen ? '냉장고 닫기' : '냉장고 열기'}
    >
      {/* 본체 */}
      <div
        className="absolute inset-0 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #d8dde3 0%, #b8bfc7 100%)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.4)',
        }}
      >
        {/* 손잡이 */}
        <div
          className="absolute right-3 top-[40%] w-2 h-20 rounded-full"
          style={{
            background: 'linear-gradient(180deg, #6a7079 0%, #4a5059 100%)',
            boxShadow: '2px 2px 6px rgba(0,0,0,0.5)',
          }}
        />
        {/* 분할선 (냉동/냉장) */}
        <div className="absolute top-[28%] left-0 right-0 h-1 bg-black/30" />
        {/* 패널 라벨 */}
        <div className="absolute top-2 left-3 text-[10px] font-mono text-black/40 tracking-wider">NAELUM</div>

        {/* 문 (닫힌 상태) */}
        <div
          className={`absolute inset-0 transition-transform duration-700 ease-out ${
            doorOpen ? '-translate-y-full' : 'translate-y-0'
          }`}
          style={{
            background: 'linear-gradient(180deg, #e8edf2 0%, #c8cfd6 100%)',
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.15)',
          }}
        >
          {!doorOpen && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <div className="text-6xl">🧊</div>
              <p className="text-sm font-medium text-black/50">탭해서 열기</p>
              {items.length > 0 && (
                <div className="px-3 py-1 rounded-full bg-black/10 text-xs text-black/70">
                  {items.length}개 재료
                </div>
              )}
            </div>
          )}
        </div>

        {/* 내부 */}
        <FridgeContents items={items} onRemove={onRemove} loading={loading} variant="skeuomorphic" />
      </div>
    </div>
  );
}

function FridgeContents({
  items, onRemove, loading, variant,
}: {
  items: FridgeItem[];
  onRemove: (id: string) => void;
  loading: boolean;
  variant: DesignTone;
}) {
  const isMinimal = variant === 'minimal';
  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={isMinimal ? 'text-text-muted text-sm' : 'text-black/50 text-sm'}>로딩중...</div>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6">
        <div className="text-4xl opacity-40">📭</div>
        <p className={isMinimal ? 'text-sm text-text-muted text-center' : 'text-sm text-black/50 text-center'}>
          냉장고가 비어있어요.<br />아래에서 재료를 추가하세요.
        </p>
      </div>
    );
  }
  return (
    <div
      className="absolute inset-0 p-4 pt-8 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {items.map(item => (
          <FridgeItemTile key={item.id} item={item} onRemove={onRemove} variant={variant} />
        ))}
      </div>
    </div>
  );
}

function FridgeItemTile({
  item, onRemove, variant,
}: {
  item: FridgeItem;
  onRemove: (id: string) => void;
  variant: DesignTone;
}) {
  const days = daysUntilExpiry(item.expiry_date);
  const color = freshnessColor(days);
  const emoji = getEmojiForName(item.ingredient_name, item.category);
  const expired = days !== null && days < 0;

  return (
    <button
      onClick={() => onRemove(item.id)}
      className="relative aspect-square rounded-xl flex flex-col items-center justify-center p-1 transition-all hover:scale-105 active:scale-95 group"
      style={{
        background: color.bg,
        boxShadow: `inset 0 0 0 1.5px ${color.ring}`,
        opacity: expired ? 0.5 : 1,
      }}
      title={`${item.ingredient_name}${color.label ? ` · ${color.label}` : ''} (탭해서 삭제)`}
    >
      <span className="text-2xl md:text-3xl" style={{ filter: expired ? 'grayscale(60%)' : 'none' }}>
        {emoji}
      </span>
      <span className={variant === 'minimal' ? 'text-[10px] text-text-primary mt-0.5 truncate w-full text-center' : 'text-[10px] text-black/80 mt-0.5 font-medium truncate w-full text-center'}>
        {item.ingredient_name}
      </span>
      {color.label && (
        <span
          className="absolute top-0.5 right-0.5 text-[9px] font-bold px-1 rounded"
          style={{ color: color.ring, background: 'rgba(0,0,0,0.4)' }}
        >
          {color.label}
        </span>
      )}
    </button>
  );
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

function RecipeMarquee({ recipes, active }: { recipes: RecipeCard[]; active: boolean }) {
  if (!active || recipes.length === 0) return null;
  // 무한 스크롤을 위해 두 번 복제
  const doubled = [...recipes, ...recipes];
  return (
    <div className="absolute inset-x-0 top-1/3 h-40 z-0 overflow-hidden pointer-events-none opacity-30">
      <div className="flex gap-4 animate-marquee whitespace-nowrap">
        {doubled.map((r, idx) => (
          <div key={`${r.id}-${idx}`} className="flex-shrink-0 w-48 h-32 rounded-xl overflow-hidden bg-background-secondary">
            {r.thumbnail_url ? (
              <Image
                src={r.thumbnail_url.replace(/^http:\/\//, 'https://')}
                alt={r.title}
                width={192}
                height={128}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🍲</div>
            )}
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}

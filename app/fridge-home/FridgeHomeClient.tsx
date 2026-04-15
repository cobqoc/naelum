'use client';

/**
 * 낼름 — 수명선(Lifeline) + 손전등(Flashlight) 실험 홈
 *
 * 컨셉: 냉장고를 "공간"으로 그리지 않는다. 시간으로 그린다.
 * - 화면 = 어둠 속 냉장고 안쪽
 * - 가로축 = 시간 (왼쪽=오늘, 오른쪽=2주 후)
 * - 각 재료는 자기 만료일 위치에 떠있다
 * - 위험 재료(D-3 이내)는 어둠 속에서도 빨갛게 깜빡이며 시야에 들어옴
 * - 마우스/손가락 주변만 손전등으로 환해짐 — "까먹은 재료를 비춰본다"
 *
 * 만개·Yummly 누구도 만든 적 없는 형태. 진짜 차별화 시도.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

const TIMELINE_DAYS = 14; // 가로축이 표현하는 최대 일수
const FLASHLIGHT_RADIUS = 220; // 손전등 반경(px)
const DANGER_THRESHOLD = 3; // D-3 이내면 어둠 속에서도 보임

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntilExpiry(expiry_date: string | null): number {
  if (!expiry_date) return TIMELINE_DAYS;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp = new Date(expiry_date); exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function addDaysISO(d: number): string {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date.toISOString().slice(0, 10);
}

function genDemoId(): string {
  return `demo-${Math.random().toString(36).slice(2, 10)}`;
}

// 한 줄 다중 입력 파서
function parseMultiInput(text: string): string[] {
  return text
    .split(/[\s,，、]+/)
    .map(t => t.replace(/\d+(개|g|kg|ml|l|모|장|컵|큰술|작은술|줌|봉|통|병|포기)?$/i, '').trim())
    .filter(t => t.length > 0 && t.length <= 30);
}

// 데모 데이터: 위험/경고/안전 분포가 골고루 보이도록 큐레이션
const DEMO_ITEMS: FridgeItem[] = [
  { id: 'demo-d0', ingredient_name: '두부', category: 'other', expiry_date: addDaysISO(0), storage_location: '냉장' },
  { id: 'demo-d1', ingredient_name: '대파', category: 'veggie', expiry_date: addDaysISO(1), storage_location: '냉장' },
  { id: 'demo-d2', ingredient_name: '시금치', category: 'veggie', expiry_date: addDaysISO(2), storage_location: '냉장' },
  { id: 'demo-d4', ingredient_name: '돼지고기', category: 'meat', expiry_date: addDaysISO(4), storage_location: '냉장' },
  { id: 'demo-d6', ingredient_name: '양파', category: 'veggie', expiry_date: addDaysISO(6), storage_location: '상온' },
  { id: 'demo-d8', ingredient_name: '계란', category: 'dairy', expiry_date: addDaysISO(8), storage_location: '냉장' },
  { id: 'demo-d11', ingredient_name: '김치', category: 'other', expiry_date: addDaysISO(11), storage_location: '냉장' },
  { id: 'demo-d13', ingredient_name: '된장', category: 'seasoning', expiry_date: addDaysISO(13), storage_location: '냉장' },
];

function getEmojiForName(name: string, category: string): string {
  const found = QUICK_ADD.find(q => q.name === name || name.includes(q.name) || q.name.includes(name));
  if (found) return found.emoji;
  const cat: Record<string, string> = {
    veggie: '🥬', meat: '🥩', seafood: '🐟', dairy: '🥛',
    grain: '🌾', seasoning: '🧂', other: '📦',
  };
  return cat[category] ?? '📦';
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FridgeHomeClient() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [multiInput, setMultiInput] = useState('');
  const [showAllChips, setShowAllChips] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [flashlight, setFlashlight] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0, y: 0, visible: false,
  });
  const [alwaysLit, setAlwaysLit] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Data ────────────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  // ── Add / Remove ────────────────────────────────────────────────────────────

  const addQuickItem = async (item: QuickAddIngredient) => {
    if (adding) return;
    setAdding(true);
    if (!user) {
      const newItem: FridgeItem = {
        id: genDemoId(),
        ingredient_name: item.name,
        category: item.category,
        expiry_date: addDaysISO(
          item.category === 'seasoning' ? 14 :
          item.category === 'dairy' ? 7 :
          item.category === 'meat' || item.category === 'seafood' ? 5 :
          7
        ),
        storage_location: item.storage,
      };
      setItems(prev => [...prev, newItem]);
      showToast(`${item.name} 추가 (체험 모드)`);
      setAdding(false);
      return;
    }
    const client = createClient();
    const { error } = await client.from('user_ingredients').insert(quickAddToPayload(item, user.id));
    if (error) showToast('추가 실패: ' + error.message);
    else {
      showToast(`${item.name} 추가 완료`);
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
      const fallback: QuickAddIngredient = match ?? {
        name: token, emoji: '📦', category: 'other', storage: '냉장',
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
    setAdding(false);
  };

  const removeItem = async (id: string) => {
    if (id.startsWith('demo-')) {
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('먹었어요 👅');
      return;
    }
    const client = createClient();
    setItems(prev => prev.filter(i => i.id !== id));
    await client.from('user_ingredients').delete().eq('id', id);
    window.dispatchEvent(new Event('fridge-updated'));
    showToast('먹었어요 👅');
  };

  // ── Flashlight ──────────────────────────────────────────────────────────────

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setFlashlight({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  };
  const handlePointerLeave = () => {
    setFlashlight(f => ({ ...f, visible: false }));
  };

  // ── Item positioning ────────────────────────────────────────────────────────

  // 같은 시간대 충돌 방지: 같은 day에 있는 재료는 Y로 stagger
  const positioned = useMemo(() => {
    const byDay: Record<number, number> = {};
    return items.map(item => {
      const days = Math.max(0, Math.min(daysUntilExpiry(item.expiry_date), TIMELINE_DAYS));
      const dayKey = Math.round(days);
      const stackIndex = byDay[dayKey] ?? 0;
      byDay[dayKey] = stackIndex + 1;
      // 가로: 0(오늘)~14(2주 후) → 5%~95%
      const xPct = 5 + (days / TIMELINE_DAYS) * 90;
      // 세로: stagger 패턴 (위/아래 번갈아)
      const stackOffset = stackIndex * 56;
      return {
        ...item,
        days,
        xPct,
        stackOffset,
      };
    });
  }, [items]);

  const dangerCount = positioned.filter(p => p.days <= DANGER_THRESHOLD).length;
  const visibleChips = showAllChips ? QUICK_ADD : QUICK_ADD.slice(0, 12);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#050505] text-text-primary overflow-x-hidden">
      {/* 헤더 */}
      <header className="relative z-20 px-4 pt-4 md:pt-6 pb-2 flex items-center justify-between gap-3">
        <Link href="/" className="text-xl md:text-2xl font-bold text-accent-warm">낼름</Link>
        <div className="flex items-center gap-2">
          {dangerCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-error/15 text-error text-xs font-bold animate-pulse">
              ⚠️ {dangerCount}개 임박
            </span>
          )}
          <button
            onClick={() => setAlwaysLit(v => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              alwaysLit
                ? 'bg-accent-warm text-background-primary'
                : 'bg-white/5 text-text-muted hover:text-text-primary'
            }`}
          >
            {alwaysLit ? '🔦 전체 보기' : '🌙 어둠 모드'}
          </button>
        </div>
      </header>

      {/* 인트로 텍스트 */}
      <div className="relative z-20 px-4 mb-4 text-center">
        <p className="text-xs md:text-sm text-text-muted">
          {alwaysLit
            ? '재료의 수명선 — 왼쪽일수록 곧 시들어요'
            : '커서를 움직여 냉장고 안을 비춰보세요. 시들기 직전 재료는 어둠 속에서도 빛납니다.'}
        </p>
      </div>

      {/* === 메인 캔버스 === */}
      <div
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onTouchMove={(e) => {
          if (!canvasRef.current) return;
          const t = e.touches[0];
          const rect = canvasRef.current.getBoundingClientRect();
          setFlashlight({ x: t.clientX - rect.left, y: t.clientY - rect.top, visible: true });
        }}
        className="relative w-full"
        style={{ height: '60vh', minHeight: '380px', maxHeight: '560px' }}
      >
        {/* 시간축 라벨 */}
        <TimelineAxis />

        {/* 재료들 */}
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
            로딩중...
          </div>
        ) : positioned.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
            <div className="text-5xl opacity-30">🌑</div>
            <p className="text-sm text-text-muted">냉장고가 비어있어요.<br />아래에서 재료를 추가하면 시간선에 떠올라요.</p>
          </div>
        ) : (
          positioned.map(p => (
            <ItemCard
              key={p.id}
              item={p}
              onRemove={removeItem}
            />
          ))
        )}

        {/* 손전등 마스크 — z-20에 위치 (일반 아이템 위, 위험 아이템 아래) */}
        {!alwaysLit && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              zIndex: 20,
              background: flashlight.visible
                ? `radial-gradient(circle ${FLASHLIGHT_RADIUS}px at ${flashlight.x}px ${flashlight.y}px, transparent 0%, rgba(5,5,5,0.4) 40%, rgba(5,5,5,0.92) 100%)`
                : 'rgba(5,5,5,0.92)',
            }}
          />
        )}
      </div>

      {/* === 재료 추가 패널 === */}
      <section className="relative z-20 max-w-md md:max-w-lg mx-auto px-4 mt-4 pb-32">
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
          공백/콤마로 구분 · 숫자/단위 자동 무시 {!user && '· 체험 모드 (로그인하면 저장됨)'}
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

function TimelineAxis() {
  const marks = [
    { label: '오늘', xPct: 5, accent: true },
    { label: '3일', xPct: 5 + (3 / TIMELINE_DAYS) * 90 },
    { label: '1주', xPct: 5 + (7 / TIMELINE_DAYS) * 90 },
    { label: '2주', xPct: 95 },
  ];
  return (
    <>
      {/* 가로 시간축 라인 */}
      <div
        className="absolute left-0 right-0 top-1/2 h-px"
        style={{
          background: 'linear-gradient(90deg, rgba(220,38,38,0.5) 0%, rgba(234,179,8,0.3) 25%, rgba(34,197,94,0.2) 60%, rgba(255,255,255,0.05) 100%)',
        }}
      />
      {/* 위험 영역 강조 (왼쪽 1/4) */}
      <div
        className="absolute left-0 top-0 bottom-0 pointer-events-none"
        style={{
          width: `${5 + (DANGER_THRESHOLD / TIMELINE_DAYS) * 90}%`,
          background: 'linear-gradient(90deg, rgba(220,38,38,0.08) 0%, transparent 100%)',
        }}
      />
      {/* 라벨 */}
      {marks.map(m => (
        <div
          key={m.label}
          className="absolute top-1/2 mt-3 -translate-x-1/2 text-[10px] tracking-wider"
          style={{ left: `${m.xPct}%`, color: m.accent ? '#dc2626' : 'rgba(255,255,255,0.3)' }}
        >
          {m.label}
        </div>
      ))}
    </>
  );
}

type PositionedItem = FridgeItem & { days: number; xPct: number; stackOffset: number };

function ItemCard({
  item, onRemove,
}: {
  item: PositionedItem;
  onRemove: (id: string) => void;
}) {
  const isDanger = item.days <= DANGER_THRESHOLD;
  const isExpired = item.days <= 0;
  const isWarning = item.days > DANGER_THRESHOLD && item.days <= 7;
  const emoji = getEmojiForName(item.ingredient_name, item.category);
  const color = isExpired ? '#7a1f1f' : isDanger ? '#dc2626' : isWarning ? '#eab308' : '#ffffff';
  const glow = isDanger ? `0 0 24px ${color}, 0 0 48px ${color}aa` : 'none';

  return (
    <button
      onClick={() => onRemove(item.id)}
      className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 active:scale-95 ${
        isDanger ? 'animate-pulse' : ''
      }`}
      style={{
        left: `${item.xPct}%`,
        top: `calc(50% - 80px + ${item.stackOffset}px)`,
        zIndex: isDanger ? 30 : 5,
      }}
      title={`${item.ingredient_name} · D-${Math.max(item.days, 0)} · 탭해서 먹기`}
    >
      <div
        className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl backdrop-blur-sm"
        style={{
          background: isDanger ? 'rgba(220,38,38,0.18)' : 'rgba(255,255,255,0.06)',
          boxShadow: glow,
          border: `1px solid ${isDanger ? color : 'rgba(255,255,255,0.15)'}`,
        }}
      >
        <span className="text-2xl md:text-3xl" style={{ filter: isExpired ? 'grayscale(60%)' : 'none' }}>
          {emoji}
        </span>
        <span className="text-[10px] font-medium whitespace-nowrap" style={{ color }}>
          {item.ingredient_name}
        </span>
        <span className="text-[9px] font-bold tracking-wider" style={{ color }}>
          D-{Math.max(item.days, 0)}
        </span>
      </div>
    </button>
  );
}

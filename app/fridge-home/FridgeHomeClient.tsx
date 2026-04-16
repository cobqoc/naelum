'use client';

/**
 * 낼름 — 자기부상(Buoyancy) 냉장고 실험 홈
 *
 * 컨셉: 신선도 = 부력. 신선한 재료는 위에 둥둥, 시들수록 가라앉는다.
 * - 세로 화면 = 물속. 위가 신선, 아래가 위험.
 * - 각 재료가 자기 만료일 기반으로 떠있거나 가라앉음
 * - 만료 재료는 바닥에 가라앉아 회색으로 시들어감
 * - 탭하면 위로 솟구쳤다 사라짐 ("먹었다")
 * - 모바일 세로 레이아웃에 최적화. 터치 퍼스트. 마우스 의존 없음.
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntilExpiry(d: string | null): number {
  if (!d) return 14;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp = new Date(d); exp.setHours(0, 0, 0, 0);
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

function parseMultiInput(text: string): string[] {
  return text
    .split(/[\s,，、]+/)
    .map(t => t.replace(/\d+(개|g|kg|ml|l|모|장|컵|큰술|작은술|줌|봉|통|병|포기)?$/i, '').trim())
    .filter(t => t.length > 0 && t.length <= 30);
}

// 신선도(일수) → 수직 위치 (0%=꼭대기, 100%=바닥)
function freshnessToPct(days: number): number {
  if (days <= 0) return 88 + Math.random() * 8;        // 만료: 바닥에 가라앉음
  if (days <= 3) return 65 + Math.random() * 15;       // 위험: 아래쪽
  if (days <= 7) return 35 + Math.random() * 20;       // 경고: 중간
  return 5 + Math.random() * 25;                       // 안전: 위쪽 둥둥
}

// 가로 분포: 아이템 index 기반으로 고르게 분산 + 약간 랜덤
function spreadX(index: number, total: number): number {
  if (total <= 1) return 50;
  const base = 12 + ((index / (total - 1)) * 76);     // 12%~88% 균등 분배
  const jitter = (Math.random() - 0.5) * 14;          // ±7% 랜덤 오프셋
  return Math.min(88, Math.max(12, base + jitter));
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

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FridgeHomeClient() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [multiInput, setMultiInput] = useState('');
  const [showAllChips, setShowAllChips] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

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

  // ── Add / Remove ───────────────────────────────────────────────────────────

  const addQuickItem = async (item: QuickAddIngredient) => {
    if (adding) return;
    setAdding(true);
    if (!user) {
      const newItem: FridgeItem = {
        id: genDemoId(), ingredient_name: item.name, category: item.category,
        expiry_date: addDaysISO(item.category === 'seasoning' ? 14 : item.category === 'dairy' ? 7 : item.category === 'meat' ? 5 : 7),
        storage_location: item.storage,
      };
      setItems(prev => [...prev, newItem]);
      showToast(`${item.name} 추가 (체험 모드)`);
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
    setAdding(false);
  };

  const removeItem = async (id: string) => {
    // 위로 솟구치는 애니 후 제거
    setRemovingIds(prev => new Set(prev).add(id));
    setTimeout(async () => {
      if (id.startsWith('demo-')) {
        setItems(prev => prev.filter(i => i.id !== id));
      } else {
        setItems(prev => prev.filter(i => i.id !== id));
        const client = createClient();
        await client.from('user_ingredients').delete().eq('id', id);
        window.dispatchEvent(new Event('fridge-updated'));
      }
      setRemovingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 500);
    showToast('👅 낼름!');
  };

  // ── Positioned Items ───────────────────────────────────────────────────────

  const positioned = useMemo(() => {
    return items.map((item, idx) => {
      const days = daysUntilExpiry(item.expiry_date);
      return {
        ...item,
        days,
        yPct: freshnessToPct(days),
        xPct: spreadX(idx, items.length),
        bobDelay: (idx * 0.7) % 4,
        bobDuration: 2.5 + (idx % 3) * 0.8,
      };
    });
  }, [items]);

  const dangerCount = positioned.filter(p => p.days <= 3).length;
  const visibleChips = showAllChips ? QUICK_ADD : QUICK_ADD.slice(0, 12);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-text-primary overflow-hidden">

      {/* 헤더 */}
      <header className="relative z-20 px-4 pt-4 md:pt-6 pb-1 flex items-center justify-between">
        <Link href="/" className="text-xl md:text-2xl font-bold text-accent-warm">낼름</Link>
        <div className="flex items-center gap-2">
          {dangerCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-error/15 text-error text-xs font-bold animate-pulse">
              ⚠️ {dangerCount}개 임박
            </span>
          )}
          <span className="text-xs text-text-muted">{items.length}개 재료</span>
        </div>
      </header>

      {/* 수면 가이드 */}
      <div className="relative z-10 px-4 mb-1">
        <div className="flex justify-between items-center text-[10px] text-white/25 tracking-wider">
          <span>🟢 신선</span>
          <span>탭하면 먹어요</span>
          <span>🔴 위험</span>
        </div>
      </div>

      {/* === 메인 캔버스: 물속 === */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: '58vh', minHeight: '360px', maxHeight: '540px',
          background: 'linear-gradient(180deg, #0d1b2a 0%, #0a1628 25%, #091220 50%, #0f0a18 75%, #1a0a0a 100%)',
        }}
      >
        {/* 수면 효과 (상단 빛 라인) */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(34,197,94,0.4) 50%, transparent 90%)' }}
        />
        {/* 바닥 위험 영역 표시 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/4 pointer-events-none"
          style={{ background: 'linear-gradient(0deg, rgba(220,38,38,0.12) 0%, transparent 100%)' }}
        />
        {/* 수심 라벨 (오른쪽) */}
        <div className="absolute right-2 top-[10%] text-[9px] text-white/15 writing-mode-vertical">안전</div>
        <div className="absolute right-2 top-[45%] text-[9px] text-white/15">경고</div>
        <div className="absolute right-2 bottom-[8%] text-[9px] text-error/30 font-bold">위험</div>

        {/* 거품 배경 데코레이션 */}
        <Bubbles />

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
            로딩중...
          </div>
        ) : positioned.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="text-5xl opacity-30">🫧</div>
            <p className="text-sm text-text-muted">재료를 추가하면<br />신선도에 따라 떠올라요</p>
          </div>
        ) : (
          positioned.map(p => (
            <FloatingItem
              key={p.id}
              item={p}
              removing={removingIds.has(p.id)}
              onRemove={removeItem}
            />
          ))
        )}
      </div>

      {/* === 재료 추가 패널 === */}
      <section className="relative z-20 max-w-md md:max-w-lg mx-auto px-4 mt-5 pb-32">
        <h2 className="text-sm font-bold text-text-secondary mb-2">⚡ 빠른 추가</h2>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {visibleChips.map(item => (
            <button
              key={item.name}
              onClick={() => addQuickItem(item)}
              disabled={adding}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs hover:border-accent-warm/50 hover:bg-accent-warm/10 transition-all disabled:opacity-50 active:scale-95"
            >
              <span>{item.emoji}</span>
              <span>{item.name}</span>
            </button>
          ))}
          {!showAllChips && (
            <button
              onClick={() => setShowAllChips(true)}
              className="px-3 py-1.5 rounded-full bg-white/[0.06] text-xs text-text-muted hover:text-text-primary transition-colors"
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
            className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-warm/50"
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1a2030] border border-accent-warm/30 text-sm shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

type PositionedItem = FridgeItem & {
  days: number; yPct: number; xPct: number; bobDelay: number; bobDuration: number;
};

function FloatingItem({
  item, removing, onRemove,
}: {
  item: PositionedItem;
  removing: boolean;
  onRemove: (id: string) => void;
}) {
  const isDanger = item.days <= 3;
  const isExpired = item.days <= 0;
  const isWarning = item.days > 3 && item.days <= 7;
  const emoji = getEmojiForName(item.ingredient_name, item.category);

  // 색상 체계
  const ringColor = isExpired ? '#7a1f1f' : isDanger ? '#dc2626' : isWarning ? '#ca8a04' : '#22c55e';
  const bgColor = isExpired ? 'rgba(120,30,30,0.35)' : isDanger ? 'rgba(220,38,38,0.20)' : isWarning ? 'rgba(202,138,4,0.15)' : 'rgba(34,197,94,0.10)';
  const textColor = isExpired ? '#b07070' : isDanger ? '#fca5a5' : isWarning ? '#fde68a' : '#d1fae5';
  const glow = isDanger ? `0 0 16px ${ringColor}80, 0 0 32px ${ringColor}40` : `0 0 8px ${ringColor}30`;

  // 크기: 위험할수록 약간 커짐 (주목도↑)
  const scale = isDanger ? 'scale-110' : '';

  return (
    <button
      onClick={() => onRemove(item.id)}
      className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-[1.15] active:scale-90 ${scale} ${
        removing ? 'animate-eaten' : 'animate-float'
      }`}
      style={{
        left: `${item.xPct}%`,
        top: removing ? '-10%' : `${item.yPct}%`,
        opacity: removing ? 0 : 1,
        animationDelay: `${item.bobDelay}s`,
        animationDuration: `${item.bobDuration}s`,
        zIndex: isDanger ? 15 : 10,
      }}
    >
      <div
        className="flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-2xl backdrop-blur-md"
        style={{
          background: bgColor,
          boxShadow: glow,
          border: `1.5px solid ${ringColor}`,
        }}
      >
        <span
          className="text-3xl md:text-4xl drop-shadow-lg"
          style={{ filter: isExpired ? 'grayscale(50%) brightness(0.7)' : 'none' }}
        >
          {emoji}
        </span>
        <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: textColor }}>
          {item.ingredient_name}
        </span>
        <span
          className="text-[9px] font-bold tracking-widest uppercase"
          style={{ color: ringColor }}
        >
          {isExpired ? '만료' : `D-${item.days}`}
        </span>
      </div>
    </button>
  );
}

function Bubbles() {
  // 미세한 거품 데코 (CSS only, 성능 영향 없음)
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/[0.03] animate-bubble"
          style={{
            width: `${8 + i * 4}px`,
            height: `${8 + i * 4}px`,
            left: `${15 + i * 14}%`,
            bottom: '-20px',
            animationDelay: `${i * 1.5}s`,
            animationDuration: `${6 + i * 2}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-12px); }
        }
        @keyframes eaten {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -200%) scale(0.3); opacity: 0; }
        }
        @keyframes bubble {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { opacity: 0.6; }
          100% { transform: translateY(-65vh) scale(1.2); opacity: 0; }
        }
        :global(.animate-float) {
          animation: float ease-in-out infinite;
        }
        :global(.animate-eaten) {
          animation: eaten 0.5s ease-out forwards !important;
        }
        :global(.animate-bubble) {
          animation: bubble linear infinite;
        }
      `}</style>
    </div>
  );
}

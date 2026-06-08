'use client';

import { useState, useEffect } from 'react';
import Link from '@/components/Common/LocalizedLink';
import { useI18n } from '@/lib/i18n/context';
import {
  FridgeIngredient,
  FridgeShell,
  FridgeHeader,
  FridgeFooter,
  ShelfSection,
} from '@/components/Fridge/FridgeShelf';
import { SAMPLE_INGREDIENTS } from '@/components/Fridge/sampleIngredients';

// --- Types ---
interface GroupedIngredients {
  refrigerator: FridgeIngredient[];
  freezer: FridgeIngredient[];
  roomTemp: FridgeIngredient[];
}

type FridgeState = 'loading' | 'anonymous' | 'empty' | 'filled';

function groupByStorage(ingredients: FridgeIngredient[]): GroupedIngredients {
  return {
    refrigerator: ingredients.filter(i => i.storage_location === '냉장' || !i.storage_location),
    freezer: ingredients.filter(i => i.storage_location === '냉동'),
    roomTemp: ingredients.filter(i => i.storage_location === '상온' || i.storage_location === '기타'),
  };
}

// --- FridgeInterior (로그인 + 재료 있음) ---
function FridgeInterior({ grouped }: { grouped: GroupedIngredients }) {
  const { t } = useI18n();

  return (
    <FridgeShell>
      <FridgeHeader title={`❄️ ${t.fridge.title}`} manageHref="/" />
      <ShelfSection sectionKey="냉장" label={t.fridge.refrigerator} icon="❄️" items={grouped.refrigerator} />
      <ShelfSection sectionKey="냉동" label={t.fridge.freezer} icon="🧊" items={grouped.freezer} />
      <ShelfSection sectionKey="상온" label={t.fridge.roomTemp} icon="🌡️" items={grouped.roomTemp} isLast />
      <FridgeFooter href="/recipes?tab=ingredient" label={`🔍 ${t.fridge.findRecipes}`} />
    </FridgeShell>
  );
}

// --- EmptyFridgeState (로그인 + 재료 없음) ---
function EmptyFridgeState() {
  const { t } = useI18n();
  const empty: FridgeIngredient[] = [];

  return (
    <FridgeShell>
      <FridgeHeader title={`❄️ ${t.fridge.title}`} manageHref="/" />
      <ShelfSection sectionKey="냉장" label={t.fridge.refrigerator} icon="❄️" items={empty} />
      <ShelfSection sectionKey="냉동" label={t.fridge.freezer} icon="🧊" items={empty} />
      <ShelfSection sectionKey="상온" label={t.fridge.roomTemp} icon="🌡️" items={empty} isLast />
      <div className="px-4 py-5 bg-[#1c2a3a] text-center">
        <p className="text-xs text-text-muted mb-3">
          {t.fridge.emptyMessage}
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-accent-warm text-background-primary text-xs font-bold hover:bg-accent-hover transition-colors"
        >
          + {t.fridge.addIngredients}
        </Link>
      </div>
    </FridgeShell>
  );
}

// --- AnonymousFridge (비로그인) — 블러 + 오버레이 유지 ---
function AnonymousFridge() {
  const { t } = useI18n();
  const sampleGrouped = groupByStorage(SAMPLE_INGREDIENTS);

  return (
    <FridgeShell>
      {/* 블러 처리된 냉장고 내부 (새 디자인) */}
      <div className="blur-[3px] select-none pointer-events-none">
        <FridgeHeader title={`❄️ ${t.fridge.title}`} />
        <ShelfSection sectionKey="냉장" label={t.fridge.refrigerator} icon="❄️" items={sampleGrouped.refrigerator} />
        <ShelfSection sectionKey="냉동" label={t.fridge.freezer} icon="🧊" items={sampleGrouped.freezer} />
        <ShelfSection sectionKey="상온" label={t.fridge.roomTemp} icon="🌡️" items={sampleGrouped.roomTemp} isLast />
        <div className="px-3 py-3 bg-[#1c2a3a]">
          <div className="py-2.5 rounded-xl bg-accent-warm/40 text-center text-xs text-background-primary/60 font-bold">
            🔍 {t.fridge.findRecipes}
          </div>
        </div>
      </div>

      {/* 중앙 안내 메시지 */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <p className="mx-5 px-4 py-3 rounded-xl bg-background-primary/80 backdrop-blur-sm text-sm text-text-secondary text-center leading-relaxed border border-white/10">
          {t.fridge.authMessage}
        </p>
      </div>

      {/* 하단 회원가입 / 로그인 버튼 */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-3">
        <div className="flex gap-2">
          <Link
            href="/signup"
            className="flex-1 py-2.5 rounded-xl bg-accent-warm text-background-primary font-bold text-xs text-center hover:bg-accent-hover transition-colors"
          >
            {t.fridge.signup}
          </Link>
          <Link
            href="/signin"
            className="flex-1 py-2.5 rounded-xl bg-background-tertiary text-text-primary font-bold text-xs text-center hover:bg-white/10 transition-colors border border-white/15"
          >
            {t.fridge.login}
          </Link>
        </div>
      </div>
    </FridgeShell>
  );
}

// --- Main ---
export default function InteractiveFridge() {
  const { t } = useI18n();
  const [state, setState] = useState<FridgeState>('loading');
  const [ingredients, setIngredients] = useState<FridgeIngredient[]>([]);

  useEffect(() => {
    // 데이터 계층 이전(docs/DATA_LAYER.md): getUser + 직접 read → GET /api/user-ingredients(401=비로그인).
    const fetchIngredients = async () => {
      let data: FridgeIngredient[] | null = null;
      try {
        const res = await fetch('/api/user-ingredients');
        if (res.status === 401) { setState('anonymous'); return; }
        if (res.ok) data = (await res.json()).items as FridgeIngredient[];
      } catch {
        // 네트워크 실패 — 아래 빈 처리
      }

      if (!data || data.length === 0) {
        setState('empty');
      } else {
        setIngredients(data);
        setState('filled');
      }
    };

    fetchIngredients();
  }, []);

  const grouped = groupByStorage(ingredients);

  if (state === 'loading') {
    return (
      <div className="w-full max-w-xs mx-auto md:max-w-sm">
        <div className="w-full rounded-2xl border border-white/10 overflow-hidden animate-pulse">
          <div className="h-10 bg-[#1c2a3a]" />
          {[0, 1, 2].map(i => (
            <div key={i}>
              <div className="h-16 bg-sky-50/20" />
              <div className="h-2.5 bg-sky-300/30" />
            </div>
          ))}
          <div className="h-14 bg-[#1c2a3a]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs mx-auto md:max-w-sm">
      {state !== 'anonymous' && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            🧊 {t.fridge.title}
          </h2>
        </div>
      )}
      {state === 'anonymous' && <AnonymousFridge />}
      {state === 'empty'     && <EmptyFridgeState />}
      {state === 'filled'    && <FridgeInterior grouped={grouped} />}
    </div>
  );
}

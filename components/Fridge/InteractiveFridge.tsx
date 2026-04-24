'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import {
  FridgeIngredient,
  FridgeShell,
  FridgeHeader,
  FridgeFooter,
  ShelfSection,
} from '@/components/Fridge/FridgeShelf';

// --- Types ---
interface GroupedIngredients {
  refrigerator: FridgeIngredient[];
  freezer: FridgeIngredient[];
  roomTemp: FridgeIngredient[];
}

type FridgeState = 'loading' | 'anonymous' | 'empty' | 'filled';

const SAMPLE_INGREDIENTS: FridgeIngredient[] = [
  { id: 's1', ingredient_name: '양파', category: 'veggie', storage_location: '냉장' },
  { id: 's2', ingredient_name: '소고기', category: 'meat', storage_location: '냉장' },
  { id: 's3', ingredient_name: '두부', category: 'other', storage_location: '냉장' },
  { id: 's4', ingredient_name: '계란', category: 'dairy', storage_location: '냉장' },
  { id: 's5', ingredient_name: '새우', category: 'seafood', storage_location: '냉동' },
  { id: 's6', ingredient_name: '삼겹살', category: 'meat', storage_location: '냉동' },
  { id: 's7', ingredient_name: '소금', category: 'seasoning', storage_location: '상온' },
  { id: 's8', ingredient_name: '쌀', category: 'grain', storage_location: '상온' },
];

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
      <FridgeFooter href="/recommendations" label={`🔍 ${t.fridge.findRecipes}`} />
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
            href="/login"
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
    const fetchIngredients = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) { setState('anonymous'); return; }

      const { data } = await supabase
        .from('user_ingredients')
        .select('id, ingredient_name, category, quantity, unit, expiry_date, storage_location')
        .eq('user_id', user.id)
        .order('expiry_date', { ascending: true, nullsFirst: false });

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

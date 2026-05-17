'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from '@/components/Common/LocalizedLink';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useI18n } from '@/lib/i18n/context';


// ─── 번역 없는 상수 ───────────────────────────────────────────

const TASTE_BAR: Record<string, string> = {
  sweet: 'bg-pink-400', salty: 'bg-blue-400', spicy: 'bg-red-400',
  sour: 'bg-yellow-400', bitter: 'bg-amber-600', umami: 'bg-orange-400',
};

const TASTE_EMOJI: Record<string, string> = {
  sweet: '🍬', salty: '🧂', spicy: '🌶️', sour: '🍋', bitter: '☕', umami: '🍖',
};

const TASTE_COLOR: Record<string, string> = {
  sweet: 'text-pink-300', salty: 'text-blue-300', spicy: 'text-red-300',
  sour: 'text-yellow-300', bitter: 'text-amber-500', umami: 'text-orange-300',
};

const TASTE_ACTIVE_BG: Record<string, string> = {
  sweet: 'bg-pink-500/25 border-pink-400', salty: 'bg-blue-500/25 border-blue-400',
  spicy: 'bg-red-500/25 border-red-400', sour: 'bg-yellow-500/25 border-yellow-400',
  bitter: 'bg-amber-800/25 border-amber-600', umami: 'bg-orange-500/25 border-orange-400',
};

const SEASON_COLOR: Record<string, string> = {
  spring: 'text-pink-300 bg-pink-500/15 border-pink-500/30',
  summer: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/30',
  fall: 'text-orange-300 bg-orange-500/15 border-orange-500/30',
  winter: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
  year_round: 'text-green-300 bg-green-500/15 border-green-500/30',
};

const SEASON_EMOJI: Record<string, string> = {
  spring: '🌸', summer: '☀️', fall: '🍂', winter: '❄️', year_round: '🌿',
};

const LIMIT = 60;

// ─── 타입 ────────────────────────────────────────────────────

interface NutritionInfo {
  calories?: number; carbs?: number; protein?: number; fat?: number; fiber?: number;
}

interface NutritionDetail {
  fiber?: number; sodium?: number; sugar?: number; moisture?: number; calcium?: number;
  iron?: number; phosphorus?: number; potassium?: number; zinc?: number;
  vitamin_a?: number; retinol?: number; beta_carotene?: number; vitamin_b1?: number;
  vitamin_b2?: number; vitamin_c?: number; vitamin_d?: number; niacin?: number;
  saturated_fat?: number; trans_fat?: number; cholesterol?: number;
  source?: string; food_code?: string;
}

interface IngredientItem {
  id: string;
  name: string;
  name_en: string | null;
  category: string | null;
  common_units: string[];
  tastes: Record<string, number> | null;
  countries_used: string[] | null;
  storage_tips: string | null;
  seasons: string[] | null;
  nutrition: NutritionInfo | null;
  nutrition_detail: NutritionDetail | null;
  pairs_well_with: string[] | null;
  description: string | null;
  emoji: string | null;
}

// ─── 상세 패널 서브 컴포넌트 ─────────────────────────────────

function TasteBars({ tastes }: { tastes: Record<string, number> | null }) {
  const { t } = useI18n();
  const tb = t.ingredient;
  const TASTE_LABEL: Record<string, string> = {
    sweet: tb.tasteSweet, salty: tb.tasteSalty, spicy: tb.tasteSpicy,
    sour: tb.tasteSour, bitter: tb.tasteBitter, umami: tb.tasteUmami,
  };
  if (!tastes) return <p className="text-xs text-text-muted">{tb.tasteDataNone}</p>;
  const entries = Object.keys(TASTE_LABEL)
    .map(key => ({ key, label: TASTE_LABEL[key], emoji: TASTE_EMOJI[key], bar: TASTE_BAR[key], value: tastes[key] ?? 0 }))
    .filter(e => e.value > 0).sort((a, b) => b.value - a.value);
  if (entries.length === 0) return <p className="text-xs text-text-muted">{tb.tasteDataNone}</p>;
  return (
    <div className="space-y-2.5">
      {entries.map(e => (
        <div key={e.key} className="flex items-center gap-3">
          <span className="text-base w-5 text-center">{e.emoji}</span>
          <span className="text-xs text-text-secondary w-12 shrink-0">{e.label}</span>
          <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${e.bar} transition-all duration-700`} style={{ width: `${(e.value / 5) * 100}%` }} />
          </div>
          <div className="flex gap-0.5 shrink-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < e.value ? e.bar : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NutritionBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background-primary/60 rounded-xl p-2.5 text-center border border-white/5">
      <p className="text-sm font-bold text-text-primary">{value}</p>
      <p className="text-[10px] text-text-muted mt-0.5">{label}</p>
    </div>
  );
}

function NutritionCard({ nutrition, detail }: { nutrition: NutritionInfo | null; detail: NutritionDetail | null }) {
  const { t } = useI18n();
  const tb = t.ingredient;
  const fiber = detail?.fiber ?? nutrition?.fiber;
  const basicItems = [
    { label: t.nutrition.calories, value: nutrition?.calories != null ? `${nutrition.calories}kcal` : null },
    { label: t.nutrition.carbs, value: nutrition?.carbs != null ? `${nutrition.carbs}g` : null },
    { label: t.nutrition.sugar, value: detail?.sugar != null ? `${detail.sugar}g` : null },
    { label: t.nutrition.protein, value: nutrition?.protein != null ? `${nutrition.protein}g` : null },
    { label: t.nutrition.fat, value: nutrition?.fat != null ? `${nutrition.fat}g` : null },
    { label: t.nutrition.fiber, value: fiber != null ? `${fiber}g` : null },
  ].filter(i => i.value !== null) as { label: string; value: string }[];
  const mineralItems = [
    { label: t.nutrition.calcium, value: detail?.calcium != null ? `${detail.calcium}mg` : null },
    { label: t.nutrition.iron, value: detail?.iron != null ? `${detail.iron}mg` : null },
    { label: t.nutrition.phosphorus, value: detail?.phosphorus != null ? `${detail.phosphorus}mg` : null },
    { label: t.nutrition.potassium, value: detail?.potassium != null ? `${detail.potassium}mg` : null },
    { label: t.nutrition.sodium, value: detail?.sodium != null ? `${detail.sodium}mg` : null },
    { label: t.nutrition.zinc, value: detail?.zinc != null ? `${detail.zinc}mg` : null },
  ].filter(i => i.value !== null) as { label: string; value: string }[];
  const vitaminItems = [
    { label: t.nutrition.vitaminA, value: detail?.vitamin_a != null ? `${detail.vitamin_a}μg` : null },
    { label: t.nutrition.vitaminB1, value: detail?.vitamin_b1 != null ? `${detail.vitamin_b1}mg` : null },
    { label: t.nutrition.vitaminB2, value: detail?.vitamin_b2 != null ? `${detail.vitamin_b2}mg` : null },
    { label: t.nutrition.vitaminC, value: detail?.vitamin_c != null ? `${detail.vitamin_c}mg` : null },
    { label: t.nutrition.vitaminD, value: detail?.vitamin_d != null ? `${detail.vitamin_d}μg` : null },
    { label: t.nutrition.niacin, value: detail?.niacin != null ? `${detail.niacin}mg` : null },
  ].filter(i => i.value !== null) as { label: string; value: string }[];
  if (basicItems.length === 0 && mineralItems.length === 0 && vitaminItems.length === 0) return null;
  return (
    <div className="space-y-4">
      {basicItems.length > 0 && (
        <div>
          <p className="text-[11px] text-text-muted font-medium mb-2 uppercase tracking-wide">{tb.nutritionBasic}</p>
          <div className="grid grid-cols-3 gap-2">{basicItems.map(item => <NutritionBadge key={item.label} {...item} />)}</div>
        </div>
      )}
      {mineralItems.length > 0 && (
        <div>
          <p className="text-[11px] text-text-muted font-medium mb-2 uppercase tracking-wide">{tb.nutritionMineral}</p>
          <div className="grid grid-cols-3 gap-2">{mineralItems.map(item => <NutritionBadge key={item.label} {...item} />)}</div>
        </div>
      )}
      {vitaminItems.length > 0 && (
        <div>
          <p className="text-[11px] text-text-muted font-medium mb-2 uppercase tracking-wide">{tb.nutritionVitamin}</p>
          <div className="grid grid-cols-3 gap-2">{vitaminItems.map(item => <NutritionBadge key={item.label} {...item} />)}</div>
        </div>
      )}
      {detail?.source && <p className="text-[10px] text-text-muted text-right">{tb.sourcePrefix} {detail.source}</p>}
    </div>
  );
}

function SectionHeader({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base">{emoji}</span>
      <h3 className="text-sm font-bold text-text-secondary">{title}</h3>
    </div>
  );
}

function Divider() { return <div className="h-px bg-white/5 my-5" />; }

// ─── 재료 상세 패널 ──────────────────────────────────────────

function IngredientPanel({
  item, related, onClose, onSelect,
}: {
  item: IngredientItem; related: IngredientItem[];
  onClose: () => void; onSelect: (item: IngredientItem) => void;
}) {
  const { t } = useI18n();
  const tb = t.ingredient;
  const SEASON_LABEL: Record<string, string> = {
    spring: tb.seasonSpring, summer: tb.seasonSummer,
    fall: tb.seasonFall, winter: tb.seasonWinter, year_round: tb.seasonYearRound,
  };
  const emoji = item.emoji ?? null;
  const catLabel = tb.categoryLabels[item.category as keyof typeof tb.categoryLabels] ?? '';
  const hasTastes = item.tastes && Object.values(item.tastes).some(v => v > 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background-secondary rounded-t-3xl border-t border-white/10 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-background-secondary pt-3 pb-2 flex justify-center z-10">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="px-5 pb-10 pt-1">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-background-tertiary to-background-primary flex items-center justify-center text-4xl flex-shrink-0 border border-white/5">
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold truncate">{item.name}</h2>
              {item.name_en && <p className="text-sm text-text-muted mt-0.5">{item.name_en}</p>}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {catLabel && (
                  <span className="px-2.5 py-1 rounded-full bg-accent-warm/15 border border-accent-warm/30 text-accent-warm text-xs font-medium">
                    {emoji} {catLabel}
                  </span>
                )}
                {item.seasons?.slice(0, 2).map(season => (
                  <span key={season} className={`px-2.5 py-1 rounded-full border text-xs font-medium ${SEASON_COLOR[season] ?? ''}`}>
                    {SEASON_EMOJI[season]} {SEASON_LABEL[season]}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {item.description && (<><p className="text-sm text-text-secondary leading-relaxed bg-background-primary/40 rounded-xl p-3.5 border border-white/5">{item.description}</p><Divider /></>)}
          {item.countries_used && item.countries_used.length > 0 && (<><SectionHeader emoji="🌍" title={tb.panelCountries} /><div className="flex flex-wrap gap-2">{item.countries_used.map(c => <span key={c} className="px-3 py-1.5 rounded-xl bg-background-primary/60 border border-white/8 text-sm text-text-secondary">{c}</span>)}</div><Divider /></>)}
          {item.storage_tips && (<><SectionHeader emoji="🧊" title={tb.panelStorage} /><div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-3.5"><p className="text-sm text-text-secondary leading-relaxed">{item.storage_tips}</p></div><Divider /></>)}
          {item.seasons && item.seasons.length > 0 && (<><SectionHeader emoji="🌸" title={tb.panelSeason} /><div className="flex flex-wrap gap-2">{item.seasons.map(season => { const label = SEASON_LABEL[season]; if (!label) return null; return <span key={season} className={`px-3 py-1.5 rounded-xl border text-sm font-medium ${SEASON_COLOR[season]}`}>{SEASON_EMOJI[season]} {label}</span>; })}</div><Divider /></>)}
          {hasTastes && (<><SectionHeader emoji="👅" title={tb.panelTaste} /><TasteBars tastes={item.tastes} /><Divider /></>)}
          {(item.nutrition || item.nutrition_detail) && (<><SectionHeader emoji="📊" title={tb.panelNutrition} /><NutritionCard nutrition={item.nutrition} detail={item.nutrition_detail} /><Divider /></>)}
          {item.pairs_well_with && item.pairs_well_with.length > 0 && (<><SectionHeader emoji="🤝" title={tb.panelPairs} /><div className="flex flex-wrap gap-2">{item.pairs_well_with.map(pair => <span key={pair} className="px-3 py-1.5 rounded-xl bg-background-primary/60 border border-white/8 text-sm text-text-secondary">{pair}</span>)}</div><Divider /></>)}
          {item.common_units?.length > 0 && (<><SectionHeader emoji="⚖️" title={tb.panelUnits} /><div className="flex flex-wrap gap-1.5">{item.common_units.map(u => <span key={u} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-text-secondary text-xs">{u}</span>)}</div><Divider /></>)}
          <Link href={`/search?q=${encodeURIComponent(item.name)}`} onClick={onClose} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-accent-warm text-background-primary font-bold text-sm hover:bg-accent-hover transition-colors">
            🍳 {tb.panelFindRecipe}
          </Link>
          {related.length > 0 && (
            <div className="mt-5">
              <SectionHeader emoji="📂" title={tb.panelSameCategory.replace('{cat}', catLabel)} />
              <div className="flex flex-wrap gap-2">
                {related.map(r => (
                  <button key={r.id} onClick={() => onSelect(r)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-tertiary hover:bg-white/10 border border-white/5 hover:border-accent-warm/30 transition-all text-sm">
                    {r.emoji && <span>{r.emoji}</span>}
                    <span className="text-text-secondary">{r.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────

export default function IngredientBrowsePage() {
  const { t } = useI18n();
  const tb = t.ingredient;

  const CATEGORIES = [
    { value: '',           label: tb.categoryAll,             emoji: '🌐' },
    { value: 'veggie',    label: tb.categoryLabels.veggie,    emoji: '🥬' },
    { value: 'fruit',     label: tb.categoryLabels.fruit,     emoji: '🍎' },
    { value: 'meat',      label: tb.categoryLabels.meat,      emoji: '🥩' },
    { value: 'seafood',   label: tb.categoryLabels.seafood,   emoji: '🐟' },
    { value: 'grain',     label: tb.categoryLabels.grain,     emoji: '🌾' },
    { value: 'dairy',     label: tb.categoryLabels.dairy,     emoji: '🧀' },
    { value: 'seasoning', label: tb.categoryLabels.seasoning, emoji: '🧂' },
    { value: 'condiment', label: tb.categoryLabels.condiment, emoji: '🫙' },
  ];

  const TASTE_FILTERS = [
    { value: '',       label: tb.tasteAll,    emoji: '✨', color: 'text-text-secondary', activeBg: 'bg-white/15 border-white/30' },
    { value: 'sweet',  label: tb.tasteSweet,  emoji: '🍬', color: TASTE_COLOR.sweet,  activeBg: TASTE_ACTIVE_BG.sweet  },
    { value: 'salty',  label: tb.tasteSalty,  emoji: '🧂', color: TASTE_COLOR.salty,  activeBg: TASTE_ACTIVE_BG.salty  },
    { value: 'spicy',  label: tb.tasteSpicy,  emoji: '🌶️', color: TASTE_COLOR.spicy,  activeBg: TASTE_ACTIVE_BG.spicy  },
    { value: 'sour',   label: tb.tasteSour,   emoji: '🍋', color: TASTE_COLOR.sour,   activeBg: TASTE_ACTIVE_BG.sour   },
    { value: 'bitter', label: tb.tasteBitter, emoji: '☕', color: TASTE_COLOR.bitter, activeBg: TASTE_ACTIVE_BG.bitter },
    { value: 'umami',  label: tb.tasteUmami,  emoji: '🍖', color: TASTE_COLOR.umami,  activeBg: TASTE_ACTIVE_BG.umami  },
  ];

  const [items, setItems] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [taste, setTaste] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<IngredientItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), sort: 'search_count' });
      if (category) params.set('categories', category);
      if (taste) params.set('taste', taste);
      if (debouncedSearch.length >= 2) params.set('q', debouncedSearch);
      const res = await fetch(`/api/ingredients/browse?${params}`);
      const data = await res.json();
      setItems(data.ingredients || []);
    } finally {
      setLoading(false);
    }
  }, [category, taste, debouncedSearch]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCategoryChange = (val: string) => { setCategory(val); setSearch(''); };
  const handleTasteChange = (val: string) => { setTaste(val === taste ? '' : val); };

  const currentCategory = CATEGORIES.find(c => c.value === category) ?? CATEGORIES[0];
  const related = selected
    ? items.filter(i => i.category === selected.category && i.id !== selected.id).slice(0, 12)
    : [];

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 pt-20 pb-28">

        {/* ── 타이틀 ── */}
        <div className="pt-4 pb-3 flex items-baseline gap-2">
          <h1 className="text-lg font-bold">{tb.browseTitle}</h1>
          <span className="text-xs text-text-muted">{tb.browseSubtitle}</span>
        </div>

        {/* ── 카테고리 탭 (한 줄 가로 스크롤) ── */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => {
            const isActive = cat.value === category;
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-150 ${
                  isActive
                    ? 'bg-accent-warm text-background-primary border-accent-warm'
                    : 'bg-background-secondary border-white/10 text-text-secondary hover:border-white/25 hover:text-text-primary'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 검색바 ── */}
        <div className="relative mt-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={
              category
                ? tb.searchByCategory.replace('{cat}', `${currentCategory.emoji} ${currentCategory.label}`)
                : tb.searchByIngredient
            }
            className="w-full bg-background-secondary border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none focus:border-accent-warm/60 transition-colors placeholder:text-text-muted"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors text-sm">
              ✕
            </button>
          )}
        </div>

        {/* ── 맛 필터 ── */}
        <div className="flex gap-1 overflow-x-auto mt-1.5 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {TASTE_FILTERS.map(f => {
            const isActive = f.value === taste;
            return (
              <button
                key={f.value}
                onClick={() => handleTasteChange(f.value)}
                className={`flex items-center gap-0.5 px-2.5 py-1 rounded-full border text-[11px] font-medium whitespace-nowrap shrink-0 transition-all duration-150 ${
                  isActive
                    ? `${f.activeBg} ${f.color}`
                    : 'bg-transparent border-white/8 text-text-muted hover:border-white/20 hover:text-text-secondary'
                }`}
              >
                <span>{f.emoji}</span>
                <span className="ml-0.5">{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 결과 헤더 ── */}
        <div className="flex items-center gap-1.5 mt-3 pb-1.5 border-b border-white/8">
          <span className="text-xs text-text-muted">{currentCategory.emoji} {currentCategory.label}</span>
          {taste && (
            <span className="text-[11px] text-text-muted">
              · {TASTE_FILTERS.find(f => f.value === taste)?.emoji}
            </span>
          )}
          {!loading && (
            <span className="text-xs text-text-muted ml-auto">{items.length}{tb.countSuffixLabel}</span>
          )}
        </div>

        {/* ── 재료 리스트 ── */}
        {loading ? (
          <>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2 border-b border-white/5 animate-pulse">
                <div className="text-base w-5 shrink-0 h-4 rounded bg-background-tertiary" />
                <div className="flex-1 h-3.5 rounded bg-background-tertiary" style={{ maxWidth: `${60 + (i % 5) * 12}px` }} />
                <div className="h-3 w-16 rounded bg-background-tertiary opacity-50 hidden sm:block" />
                <div className="h-4 w-5 rounded-full bg-background-tertiary shrink-0" />
              </div>
            ))}
          </>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <div className="text-5xl mb-3">{currentCategory.emoji}</div>
            <p className="text-sm font-medium text-text-secondary">{tb.noMatchingTitle}</p>
            <p className="text-xs mt-1">{tb.noMatchingHint}</p>
          </div>
        ) : (
          <>
            {items.map(item => {
              const emoji = item.emoji ?? null;
              const topTaste = item.tastes
                ? Object.entries(item.tastes).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a)[0]
                : null;
              const topSeason = item.seasons?.[0];

              return (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="flex items-center gap-2.5 w-full py-2 border-b border-white/5 hover:bg-background-secondary/50 active:bg-background-secondary/80 transition-colors text-left group"
                >
                  {/* 이모지 */}
                  <span className="text-base w-5 text-center shrink-0">{emoji}</span>

                  {/* 한글 이름 */}
                  <span className="text-sm font-medium text-text-primary leading-none truncate min-w-0 flex-1">
                    {item.name}
                  </span>

                  {/* 영문 이름 */}
                  {item.name_en && (
                    <span className="text-xs text-text-muted leading-none truncate shrink-0 hidden sm:block max-w-[120px]">
                      {item.name_en}
                    </span>
                  )}

                  {/* 배지 */}
                  <div className="flex items-center gap-1 shrink-0">
                    {topSeason && SEASON_COLOR[topSeason] && (
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${SEASON_COLOR[topSeason]}`}>
                        {SEASON_EMOJI[topSeason]}
                      </span>
                    )}
                    {topTaste && (
                      <span className={`text-[11px] ${TASTE_COLOR[topTaste[0]] ?? 'text-text-muted'}`}>
                        {TASTE_EMOJI[topTaste[0]]}
                      </span>
                    )}
                  </div>

                  {/* 화살표 */}
                  <span className="text-text-muted/50 text-sm shrink-0 group-hover:text-text-muted transition-colors">›</span>
                </button>
              );
            })}
          </>
        )}

      </main>
      <BottomNav />

      {selected && (
        <IngredientPanel
          item={selected}
          related={related}
          onClose={() => setSelected(null)}
          onSelect={item => setSelected(item)}
        />
      )}
    </div>
  );
}

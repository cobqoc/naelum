'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

// ─── 상수 ────────────────────────────────────────────────────

const CATEGORIES = [
  { value: '',          label: '전체',    emoji: '🌐' },
  { value: 'veggie',   label: '채소',    emoji: '🥬' },
  { value: 'fruit',    label: '과일',    emoji: '🍎' },
  { value: 'meat',     label: '육류',    emoji: '🥩' },
  { value: 'seafood',  label: '해산물',  emoji: '🐟' },
  { value: 'grain',    label: '곡물',    emoji: '🌾' },
  { value: 'dairy',     label: '유제품',    emoji: '🧀' },
  { value: 'seasoning', label: '양념&소스', emoji: '🧂' },
  { value: 'condiment', label: '조미료',   emoji: '🧂' },
];

const TASTE_FILTERS = [
  { value: '',       label: '전체 맛',  emoji: '✨', color: 'text-text-secondary', activeBg: 'bg-white/15 border-white/30' },
  { value: 'sweet',  label: '단맛',    emoji: '🍬', color: 'text-pink-300',   activeBg: 'bg-pink-500/25 border-pink-400' },
  { value: 'salty',  label: '짠맛',    emoji: '🧂', color: 'text-blue-300',   activeBg: 'bg-blue-500/25 border-blue-400' },
  { value: 'spicy',  label: '매운맛',  emoji: '🌶️', color: 'text-red-300',    activeBg: 'bg-red-500/25 border-red-400' },
  { value: 'sour',   label: '신맛',    emoji: '🍋', color: 'text-yellow-300', activeBg: 'bg-yellow-500/25 border-yellow-400' },
  { value: 'bitter', label: '쓴맛',    emoji: '☕', color: 'text-amber-500',  activeBg: 'bg-amber-800/25 border-amber-600' },
  { value: 'umami',  label: '감칠맛',  emoji: '🍖', color: 'text-orange-300', activeBg: 'bg-orange-500/25 border-orange-400' },
];

const TASTE_META: Record<string, { label: string; emoji: string; bar: string }> = {
  sweet:  { label: '단맛',   emoji: '🍬', bar: 'bg-pink-400' },
  salty:  { label: '짠맛',   emoji: '🧂', bar: 'bg-blue-400' },
  spicy:  { label: '매운맛', emoji: '🌶️', bar: 'bg-red-400' },
  sour:   { label: '신맛',   emoji: '🍋', bar: 'bg-yellow-400' },
  bitter: { label: '쓴맛',   emoji: '☕', bar: 'bg-amber-600' },
  umami:  { label: '감칠맛', emoji: '🍖', bar: 'bg-orange-400' },
};

const SEASON_LABEL: Record<string, { label: string; emoji: string; color: string }> = {
  spring:     { label: '봄',   emoji: '🌸', color: 'text-pink-300 bg-pink-500/15 border-pink-500/30' },
  summer:     { label: '여름', emoji: '☀️', color: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/30' },
  fall:       { label: '가을', emoji: '🍂', color: 'text-orange-300 bg-orange-500/15 border-orange-500/30' },
  winter:     { label: '겨울', emoji: '❄️', color: 'text-blue-300 bg-blue-500/15 border-blue-500/30' },
  year_round: { label: '연중', emoji: '🌿', color: 'text-green-300 bg-green-500/15 border-green-500/30' },
};

const CATEGORY_EMOJI: Record<string, string> = {
  veggie: '🥬', fruit: '🍎', meat: '🥩', seafood: '🐟',
  grain: '🌾', dairy: '🧀', seasoning: '🧂', condiment: '🧂',
  dessert: '🍰', asian: '🍜',
};

const CATEGORY_LABEL: Record<string, string> = {
  veggie: '채소', fruit: '과일', meat: '육류', seafood: '해산물',
  grain: '곡물', dairy: '유제품', seasoning: '양념&소스', condiment: '조미료',
  dessert: '디저트', asian: '아시아',
};

const LIMIT = 60;

// ─── 타입 ────────────────────────────────────────────────────

interface NutritionInfo {
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  fiber?: number;
}

interface NutritionDetail {
  fiber?: number;
  sodium?: number;
  sugar?: number;
  moisture?: number;
  calcium?: number;
  iron?: number;
  phosphorus?: number;
  potassium?: number;
  zinc?: number;
  vitamin_a?: number;
  retinol?: number;
  beta_carotene?: number;
  vitamin_b1?: number;
  vitamin_b2?: number;
  vitamin_c?: number;
  vitamin_d?: number;
  niacin?: number;
  saturated_fat?: number;
  trans_fat?: number;
  cholesterol?: number;
  source?: string;
  food_code?: string;
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
}

// ─── 하위 컴포넌트 ────────────────────────────────────────────

function TasteBars({ tastes }: { tastes: Record<string, number> | null }) {
  if (!tastes) return <p className="text-xs text-text-muted">맛 데이터 없음</p>;
  const entries = Object.entries(TASTE_META)
    .map(([key, meta]) => ({ key, ...meta, value: tastes[key] ?? 0 }))
    .filter(t => t.value > 0)
    .sort((a, b) => b.value - a.value);

  if (entries.length === 0) return <p className="text-xs text-text-muted">맛 데이터 없음</p>;

  return (
    <div className="space-y-2.5">
      {entries.map(t => (
        <div key={t.key} className="flex items-center gap-3">
          <span className="text-base w-5 text-center">{t.emoji}</span>
          <span className="text-xs text-text-secondary w-12 shrink-0">{t.label}</span>
          <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${t.bar} transition-all duration-700`}
              style={{ width: `${(t.value / 5) * 100}%` }}
            />
          </div>
          <div className="flex gap-0.5 shrink-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < t.value ? t.bar : 'bg-white/10'}`} />
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

function NutritionCard({
  nutrition,
  detail,
}: {
  nutrition: NutritionInfo | null;
  detail: NutritionDetail | null;
}) {
  // 기본 영양소 (nutrition + detail 병합, detail 우선)
  const fiber = detail?.fiber ?? nutrition?.fiber;
  const basicItems = [
    { label: '칼로리',   value: nutrition?.calories != null ? `${nutrition.calories}kcal` : null },
    { label: '탄수화물', value: nutrition?.carbs     != null ? `${nutrition.carbs}g`      : null },
    { label: '당류',     value: detail?.sugar        != null ? `${detail.sugar}g`         : null },
    { label: '단백질',   value: nutrition?.protein   != null ? `${nutrition.protein}g`    : null },
    { label: '지방',     value: nutrition?.fat       != null ? `${nutrition.fat}g`        : null },
    { label: '식이섬유', value: fiber                != null ? `${fiber}g`                : null },
  ].filter(i => i.value !== null) as { label: string; value: string }[];

  const mineralItems = [
    { label: '칼슘',   value: detail?.calcium    != null ? `${detail.calcium}mg`   : null },
    { label: '철',     value: detail?.iron       != null ? `${detail.iron}mg`      : null },
    { label: '인',     value: detail?.phosphorus != null ? `${detail.phosphorus}mg`: null },
    { label: '칼륨',   value: detail?.potassium  != null ? `${detail.potassium}mg` : null },
    { label: '나트륨', value: detail?.sodium     != null ? `${detail.sodium}mg`    : null },
    { label: '아연',   value: detail?.zinc       != null ? `${detail.zinc}mg`      : null },
  ].filter(i => i.value !== null) as { label: string; value: string }[];

  const vitaminItems = [
    { label: '비타민A', value: detail?.vitamin_a  != null ? `${detail.vitamin_a}μg`  : null },
    { label: '비타민B1',value: detail?.vitamin_b1 != null ? `${detail.vitamin_b1}mg` : null },
    { label: '비타민B2',value: detail?.vitamin_b2 != null ? `${detail.vitamin_b2}mg` : null },
    { label: '비타민C', value: detail?.vitamin_c  != null ? `${detail.vitamin_c}mg`  : null },
    { label: '비타민D', value: detail?.vitamin_d  != null ? `${detail.vitamin_d}μg`  : null },
    { label: '니아신',  value: detail?.niacin     != null ? `${detail.niacin}mg`     : null },
  ].filter(i => i.value !== null) as { label: string; value: string }[];

  if (basicItems.length === 0 && mineralItems.length === 0 && vitaminItems.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* 기본 */}
      {basicItems.length > 0 && (
        <div>
          <p className="text-[11px] text-text-muted font-medium mb-2 uppercase tracking-wide">기본</p>
          <div className="grid grid-cols-3 gap-2">
            {basicItems.map(item => <NutritionBadge key={item.label} {...item} />)}
          </div>
        </div>
      )}

      {/* 미네랄 */}
      {mineralItems.length > 0 && (
        <div>
          <p className="text-[11px] text-text-muted font-medium mb-2 uppercase tracking-wide">미네랄</p>
          <div className="grid grid-cols-3 gap-2">
            {mineralItems.map(item => <NutritionBadge key={item.label} {...item} />)}
          </div>
        </div>
      )}

      {/* 비타민 */}
      {vitaminItems.length > 0 && (
        <div>
          <p className="text-[11px] text-text-muted font-medium mb-2 uppercase tracking-wide">비타민</p>
          <div className="grid grid-cols-3 gap-2">
            {vitaminItems.map(item => <NutritionBadge key={item.label} {...item} />)}
          </div>
        </div>
      )}

      {detail?.source && (
        <p className="text-[10px] text-text-muted text-right">출처: {detail.source}</p>
      )}
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

function Divider() {
  return <div className="h-px bg-white/5 my-5" />;
}

// ─── 재료 상세 패널 ──────────────────────────────────────────

function IngredientPanel({
  item,
  related,
  onClose,
  onSelect,
}: {
  item: IngredientItem;
  related: IngredientItem[];
  onClose: () => void;
  onSelect: (item: IngredientItem) => void;
}) {
  const emoji = CATEGORY_EMOJI[item.category ?? ''] ?? '📦';
  const catLabel = CATEGORY_LABEL[item.category ?? ''] ?? '';

  const hasTastes = item.tastes && Object.values(item.tastes).some(v => v > 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background-secondary rounded-t-3xl border-t border-white/10 max-h-[85vh] overflow-y-auto">
        {/* 핸들 */}
        <div className="sticky top-0 bg-background-secondary pt-3 pb-2 flex justify-center z-10">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pb-10 pt-1">
          {/* ── 재료 헤더 ── */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-background-tertiary to-background-primary flex items-center justify-center text-4xl flex-shrink-0 border border-white/5">
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold truncate">{item.name}</h2>
              {item.name_en && (
                <p className="text-sm text-text-muted mt-0.5">{item.name_en}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {catLabel && (
                  <span className="px-2.5 py-1 rounded-full bg-accent-warm/15 border border-accent-warm/30 text-accent-warm text-xs font-medium">
                    {emoji} {catLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── 설명 ── */}
          {item.description && (
            <>
              <p className="text-sm text-text-secondary leading-relaxed bg-background-primary/40 rounded-xl p-3.5 border border-white/5">
                {item.description}
              </p>
              <Divider />
            </>
          )}

          {/* ── 국가별 사용 ── */}
          {item.countries_used && item.countries_used.length > 0 && (
            <>
              <SectionHeader emoji="🌍" title="주요 사용 국가" />
              <div className="flex flex-wrap gap-2">
                {item.countries_used.map(country => (
                  <span
                    key={country}
                    className="px-3 py-1.5 rounded-xl bg-background-primary/60 border border-white/8 text-sm text-text-secondary"
                  >
                    {country}
                  </span>
                ))}
              </div>
              <Divider />
            </>
          )}

          {/* ── 보관 방법 ── */}
          {item.storage_tips && (
            <>
              <SectionHeader emoji="🧊" title="보관 방법" />
              <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-3.5">
                <p className="text-sm text-text-secondary leading-relaxed">{item.storage_tips}</p>
              </div>
              <Divider />
            </>
          )}

          {/* ── 제철 정보 ── */}
          {item.seasons && item.seasons.length > 0 && (
            <>
              <SectionHeader emoji="🌸" title="제철 정보" />
              <div className="flex flex-wrap gap-2">
                {item.seasons.map(season => {
                  const s = SEASON_LABEL[season];
                  if (!s) return null;
                  return (
                    <span key={season} className={`px-3 py-1.5 rounded-xl border text-sm font-medium ${s.color}`}>
                      {s.emoji} {s.label}
                    </span>
                  );
                })}
              </div>
              <Divider />
            </>
          )}

          {/* ── 맛 프로필 ── */}
          {hasTastes && (
            <>
              <SectionHeader emoji="👅" title="맛 프로필" />
              <TasteBars tastes={item.tastes} />
              <Divider />
            </>
          )}

          {/* ── 영양 정보 ── */}
          {(item.nutrition || item.nutrition_detail) && (
            <>
              <SectionHeader emoji="📊" title="영양 정보 (100g 기준)" />
              <NutritionCard nutrition={item.nutrition} detail={item.nutrition_detail} />
              <Divider />
            </>
          )}

          {/* ── 잘 어울리는 재료 ── */}
          {item.pairs_well_with && item.pairs_well_with.length > 0 && (
            <>
              <SectionHeader emoji="🤝" title="잘 어울리는 재료" />
              <div className="flex flex-wrap gap-2">
                {item.pairs_well_with.map(pair => (
                  <span
                    key={pair}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-primary/60 border border-white/8 text-sm text-text-secondary"
                  >
                    {pair}
                  </span>
                ))}
              </div>
              <Divider />
            </>
          )}

          {/* ── 주요 단위 ── */}
          {item.common_units?.length > 0 && (
            <>
              <SectionHeader emoji="⚖️" title="주요 단위" />
              <div className="flex flex-wrap gap-1.5">
                {item.common_units.map(u => (
                  <span key={u} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-text-secondary text-xs">
                    {u}
                  </span>
                ))}
              </div>
              <Divider />
            </>
          )}

          {/* ── 레시피 찾기 ── */}
          <Link
            href={`/search?q=${encodeURIComponent(item.name)}`}
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-accent-warm text-background-primary font-bold text-sm hover:bg-accent-hover transition-colors"
          >
            🍳 이 재료로 레시피 찾기
          </Link>

          {/* ── 같은 카테고리 ── */}
          {related.length > 0 && (
            <div className="mt-5">
              <SectionHeader emoji="📂" title={`같은 ${catLabel} 재료`} />
              <div className="flex flex-wrap gap-2">
                {related.map(r => (
                  <button
                    key={r.id}
                    onClick={() => onSelect(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-tertiary hover:bg-white/10 border border-white/5 hover:border-accent-warm/30 transition-all text-sm"
                  >
                    <span>{CATEGORY_EMOJI[r.category ?? ''] ?? '📦'}</span>
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
  const [items, setItems] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [taste, setTaste] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<IngredientItem | null>(null);
  const catScrollRef = useRef<HTMLDivElement>(null);

  // 검색 디바운싱
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
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

  // 카테고리/맛 변경 시 검색어 초기화
  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setSearch('');
  };
  const handleTasteChange = (val: string) => {
    setTaste(val === taste ? '' : val);
  };

  const currentCategory = CATEGORIES.find(c => c.value === category) ?? CATEGORIES[0];
  const currentTaste = TASTE_FILTERS.find(t => t.value === taste) ?? TASTE_FILTERS[0];

  const related = selected
    ? items.filter(i => i.category === selected.category && i.id !== selected.id).slice(0, 12)
    : [];

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 pt-20 pb-28">

        {/* ── 페이지 헤더 ── */}
        <div className="py-6">
          <h1 className="text-2xl font-bold">재료 백과사전</h1>
          <p className="text-sm text-text-muted mt-1">
            카테고리를 선택하거나 재료를 검색해 보세요
          </p>
        </div>

        {/* ── 카테고리 탭 ── */}
        <div
          ref={catScrollRef}
          className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {CATEGORIES.map(cat => {
            const isActive = cat.value === category;
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'bg-accent-warm text-background-primary border-accent-warm shadow-lg shadow-accent-warm/20'
                    : 'bg-background-secondary border-white/10 text-text-secondary hover:border-accent-warm/40 hover:text-text-primary'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 맛 필터 (보조) ── */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-2 mb-5 scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {TASTE_FILTERS.map(t => {
            const isActive = t.value === taste;
            return (
              <button
                key={t.value}
                onClick={() => handleTasteChange(t.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isActive
                    ? `${t.activeBg} ${t.color}`
                    : `bg-background-secondary border-white/8 text-text-muted hover:border-white/20 hover:text-text-secondary`
                }`}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 검색바 ── */}
        <div className="relative mb-5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={
              category
                ? `${currentCategory.emoji} ${currentCategory.label} 재료 검색...`
                : '재료 이름으로 검색...'
            }
            className="w-full bg-background-secondary border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:border-accent-warm/50 transition-colors placeholder:text-text-muted"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── 결과 헤더 ── */}
        {!loading && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{currentCategory.emoji}</span>
            <span className="font-bold text-text-primary">{currentCategory.label}</span>
            {taste && (
              <>
                <span className="text-text-muted">·</span>
                <span className={`text-sm ${currentTaste.color}`}>
                  {currentTaste.emoji} {currentTaste.label}
                </span>
              </>
            )}
            <span className="text-text-muted text-sm font-normal ml-auto">{items.length}개</span>
          </div>
        )}

        {/* ── 재료 그리드 ── */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-background-secondary border border-white/5 p-3 flex flex-col items-center gap-2 aspect-square justify-center">
                <div className="w-9 h-9 rounded-full bg-background-tertiary animate-pulse" />
                <div className="w-14 h-2.5 rounded bg-background-tertiary animate-pulse" />
                <div className="w-10 h-2 rounded bg-background-tertiary animate-pulse" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <div className="text-6xl mb-4">{currentCategory.emoji}</div>
            <p className="text-base font-medium text-text-secondary">해당하는 재료가 없어요</p>
            <p className="text-sm mt-1">다른 카테고리나 검색어를 시도해 보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {items.map(item => {
              const emoji = CATEGORY_EMOJI[item.category ?? ''] ?? '📦';
              const catLabel = CATEGORY_LABEL[item.category ?? ''] ?? '';
              // 맛 중 가장 강한 것 표시
              const topTaste = item.tastes
                ? Object.entries(item.tastes)
                    .filter(([, v]) => v > 0)
                    .sort(([, a], [, b]) => b - a)[0]
                : null;
              const topTasteMeta = topTaste ? TASTE_META[topTaste[0]] : null;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="rounded-2xl bg-background-secondary border border-white/5 hover:border-accent-warm/40 hover:bg-background-tertiary active:scale-95 transition-all duration-150 p-3 flex flex-col items-center gap-1.5 text-center group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform duration-200">{emoji}</span>
                  <span className="text-xs font-semibold leading-tight">{item.name}</span>
                  {!category && catLabel && (
                    <span className="text-[10px] text-text-muted">{catLabel}</span>
                  )}
                  {topTasteMeta && (
                    <span className="text-[10px] text-text-muted opacity-70">
                      {topTasteMeta.emoji} {topTasteMeta.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

      </main>
      <BottomNav />

      {/* 상세 패널 */}
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

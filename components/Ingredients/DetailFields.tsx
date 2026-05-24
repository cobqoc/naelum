'use client';

import { useState, useEffect, useRef } from 'react';
import type { TranslationKeys } from '@/lib/i18n/translations';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';

/**
 * 재료 상세 설정 필드 (카테고리·유통기한·수량/단위·보관위치·메모) — 공통 표현.
 *
 * god-file(IngredientForm) 분해 Phase 2. 원래 IngredientForm.tsx 안의 독립
 * 함수 컴포넌트였던 것을 파일만 분리(verbatim relocate) — prop 인터페이스·JSX·
 * 자체 상태(catScroll·showDirectInput) 전부 원본과 byte-identical, 동작 변경 0.
 * UNITS/STORAGE_LOCATIONS/CATEGORIES 는 이 컴포넌트에서만 쓰여 함께 이동.
 * 회귀 가드: e2e/ingredient-auto-merge·autocomplete·picker-modal.
 */

const UNITS = ['선택', 'g', 'kg', 'ml', 'L', '개', '큰술', '작은술', '컵', '줌', '꼬집', '조각', '장', '포기', '대', '모', '마리'];

const STORAGE_LOCATIONS = ['냉장', '냉동', '상온'];

// 카테고리 ID·이모지만. 표시용 label은 i18n(t.ingredient.categoryLabels)에서 동적 lookup.
const CATEGORIES: { id: 'veggie' | 'meat' | 'seafood' | 'grain' | 'dairy' | 'seasoning' | 'condiment' | 'fruit' | 'other'; icon: string }[] = [
  { id: 'veggie', icon: '🥬' },
  { id: 'meat', icon: '🥩' },
  { id: 'seafood', icon: '🐟' },
  { id: 'grain', icon: '🌾' },
  { id: 'dairy', icon: '🧀' },
  { id: 'seasoning', icon: '🥫' },
  { id: 'condiment', icon: '🧂' },
  { id: 'fruit', icon: '🍎' },
  { id: 'other', icon: '📦' },
];

// === 상세 설정 필드 (공통) ===
export default function DetailFields({
  item,
  onChange,
  errors,
  t,
  showStorageLocation = true,
}: {
  item: {
    category: string;
    quantity: number | null;
    unit: string;
    purchase_date: string;
    expiry_date: string;
    storage_location: string;
    notes: string;
    expiry_alert: boolean;
  };
  onChange: (field: string, value: string | number | boolean | null) => void;
  errors: Record<string, string>;
  t: TranslationKeys;
  showStorageLocation?: boolean;
}) {
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [catCanLeft,  setCatCanLeft]  = useState(false);
  const [catCanRight, setCatCanRight] = useState(false);
  const [showDirectInput, setShowDirectInput] = useState(false);

  const updateCatArrows = () => {
    const el = catScrollRef.current;
    if (!el) return;
    setCatCanLeft(el.scrollLeft > 2);
    setCatCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    updateCatArrows();
    const catEl = catScrollRef.current;
    catEl?.addEventListener('scroll', updateCatArrows, { passive: true });
    const catWheel = catEl ? (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      catEl.scrollBy({ left: e.deltaY * 2, behavior: 'auto' });
      updateCatArrows();
    } : null;
    catEl?.addEventListener('wheel', catWheel!, { passive: false });
    const observer = new ResizeObserver(updateCatArrows);
    if (catEl) observer.observe(catEl);
    return () => {
      catEl?.removeEventListener('scroll', updateCatArrows);
      catEl?.removeEventListener('wheel',  catWheel!);
      observer.disconnect();
    };
  }, []);

  const addDaysToISO = (days: number) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const QUICK_EXPIRY = [
    { label: t.quickAdd.expiryPresetToday, days: 0 },
    { label: t.quickAdd.expiryPreset3d,    days: 3 },
    { label: t.quickAdd.expiryPreset1w,    days: 7 },
    { label: t.quickAdd.expiryPreset1m,    days: 30 },
  ];

  const VOLUME_UNITS = new Set(['g', 'kg', 'ml', 'L', '큰술', '작은술', '컵']);
  const quantityLabel = item.unit === '선택'
    ? t.quickAdd.quantityOrVolume
    : VOLUME_UNITS.has(item.unit) ? t.quickAdd.volume : t.quickAdd.quantity;

  return (
    <div className="space-y-4">
      {/* 카테고리 */}
      <div>
        <label className="block mb-2 text-xs font-medium text-text-muted uppercase tracking-wide">{t.quickAdd.category}</label>
        <div className="relative">
          {catCanLeft && (
            <button
              type="button"
              onClick={() => catScrollRef.current?.scrollBy({ left: -120, behavior: 'smooth' })}
              className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-start pr-6 pl-0.5"
              style={{ background: 'linear-gradient(to right, rgba(42,42,42,1) 30%, transparent 100%)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <div
            ref={catScrollRef}
            className={`flex gap-1.5 overflow-x-auto scrollbar-hide ${catCanLeft ? 'pl-6' : ''} ${catCanRight ? 'pr-6' : ''}`}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onChange('category', cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                  item.category === cat.id
                    ? 'bg-accent-warm text-background-primary'
                    : 'bg-background-secondary text-text-primary hover:bg-white/8'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{t.ingredient.categoryLabels[cat.id]}</span>
              </button>
            ))}
          </div>
          {catCanRight && (
            <button
              type="button"
              onClick={() => catScrollRef.current?.scrollBy({ left: 120, behavior: 'smooth' })}
              className="absolute right-0 top-0 bottom-0 flex items-center justify-end pl-6 pr-0.5"
              style={{ background: 'linear-gradient(to left, rgba(42,42,42,1) 30%, transparent 100%)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 유통기한 */}
      <div>
        {/* 레이블 + 직접입력 토글 */}
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">{t.quickAdd.expiryDate}</label>
          <button
            type="button"
            onClick={() => setShowDirectInput(v => !v)}
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-all ${
              showDirectInput
                ? 'text-text-muted hover:text-text-secondary'
                : 'text-accent-warm border border-accent-warm/40 hover:border-accent-warm/70 hover:bg-accent-warm/10'
            }`}
          >
            {showDirectInput ? (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                <span>{t.quickAdd.backToPresets}</span>
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span>{t.quickAdd.directInputDate}</span>
              </>
            )}
          </button>
        </div>

        {showDirectInput ? (
          /* 직접 입력 모드 — 구매일·유통기한 양옆 */
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-[11px] text-text-muted">{t.quickAdd.purchaseDate}</label>
              <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-3 !py-2.5">
                <input
                  type="date"
                  value={item.purchase_date}
                  onChange={(e) => onChange('purchase_date', e.target.value)}
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                />
              </InputBoxWrapper>
            </div>
            <div>
              <label className="block mb-1 text-[11px] text-text-muted">{t.quickAdd.expiryDate}</label>
              <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-3 !py-2.5">
                <input
                  type="date"
                  value={item.expiry_date}
                  onChange={(e) => onChange('expiry_date', e.target.value)}
                  autoFocus
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                />
              </InputBoxWrapper>
            </div>
          </div>
        ) : (
          /* 프리셋 모드 */
          <div className="grid grid-cols-2 gap-1">
            {QUICK_EXPIRY.map(({ label, days }) => {
              const iso = addDaysToISO(days);
              const isActive = item.expiry_date === iso;
              const d = new Date(iso + 'T00:00:00');
              const md = `${d.getMonth() + 1}/${d.getDate()}`;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => onChange('expiry_date', isActive ? '' : iso)}
                  className={`flex flex-col items-center py-1.5 rounded-lg text-[11px] font-medium leading-tight transition-all ${
                    isActive
                      ? 'bg-accent-warm text-background-primary'
                      : 'bg-background-secondary text-text-secondary hover:bg-white/8 hover:text-text-primary'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] ${isActive ? 'opacity-80' : 'opacity-50'}`}>{md}</span>
                </button>
              );
            })}
          </div>
        )}

        {errors.expiry_date && <p className="mt-1 text-xs text-error">{errors.expiry_date}</p>}
        {item.expiry_date && (
          <>
            <p className="mt-1.5 text-[11px] text-text-muted text-center">
              {(() => {
                const today = new Date(); today.setHours(0,0,0,0);
                const d = new Date(item.expiry_date + 'T00:00:00'); d.setHours(0,0,0,0);
                const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
                if (diff < 0) return `⚠️ ${Math.abs(diff)}일 지남`;
                if (diff === 0) return '⚠️ 오늘 만료';
                return `D-${diff}`;
              })()}
            </p>
            <div className="flex items-center justify-between mt-1.5 px-0.5">
              <span className="text-xs text-text-secondary">{t.quickAdd.expiryAlert}</span>
              <button
                type="button"
                onClick={() => onChange('expiry_alert', !item.expiry_alert)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  item.expiry_alert ? 'bg-accent-warm' : 'bg-background-tertiary'
                }`}
                aria-checked={item.expiry_alert}
                role="switch"
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  item.expiry_alert ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* 수량 + 단위 */}
      <div>
        <label className="block mb-2 text-xs font-medium text-text-muted uppercase tracking-wide">{quantityLabel}</label>
        {/* 스테퍼 + 단위 통합 [−][수량 | 단위 ▾][+] */}
        <div className="inline-flex items-center rounded-xl border border-white/8 bg-background-secondary/80 overflow-hidden">
          <button
            type="button"
            onClick={() => onChange('quantity', Math.max(0, (item.quantity ?? 1) - 1) || null)}
            className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/8 transition-all text-lg font-light flex-shrink-0"
          >
            −
          </button>
          {/* 수량 입력 */}
          <input
            type="number"
            min="0"
            step="0.1"
            value={item.quantity === null ? '' : item.quantity}
            onChange={(e) => onChange('quantity', e.target.value === '' ? null : parseFloat(e.target.value))}
            placeholder="1"
            className="w-12 text-center bg-transparent text-sm text-text-primary outline-none h-10 border-l border-white/8 [appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
          />
          {/* 단위 드롭다운 — 수량과 시각적으로 한 덩어리 */}
          <div className="relative flex items-center border-l border-white/8 h-10 pr-1">
            <select
              value={item.unit}
              onChange={(e) => onChange('unit', e.target.value)}
              className="bg-transparent text-sm text-text-primary outline-none appearance-none cursor-pointer pl-2 pr-5 h-full"
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit} className="bg-background-secondary">
                  {t.quickAdd.unitLabels[unit as keyof typeof t.quickAdd.unitLabels] ?? unit}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-1 text-text-muted text-[10px]">▾</span>
          </div>
          <button
            type="button"
            onClick={() => onChange('quantity', (item.quantity ?? 0) + 1)}
            className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/8 transition-all text-lg font-light border-l border-white/8 flex-shrink-0"
          >
            +
          </button>
        </div>
        {errors.quantity && <p className="mt-1 text-xs text-error">{errors.quantity}</p>}
      </div>

      {/* 보관 위치 */}
      {showStorageLocation && (
        <div>
          <label className="block mb-1.5 text-xs font-medium text-text-muted uppercase tracking-wide">{t.quickAdd.storageLocation}</label>
          <div className="flex gap-2">
            {STORAGE_LOCATIONS.map((location) => (
              <button
                key={location}
                type="button"
                onClick={() => onChange('storage_location', location)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                  item.storage_location === location
                    ? 'bg-accent-warm text-background-primary'
                    : 'bg-background-secondary text-text-primary hover:bg-white/8'
                }`}
              >
                {t.quickAdd.storageLocationLabels[location as keyof typeof t.quickAdd.storageLocationLabels] ?? location}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 메모 */}
      <div>
        <label className="block mb-1.5 text-xs font-medium text-text-muted uppercase tracking-wide">{t.quickAdd.notes}</label>
        <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-3 !py-2.5 !min-h-[60px] !items-start">
          <textarea
            value={item.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder={t.quickAdd.notesPlaceholder}
            rows={2}
            className={`${INPUT_INNER_COMFORTABLE_CLASS} resize-none`}
            style={INPUT_INNER_STYLE}
          />
        </InputBoxWrapper>
      </div>

    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import IngredientAutocompleteV2 from './IngredientAutocompleteV2';
import IngredientBrowser from './IngredientBrowser';
import { IngredientItem } from './IngredientAutocompleteTypes';
import { getIngredientEmoji } from '@/lib/utils/ingredientEmoji';
import { getRecentIngredients, RecentIngredient } from '@/lib/utils/recentIngredients';
import { lookupStorageByName } from '@/lib/ingredients/storageMap';
import { POPULAR_ITEMS } from '@/lib/ingredients/popularItems';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKeys } from '@/lib/i18n/translations';

interface IngredientFormData {
  ingredient_name: string;
  category: string;
  quantity: number | null;
  unit: string;
  purchase_date: string;
  expiry_date: string;
  storage_location: string;
  notes: string;
  expiry_alert: boolean;
  ingredient_id?: string | null;
}

interface PendingIngredient {
  id: string;
  name: string;
  category: string;
  categoryIcon: string;
  ingredientId?: string;
  common_units: string[];
  quantity: number | null;
  unit: string;
  purchase_date: string;
  expiry_date: string;
  storage_location: string;
  notes: string;
  expiry_alert: boolean;
}

type LocMode = null | '냉장' | '냉동' | '상온';

interface IngredientFormProps {
  onSubmit: (formData: IngredientFormData) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<IngredientFormData>;
  /** 외부 controlled 모드 — 값/핸들러 모두 주면 모달 헤더의 pill이 제어. 없으면 내부 state. */
  selectedLocation?: LocMode;
  onLocationChange?: (loc: LocMode) => void;
}

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


let pendingIdCounter = 0;

/**
 * onSubmit 호출 직전 payload 정규화 — 모든 caller 자동 안전.
 * - 빈 문자열 date("") → null: PostgreSQL date 컬럼이 ""를 거부(22007 invalid syntax)
 * - "preset-XXX" 형식 ingredient_id → null: ingredients_master FK는 UUID이므로 preset 임시 id 못 들어감
 *
 * 회귀: 빈 가이드 → 모달 → 양파 1탭 시 purchase_date=""·expiry_date=""로 400 발생하던 버그.
 * T 그대로 반환 — caller가 type cast 안 해도 됨. 내부에서만 nullable 변환을 type system 우회.
 */
function sanitizeOutgoingPayload<T>(data: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- nullable 변환을 위한 한 곳 우회
  const d = data as any;
  const purchase: string = d.purchase_date ?? '';
  const expiry: string = d.expiry_date ?? '';
  const ingId: string | null = d.ingredient_id ?? null;
  return {
    ...d,
    purchase_date: purchase || null,
    expiry_date: expiry || null,
    ingredient_id: ingId && !ingId.startsWith('preset-') ? ingId : null,
  };
}

export default function IngredientForm({
  onSubmit,
  onCancel,
  initialData,
  selectedLocation: externalLocation,
  onLocationChange,
}: IngredientFormProps) {
  const { t } = useI18n();
  const { info: toastInfo, success: toastSuccess } = useToast();

  // 기존 단일 입력 모드 (수정 모드에서 사용)
  const isEditMode = !!initialData?.ingredient_name;

  // 저장 위치 모드:
  //   null = 자동 분류 (디폴트, 재료명 큐레이션 맵 기반)
  //   '냉장'|'냉동'|'상온' = 수동 override (모든 새+기존 재료 일괄 지정)
  // Controlled(외부 주입) / Uncontrolled(내부 state) 겸용.
  const isControlled = externalLocation !== undefined;
  const [internalLocation, setInternalLocation] = useState<LocMode>(null);
  const selectedLocation: LocMode = isControlled ? externalLocation : internalLocation;
  const defaultLocationRef = useRef<LocMode>(null);
  useEffect(() => {
    defaultLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  // selectedLocation 변화 시 기존 pendingItems 위치 일괄 재계산.
  // null(자동) → 큐레이션 맵 기반 재분류, 수동 → 모든 아이템 해당 위치로 고정.
  useEffect(() => {
    setPendingItems(prev => prev.map(item => ({
      ...item,
      storage_location: selectedLocation ?? (lookupStorageByName(item.name) ?? '상온'),
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  // 빠른 추가 모드 상태
  const [inputValue, setInputValue] = useState('');
  const [pendingItems, setPendingItems] = useState<PendingIngredient[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [frequentIngredients, setFrequentIngredients] = useState<RecentIngredient[]>([]);

  // 기존 모드 상태 (수정 모드)
  const [formData, setFormData] = useState<IngredientFormData>({
    ingredient_name: initialData?.ingredient_name || '',
    category: initialData?.category || 'other',
    quantity: initialData?.quantity || null,
    unit: initialData?.unit || '선택',
    purchase_date: initialData?.purchase_date || '',
    expiry_date: initialData?.expiry_date || '',
    storage_location: initialData?.storage_location || '기타',
    notes: initialData?.notes || '',
    expiry_alert: initialData?.expiry_alert !== undefined ? initialData.expiry_alert : true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 자주 쓰는 재료 로드 — 사용 기록 많으면 상위 20개, 부족하면 인기 재료 프리셋으로 보충
  useEffect(() => {
    if (!isEditMode) {
      const recent = getRecentIngredients();
      setFrequentIngredients(recent.slice(0, 20));
    }
  }, [isEditMode]);

  const createPendingItem = (name: string, category: string, id?: string, commonUnits?: string[]): PendingIngredient => {
    // 수동 override 있으면 그 위치 사용, 없으면 (= null, 자동 모드) 큐레이션 맵 매칭.
    // 맵에도 없으면 상온 fallback.
    const override = defaultLocationRef.current;
    const storage = override ?? (lookupStorageByName(name) ?? '상온');
    return {
      id: `pending-${++pendingIdCounter}`,
      name,
      category: category || 'other',
      categoryIcon: getIngredientEmoji(name, category || 'other'),
      ingredientId: id,
      common_units: commonUnits || [],
      quantity: null,
      unit: commonUnits?.[0] || '선택',
      purchase_date: new Date().toISOString().slice(0, 10),
      expiry_date: '',
      storage_location: storage,
      notes: '',
      expiry_alert: true,
    };
  };

  const handleQuickSelect = useCallback((ingredient: IngredientItem) => {
    setPendingItems(prev => {
      // 중복 재료 탭 시 사일런트 실패 → 사용자 혼란 방지용 토스트
      if (prev.some(p => p.name === ingredient.name)) {
        toastInfo(`"${ingredient.name}" ${t.quickAdd.alreadyAdded}`);
        return prev;
      }
      return [...prev, createPendingItem(ingredient.name, ingredient.category || 'other', ingredient.id, ingredient.common_units)];
    });
    setInputValue('');
  }, [toastInfo]);

  // 태그 삭제
  const handleRemoveItem = useCallback((index: number) => {
    setPendingItems(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  }, [editingIndex]);

  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingIndex !== null && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [editingIndex]);

  // 태그 클릭 → 상세 설정 토글
  const handleTagClick = useCallback((index: number) => {
    setEditingIndex(prev => prev === index ? null : index);
  }, []);

  // 상세 설정 변경
  const handleDetailChange = useCallback((index: number, field: string, value: string | number | boolean | null) => {
    setPendingItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }, []);

  // 일괄 제출
  const handleBatchSubmit = async () => {
    if (pendingItems.length === 0 || isSubmitting) return;

    const items = [...pendingItems];
    const count = items.length;
    setIsSubmitting(true);

    await Promise.all(items.map(item => onSubmit(sanitizeOutgoingPayload({
      ingredient_name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      purchase_date: item.purchase_date,
      expiry_date: item.expiry_date,
      storage_location: item.storage_location,
      notes: item.notes,
      expiry_alert: item.expiry_alert,
      ingredient_id: item.ingredientId ?? null,
    }))));

    setIsSubmitting(false);
    setPendingItems([]);
    setEditingIndex(null);
    toastSuccess(t.quickAdd.addedToast.replace('{count}', String(count)));
    onCancel?.();
  };

  // === 수정 모드 (기존 로직) ===
  if (isEditMode) {
    const validate = (): boolean => {
      const newErrors: Record<string, string> = {};
      if (!formData.ingredient_name.trim()) {
        newErrors.ingredient_name = t.quickAdd.nameRequired;
      }
      if (formData.quantity !== null && formData.quantity <= 0) {
        newErrors.quantity = t.quickAdd.quantityPositive;
      }
      if (formData.expiry_date && formData.purchase_date) {
        if (new Date(formData.expiry_date) <= new Date(formData.purchase_date)) {
          newErrors.expiry_date = t.quickAdd.expiryAfterPurchase;
        }
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (validate()) {
        // 수정 모드도 같은 sanitize 적용 — 사용자가 만료일 지우고 저장 시 빈 문자열로 400 방지
        onSubmit(sanitizeOutgoingPayload(formData));
        setFormData({
          ingredient_name: '', category: 'other', quantity: null, unit: '선택',
          purchase_date: '', expiry_date: '', storage_location: '기타', notes: '', expiry_alert: true
        });
        setErrors({});
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 재료명 — 탭하면 편집, blur/Enter로 확정. 검색 autocomplete 제거 (수정 모드에서 다른 재료 교체 방지). */}
        <div>
          <label className="block mb-2 text-sm font-medium text-text-secondary">
            {t.quickAdd.ingredientName} <span className="text-error">*</span>
          </label>
          <EditableName
            value={formData.ingredient_name}
            onChange={(v) => setFormData(prev => ({ ...prev, ingredient_name: v }))}
          />
          {errors.ingredient_name && <p className="mt-1 text-sm text-error">{errors.ingredient_name}</p>}
        </div>
        <DetailFields
          item={{
            category: formData.category,
            quantity: formData.quantity,
            unit: formData.unit,
            purchase_date: formData.purchase_date,
            expiry_date: formData.expiry_date,
            storage_location: formData.storage_location,
            notes: formData.notes,
            expiry_alert: formData.expiry_alert,
          }}
          onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
          errors={errors}
          t={t}
        />
        <div className="flex gap-3 pt-4">
          <button type="submit" className="flex-1 rounded-xl bg-accent-warm py-3 font-bold text-background-primary hover:bg-accent-hover transition-colors">
            {t.quickAdd.editComplete}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-6 rounded-xl bg-white/5 py-3 font-medium text-text-secondary hover:bg-white/10 transition-colors">
              {t.quickAdd.close}
            </button>
          )}
        </div>
      </form>
    );
  }

  // === 빠른 추가 모드 (새 디자인) ===
  // 자주 쓰는 재료 중 아직 pending에 없는 것만 표시.
  // 기록 부족하면 POPULAR_ITEMS(한국 가정 필수 재료 20개)로 보충 — 신규 사용자도 바로 원탭 추가 가능.
  const availableFrequent = frequentIngredients.filter(
    f => !pendingItems.some(p => p.name === f.name)
  );
  const presetFallback = availableFrequent.length < 6
    ? POPULAR_ITEMS.filter(
        p => !availableFrequent.some(f => f.name === p.name) &&
             !pendingItems.some(pi => pi.name === p.name)
      )
    : [];

  return (
    <div className="space-y-4">
      {/* 저장 위치 pill UI는 AddIngredientModal 헤더로 이관됨 (controlled props로 제어) */}

      {/* 빈 상태 동기부여 메시지 — pending 0이고 재료 탐색 중인 사용자용 */}
      {pendingItems.length === 0 && (
        <div className="rounded-lg bg-accent-warm/5 border border-accent-warm/20 px-3 py-2">
          <p className="text-[11px] text-text-secondary leading-relaxed">
            {t.quickAdd.minRecipeHint}
          </p>
        </div>
      )}

      {/* 1. 재료 브라우저 + 검색 — 상세 설정 열릴 때 숨겨 모바일 공간 확보 */}
      <div className={editingIndex !== null ? 'hidden' : ''}>
        <IngredientBrowser
          onSelect={handleQuickSelect}
          selectedNames={pendingItems.map(p => p.name)}
          frequentItems={availableFrequent.map(f => ({ id: f.id, name: f.name, category: f.category ?? null }))}
          popularItems={presetFallback}
        />
        <div className="mt-4">
          <IngredientAutocompleteV2
            value={inputValue}
            onChange={setInputValue}
            onSelect={handleQuickSelect}
            placeholder={t.quickAdd.searchPlaceholder}
            enableRecentItems={true}
            allowCustomIngredient={true}
            autoFocus={true}
          />
        </div>
      </div>

      {/* 상세 설정 열릴 때: "← 재료 더 추가" 버튼으로 브라우저 복귀 */}
      {editingIndex !== null && (
        <button
          type="button"
          onClick={() => setEditingIndex(null)}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {t.quickAdd.backToBrowser}
        </button>
      )}

      {/* 3. 추가된 재료 태그 */}
      {pendingItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-text-muted">
                {t.quickAdd.addedItems} <span className="text-accent-warm font-medium">{pendingItems.length}</span>
              </p>
              <p className="text-[11px] text-text-muted/70 mt-0.5">
                {t.quickAdd.detailTapHint}
              </p>
            </div>
            {pendingItems.length > 1 && (
              <button
                type="button"
                onClick={() => { setPendingItems([]); setEditingIndex(null); }}
                className="text-xs text-text-muted hover:text-error transition-colors"
              >
                {t.quickAdd.clearAll}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {pendingItems.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTagClick(index)}
                className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all ${
                  editingIndex === index
                    ? 'bg-accent-warm text-background-primary ring-2 ring-accent-warm/50'
                    : 'bg-accent-warm/15 text-accent-warm hover:bg-accent-warm/25'
                }`}
              >
                <span>{item.categoryIcon}</span>
                <span className="font-medium">{item.name}</span>
                {/* 저장 위치 배지 — 얇은 구분자로 카테고리 이모지와 분리, 가독성↑ */}
                <span className="text-[11px] opacity-40" aria-hidden="true">·</span>
                <span
                  className="text-[11px] opacity-80"
                  title={`${t.quickAdd.storageTitle}: ${t.quickAdd.storageLocationLabels[item.storage_location as keyof typeof t.quickAdd.storageLocationLabels] ?? item.storage_location}`}
                >
                  {item.storage_location === '냉장' ? '❄️' : item.storage_location === '냉동' ? '🧊' : '🌡'}
                </span>
                <span
                  onClick={(e) => { e.stopPropagation(); handleRemoveItem(index); }}
                  className={`ml-0.5 rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-colors ${
                    editingIndex === index
                      ? 'hover:bg-background-primary/20'
                      : 'hover:bg-accent-warm/30'
                  }`}
                >
                  ✕
                </span>
              </button>
            ))}
          </div>

          {/* 4. 상세 설정 (선택한 태그) */}
          {editingIndex !== null && pendingItems[editingIndex] && (
            <div ref={detailRef} className="mt-3 rounded-2xl bg-background-tertiary/50 p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-text-primary">
                  {pendingItems[editingIndex].categoryIcon} {pendingItems[editingIndex].name} {t.quickAdd.detailSettings}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="text-xs text-text-muted hover:text-text-secondary"
                >
                  {t.quickAdd.close}
                </button>
              </div>
              <DetailFields
                item={pendingItems[editingIndex]}
                onChange={(field, value) => handleDetailChange(editingIndex, field, value)}
                errors={{}}
                t={t}
              />
            </div>
          )}

          {/* 5. 제출 버튼 — 스크롤해도 항상 보이게 sticky 하단 고정 (부모 스크롤 컨테이너의 하단에 붙음) */}
          <div className="sticky bottom-0 -mx-5 mt-4 px-5 pt-3 pb-3 bg-gradient-to-t from-background-primary via-background-primary to-background-primary/90 backdrop-blur-sm flex gap-3">
            <button
              type="button"
              onClick={handleBatchSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-accent-warm py-3.5 font-bold text-background-primary hover:bg-accent-hover active:scale-[0.98] transition-all shadow-lg shadow-accent-warm/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t.quickAdd.addingButton : `${pendingItems.length}${t.quickAdd.countSuffix} ${t.quickAdd.addButton}`}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 rounded-xl bg-white/5 py-3.5 font-medium text-text-secondary hover:bg-white/10 transition-colors"
              >
                {t.quickAdd.close}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 입력 안내 (아무것도 없을 때) */}
      {pendingItems.length === 0 && availableFrequent.length === 0 && (
        <p className="text-xs text-text-muted text-center py-2">
          {t.quickAdd.hint}
        </p>
      )}
    </div>
  );
}

// === 상세 설정 필드 (공통) ===
function DetailFields({
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

  const fieldBase = "w-full rounded-xl bg-background-secondary/80 px-3 py-2.5 text-sm text-text-primary outline-none border border-white/8 focus:border-accent-warm/60 focus:ring-1 focus:ring-accent-warm/40 transition-all";

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

      {/* 날짜 — 구매일·유통기한 2열 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 구매일 */}
        <div>
          <label className="block mb-1.5 text-xs font-medium text-text-muted uppercase tracking-wide">{t.quickAdd.purchaseDate}</label>
          <input
            type="date"
            value={item.purchase_date}
            onChange={(e) => onChange('purchase_date', e.target.value)}
            className={fieldBase}
          />
          {item.purchase_date && (
            <p className="mt-1 text-[11px] text-text-muted text-center">
              {(() => {
                const today = new Date(); today.setHours(0,0,0,0);
                const d = new Date(item.purchase_date + 'T00:00:00'); d.setHours(0,0,0,0);
                const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
                if (diff === 0) return t.quickAdd.expiryPresetToday;
                if (diff === 1) return '어제';
                if (diff > 1) return `${diff}일 전`;
                return '';
              })()}
            </p>
          )}
        </div>
        {/* 유통기한 */}
        <div>
          <label className="block mb-1.5 text-xs font-medium text-text-muted uppercase tracking-wide">{t.quickAdd.expiryDate}</label>
          {/* 빠른 선택 — 실제 날짜 함께 표시 */}
          <div className="grid grid-cols-2 gap-1 mb-1.5">
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
                  className={`flex flex-col items-center py-1 rounded-lg text-[11px] font-medium leading-tight transition-all ${
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
          <input
            type="date"
            value={item.expiry_date}
            onChange={(e) => onChange('expiry_date', e.target.value)}
            className={fieldBase}
          />
          {errors.expiry_date && <p className="mt-1 text-xs text-error">{errors.expiry_date}</p>}
          {item.expiry_date && (
            <>
              <p className="mt-1 text-[11px] text-text-muted text-center">
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
        <textarea
          value={item.notes}
          onChange={(e) => onChange('notes', e.target.value)}
          placeholder={t.quickAdd.notesPlaceholder}
          rows={2}
          className={`${fieldBase} resize-none`}
        />
      </div>

    </div>
  );
}

/**
 * 탭해서 편집하는 재료명 UI (수정 모드 전용).
 * - 기본: 이름 + ✏️ 아이콘 버튼으로 표시 (read-only)
 * - 탭 → 인라인 input으로 전환
 * - blur 또는 Enter → 확정 + read-only 복귀 (빈 값은 이전 값 유지)
 */
function EditableName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prop 변경 시 draft를 동기화 (controlled input 외부 업데이트 대응)
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onChange(trimmed);
    else setDraft(value); // 빈 값이면 원복
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className="w-full px-4 py-3 rounded-xl bg-background-secondary text-text-primary text-base font-medium outline-none ring-2 ring-accent-warm"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-background-secondary text-text-primary text-base font-medium text-left hover:bg-white/5 active:scale-[0.99] transition-all ring-1 ring-white/10"
    >
      <span className="truncate">{value || t.quickAdd.nameEmpty}</span>
      <span className="text-xs text-text-muted flex-shrink-0 ml-2">{t.quickAdd.editLabel}</span>
    </button>
  );
}

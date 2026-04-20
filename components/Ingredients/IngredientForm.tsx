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

const CATEGORIES = [
  { id: 'veggie', name: '채소', icon: '🥬' },
  { id: 'meat', name: '육류', icon: '🥩' },
  { id: 'seafood', name: '해산물', icon: '🐟' },
  { id: 'grain', name: '곡물', icon: '🌾' },
  { id: 'dairy', name: '유제품', icon: '🧀' },
  { id: 'seasoning', name: '양념&소스', icon: '🥫' },
  { id: 'condiment', name: '조미료', icon: '🧂' },
  { id: 'fruit', name: '과일', icon: '🍎' },
  { id: 'other', name: '기타', icon: '📦' },
];


let pendingIdCounter = 0;

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
      purchase_date: '',
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
        toastInfo(`"${ingredient.name}" 이미 추가됐어요.`);
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
    if (pendingItems.length === 0) return;

    const items = [...pendingItems];
    const count = items.length;
    setPendingItems([]);
    setEditingIndex(null);

    for (const item of items) {
      await onSubmit({
        ingredient_name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        purchase_date: item.purchase_date,
        expiry_date: item.expiry_date,
        storage_location: item.storage_location,
        notes: item.notes,
        expiry_alert: item.expiry_alert,
      });
    }

    // 제출 성공 피드백
    toastSuccess(`🧊 재료 ${count}개가 추가됐어요!`);
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
        onSubmit(formData);
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
          defaultExpanded
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
            <span className="text-accent-warm">💡</span> 재료 3개 이상 추가하면 레시피 추천을 받을 수 있어요.
          </p>
        </div>
      )}

      {/* 1. 재료 브라우저 (탭+그리드) — "⭐ 자주" 탭 우선 노출.
          대부분 사용자는 목록에서 원탭 추가 → 탭/그리드를 상단에 배치. */}
      <IngredientBrowser
        onSelect={handleQuickSelect}
        selectedNames={pendingItems.map(p => p.name)}
        frequentItems={availableFrequent.map(f => ({ id: f.id, name: f.name, category: f.category ?? null }))}
        popularItems={presetFallback}
      />

      {/* 2. 검색 자동완성 — 특수 재료나 마스터에 없는 커스텀 재료 추가용. 브라우저 하단 보조 수단. */}
      <div>
        <p className="text-[11px] text-text-muted mb-1.5">찾는 재료가 없다면 검색으로 직접 추가</p>
        <IngredientAutocompleteV2
          value={inputValue}
          onChange={setInputValue}
          onSelect={handleQuickSelect}
          placeholder={t.quickAdd.placeholder}
          enableRecentItems={true}
          allowCustomIngredient={true}
        />
      </div>

      {/* 3. 추가된 재료 태그 */}
      {pendingItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-text-muted">
                {t.quickAdd.addedItems} <span className="text-accent-warm font-medium">{pendingItems.length}</span>
              </p>
              <p className="text-[11px] text-text-muted/70 mt-0.5">
                💡 각 재료를 탭하면 수량·유통기한 등 상세 설정을 할 수 있어요
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
                  title={`저장 위치: ${item.storage_location}`}
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
                showStorageLocation={false}
              />
            </div>
          )}

          {/* 5. 제출 버튼 — 스크롤해도 항상 보이게 sticky 하단 고정 (부모 스크롤 컨테이너의 하단에 붙음) */}
          <div className="sticky bottom-0 -mx-5 mt-4 px-5 pt-3 pb-3 bg-gradient-to-t from-background-primary via-background-primary to-background-primary/90 backdrop-blur-sm flex gap-3">
            <button
              type="button"
              onClick={handleBatchSubmit}
              className="flex-1 rounded-xl bg-accent-warm py-3.5 font-bold text-background-primary hover:bg-accent-hover active:scale-[0.98] transition-all shadow-lg shadow-accent-warm/20"
            >
              {pendingItems.length}개 {t.quickAdd.addButton}
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
  defaultExpanded = false,
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
  /** 수정 모드 등에서 고급 필드를 기본 펼침 상태로 시작 — 이미 입력된 값 가리는 것 방지 */
  defaultExpanded?: boolean;
  /** 보관 장소 pill 표시 여부 — batch 모드에선 false (헤더 pill로 일괄 지정), edit 모드에선 true */
  showStorageLocation?: boolean;
}) {
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [catCanLeft, setCatCanLeft] = useState(false);
  const [catCanRight, setCatCanRight] = useState(false);
  // 고급 필드(구매일·유통기한·위치·메모·알림) 접이식 — 기본값으로 충분한 사용자 부담 감소.
  // 수정 모드에선 기본 펼침 (이미 입력된 값이 있을 수 있음).
  const [showAdvanced, setShowAdvanced] = useState(defaultExpanded);

  const updateCatArrows = () => {
    const el = catScrollRef.current;
    if (!el) return;
    setCatCanLeft(el.scrollLeft > 2);
    setCatCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    updateCatArrows();
    const el = catScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateCatArrows, { passive: true });
    const observer = new ResizeObserver(updateCatArrows);
    observer.observe(el);
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('scroll', updateCatArrows);
      el.removeEventListener('wheel', onWheel);
      observer.disconnect();
    };
  }, []);

  const scrollCat = (dir: 'left' | 'right') => {
    catScrollRef.current?.scrollBy({ left: dir === 'right' ? 120 : -120, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      {/* 카테고리 */}
      <div>
        <label className="block mb-2 text-xs font-medium text-text-muted">{t.quickAdd.category}</label>
        <div className="flex items-center gap-1">
          {catCanLeft && (
            <button
              type="button"
              onClick={() => scrollCat('left')}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-background-secondary text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all text-sm"
            >
              ‹
            </button>
          )}
          <div className="relative flex-1 min-w-0">
            <div
              ref={catScrollRef}
              className="flex gap-1.5 overflow-x-auto scrollbar-hide"
              onScroll={updateCatArrows}
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onChange('category', cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                    item.category === cat.id
                      ? 'bg-accent-warm text-background-primary'
                      : 'bg-background-secondary text-text-primary hover:bg-white/5'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
            {catCanRight && (
              <div
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-12"
                style={{ background: 'linear-gradient(to left, rgba(58,58,58,0.95) 40%, rgba(58,58,58,0) 100%)' }}
              />
            )}
          </div>
          {catCanRight && (
            <button
              type="button"
              onClick={() => scrollCat('right')}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-background-secondary text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all text-sm"
            >
              ›
            </button>
          )}
        </div>
      </div>

      {/* 양 + 단위 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-1.5 text-xs font-medium text-text-muted">{t.quickAdd.quantity}</label>
          <input
            type="number"
            step="0.01"
            value={item.quantity === null ? '' : item.quantity}
            onChange={(e) => onChange('quantity', e.target.value === '' ? null : parseFloat(e.target.value))}
            placeholder={t.quickAdd.quantityPlaceholder}
            className="w-full rounded-xl bg-background-secondary px-3 py-2.5 text-sm text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
          />
          {errors.quantity && <p className="mt-1 text-xs text-error">{errors.quantity}</p>}
        </div>
        <div>
          <label className="block mb-1.5 text-xs font-medium text-text-muted">{t.quickAdd.unit}</label>
          <select
            value={item.unit}
            onChange={(e) => onChange('unit', e.target.value)}
            className="w-full rounded-xl bg-background-secondary px-3 py-2.5 text-sm text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm cursor-pointer"
          >
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 고급 설정 토글 — subtle 링크 스타일로 유지 (브라우저 기본 focus ring이 두드러지지 않도록) */}
      <button
        type="button"
        onClick={() => setShowAdvanced(prev => !prev)}
        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
      >
        <span>{showAdvanced ? '접기' : '더 자세히'}</span>
        <svg className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showAdvanced && (
        <>
          {/* 구매일 + 만료일 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-xs font-medium text-text-muted">{t.quickAdd.purchaseDate}</label>
              <input
                type="date"
                value={item.purchase_date}
                onChange={(e) => onChange('purchase_date', e.target.value)}
                className="w-full rounded-xl bg-background-secondary px-3 py-2.5 text-sm text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-medium text-text-muted">{t.quickAdd.expiryDate}</label>
              <input
                type="date"
                value={item.expiry_date}
                onChange={(e) => onChange('expiry_date', e.target.value)}
                className="w-full rounded-xl bg-background-secondary px-3 py-2.5 text-sm text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
              />
              {errors.expiry_date && <p className="mt-1 text-xs text-error">{errors.expiry_date}</p>}
            </div>
          </div>

          {/* 보관 위치 — 편집 모드에서만 노출. 배치 모드는 헤더의 pill로 일괄 지정. */}
          {showStorageLocation && (
            <div>
              <label className="block mb-1.5 text-xs font-medium text-text-muted">{t.quickAdd.storageLocation}</label>
              <div className="grid grid-cols-4 gap-1.5">
                {STORAGE_LOCATIONS.map((location) => (
                  <button
                    key={location}
                    type="button"
                    onClick={() => onChange('storage_location', location)}
                    className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      item.storage_location === location
                        ? 'bg-accent-warm text-background-primary'
                        : 'bg-background-secondary text-text-primary hover:bg-white/5'
                    }`}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 메모 */}
          <div>
            <label className="block mb-1.5 text-xs font-medium text-text-muted">{t.quickAdd.notes}</label>
            <textarea
              value={item.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder={t.quickAdd.notesPlaceholder}
              rows={2}
              className="w-full rounded-xl bg-background-secondary px-3 py-2.5 text-sm text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm resize-none"
            />
          </div>

          {/* 만료 알림 토글 */}
          <div className="flex items-center justify-between">
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
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  item.expiry_alert ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </>
      )}
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
      <span className="truncate">{value || '이름 없음'}</span>
      <span className="text-xs text-text-muted flex-shrink-0 ml-2">✏️ 수정</span>
    </button>
  );
}

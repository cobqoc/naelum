'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import IngredientAutocompleteV2 from './IngredientAutocompleteV2';
import IngredientBrowser from './IngredientBrowser';
import { IngredientItem } from './IngredientAutocompleteTypes';
import { getRecentIngredients, RecentIngredient } from '@/lib/utils/recentIngredients';
import { lookupStorageByName } from '@/lib/ingredients/storageMap';
import { usePopularIngredients } from '@/lib/ingredients/usePopularIngredients';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import { useFavorites } from '@/lib/favorites/useFavorites';
import { sanitizeOutgoingPayload } from '@/lib/ingredients/sanitizeOutgoingPayload';
import DetailFields from './DetailFields';
import EditableName from './EditableName';

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
  /** 보관위치(냉장/냉동/상온) — 모달 헤더 pill(부모)이 제어하는 controlled 값.
   *  미지정 시 null = 자동분류. (구 uncontrolled 겸용 모드는 UI 없는 죽은 경로라 제거됨) */
  selectedLocation?: LocMode;
  /** 이미 냉장고에 있는 재료 이름 목록 — 브라우저 칩에 보유 중 표시용 */
  ownedNames?: string[];
}

let pendingIdCounter = 0;

export default function IngredientForm({
  onSubmit,
  onCancel,
  initialData,
  selectedLocation: externalLocation,
  ownedNames,
}: IngredientFormProps) {
  const { t } = useI18n();
  const { success: toastSuccess } = useToast();

  // 기존 단일 입력 모드 (수정 모드에서 사용)
  const isEditMode = !!initialData?.ingredient_name;

  // 저장 위치 모드:
  //   null = 자동 분류 (디폴트, 재료명 큐레이션 맵 기반)
  //   '냉장'|'냉동'|'상온' = 수동 override (모든 새+기존 재료 일괄 지정)
  // 보관위치는 모달 헤더 pill(부모)이 제어 — 이 컴포넌트는 값만 받는 controlled.
  // (구 uncontrolled 분기는 그 모드용 UI 가 없어 영영 null 고정인 죽은 코드라 제거.
  //  externalLocation 미지정도 동일하게 null=자동분류 — 행위 변화 0)
  const selectedLocation: LocMode = externalLocation ?? null;
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

  // 사용자별 자주 쓰는 재료 (DB, Stage 2: score 기반)
  const { items: favorites } = useFavorites(50);
  const popularIngredients = usePopularIngredients();

  // 자주 쓰는 재료 로드 — DB favorites 우선, 비어있으면 localStorage(legacy/비로그인) fallback
  useEffect(() => {
    if (isEditMode) return;
    if (favorites.length > 0) {
      setFrequentIngredients(
        favorites.slice(0, 40).map(f => ({
          id: `fav:${f.ingredient_name}`,
          name: f.ingredient_name,
          name_en: null,
          category: f.category,
          timestamp: new Date(f.last_added_at).getTime(),
          count: f.score,
          emoji: f.emoji ?? null,
        }))
      );
    } else {
      const recent = getRecentIngredients();
      setFrequentIngredients(recent.slice(0, 40));
    }
  }, [isEditMode, favorites]);

  const createPendingItem = (name: string, category: string, id?: string, commonUnits?: string[]): PendingIngredient => {
    // 수동 override 있으면 그 위치 사용, 없으면 (= null, 자동 모드) 큐레이션 맵 매칭.
    // 맵에도 없으면 상온 fallback.
    const override = defaultLocationRef.current;
    const storage = override ?? (lookupStorageByName(name) ?? '상온');
    return {
      id: `pending-${++pendingIdCounter}`,
      name,
      category: category || 'other',
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
      const idx = prev.findIndex(p => p.name === ingredient.name);
      // 이미 추가된 재료 재클릭 → 제거 (토글)
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      return [...prev, createPendingItem(ingredient.name, ingredient.category || 'other', ingredient.id, ingredient.common_units)];
    });
    setInputValue('');
  }, []);

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
  // 기록 부족하면 인기 재료(DB에서 category+emoji 포함)로 보충 — 신규 사용자도 바로 원탭 추가 가능.
  const availableFrequent = frequentIngredients.filter(
    f => !pendingItems.some(p => p.name === f.name)
  );
  const presetFallback = availableFrequent.length < 6
    ? popularIngredients.filter(
        p => !availableFrequent.some(f => f.name === p.name) &&
             !pendingItems.some(pi => pi.name === p.name)
      )
    : [];

  return (
    <div className="space-y-4">
      {/* 저장 위치 pill UI는 AddIngredientModal 헤더로 이관됨 (controlled props로 제어) */}

      {/* 1. 재료 브라우저 + 검색 — 상세 설정 열릴 때 숨겨 모바일 공간 확보 */}
      <div className={editingIndex !== null ? 'hidden' : ''}>
        <IngredientBrowser
          onSelect={handleQuickSelect}
          selectedNames={pendingItems.map(p => p.name)}
          frequentItems={availableFrequent.map(f => ({ id: f.id, name: f.name, category: f.category ?? null, emoji: f.emoji ?? null }))}
          popularItems={presetFallback}
          ownedNames={ownedNames}
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
                  {pendingItems[editingIndex].name} {t.quickAdd.detailSettings}
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

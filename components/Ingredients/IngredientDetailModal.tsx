'use client';

import { useMemo } from 'react';
import IngredientForm from './IngredientForm';
import { getIngredientEmoji } from '@/lib/utils/ingredientEmoji';

interface Ingredient {
  id: string;
  ingredient_name: string;
  category: string;
  quantity?: number | null;
  unit?: string | null;
  purchase_date?: string | null;
  expiry_date?: string | null;
  storage_location?: string | null;
  notes?: string | null;
  expiry_alert?: boolean;
}

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

interface IngredientDetailModalProps {
  ingredient: Ingredient;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, formData: IngredientFormData) => void;
  /** 삭제 버튼 — 제공 시 모달 내에서 바로 삭제 가능 */
  onDelete?: (ingredient: Ingredient) => void;
}

export default function IngredientDetailModal({
  ingredient,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: IngredientDetailModalProps) {
  const initialData = useMemo<Partial<IngredientFormData>>(() => {
    if (!isOpen || !ingredient) return {};
    return {
      ingredient_name: ingredient.ingredient_name,
      category: ingredient.category || 'other',
      quantity: ingredient.quantity,
      unit: ingredient.unit || '선택',
      purchase_date: ingredient.purchase_date || '',
      expiry_date: ingredient.expiry_date || '',
      storage_location: ingredient.storage_location || '기타',
      notes: ingredient.notes || '',
      expiry_alert: ingredient.expiry_alert !== undefined ? ingredient.expiry_alert : true
    };
  }, [isOpen, ingredient]);

  const handleSubmit = (formData: IngredientFormData) => {
    // Dirty 체크 — 변경 사항 없으면 불필요한 업데이트 skip
    const isDirty = Object.keys(initialData).some((key) => {
      const k = key as keyof IngredientFormData;
      return (initialData as IngredientFormData)[k] !== formData[k];
    });
    if (!isDirty) {
      onClose();
      return;
    }
    onUpdate(ingredient.id, formData);
    onClose();
  };

  const handleDelete = () => {
    if (!onDelete) return;
    onDelete(ingredient);
    onClose();
  };

  if (!isOpen) return null;

  const emoji = getIngredientEmoji(ingredient.ingredient_name, ingredient.category);

  return (
    // z-[60] — BottomNav(z-50) 위에 배치. 모바일 fullscreen, 데스크탑 센터 카드.
    <div
      className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl bg-background-secondary sm:rounded-2xl border-x-0 sm:border border-white/10 shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — safe-area 상단 패딩 + 대상 재료 명시 */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <h2 className="text-lg font-bold text-text-primary truncate flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">{emoji}</span>
            <span className="truncate">{ingredient.ingredient_name}</span>
            <span className="text-sm text-text-muted font-normal flex-shrink-0">수정</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 폼 — 스크롤 영역 + safe-area 하단 */}
        <div
          className="flex-1 overflow-y-auto px-5 pt-5"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <IngredientForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />

          {/* 삭제 버튼 — 수정 폼 하단에 배치 */}
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full mt-3 py-2.5 rounded-xl border border-error/30 text-error text-sm font-medium hover:bg-error/10 active:scale-[0.98] transition-all"
            >
              🗑 이 재료 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

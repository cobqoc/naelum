'use client';

import { useMemo } from 'react';
import IngredientForm from './IngredientForm';

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
}

export default function IngredientDetailModal({
  ingredient,
  isOpen,
  onClose,
  onUpdate
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
    onUpdate(ingredient.id, formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-background-secondary p-6 shadow-2xl">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">재료 수정</h2>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 폼 */}
        <IngredientForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import IngredientForm from './IngredientForm';

const IngredientImageUpload = dynamic(() => import('./IngredientImageUpload'), { ssr: false });
const ReceiptScanner = dynamic(() => import('./ReceiptScanner'), { ssr: false });

const STORAGE_ICONS: Record<string, string> = {
  '냉장': '❄️', '냉동': '🧊', '상온': '🌡️', '기타': '📦',
};

type TabType = 'form' | 'photo' | 'receipt';

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

interface PhotoLabel {
  name: string;
  ingredientId?: string;
  category: string;
  quantity?: number | null;
  unit?: string;
  purchase_date?: string;
  expiry_date?: string;
  storage_location?: string;
  notes?: string;
  expiry_alert?: boolean;
}

interface AddIngredientModalProps {
  isOpen: boolean;
  location: string | null;
  onClose: () => void;
  onAddIngredient: (formData: IngredientFormData) => void;
  onAddFromPhoto: (labels: PhotoLabel[]) => void;
}

export default function AddIngredientModal({
  isOpen,
  location,
  onClose,
  onAddIngredient,
  onAddFromPhoto,
}: AddIngredientModalProps) {
  const [tab, setTab] = useState<TabType>('form');

  if (!isOpen || !location) return null;

  const icon = STORAGE_ICONS[location] || '📦';

  const handlePhotoAdd = (labels: PhotoLabel[]) => {
    onAddFromPhoto(labels);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-background-primary rounded-t-3xl sm:rounded-2xl border border-white/10 shadow-2xl flex flex-col"
        style={{ maxHeight: '90dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h2 className="font-bold text-text-primary">{location}에 재료 추가</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-all"
          >
            ✕
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1.5 px-6 pt-4 pb-2 flex-shrink-0">
          {([
            { key: 'form',    label: '✏️ 직접 입력' },
            { key: 'photo',   label: '📷 사진' },
            { key: 'receipt', label: '🧾 영수증' },
          ] as { key: TabType; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                tab === key
                  ? 'bg-accent-warm text-background-primary'
                  : 'bg-background-secondary text-text-secondary hover:bg-white/8'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
          {tab === 'form' && (
            <IngredientForm
              onSubmit={onAddIngredient}
              onCancel={onClose}
              defaultStorageLocation={location}
            />
          )}
          {tab === 'photo' && (
            <IngredientImageUpload onAddIngredients={handlePhotoAdd} />
          )}
          {tab === 'receipt' && (
            <ReceiptScanner onAddIngredients={handlePhotoAdd} />
          )}
        </div>
      </div>
    </div>
  );
}

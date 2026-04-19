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

  const isSecondary = tab !== 'form';
  const secondaryTitle = tab === 'photo' ? '사진으로 추가' : tab === 'receipt' ? '영수증 스캔' : '';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-background-primary sm:rounded-2xl sm:border border-white/10 shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[88dvh]"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 — safe-area 상단 패딩 포함 (노치) */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isSecondary ? (
              <button
                onClick={() => setTab('form')}
                aria-label="뒤로"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-text-secondary transition-all flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <span className="text-xl">{icon}</span>
            )}
            <h2 className="font-bold text-text-primary truncate">
              {isSecondary ? secondaryTitle : `${location}에 재료 추가`}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-all flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 콘텐츠 — 하단 safe-area 포함 */}
        <div
          className="flex-1 overflow-y-auto px-5 pt-4"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {tab === 'form' && (
            <>
              <IngredientForm
                onSubmit={onAddIngredient}
                onCancel={onClose}
                defaultStorageLocation={location}
              />

              {/* 보조 액션 — 사진/영수증으로 일괄 추가 */}
              <div className="mt-6 pt-5 border-t border-white/5">
                <p className="text-[11px] text-text-muted mb-3 text-center tracking-wide">또는 여러 개 한번에</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTab('photo')}
                    className="group flex items-center gap-2.5 px-3 py-3 rounded-xl bg-background-secondary hover:bg-white/5 border border-white/5 transition-all active:scale-95"
                  >
                    <div className="w-9 h-9 rounded-lg bg-accent-warm/15 text-accent-warm flex items-center justify-center flex-shrink-0 group-hover:bg-accent-warm/25 transition-colors">
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <circle cx="12" cy="13" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-[13px] font-semibold text-text-primary leading-tight">사진 인식</div>
                      <div className="text-[10px] text-text-muted leading-tight mt-0.5">재료 촬영</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setTab('receipt')}
                    className="group flex items-center gap-2.5 px-3 py-3 rounded-xl bg-background-secondary hover:bg-white/5 border border-white/5 transition-all active:scale-95"
                  >
                    <div className="w-9 h-9 rounded-lg bg-info/15 text-info flex items-center justify-center flex-shrink-0 group-hover:bg-info/25 transition-colors">
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 2v20l3-2 3 2 3-2 3 2V2H9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7h6M12 11h6M12 15h4" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-[13px] font-semibold text-text-primary leading-tight">영수증 스캔</div>
                      <div className="text-[10px] text-text-muted leading-tight mt-0.5">마트 영수증</div>
                    </div>
                  </button>
                </div>
              </div>
            </>
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

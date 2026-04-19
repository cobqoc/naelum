'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import IngredientForm from './IngredientForm';

type LocMode = null | '냉장' | '냉동' | '상온';

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
  // 저장 위치 선택 state — IngredientForm의 pill UI가 헤더로 이관됨.
  // null = 자동 분류 (디폴트) / '냉장'·'냉동'·'상온' = 수동 override
  const [selectedLocation, setSelectedLocation] = useState<LocMode>(null);

  // 모달이 특정 섹션으로 열리면 (예: '냉장') 그 위치로 pre-select.
  // FAB('auto')로 열리면 null(자동) 유지. 모달이 열릴 때마다 탭도 form으로 리셋.
  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedLocation(
      location && location !== 'auto' && ['냉장', '냉동', '상온'].includes(location)
        ? (location as LocMode)
        : null
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTab('form');
  }, [isOpen, location]);

  if (!isOpen || !location) return null;

  // 'auto' 센티넬 = FAB에서 열린 경우. 특정 섹션 타겟 없이 generic 타이틀/아이콘 사용.
  const isAuto = location === 'auto';
  const icon = isAuto ? '✨' : (STORAGE_ICONS[location] || '📦');

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
        {/* 헤더 — safe-area 상단 패딩 포함 (노치).
            form 탭일 때: 타이틀 제거하고 저장 위치 pill 표시. 보조 탭(사진/영수증): 기존 타이틀 유지. */}
        <div
          className="border-b border-white/5 flex-shrink-0"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          {/* 상단 라인: 뒤로/아이콘 + 타이틀/자동분류 라벨 + 닫기 */}
          <div className="flex items-center justify-between px-5 pt-1 pb-2">
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
              ) : null}
              {isSecondary ? (
                <h2 className="font-bold text-text-primary truncate">{secondaryTitle}</h2>
              ) : (
                <label className="text-xs font-medium flex items-center gap-1.5 min-w-0" aria-label="재료 추가 — 저장 위치 선택">
                  <span className="text-accent-warm font-bold whitespace-nowrap">✨ 기본: 자동 분류</span>
                  {selectedLocation && (
                    <span className="text-text-muted truncate">
                      → 현재 <span className="text-accent-warm">{selectedLocation}</span>으로 고정됨
                    </span>
                  )}
                </label>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {!isSecondary && selectedLocation && (
                <button
                  type="button"
                  onClick={() => setSelectedLocation(null)}
                  className="text-[10px] text-accent-warm hover:underline"
                >
                  자동으로 돌리기
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="닫기"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* form 탭 전용: 저장 위치 pill (이전에 IngredientForm 내부에 있던 UI) */}
          {!isSecondary && (
            <div className="px-5 pb-3">
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { key: '냉장', icon: '❄️' },
                  { key: '냉동', icon: '🧊' },
                  { key: '상온', icon: '🌡' },
                ] as const).map((opt) => {
                  const active = selectedLocation === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSelectedLocation(active ? null : opt.key)}
                      className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs font-semibold transition-all ${
                        active
                          ? 'bg-accent-warm text-background-primary shadow-md shadow-accent-warm/30'
                          : 'bg-background-secondary text-text-secondary hover:bg-white/5 border border-white/10'
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.key}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[10px] text-text-muted leading-relaxed">
                ⚠️ 자동 분류는 정확하지 않을 수 있어요. 위 버튼으로 일괄 지정하거나, 태그를 눌러 개별 수정할 수 있어요.
              </p>
            </div>
          )}
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
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
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

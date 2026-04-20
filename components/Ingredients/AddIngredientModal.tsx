'use client';

import { useState, useEffect } from 'react';
import IngredientForm from './IngredientForm';

type LocMode = null | '냉장' | '냉동' | '상온';

const STORAGE_ICONS: Record<string, string> = {
  '냉장': '❄️', '냉동': '🧊', '상온': '🌡️', '기타': '📦',
};

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

interface AddIngredientModalProps {
  isOpen: boolean;
  location: string | null;
  onClose: () => void;
  onAddIngredient: (formData: IngredientFormData) => void;
}

export default function AddIngredientModal({
  isOpen,
  location,
  onClose,
  onAddIngredient,
}: AddIngredientModalProps) {
  // 저장 위치 선택 state — IngredientForm의 pill UI가 헤더로 이관됨.
  // null = 자동 분류 (디폴트) / '냉장'·'냉동'·'상온' = 수동 override
  const [selectedLocation, setSelectedLocation] = useState<LocMode>(null);

  // 모달이 특정 섹션으로 열리면 (예: '냉장') 그 위치로 pre-select.
  // FAB('auto')로 열리면 null(자동) 유지.
  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedLocation(
      location && location !== 'auto' && ['냉장', '냉동', '상온'].includes(location)
        ? (location as LocMode)
        : null
    );
  }, [isOpen, location]);

  if (!isOpen || !location) return null;

  // 'auto' 센티넬 = FAB에서 열린 경우. 특정 섹션 타겟 없이 generic 아이콘 사용.
  const isAuto = location === 'auto';
  const _icon = isAuto ? '✨' : (STORAGE_ICONS[location] || '📦');
  void _icon;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-background-primary sm:rounded-2xl sm:border border-white/10 shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[88dvh]"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 — safe-area 상단 패딩 포함 (노치). 타이틀 제거하고 저장 위치 pill 상단에 배치. */}
        <div
          className="border-b border-white/5 flex-shrink-0"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          {/* 상단 라인: 자동 분류 라벨 + 닫기 */}
          <div className="flex items-center justify-between px-5 pt-1 pb-2">
            <label className="text-xs font-medium flex items-center gap-1.5 min-w-0" aria-label="재료 추가 — 저장 위치 선택">
              <span className="text-accent-warm font-bold whitespace-nowrap">✨ 기본: 자동 분류</span>
              {selectedLocation && (
                <span className="text-text-muted truncate">
                  → 현재 <span className="text-accent-warm">{selectedLocation}</span>으로 고정됨
                </span>
              )}
            </label>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {selectedLocation && (
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

          {/* 저장 위치 pill (냉장/냉동/상온) */}
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
        </div>

        {/* 콘텐츠 — 하단 safe-area 포함 */}
        <div
          className="flex-1 overflow-y-auto px-5 pt-4"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <IngredientForm
            onSubmit={onAddIngredient}
            onCancel={onClose}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
          />
        </div>
      </div>
    </div>
  );
}

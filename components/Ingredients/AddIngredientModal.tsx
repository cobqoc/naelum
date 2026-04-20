'use client';

import { useState, useEffect } from 'react';
import IngredientForm from './IngredientForm';

type LocMode = null | '냉장' | '냉동' | '상온';

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
  // ⓘ 아이콘으로 자동 분류 안내 표시 토글 (기본 숨김, 매번 보이는 경고문 피로도 감소)
  const [showHint, setShowHint] = useState(false);

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
    // 모달 닫혔다 다시 열릴 때 힌트 상태 초기화
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowHint(false);
  }, [isOpen, location]);

  if (!isOpen || !location) return null;

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
          {/* 상단 라인: 자동 분류 라벨 (+ⓘ 토글) + 닫기.
              "자동으로 돌리기" 링크 제거 — 활성 pill 재탭으로 토글 가능 (중복 UI였음). */}
          <div className="flex items-center justify-between px-5 pt-1 pb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-accent-warm whitespace-nowrap">✨ 기본: 자동 분류</span>
              <button
                type="button"
                onClick={() => setShowHint(prev => !prev)}
                aria-label="자동 분류 안내 보기"
                aria-expanded={showHint}
                className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0 transition-colors ${
                  showHint
                    ? 'bg-accent-warm text-background-primary'
                    : 'bg-white/10 text-text-muted hover:bg-white/15 hover:text-text-secondary'
                }`}
              >
                ⓘ
              </button>
              {selectedLocation && (
                <span className="text-[11px] text-text-muted truncate">
                  → <span className="text-accent-warm">{selectedLocation}</span>으로 고정
                </span>
              )}
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
            {/* 안내 문구 — ⓘ 클릭 시에만 노출 (매번 반복 노출 제거) */}
            {showHint && (
              <p className="mt-1.5 text-[10px] text-text-muted leading-relaxed bg-white/5 rounded-md px-2.5 py-2">
                자동 분류는 정확하지 않을 수 있어요.<br/>
                <span className="text-text-secondary">• 위 버튼 탭 → 모든 재료 해당 위치로 일괄 지정 (같은 버튼 다시 탭 → 자동으로 복귀)</span><br/>
                <span className="text-text-secondary">• 아래 추가된 태그 탭 → 해당 재료 개별 수정</span>
              </p>
            )}
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

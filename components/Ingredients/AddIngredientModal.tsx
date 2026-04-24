'use client';

import { useState, useEffect, useRef } from 'react';
import IngredientForm from './IngredientForm';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useI18n } from '@/lib/i18n/context';

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
  const { t } = useI18n();
  // 저장 위치 선택 state — IngredientForm의 pill UI가 헤더로 이관됨.
  // null = 자동 분류 (디폴트) / '냉장'·'냉동'·'상온' = 수동 override
  const [selectedLocation, setSelectedLocation] = useState<LocMode>(null);
  // ⓘ 툴팁/팝오버 — 방법 안내(how-to)만 숨김. 경고 자체는 헤더에 항상 노출.
  const [showHint, setShowHint] = useState(false);
  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 모달 자체 ESC로 닫기 — 힌트가 열려있지 않을 때만 (힌트가 우선)
  useEscapeKey(onClose, isOpen && !showHint);

  // 힌트 팝오버 외부 클릭 / ESC 키 → 힌트만 닫기
  useEscapeKey(() => setShowHint(false), showHint);
  useEffect(() => {
    if (!showHint) return;
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (hintButtonRef.current?.contains(target)) return;
      setShowHint(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, [showHint]);

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
          {/* 상단 라인: 자동 분류 라벨 + 경고(항상 노출) + ⓘ(how-to 팝오버) + 닫기 */}
          <div className="flex items-center justify-between px-5 pt-1 pb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-accent-warm whitespace-nowrap">✨ 보관 장소: 자동 분류</span>
              <span className="text-[11px] text-text-muted whitespace-nowrap">· 100% 정확하지 않음</span>
              {/* ⓘ 버튼 + 팝오버 — group-hover로 데스크탑 hover 지원, onClick으로 모바일 탭 지원 */}
              <div className="relative group">
                <button
                  ref={hintButtonRef}
                  type="button"
                  onClick={() => setShowHint(prev => !prev)}
                  aria-label={t.ingredient.howToAddLabel}
                  aria-expanded={showHint}
                  className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0 transition-colors ${
                    showHint
                      ? 'bg-accent-warm text-background-primary'
                      : 'bg-white/10 text-text-muted hover:bg-white/15 hover:text-text-secondary'
                  }`}
                >
                  ⓘ
                </button>

                {/* 팝오버 — 데스크탑: group-hover로 자동 노출. 모바일: 탭으로 showHint 토글. */}
                <div
                  ref={popoverRef}
                  role="tooltip"
                  className={`absolute top-full left-0 mt-2 z-10 w-[260px] max-w-[calc(100vw-2.5rem)] p-3 rounded-lg bg-background-tertiary border border-white/10 shadow-xl text-[11px] leading-relaxed transition-opacity ${
                    showHint
                      ? 'opacity-100 visible pointer-events-auto'
                      : 'opacity-0 invisible pointer-events-none md:group-hover:opacity-100 md:group-hover:visible md:group-hover:pointer-events-auto'
                  }`}
                >
                  {/* 화살표 */}
                  <div className="absolute -top-1 left-2 w-2 h-2 rotate-45 bg-background-tertiary border-l border-t border-white/10" />
                  <p className="text-text-primary font-semibold mb-1.5">💡 재료 분류 방법</p>
                  <ul className="space-y-1 text-text-secondary">
                    <li>• <strong className="text-text-primary">위 냉장/냉동/상온 버튼</strong> → 모든 재료 일괄 지정</li>
                    <li>• <strong className="text-text-primary">추가된 태그 탭</strong> → 재료별 개별 수정</li>
                    <li className="text-text-muted pt-1">활성 버튼 재탭 → 자동 모드로 복귀</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {selectedLocation && (
                <span className="text-[11px] text-text-muted whitespace-nowrap">
                  → <span className="text-accent-warm">{selectedLocation}</span>
                </span>
              )}
              <button
                onClick={onClose}
                aria-label={t.common.close}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 저장 위치 pill (냉장/냉동/상온) — 경고문 제거, how-to는 ⓘ 팝오버로 이관 */}
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

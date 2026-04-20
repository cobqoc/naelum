'use client';

import { useEffect } from 'react';

interface FridgeItem {
  id: string;
  ingredient_name: string;
  category: string;
  expiry_date: string | null;
  storage_location: string | null;
  purchase_date?: string | null;
}

interface Props {
  isOpen: boolean;
  items: FridgeItem[];
  onClose: () => void;
  /** 재료 클릭 시 기존 액션 시트(만들기/수정/삭제) 오픈 */
  onItemClick: (item: FridgeItem) => void;
  /** chip hover X 클릭 시 빠른 삭제 (데스크톱) */
  onDelete: (item: FridgeItem) => void;
  /** freshState 계산 함수 (HomeClient에서 주입) */
  freshState: (item: Pick<FridgeItem, 'expiry_date' | 'purchase_date'>) => {
    border: string; label: string; isDanger: boolean;
  };
  /** getEmoji 함수 주입 */
  getEmoji: (name: string, category: string) => string;
}

const GROUP_ORDER: { key: string; icon: string; label: string }[] = [
  { key: '냉장', icon: '❄️', label: '냉장' },
  { key: '냉동', icon: '🧊', label: '냉동' },
  { key: '상온', icon: '🌡', label: '상온' },
];

/**
 * +N 오버플로우 버튼 탭 시 열리는 전체 재료 리스트 시트.
 * 냉장/냉동/상온 별로 그룹핑, 각 chip 탭은 액션 시트로 연결.
 */
export default function FridgeAllSheet({ isOpen, items, onClose, onItemClick, onDelete, freshState, getEmoji }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 그룹별 분류 (상온 + 기타 포함, null은 냉장으로)
  const groups: Record<string, FridgeItem[]> = { 냉장: [], 냉동: [], 상온: [] };
  for (const item of items) {
    const loc = item.storage_location;
    if (loc === '냉동') groups['냉동'].push(item);
    else if (loc === '상온' || loc === '기타') groups['상온'].push(item);
    else groups['냉장'].push(item); // 냉장 or null
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-background-secondary rounded-t-2xl md:rounded-2xl border-t md:border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85dvh]">
        {/* 핸들 (모바일) */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* 헤더 */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-sm">
            🧺 재료 전체 보기 <span className="text-text-muted font-normal">({items.length}개)</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-all"
            aria-label="닫기"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 그룹별 리스트 */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {GROUP_ORDER.map(({ key, icon, label }) => {
            const list = groups[key];
            if (list.length === 0) return null;
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-text-secondary">
                  <span>{icon}</span>
                  <span>{label}</span>
                  <span className="text-text-muted font-normal">({list.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map(item => {
                    const { border, label: freshLabel, isDanger } = freshState(item);
                    const emoji = getEmoji(item.ingredient_name, item.category);
                    return (
                      <div key={item.id} className="relative group md:pt-2 md:pr-2 md:-mt-2 md:-mr-2">
                        <button
                          onClick={() => { onItemClick(item); }}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-md bg-white/95 border-2 hover:scale-105 active:scale-95 transition-all ${isDanger ? 'animate-pulse' : ''}`}
                          style={{ borderColor: border, boxShadow: isDanger ? `0 0 4px ${border}66` : '0 1px 2px rgba(0,0,0,0.15)' }}
                          title={`${item.ingredient_name}${freshLabel ? ` · ${freshLabel}` : ''}`}
                        >
                          <span className="text-base leading-none">{emoji}</span>
                          <span className="text-xs font-bold text-gray-800 leading-none max-w-[90px] truncate">
                            {item.ingredient_name}
                          </span>
                          {freshLabel && (
                            <span className="text-[10px] font-bold leading-none" style={{ color: border }}>{freshLabel}</span>
                          )}
                        </button>
                        {/* 데스크톱 hover X 빠른 삭제 */}
                        <button
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(item); }}
                          className="hidden md:flex absolute top-0 right-0 w-4 h-4 items-center justify-center rounded-full bg-error text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md ring-2 ring-white"
                          aria-label={`${item.ingredient_name} 삭제`}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

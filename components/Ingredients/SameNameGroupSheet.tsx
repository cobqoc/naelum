'use client';

import type { RefObject } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { formatFreshLabel, type FreshLabelKind } from '@/app/[lang]/_home/helpers';
import { toStoredUnit } from '@/lib/ingredients/unitSentinel';
import CloseIcon from '@/components/icons/CloseIcon';

/** 미니 시트 행 표시에 필요한 필드 — HomeClient(FridgeItem)·FridgeAllSheet 양쪽 항목이 구조적으로 만족 */
export interface SameNameGroupItem {
  id: string;
  category: string;
  expiry_date: string | null;
  storage_location: string | null;
  purchase_date?: string | null;
  quantity?: number | null;
  unit?: string | null;
  shelf_life_days?: Record<string, number> | null;
}

interface Props<T extends SameNameGroupItem> {
  /** 헤더 표시명(데모 칩이면 로케일 표시명) */
  name: string;
  items: T[];
  freshState: (item: T) => { border: string; labelKind: FreshLabelKind; labelN: number; isEstimate: boolean };
  onClose: () => void;
  /** 행 선택 — 시트를 먼저 닫고(onClose) 호출 */
  onPick: (item: T) => void;
  /** 행 보조줄에 보관 위치를 붙여 보여줄지(홈 냉장고 쪽만 — 원래 두 화면의 차이 그대로) */
  showStorage?: boolean;
  /** 패널 ref — 감싸는 쪽이 포커스 트랩을 걸 때(FridgeAllSheet, PHR-33). 마크업엔 영향 없음 */
  panelRef?: RefObject<HTMLDivElement | null>;
}

/**
 * "같은 이름 그룹" 미니 시트 — 같은 이름 재료 칩(×N)을 누르면 그룹 내 항목을 골라 여는 시트.
 * HomeClient 와 FridgeAllSheet 에 같은 마크업이 두 벌 복붙돼 있던 것을 하나로(ICL-15 / PHR-33, 2026-10-04).
 * 마크업·className·텍스트·행 클릭 순서(닫기 → 선택)는 두 원본과 동일하고, 차이였던 보관 위치 표시만 prop.
 */
export default function SameNameGroupSheet<T extends SameNameGroupItem>({
  name, items, freshState, onClose, onPick, showStorage = false, panelRef,
}: Props<T>) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-[75] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div ref={panelRef} className="relative w-full md:max-w-sm bg-background-secondary rounded-t-2xl md:rounded-2xl border-t md:border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[70dvh]">
        <div className="md:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-sm">
            {name} <span className="text-text-muted font-normal">×{items.length}</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-all"
            aria-label={t.common.close}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {items.map(item => {
            const { border, labelKind, labelN, isEstimate } = freshState(item);
            const freshLabel = formatFreshLabel(labelKind, labelN, t, isEstimate);
            return (
              <button
                key={item.id}
                onClick={() => { onClose(); onPick(item); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background-tertiary hover:bg-white/10 transition-colors text-left"
              >
                <span className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: border }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">
                    {/* 단위 미선택 센티넬('선택')은 표시하지 않음 — 옛 저장분이 "1선택" 으로 보이던 것(PHR-44) */}
                    {item.quantity != null ? `${item.quantity}${toStoredUnit(item.unit) ?? ''}` : t.ingredient.qtyUnknown}
                  </div>
                  <div className="text-[11px] text-text-muted truncate">
                    {item.purchase_date ? `${t.ingredient.purchasedShort} ${item.purchase_date.slice(5)}` : ''}
                    {item.expiry_date ? ` · ${t.ingredient.expiryShort} ${item.expiry_date.slice(5)}` : ''}
                    {showStorage && item.storage_location ? ` · ${item.storage_location}` : ''}
                    {freshLabel ? ` · ${freshLabel}` : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

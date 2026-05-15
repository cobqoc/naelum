'use client';

import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useI18n } from '@/lib/i18n/context';

interface ExistingItem {
  id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  expiry_date: string | null;
  storage_location: string | null;
}

interface Props {
  isOpen: boolean;
  /** 새로 추가하려는 재료명 */
  newName: string;
  /** 같은 이름의 기존 재료 목록 (1개 이상) */
  existingItems: ExistingItem[];
  onClose: () => void;
  /** 따로 추가 — 그대로 새 행 INSERT */
  onAddSeparate: () => void;
  /** 수량 합치기 — 어느 기존 항목에 합칠지(여러 개 있을 때) */
  onMerge: (targetItemId: string) => void;
}

/**
 * 냉장고에 같은 이름 재료가 이미 있을 때 사용자에게 의도 확인.
 * 따로 추가(다른 유통기한·구매일) vs 수량 합치기.
 */
export default function DuplicateIngredientDialog({
  isOpen, newName, existingItems, onClose, onAddSeparate, onMerge,
}: Props) {
  const { t } = useI18n();
  useEscapeKey(onClose, isOpen);

  if (!isOpen || existingItems.length === 0) return null;

  // 기본 합치기 대상: 첫 번째 기존 항목 (보통 가장 임박한 만료일 기준 정렬됨)
  const defaultTarget = existingItems[0];

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-sm bg-background-secondary rounded-t-2xl md:rounded-2xl border-t md:border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* 핸들 (모바일) */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pt-3 pb-2">
          <h3 className="font-bold text-base text-text-primary">
            {t.ingredient.duplicateTitle}
          </h3>
          <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
            {t.ingredient.duplicateDesc
              .replace('{name}', newName)
              .replace('{count}', String(existingItems.length))}
          </p>
        </div>

        {/* 기존 항목 미니 목록 (정보 제공) */}
        <div className="px-5 pb-3 space-y-1.5">
          {existingItems.slice(0, 3).map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2 text-[11px] text-text-muted bg-background-tertiary/60 rounded-md px-2.5 py-1.5"
            >
              <span aria-hidden="true">·</span>
              <span className="flex-1 truncate">
                {item.quantity != null ? `${item.quantity}${item.unit ?? ''}` : t.ingredient.qtyUnknown}
                {item.expiry_date ? ` · ${t.ingredient.expiryShort} ${item.expiry_date.slice(5)}` : ''}
                {item.storage_location ? ` · ${item.storage_location}` : ''}
              </span>
            </div>
          ))}
          {existingItems.length > 3 && (
            <p className="text-[10px] text-text-muted text-center">
              +{existingItems.length - 3}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="border-t border-white/10 p-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onMerge(defaultTarget.id)}
            className="w-full py-2.5 rounded-xl bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover transition-colors active:scale-[0.98]"
          >
            {t.ingredient.mergeQuantity}
          </button>
          <button
            type="button"
            onClick={onAddSeparate}
            className="w-full py-2.5 rounded-xl bg-background-tertiary border border-white/10 text-text-primary text-sm font-medium hover:bg-white/5 transition-colors"
          >
            {t.ingredient.addSeparate}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

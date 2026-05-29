'use client';

import { useRef } from 'react';
import type { TranslationKeys } from '@/lib/i18n/translations';
import type { useUnitConversion } from '@/lib/hooks/useUnitConversion';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

/**
 * 쿠킹 모드 재료 하단 시트 (순수 표현).
 *
 * god-file(RecipeCookMode) 분해 Phase 2. preparedIngredients·onTogglePrepared·
 * isIngredientOwned·unitConv 는 부모 소유 — 값+콜백만. JSX·className 원본과
 * byte-identical → 행위 변경 0.
 */

interface RecipeIngredient {
  ingredient_id?: string | null;  // V2: id 기반 매칭
  ingredient_name: string;
  quantity: string;
  unit: string;
  notes?: string;
}

type UnitConv = ReturnType<typeof useUnitConversion>;

export default function CookIngredientsSheet({
  t,
  ingredients,
  preparedIngredients,
  onTogglePrepared,
  isIngredientOwned,
  unitConv,
  onClose,
}: {
  t: TranslationKeys;
  ingredients: RecipeIngredient[];
  preparedIngredients: Set<number>;
  onTogglePrepared: (index: number) => void;
  /** V2: ingredient_id 기반 매칭. null = 옛 데이터 → false */
  isIngredientOwned: (ingredient_id: string | null) => boolean;
  unitConv: UnitConv;
  onClose: () => void;
}) {
  // a11y: 호출처 조건부 마운트.
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose, true);
  useFocusTrap(true, panelRef);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      />
      <div ref={panelRef} className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] bg-background-secondary rounded-t-2xl border-t border-white/10 overflow-hidden animate-slide-up">
        {/* 드래그 핸들 */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(70vh-48px)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{t.cookMode.ingredientsShort}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-background-tertiary flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ingredients.map((ing, idx) => {
              const owned = isIngredientOwned(ing.ingredient_id ?? null);
              const prepared = preparedIngredients.has(idx);
              const displayUnit = (ing.unit && ing.unit !== '선택') ? ing.unit : '';
              const converted = unitConv.convertIngredient(ing.quantity, displayUnit);
              return (
                <div
                  key={idx}
                  onClick={() => onTogglePrepared(idx)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-95 ${
                    prepared
                      ? 'bg-success/20 border-success'
                      : owned
                        ? 'bg-background-tertiary border-text-muted/30'
                        : 'bg-background-tertiary border-error/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      prepared ? 'text-success' : owned ? 'text-text-primary' : 'text-error'
                    }`}>
                      {ing.ingredient_name}
                    </span>
                    {prepared && <span className="text-success text-xs">✓</span>}
                  </div>
                  <div className="text-xs text-text-muted">
                    {converted.isConverted ? (
                      <><span className="text-info">{converted.quantity} {converted.unit}</span> <span className="opacity-60">({ing.quantity}{displayUnit})</span></>
                    ) : (
                      <>{ing.quantity} {displayUnit}</>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

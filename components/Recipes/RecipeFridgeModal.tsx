'use client';

import { useI18n } from '@/lib/i18n/context';

interface RecipeFridgeModalProps {
  onClose: () => void;
  /** 내 냉장고에 보유 중인 이 레시피 재료명 (동의어 매칭) */
  ownedNames: string[];
  /** 대체 가능 — 보유는 아니지만 가진 재료(via)로 바꿔 쓸 수 있는 레시피 재료 */
  substituteItems: { ingredient: string; via: string }[];
  /** 없는 재료명 (대체도 불가 — 사야 함) */
  missingNames: string[];
  /** 냉장고가 비어있음(미로그인·재료 0개) — 안내문 표시 */
  fridgeEmpty?: boolean;
}

/**
 * 레시피 ↔ 내 냉장고 재료 대조 모달 (보유 ✓ / 대체 가능 🔄 / 없는 ✗).
 *
 * 레시피 상세(RecipeBrowseView)·추천 카드(FridgeRecipeCard) 공용.
 * 순수 표현 — 분류된 목록을 props 로 받아 그리기만 한다.
 * "보유"는 같은 재료만(동의어). 까나리액젓을 가졌다고 멸치액젓을 "보유"라
 * 하지 않고 "대체 가능"으로 정직하게 보여준다. 호출처가 조건부 마운트.
 */
export default function RecipeFridgeModal({
  onClose,
  ownedNames,
  substituteItems,
  missingNames,
  fridgeEmpty,
}: RecipeFridgeModalProps) {
  const { t } = useI18n();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div
        className="relative mx-4 w-full max-w-sm bg-background-secondary rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="font-bold text-text-primary">{t.recipe.fridgeModalTitle}</span>
          <button
            onClick={onClose}
            aria-label={t.common.close}
            className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-4">
          {/* 보유 재료 */}
          {ownedNames.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-success mb-2">
                {t.recipe.fridgeModalOwned} ({ownedNames.length})
              </p>
              <div className="space-y-1">
                {ownedNames.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-text-primary">
                    <span className="text-success">✓</span>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 대체 가능 — 보유는 아니지만 가진 재료로 바꿔 쓸 수 있음 */}
          {substituteItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-warning mb-2">
                {t.recipe.fridgeModalSubstitute} ({substituteItems.length})
              </p>
              <div className="space-y-1">
                {substituteItems.map((it, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-text-primary">
                    <span className="text-warning">🔄</span>
                    <span>{it.ingredient}</span>
                    <span className="ml-auto text-xs text-text-muted">↔ {it.via}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 없는 재료 */}
          {missingNames.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-error mb-2">
                {t.recipe.fridgeModalMissing} ({missingNames.length})
              </p>
              <div className="space-y-1">
                {missingNames.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-error">✗</span>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 미로그인 / 냉장고 비어있음 */}
          {fridgeEmpty && (
            <p className="text-sm text-text-muted text-center py-4">{t.recipe.fridgeModalEmpty}</p>
          )}
        </div>
      </div>
    </div>
  );
}

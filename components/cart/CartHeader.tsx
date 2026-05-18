import CartIcon from '@/components/icons/CartIcon';
import type { TranslationKeys } from '@/lib/i18n/translations';
import type { GroupMode } from '@/lib/shopping-list/groupItems';

/**
 * cart 드롭다운 헤더 — 타이틀·진행률·그룹모드 토글·액션(hide/share/clear) (순수 표현).
 *
 * god-file(ShoppingCartDropdown) 분해 Phase 2. 상태·핸들러는 부모 소유, 값+콜백만
 * props. JSX·className 원본과 byte-identical → 행위 변경 0. 회귀 가드:
 * e2e/cart-decomposition.spec.ts(그룹모드 토글)·cart.spec.ts(진행률/hide/clear).
 */

interface CartHeaderProps {
  t: TranslationKeys;
  uncheckedCount: number;
  totalCount: number;
  checkedCount: number;
  progressPct: number;
  groupMode: GroupMode;
  switchGroupMode: (mode: GroupMode) => void;
  hideChecked: boolean;
  toggleHideChecked: () => void;
  handleShare: () => void;
  sharing: boolean;
  clearAll: () => void;
  onClose: () => void;
}

export default function CartHeader({
  t,
  uncheckedCount,
  totalCount,
  checkedCount,
  progressPct,
  groupMode,
  switchGroupMode,
  hideChecked,
  toggleHideChecked,
  handleShare,
  sharing,
  clearAll,
  onClose,
}: CartHeaderProps) {
  return (
    <div className="px-4 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm flex items-center gap-1.5">
          <CartIcon size={20} active />
          {t.cart.titleText} {uncheckedCount > 0 && <span className="text-accent-warm">({uncheckedCount})</span>}
        </span>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors text-base"
          aria-label={t.cart.closeAria}
        >
          ✕
        </button>
      </div>

      {/* 진행률 바 — 항목이 있을 때만 */}
      {totalCount > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
            <span>{t.cart.checkedProgress.replace('{checked}', String(checkedCount)).replace('{total}', String(totalCount))}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-accent-warm transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* 그룹 모드 토글 + 액션 — 항목 있을 때 */}
      {totalCount > 0 && (
        <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
          {totalCount >= 2 ? (
            <div className="inline-flex rounded-lg bg-background-tertiary p-0.5 text-[11px]">
              <button
                onClick={() => switchGroupMode('recipe')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  groupMode === 'recipe'
                    ? 'bg-accent-warm/20 text-accent-warm font-medium'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {t.cart.groupByRecipe}
              </button>
              <button
                onClick={() => switchGroupMode('category')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  groupMode === 'category'
                    ? 'bg-accent-warm/20 text-accent-warm font-medium'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {t.cart.groupByCategory}
              </button>
            </div>
          ) : <span />}

          <div className="flex items-center gap-1.5 text-[11px]">
            {/* #4 완료 항목 숨김 토글 — 체크된 게 있을 때만 노출 */}
            {checkedCount > 0 && (
              <button
                onClick={toggleHideChecked}
                className={`px-2 py-1 rounded-md transition-all ${
                  hideChecked
                    ? 'bg-accent-warm/20 text-accent-warm font-medium'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {hideChecked ? t.cart.showAll : t.cart.hideChecked}
              </button>
            )}
            {/* 공유 — 가족·룸메이트 read-only 링크 */}
            <button
              onClick={handleShare}
              disabled={sharing}
              aria-label={t.cart.shareButton}
              className="px-2 py-1 rounded-md text-text-muted hover:text-accent-warm transition-colors disabled:opacity-50"
            >
              {sharing ? t.cart.shareGenerating : `🔗 ${t.cart.shareButton}`}
            </button>
            {/* #5 전체 비우기 */}
            <button
              onClick={clearAll}
              aria-label={t.cart.clearAllAria}
              className="px-2 py-1 rounded-md text-text-muted hover:text-error transition-colors"
            >
              🗑 {t.cart.clearAll}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

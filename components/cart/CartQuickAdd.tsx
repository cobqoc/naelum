import type { TranslationKeys } from '@/lib/i18n/translations';
import type { QuickItem } from '@/components/cart/types';

/**
 * cart quick-add 칩 행 — favorites + POPULAR_ITEMS 통합 (순수 표현).
 *
 * god-file(ShoppingCartDropdown) 분해 Phase 2. quickAddItems 계산·quickAdd·
 * toggleFavoriteStar 로직은 부모 소유 — 값+콜백만. JSX·className 원본과
 * byte-identical → 행위 변경 0. 회귀 가드: cart.spec.ts #6(빈 상태 quick-add).
 * (loggedIn = 원본 `user` 진위값. 표현 분기만 — 동작 동일)
 */

interface CartQuickAddProps {
  t: TranslationKeys;
  quickAddItems: QuickItem[];
  loggedIn: boolean;
  toggleFavoriteStar: (name: string, category: string, isStarred: boolean) => void;
  quickAdd: (name: string, cartCategory: string) => void;
  adding: boolean;
}

export default function CartQuickAdd({
  t,
  quickAddItems,
  loggedIn,
  toggleFavoriteStar,
  quickAdd,
  adding,
}: CartQuickAddProps) {
  if (quickAddItems.length === 0) return null;
  return (
    <div data-testid="cart-quick-add" className="px-3 py-2 border-b border-white/10 flex-shrink-0">
      <div className="flex flex-wrap gap-1">
        {quickAddItems.map(item => (
          <div
            key={item.name}
            className={`inline-flex items-center rounded-full text-[11px] transition-colors ${
              item.isStarred
                ? 'bg-yellow-400/12 hover:bg-yellow-400/20 text-text-primary'
                : 'bg-background-tertiary hover:bg-accent-warm/15 text-text-secondary hover:text-accent-warm'
            }`}
          >
            {/* ⭐ 토글 — 로그인 사용자에게만 */}
            {loggedIn && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  toggleFavoriteStar(item.name, item.category, item.isStarred);
                }}
                aria-pressed={item.isStarred}
                aria-label={item.isStarred ? t.cart.unstarAria : t.cart.starAria}
                className={`pl-1.5 pr-0.5 py-1 text-xs leading-none ${item.isStarred ? 'text-yellow-400' : 'text-text-muted/60 hover:text-yellow-400'}`}
              >
                <span aria-hidden="true">{item.isStarred ? '⭐' : '☆'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => quickAdd(item.name, item.category)}
              disabled={adding}
              className={`flex items-center gap-1 ${loggedIn ? 'pl-0.5' : 'pl-2'} pr-2 py-1 disabled:opacity-50 max-w-[8rem]`}
            >
              <span aria-hidden="true" className="flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.name}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

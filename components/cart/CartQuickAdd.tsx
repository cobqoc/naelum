import type { QuickItem } from '@/components/cart/types';

/**
 * cart quick-add 칩 행 — favorites + POPULAR_ITEMS 통합 (순수 표현).
 *
 * god-file(ShoppingCartDropdown) 분해 Phase 2. quickAddItems 계산·quickAdd
 * 로직은 부모 소유 — 값+콜백만.
 * 회귀 가드: cart.spec.ts #6(빈 상태 quick-add).
 */

interface CartQuickAddProps {
  quickAddItems: QuickItem[];
  quickAdd: (name: string, cartCategory: string) => void;
  adding: boolean;
}

export default function CartQuickAdd({
  quickAddItems,
  quickAdd,
  adding,
}: CartQuickAddProps) {
  if (quickAddItems.length === 0) return null;
  return (
    <div data-testid="cart-quick-add" className="px-3 py-2 border-b border-white/10 flex-shrink-0">
      <div className="flex flex-wrap gap-1">
        {quickAddItems.map(item => (
          <button
            key={item.name}
            type="button"
            onClick={() => quickAdd(item.name, item.category)}
            disabled={adding}
            className="inline-flex items-center gap-1 rounded-full bg-background-tertiary hover:bg-accent-warm/15 text-text-secondary hover:text-accent-warm text-[11px] pl-2 pr-2 py-1 transition-colors disabled:opacity-50 max-w-[8rem]"
          >
            <span aria-hidden="true" className="flex-shrink-0">{item.icon}</span>
            <span className="truncate">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

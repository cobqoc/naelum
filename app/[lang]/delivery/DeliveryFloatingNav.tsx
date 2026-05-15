'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { useCart } from '@/lib/delivery/hooks';
import { cartItemCount } from '@/lib/delivery/cart';

// 각 delivery 페이지가 개별 렌더링. layout에서 호출 시 hydration context 문제 발생.
export default function DeliveryFloatingNav() {
  const { t, language } = useI18n();
  const pathname = usePathname();
  const cart = useCart();
  const count = cartItemCount(cart);

  const onCart = pathname?.endsWith('/delivery/cart');
  // 주문 상세(/orders/[id])에서는 FAB을 통한 list 이동 허용. list 페이지에서만 hide.
  const onOrders = pathname?.endsWith('/delivery/orders');

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end gap-2 z-40">
      {!onOrders && (
        <Link
          href={`/${language}/delivery/orders`}
          className="px-4 py-2 rounded-full bg-background-secondary border border-white/10 text-sm hover:bg-white/5 transition-colors shadow-lg"
          data-testid="fab-orders"
        >
          📋 {t.delivery.order.listTitle}
        </Link>
      )}
      {!onCart && (
        <Link
          href={`/${language}/delivery/cart`}
          className="relative px-4 py-3 rounded-full bg-accent-warm text-background-primary font-bold text-sm hover:bg-accent-warm/90 transition-colors shadow-lg"
          data-testid="fab-cart"
        >
          🛒 {t.delivery.cart.title}
          {count > 0 && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center"
              data-testid="fab-cart-count"
            >
              {count}
            </span>
          )}
        </Link>
      )}
    </div>
  );
}

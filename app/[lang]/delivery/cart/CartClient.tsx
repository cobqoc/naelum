'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { clearCart } from '@/lib/delivery/storage';
import ConfirmDialog from '@/components/Common/ConfirmDialog';
import {
  updateQuantity,
  removeFromCart,
  cartSubtotal,
  cartTotal,
  isMinOrderMet,
} from '@/lib/delivery/cart';
import { useCart } from '@/lib/delivery/hooks';
import DeliveryFloatingNav from '../DeliveryFloatingNav';

function formatPrice(n: number, lang: string): string {
  return new Intl.NumberFormat(lang).format(n);
}

export default function CartClient() {
  const router = useRouter();
  const { t, language } = useI18n();
  const cart = useCart();
  const [clearOpen, setClearOpen] = useState(false);
  // useSyncExternalStore가 SSR-safe. 빈 카트로 SSR 후 hydration 시 localStorage 값 자동 반영.

  const isEmpty = cart.items.length === 0;
  const subtotal = cartSubtotal(cart);
  const total = cartTotal(cart);
  const minMet = isMinOrderMet(cart);
  const minShortBy = Math.max(0, cart.minOrderPrice - subtotal);

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-24">
      <DeliveryFloatingNav />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t.delivery.cart.title}</h1>
            {cart.restaurantName && (
              <p className="text-text-muted text-sm mt-1">
                {t.delivery.cart.restaurantLabel}:{' '}
                <Link
                  href={`/${language}/delivery/restaurants/${cart.restaurantId}`}
                  className="text-accent-warm hover:underline"
                >
                  {cart.restaurantName}
                </Link>
              </p>
            )}
          </div>
          {!isEmpty && (
            <button
              type="button"
              onClick={() => setClearOpen(true)}
              className="text-sm text-text-muted hover:text-error transition-colors"
              data-testid="clear-cart"
            >
              {t.delivery.cart.clearCart}
            </button>
          )}
        </header>

        <ConfirmDialog
          isOpen={clearOpen}
          title={t.delivery.cart.clearCart}
          description={t.delivery.cart.clearCartConfirm}
          destructive
          onConfirm={() => { clearCart(); setClearOpen(false); }}
          onCancel={() => setClearOpen(false)}
        />

        {isEmpty ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">🛒</p>
            <p className="text-lg font-bold mb-2">{t.delivery.cart.empty}</p>
            <p className="text-text-muted text-sm mb-6">{t.delivery.cart.emptySubtitle}</p>
            <Link
              href={`/${language}/delivery`}
              className="inline-block px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-warm/90 transition-colors"
            >
              {t.delivery.cart.goToRestaurants}
            </Link>
          </div>
        ) : (
          <>
            <ul
              className="divide-y divide-white/10 rounded-xl bg-background-secondary border border-white/10 overflow-hidden mb-6"
              data-testid="cart-items"
            >
              {cart.items.map((item) => (
                <li key={item.menuItemId} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <div className="text-sm text-text-muted">
                      {formatPrice(item.price, language)}
                      {t.delivery.won}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-background-tertiary hover:bg-white/10 transition-colors"
                      aria-label="decrease"
                      data-testid={`decrease-${item.menuItemId}`}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold" data-testid={`qty-${item.menuItemId}`}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-background-tertiary hover:bg-white/10 transition-colors"
                      aria-label="increase"
                      data-testid={`increase-${item.menuItemId}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="shrink-0 text-text-muted hover:text-error transition-colors p-2"
                    aria-label="remove"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            {/* Summary */}
            <div className="rounded-xl bg-background-secondary border border-white/10 p-4 space-y-2 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">{t.delivery.cart.subtotal}</span>
                <span data-testid="cart-subtotal">
                  {formatPrice(subtotal, language)}
                  {t.delivery.won}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">{t.delivery.deliveryFee}</span>
                <span>
                  {cart.deliveryFee === 0
                    ? t.delivery.free
                    : `${formatPrice(cart.deliveryFee, language)}${t.delivery.won}`}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10 font-bold">
                <span>{t.delivery.cart.total}</span>
                <span data-testid="cart-total">
                  {formatPrice(total, language)}
                  {t.delivery.won}
                </span>
              </div>
            </div>

            {!minMet && (
              <div className="text-sm text-warning bg-warning/10 rounded-lg p-3 mb-4" data-testid="min-order-warning">
                {t.delivery.cart.minOrderShortBy.replace('{amount}', formatPrice(minShortBy, language))}
              </div>
            )}

            <button
              type="button"
              disabled={!minMet}
              onClick={() => router.push(`/${language}/delivery/checkout`)}
              className="w-full px-6 py-4 rounded-xl bg-accent-warm text-background-primary font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-warm/90 transition-colors"
              data-testid="goto-checkout"
            >
              {t.delivery.cart.goToCheckout} ({formatPrice(total, language)}
              {t.delivery.won})
            </button>
          </>
        )}
      </div>
    </div>
  );
}

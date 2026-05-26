'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/client';
import { saveAddress, getAddress, clearCart } from '@/lib/delivery/storage';
import { cartSubtotal, cartTotal, isMinOrderMet } from '@/lib/delivery/cart';
import { createOrder } from '@/lib/delivery/api';
import { useCart } from '@/lib/delivery/hooks';
import type { Address } from '@/lib/delivery/types';
import DeliveryFloatingNav from '../DeliveryFloatingNav';

function formatPrice(n: number, lang: string): string {
  return new Intl.NumberFormat(lang).format(n);
}

const EMPTY_ADDRESS: Address = {
  recipientName: '',
  recipientPhone: '',
  zipcode: '',
  roadAddress: '',
  detail: '',
};

export default function CheckoutClient() {
  const router = useRouter();
  const { t, language } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const cart = useCart();
  // 주소는 localStorage에 저장된 직전 값으로 lazy init.
  const [address, setAddress] = useState<Address>(() => getAddress() ?? EMPTY_ADDRESS);
  const [requestNote, setRequestNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 카트 비어있으면 카트로 강제 이동. 단 submitting 중이면 회피
  useEffect(() => {
    if (cart.items.length === 0 && !submitting) {
      router.replace(`/${language}/delivery/cart`);
    }
  }, [cart, router, language, submitting]);

  // 비로그인 시 로그인 페이지로 redirect (현 경로로 돌아오게)
  useEffect(() => {
    if (!authLoading && !user) {
      const redirect = encodeURIComponent(`/${language}/delivery/checkout`);
      router.replace(`/${language}/signin?redirect=${redirect}`);
    }
  }, [authLoading, user, router, language]);

  const subtotal = cartSubtotal(cart);
  const total = cartTotal(cart);
  const minMet = isMinOrderMet(cart);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || !minMet || !user) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // 주소 prefill 저장 (다음 주문 시)
      saveAddress(address);

      // 주문 DB INSERT
      const supabase = createClient();
      const order = await createOrder(supabase, user.id, {
        cart,
        address,
        requestNote,
        paymentMethod: 'mock',
      });

      clearCart();
      router.push(`/${language}/delivery/orders/${order.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSubmitError(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-24">
      <DeliveryFloatingNav />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Link href={`/${language}/delivery/cart`} className="text-accent-warm text-sm">
          ← {t.delivery.cart.title}
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mt-4 mb-6">
          {t.delivery.checkout.title}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Address */}
          <section className="rounded-xl bg-background-secondary border border-white/10 p-4 space-y-3">
            <h2 className="font-bold mb-2">{t.delivery.checkout.addressSection}</h2>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-text-muted mb-1 block">
                  {t.delivery.checkout.recipientName}
                </span>
                <InputBoxWrapper className="!bg-background-tertiary !rounded-lg !px-3 !py-2">
                  <input
                    type="text"
                    required
                    value={address.recipientName}
                    onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
                    placeholder={t.delivery.checkout.recipientNamePlaceholder}
                    className={INPUT_INNER_COMFORTABLE_CLASS}
                    style={INPUT_INNER_STYLE}
                    data-testid="recipient-name"
                  />
                </InputBoxWrapper>
              </label>
              <label className="block">
                <span className="text-xs text-text-muted mb-1 block">
                  {t.delivery.checkout.recipientPhone}
                </span>
                <InputBoxWrapper className="!bg-background-tertiary !rounded-lg !px-3 !py-2">
                  <input
                    type="tel"
                    required
                    value={address.recipientPhone}
                    onChange={(e) => setAddress({ ...address, recipientPhone: e.target.value })}
                    placeholder={t.delivery.checkout.recipientPhonePlaceholder}
                    className={INPUT_INNER_COMFORTABLE_CLASS}
                    style={INPUT_INNER_STYLE}
                    data-testid="recipient-phone"
                  />
                </InputBoxWrapper>
              </label>
            </div>

            <label className="block">
              <span className="text-xs text-text-muted mb-1 block">
                {t.delivery.checkout.zipcode}
              </span>
              <InputBoxWrapper className="!bg-background-tertiary !rounded-lg !px-3 !py-2">
                <input
                  type="text"
                  value={address.zipcode}
                  onChange={(e) => setAddress({ ...address, zipcode: e.target.value })}
                  placeholder={t.delivery.checkout.zipcodePlaceholder}
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                  data-testid="zipcode"
                />
              </InputBoxWrapper>
            </label>

            <label className="block">
              <span className="text-xs text-text-muted mb-1 block">
                {t.delivery.checkout.roadAddress}
              </span>
              <InputBoxWrapper className="!bg-background-tertiary !rounded-lg !px-3 !py-2">
                <input
                  type="text"
                  required
                  value={address.roadAddress}
                  onChange={(e) => setAddress({ ...address, roadAddress: e.target.value })}
                  placeholder={t.delivery.checkout.roadAddressPlaceholder}
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                  data-testid="road-address"
                />
              </InputBoxWrapper>
            </label>

            <label className="block">
              <span className="text-xs text-text-muted mb-1 block">
                {t.delivery.checkout.addressDetail}
              </span>
              <InputBoxWrapper className="!bg-background-tertiary !rounded-lg !px-3 !py-2">
                <input
                  type="text"
                  value={address.detail}
                  onChange={(e) => setAddress({ ...address, detail: e.target.value })}
                  placeholder={t.delivery.checkout.addressDetailPlaceholder}
                  className={INPUT_INNER_COMFORTABLE_CLASS}
                  style={INPUT_INNER_STYLE}
                  data-testid="address-detail"
                />
              </InputBoxWrapper>
            </label>
          </section>

          {/* Request note */}
          <section className="rounded-xl bg-background-secondary border border-white/10 p-4">
            <label className="block">
              <span className="font-bold mb-2 block">{t.delivery.checkout.requestNote}</span>
              <InputBoxWrapper className="!bg-background-tertiary !rounded-lg !px-3 !py-2 !min-h-[60px] !items-start">
                <textarea
                  rows={2}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder={t.delivery.checkout.requestNotePlaceholder}
                  className={`${INPUT_INNER_COMFORTABLE_CLASS} resize-none`}
                  style={INPUT_INNER_STYLE}
                  data-testid="request-note"
                />
              </InputBoxWrapper>
            </label>
          </section>

          {/* Order summary */}
          <section className="rounded-xl bg-background-secondary border border-white/10 p-4">
            <h2 className="font-bold mb-3">{t.delivery.checkout.summarySection}</h2>
            <div className="text-sm text-text-muted mb-3">
              {t.delivery.cart.restaurantLabel}:{' '}
              <span className="text-text-primary font-medium">{cart.restaurantName}</span>
            </div>
            <ul className="space-y-1 mb-3 text-sm">
              {cart.items.map((i) => (
                <li key={i.menuItemId} className="flex items-center justify-between">
                  <span>
                    {i.name} <span className="text-text-muted">× {i.quantity}</span>
                  </span>
                  <span>
                    {formatPrice(i.price * i.quantity, language)}
                    {t.delivery.won}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-white/10 pt-2 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">{t.delivery.cart.subtotal}</span>
                <span>
                  {formatPrice(subtotal, language)}
                  {t.delivery.won}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">{t.delivery.deliveryFee}</span>
                <span>
                  {cart.deliveryFee === 0
                    ? t.delivery.free
                    : `${formatPrice(cart.deliveryFee, language)}${t.delivery.won}`}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10 font-bold text-base">
                <span>{t.delivery.cart.total}</span>
                <span data-testid="checkout-total">
                  {formatPrice(total, language)}
                  {t.delivery.won}
                </span>
              </div>
            </div>
          </section>

          {/* Payment (mock) */}
          <section className="rounded-xl bg-background-secondary border border-white/10 p-4">
            <h2 className="font-bold mb-3">{t.delivery.checkout.paymentSection}</h2>
            <div className="px-3 py-2 rounded-lg bg-background-tertiary border border-white/10 text-sm">
              💳 {t.delivery.checkout.paymentMock}
            </div>
            <p className="text-xs text-text-muted mt-2">
              {t.delivery.checkout.agreementNotice}
            </p>
          </section>

          {submitError && (
            <div className="text-sm text-error bg-error/10 rounded-lg p-3" data-testid="submit-error">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !minMet || !user}
            className="w-full px-6 py-4 rounded-xl bg-accent-warm text-background-primary font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-warm/90 transition-colors"
            data-testid="place-order"
          >
            {submitting
              ? t.delivery.checkout.processing
              : `${t.delivery.checkout.placeOrder} (${formatPrice(total, language)}${t.delivery.won})`}
          </button>
        </form>
      </div>
    </div>
  );
}

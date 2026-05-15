// localStorage 기반 배달 카트·주소 상태.
// orders는 DB로 이전됨 (lib/delivery/api.ts) — 여기엔 cart·address만 남김.
// useSyncExternalStore와 함께 쓰려면 동일 데이터에 대해 동일 reference 반환 필수
// (참조 매번 새로 만들면 React 무한 re-render — React error #185).

import type { Cart, Address } from './types';
import { EMPTY_CART } from './types';

const KEY_CART = 'naelum_delivery_cart_v1';
const KEY_ADDRESS = 'naelum_delivery_address_v1';

const CART_CHANGE_EVENT = 'naelum:delivery:cart_change';

function safeWindow(): Window | null {
  if (typeof window === 'undefined') return null;
  return window;
}

// ---------- 캐시된 snapshot ----------

let _cartSnapshot: Cart = EMPTY_CART;
let _cartLoaded = false;

function loadCartFromStorage(): Cart {
  const w = safeWindow();
  if (!w) return EMPTY_CART;
  try {
    const raw = w.localStorage.getItem(KEY_CART);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw) as Cart;
    if (!parsed || !Array.isArray(parsed.items)) return EMPTY_CART;
    return parsed;
  } catch {
    return EMPTY_CART;
  }
}

// ---------- Cart ----------

export function getCart(): Cart {
  if (!_cartLoaded) {
    _cartSnapshot = loadCartFromStorage();
    _cartLoaded = true;
  }
  return _cartSnapshot;
}

export function saveCart(cart: Cart): void {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.setItem(KEY_CART, JSON.stringify(cart));
  _cartSnapshot = cart;
  _cartLoaded = true;
  w.dispatchEvent(new CustomEvent(CART_CHANGE_EVENT));
}

export function clearCart(): void {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.removeItem(KEY_CART);
  _cartSnapshot = EMPTY_CART;
  _cartLoaded = true;
  w.dispatchEvent(new CustomEvent(CART_CHANGE_EVENT));
}

export function subscribeCart(handler: () => void): () => void {
  const w = safeWindow();
  if (!w) return () => {};
  const fn = () => {
    _cartSnapshot = loadCartFromStorage();
    _cartLoaded = true;
    handler();
  };
  w.addEventListener(CART_CHANGE_EVENT, fn);
  w.addEventListener('storage', fn);
  return () => {
    w.removeEventListener(CART_CHANGE_EVENT, fn);
    w.removeEventListener('storage', fn);
  };
}

// ---------- Address (checkout prefill용) ----------

export function getAddress(): Address | null {
  const w = safeWindow();
  if (!w) return null;
  try {
    const raw = w.localStorage.getItem(KEY_ADDRESS);
    if (!raw) return null;
    return JSON.parse(raw) as Address;
  } catch {
    return null;
  }
}

export function saveAddress(address: Address): void {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.setItem(KEY_ADDRESS, JSON.stringify(address));
}

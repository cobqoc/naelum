import type { Cart, CartItem, Restaurant, MenuItem } from './types';
import { getCart, saveCart, clearCart } from './storage';
import { EMPTY_CART } from './types';

// 카트는 단일 식당 제약 — 다른 식당 메뉴 담으려면 기존 카트 비워야.
// 호출자가 confirm 다이얼로그 표시한 뒤 forceReplace=true로 호출.

export interface AddToCartResult {
  ok: boolean;
  reason?: 'different_restaurant';
  existingRestaurantName?: string;
}

export function addToCart(
  restaurant: Restaurant,
  menuItem: MenuItem,
  quantity: number = 1,
  forceReplace: boolean = false
): AddToCartResult {
  const cart = getCart();

  // 다른 식당 메뉴 시도 — 거부 또는 강제 교체
  if (cart.restaurantId && cart.restaurantId !== restaurant.id && cart.items.length > 0) {
    if (!forceReplace) {
      return {
        ok: false,
        reason: 'different_restaurant',
        existingRestaurantName: cart.restaurantName ?? '',
      };
    }
    // 강제 교체
    const newCart: Cart = {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      deliveryFee: restaurant.delivery_fee,
      minOrderPrice: restaurant.min_order_price,
      items: [
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity,
        },
      ],
    };
    saveCart(newCart);
    return { ok: true };
  }

  // 같은 식당이거나 빈 카트
  const items = [...cart.items];
  const existingIdx = items.findIndex((i) => i.menuItemId === menuItem.id);
  if (existingIdx >= 0) {
    items[existingIdx] = { ...items[existingIdx], quantity: items[existingIdx].quantity + quantity };
  } else {
    items.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
    });
  }

  const newCart: Cart = {
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    deliveryFee: restaurant.delivery_fee,
    minOrderPrice: restaurant.min_order_price,
    items,
  };
  saveCart(newCart);
  return { ok: true };
}

export function updateQuantity(menuItemId: string, quantity: number): void {
  const cart = getCart();
  if (quantity <= 0) {
    removeFromCart(menuItemId);
    return;
  }
  const items = cart.items.map((i) =>
    i.menuItemId === menuItemId ? { ...i, quantity } : i
  );
  saveCart({ ...cart, items });
}

export function removeFromCart(menuItemId: string): void {
  const cart = getCart();
  const items = cart.items.filter((i) => i.menuItemId !== menuItemId);
  if (items.length === 0) {
    clearCart();
    return;
  }
  saveCart({ ...cart, items });
}

export function cartItemCount(cart: Cart): number {
  return cart.items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartSubtotal(cart: Cart): number {
  return cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function cartTotal(cart: Cart): number {
  return cartSubtotal(cart) + cart.deliveryFee;
}

export function isMinOrderMet(cart: Cart): boolean {
  return cartSubtotal(cart) >= cart.minOrderPrice;
}

export { EMPTY_CART };
export type { Cart, CartItem };

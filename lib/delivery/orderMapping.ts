// 배달 주문 DB row → 클라이언트 Order 매핑 (순수 함수, server/client 공용).
// 'use client' 없음 — API 라우트(서버)와 lib/delivery/api.ts(client createOrder) 양쪽에서 import.

import type { Address, Order, OrderStatus } from './types';

export interface DbOrder {
  id: string;
  order_number: string;
  user_id: string | null;
  restaurant_id: string;
  rider_id: string | null;
  address_snapshot: Address;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: string | null;
  request_note: string | null;
  estimated_delivery_at: string | null;
  placed_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  // 식당 정보 JOIN 결과
  restaurant?: { name: string };
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  selected_options: unknown;
  subtotal: number;
}

export function toClientOrder(dbOrder: DbOrder, items: DbOrderItem[]): Order {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    restaurantId: dbOrder.restaurant_id,
    restaurantName: dbOrder.restaurant?.name ?? '',
    items: items.map((i) => ({
      menuItemId: i.menu_item_id ?? '',
      name: i.name_snapshot,
      price: i.price_snapshot,
      quantity: i.quantity,
    })),
    subtotal: dbOrder.subtotal,
    deliveryFee: dbOrder.delivery_fee,
    total: dbOrder.total,
    address: dbOrder.address_snapshot,
    requestNote: dbOrder.request_note ?? '',
    paymentMethod: dbOrder.payment_method ?? 'mock',
    status: dbOrder.status,
    placedAt: dbOrder.placed_at,
    estimatedDeliveryAt: dbOrder.estimated_delivery_at ?? dbOrder.placed_at,
  };
}

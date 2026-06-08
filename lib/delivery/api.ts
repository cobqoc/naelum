'use client';

// 배달 도메인 Supabase API 헬퍼.
// cart는 여전히 localStorage (lib/delivery/storage.ts). orders/addresses는 DB.
// 로그인 필요한 작업이 대부분 — 호출 측에서 auth 체크 후 사용.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Cart, Address, Order, OrderStatus } from './types';
import { toClientOrder, type DbOrder, type DbOrderItem } from './orderMapping';

// 주문 번호 생성 (사람이 읽기 쉬운)
function generateOrderNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${yyyy}${mm}${dd}-${rand}`;
}

export interface CreateOrderInput {
  cart: Cart;
  address: Address;
  requestNote: string;
  paymentMethod: string;
}

export async function createOrder(
  supabase: SupabaseClient,
  userId: string,
  input: CreateOrderInput
): Promise<Order> {
  const { cart, address, requestNote, paymentMethod } = input;
  if (!cart.restaurantId || !cart.restaurantName) {
    throw new Error('Cart restaurant info missing');
  }
  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + cart.deliveryFee;
  const eta = new Date(Date.now() + 35 * 60 * 1000).toISOString();

  const { data: orderRow, error: orderErr } = await supabase
    .from('delivery_orders')
    .insert({
      order_number: generateOrderNumber(),
      user_id: userId,
      restaurant_id: cart.restaurantId,
      address_snapshot: address,
      status: 'paid', // mock 결제 즉시 paid
      subtotal,
      delivery_fee: cart.deliveryFee,
      total,
      payment_method: paymentMethod,
      request_note: requestNote || null,
      estimated_delivery_at: eta,
    })
    .select('*, restaurant:delivery_restaurants(name)')
    .single();

  if (orderErr || !orderRow) {
    throw new Error(`Failed to create order: ${orderErr?.message ?? 'unknown'}`);
  }

  const itemRows = cart.items.map((item) => ({
    order_id: orderRow.id,
    menu_item_id: item.menuItemId,
    name_snapshot: item.name,
    price_snapshot: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }));

  const { data: itemsData, error: itemsErr } = await supabase
    .from('delivery_order_items')
    .insert(itemRows)
    .select('*');

  if (itemsErr || !itemsData) {
    // 주문은 만들어졌는데 항목 실패. 롤백 — 주문 삭제.
    // ⚠️ delivery_orders 에 유저 DELETE RLS 정책 없음(insert/read/update만; admin·점주만 ALL).
    //    → 일반 유저 컨텍스트 롤백은 RLS 거부돼 orphan 주문 행이 남을 수 있다.
    //    배달 prod 점등 시 service-role 롤백 또는 "유저 본인 pending 주문 DELETE" 정책 추가 필요.
    //    현재는 휴면(admin 전용·prod 미적용) — 최소한 .error 관찰화로 침묵 방지.
    const { error: rollbackError } = await supabase.from('delivery_orders').delete().eq('id', orderRow.id);
    if (rollbackError) console.error('delivery order rollback failed (orphan row possible):', rollbackError);
    throw new Error(`Failed to create order items: ${itemsErr?.message ?? 'unknown'}`);
  }

  return toClientOrder(orderRow as DbOrder, itemsData as DbOrderItem[]);
}

// 데이터 계층 이전(docs/DATA_LAYER.md): 직접 supabase read → 서버 엔드포인트.
// 본인 주문 목록은 GET /api/delivery/orders 가 쿠키 인증 + 매핑까지 처리.
export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch('/api/delivery/orders');
  if (!res.ok) {
    const msg = await res.json().then((b) => b.error).catch(() => String(res.status));
    throw new Error(`Failed to fetch orders: ${msg ?? 'unknown'}`);
  }
  const { orders } = await res.json();
  return orders as Order[];
}

export async function fetchOrder(orderId: string): Promise<Order | null> {
  const res = await fetch(`/api/delivery/orders/${orderId}`);
  if (res.status === 404) return null; // 미존재/본인 아님(RLS) → null (원본 동작 보존)
  if (!res.ok) {
    const msg = await res.json().then((b) => b.error).catch(() => String(res.status));
    throw new Error(`Failed to fetch order: ${msg ?? 'unknown'}`);
  }
  const { order } = await res.json();
  return order as Order | null;
}

export async function cancelOrder(
  supabase: SupabaseClient,
  orderId: string
): Promise<void> {
  const { error } = await supabase
    .from('delivery_orders')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) {
    throw new Error(`Failed to cancel order: ${error.message}`);
  }
}

export async function updateOrderStatus(
  supabase: SupabaseClient,
  orderId: string,
  newStatus: OrderStatus
): Promise<void> {
  const patch: Record<string, unknown> = { status: newStatus };
  // timestamp 같이 갱신
  if (newStatus === 'accepted') patch.accepted_at = new Date().toISOString();
  if (newStatus === 'ready') patch.ready_at = new Date().toISOString();
  if (newStatus === 'picked_up') patch.picked_up_at = new Date().toISOString();
  if (newStatus === 'delivered') patch.delivered_at = new Date().toISOString();
  if (newStatus === 'cancelled') patch.cancelled_at = new Date().toISOString();

  const { error } = await supabase
    .from('delivery_orders')
    .update(patch)
    .eq('id', orderId);

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }
}

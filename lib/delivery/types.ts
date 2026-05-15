// 배달 도메인 클라이언트 타입.
// DB 미적용 단계라 cart/order/address 모두 localStorage. 향후 DB 마이그레이션 시
// _PENDING_20260517_delivery_orders.sql 와 매핑.

export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  cuisine_types: string[];
  address: string | null;
  delivery_fee: number;
  min_order_price: number;
  avg_cook_time_min: number;
  rating: number;
  rating_count: number;
  is_open: boolean;
  thumbnail_url: string | null;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_popular: boolean;
  sort_order: number;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  restaurantId: string | null;
  restaurantName: string | null;
  deliveryFee: number;
  minOrderPrice: number;
  items: CartItem[];
}

export interface Address {
  recipientName: string;
  recipientPhone: string;
  zipcode: string;
  roadAddress: string;
  detail: string;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: Address;
  requestNote: string;
  paymentMethod: string;
  status: OrderStatus;
  placedAt: string;
  estimatedDeliveryAt: string;
}

export const EMPTY_CART: Cart = {
  restaurantId: null,
  restaurantName: null,
  deliveryFee: 0,
  minOrderPrice: 0,
  items: [],
};

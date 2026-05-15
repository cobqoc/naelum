// 주문 도메인 — DB가 정식 storage. createOrder/fetchOrder는 lib/delivery/api.ts.
// 이 파일은 상태 추론 유틸만 보유.

import type { Order, OrderStatus } from './types';

// 데모용 상태 진행 — placedAt 기준 시간 흐름에 따라 상태 자동 추정.
// 실제 운영 시엔 식당 사장님·라이더가 명시적으로 상태 업데이트 (lib/delivery/api.ts:updateOrderStatus).
// inferStatus는 사장님이 아직 안 받았을 때 데모용 가상 진행 표시 목적.
const STATUS_TIMELINE: { status: OrderStatus; afterMs: number }[] = [
  { status: 'paid',      afterMs: 0 },
  { status: 'accepted',  afterMs: 2 * 60 * 1000 },
  { status: 'preparing', afterMs: 5 * 60 * 1000 },
  { status: 'ready',     afterMs: 20 * 60 * 1000 },
  { status: 'picked_up', afterMs: 23 * 60 * 1000 },
  { status: 'delivered', afterMs: 35 * 60 * 1000 },
];

export function inferStatus(order: Order, now: Date = new Date()): OrderStatus {
  // 사장님/사용자가 명시적으로 cancelled/delivered 설정한 건 우선
  if (order.status === 'cancelled') return 'cancelled';
  if (order.status === 'delivered') return 'delivered';

  // 사장님이 명시한 status가 inferred보다 더 진행됐다면 그쪽 우선
  const elapsed = now.getTime() - new Date(order.placedAt).getTime();
  let inferred: OrderStatus = 'paid';
  for (const step of STATUS_TIMELINE) {
    if (elapsed >= step.afterMs) inferred = step.status;
  }

  // 사장님이 명시한 status가 더 진행된 단계면 그것 사용
  const orderIdx = STATUS_TIMELINE.findIndex((s) => s.status === order.status);
  const inferredIdx = STATUS_TIMELINE.findIndex((s) => s.status === inferred);
  if (orderIdx > inferredIdx) return order.status;
  return inferred;
}

export type { Order, OrderStatus };

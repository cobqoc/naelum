'use client';

import { useSyncExternalStore } from 'react';
import { getCart, subscribeCart } from './storage';
import type { Cart } from './types';
import { EMPTY_CART } from './types';

// 안정 reference의 server snapshot — 함수가 매번 새 closure를 반환하지 않도록 외부 정의.
const getCartServerSnapshot = (): Cart => EMPTY_CART;

// useSyncExternalStore — SSR/hydration 안전. setState-in-effect 회피.
// 핵심: getSnapshot이 *같은 데이터에 대해 같은 reference*를 반환해야 무한 re-render 회피.
// (storage.ts가 모듈 캐시로 보장)
export function useCart(): Cart {
  return useSyncExternalStore(subscribeCart, getCart, getCartServerSnapshot);
}

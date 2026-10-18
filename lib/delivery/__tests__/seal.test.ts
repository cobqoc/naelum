import { describe, it, expect } from 'vitest';
import { isDeliveryPath, isDeliveryEnabled } from '../seal';

describe('배달 봉인 — 경로 판정 (lang prefix 뗀 경로)', () => {
  it('배달·가게·라이더 화면과 배달 API 는 봉인 대상이다', () => {
    for (const p of [
      '/delivery',
      '/delivery/cart',
      '/delivery/orders/42',
      '/delivery/map',
      '/merchant',
      '/merchant/orders',
      '/rider',
      '/rider/home',
      '/api/delivery',
      '/api/delivery/orders',
      '/api/delivery/nearby',
    ]) {
      expect(isDeliveryPath(p), p).toBe(true);
    }
  });

  it('다른 화면·API 와 이름만 겹치는 경로는 봉인하지 않는다', () => {
    for (const p of [
      '/',
      '/recipes',
      '/admin',
      '/fridge',
      '/delivery-tips',
      '/merchants',
      '/riders',
      '/api/deliveryx',
      '/api/recipes',
      '/ko/delivery', // lang 을 떼지 않은 경로는 proxy 가 stripLang 후에 넘긴다
    ]) {
      expect(isDeliveryPath(p), p).toBe(false);
    }
  });
});

describe('배달 봉인 — 스위치', () => {
  it("정확히 'true' 일 때만 열린다", () => {
    expect(isDeliveryEnabled('true')).toBe(true);
  });

  it('값이 없거나 다른 값이면 봉인 상태다 (실수로 열리지 않게)', () => {
    for (const v of [undefined, '', 'false', '1', 'TRUE', 'yes', ' true']) {
      expect(isDeliveryEnabled(v), String(v)).toBe(false);
    }
  });
});

import { describe, it, expect } from 'vitest';
import { sanitizeEditPayload } from '../sanitizeEditPayload';

// 수정 폼 상태와 같은 모양(ingredient_id 는 선택 필드 — 폼 상태엔 없음)
const base: { ingredient_name: string; ingredient_id?: string | null; [k: string]: unknown } = {
  ingredient_name: '양파',
  category: 'veggie',
  quantity: 3,
  unit: '개',
  purchase_date: '',
  expiry_date: '2026-10-10',
  storage_location: '냉장',
  notes: '',
  expiry_alert: true,
};

describe('sanitizeEditPayload', () => {
  it('이름이 그대로면 ingredient_id 키가 없다(update 가 FK 를 건드리지 않음)', () => {
    const out = sanitizeEditPayload(base, '양파');
    expect('ingredient_id' in out).toBe(false);
  });

  it('이름을 바꾸면 ingredient_id: null 을 보낸다(기존 FK 는 다른 재료라 끊음 — 이전 동작 유지)', () => {
    const out = sanitizeEditPayload({ ...base, ingredient_name: '대파' }, '양파');
    expect(out.ingredient_id).toBeNull();
  });

  it('날짜 정규화는 sanitizeOutgoingPayload 와 같다(빈 문자열 → null)', () => {
    const out = sanitizeEditPayload(base, '양파');
    expect(out.purchase_date).toBeNull();
    expect(out.expiry_date).toBe('2026-10-10');
  });

  it('다른 필드는 그대로 통과', () => {
    const out = sanitizeEditPayload(base, '양파');
    expect(out).toMatchObject({ ingredient_name: '양파', quantity: 3, unit: '개', storage_location: '냉장' });
  });
});

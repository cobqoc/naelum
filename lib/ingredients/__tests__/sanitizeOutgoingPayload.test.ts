import { describe, it, expect } from 'vitest';
import { sanitizeOutgoingPayload } from '@/lib/ingredients/sanitizeOutgoingPayload';

describe('sanitizeOutgoingPayload', () => {
  it('빈 문자열 date → null (PG 22007 방지)', () => {
    const out = sanitizeOutgoingPayload({
      ingredient_name: '양파',
      purchase_date: '',
      expiry_date: '',
      ingredient_id: null,
    });
    expect(out.purchase_date).toBeNull();
    expect(out.expiry_date).toBeNull();
  });

  it('정상 date 문자열은 보존', () => {
    const out = sanitizeOutgoingPayload({
      purchase_date: '2026-05-17',
      expiry_date: '2026-05-24',
      ingredient_id: null,
    });
    expect(out.purchase_date).toBe('2026-05-17');
    expect(out.expiry_date).toBe('2026-05-24');
  });

  it('preset- ingredient_id → null (UUID FK 보호)', () => {
    expect(
      sanitizeOutgoingPayload({ ingredient_id: 'preset-onion', purchase_date: '', expiry_date: '' })
        .ingredient_id
    ).toBeNull();
  });

  it('UUID ingredient_id 는 보존', () => {
    const uuid = '8c3d58f7-ab76-44b0-a98a-d7ddb2e81b4f';
    expect(
      sanitizeOutgoingPayload({ ingredient_id: uuid, purchase_date: '', expiry_date: '' })
        .ingredient_id
    ).toBe(uuid);
  });

  it('ingredient_id undefined/null → null', () => {
    expect(
      sanitizeOutgoingPayload({ purchase_date: '', expiry_date: '' }).ingredient_id
    ).toBeNull();
    expect(
      sanitizeOutgoingPayload({ ingredient_id: null, purchase_date: '', expiry_date: '' })
        .ingredient_id
    ).toBeNull();
  });

  it('다른 필드는 그대로 통과', () => {
    const out = sanitizeOutgoingPayload({
      ingredient_name: '두부',
      category: 'dairy',
      quantity: 2,
      unit: '모',
      purchase_date: '2026-05-17',
      expiry_date: '',
      ingredient_id: 'preset-x',
      expiry_alert: true,
    });
    expect(out).toMatchObject({
      ingredient_name: '두부',
      category: 'dairy',
      quantity: 2,
      unit: '모',
      purchase_date: '2026-05-17',
      expiry_date: null,
      ingredient_id: null,
      expiry_alert: true,
    });
  });
});

import { describe, it, expect } from 'vitest';
import { isUuid } from '../isUuid';

describe('isUuid', () => {
  it('UUID 형식은 통과(대소문자 무관)', () => {
    expect(isUuid('8c3d58f7-ab76-44b0-a98a-d7ddb2e81b4f')).toBe(true);
    expect(isUuid('8C3D58F7-AB76-44B0-A98A-D7DDB2E81B4F')).toBe(true);
  });
  it('클라이언트 합성 id·빈 값·비문자열은 거부', () => {
    for (const v of ['fav:양파', 'preset-onion', 'pending-3', '', null, undefined, 123, '8c3d58f7ab7644b0a98ad7ddb2e81b4f']) {
      expect(isUuid(v)).toBe(false);
    }
  });
});

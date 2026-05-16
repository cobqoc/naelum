import { describe, it, expect } from 'vitest';
import { isDemoRecord } from '@/app/[lang]/_home/helpers';

// 회귀 가드: 단순 id.startsWith('d') 판정은 gen_random_uuid() UUID 중
// 첫 hex 글자가 'd'인 ~1/16 을 실제 DB 행인데도 데모로 오판 →
// updateIngredient/삭제가 PATCH 없이 로컬만 갱신, DB 침묵 유실.
// (e2e logged-in-home.spec.ts:310 의 ~6% flaky 의 진짜 근본 원인)
describe('isDemoRecord', () => {
  it('진짜 데모 id (d + 숫자, demoItems.ts d1..d21) 는 데모로 판정', () => {
    for (const id of ['d1', 'd2', 'd9', 'd10', 'd20', 'd21']) {
      expect(isDemoRecord({ id })).toBe(true);
    }
  });

  it('legacy demo* prefix 도 데모로 판정 (localStorage 호환)', () => {
    expect(isDemoRecord({ id: 'demo' })).toBe(true);
    expect(isDemoRecord({ id: 'demo-123' })).toBe(true);
  });

  it('isDemoItem 플래그가 true 면 id 무관하게 데모', () => {
    expect(isDemoRecord({ id: 'a3f9b1c2-1d4e-4a7b-8c9d-0e1f2a3b4c5d', isDemoItem: true })).toBe(true);
  });

  it("실제 UUID 가 'd' 로 시작해도 데모가 아니다 (침묵 유실 회귀 가드)", () => {
    // gen_random_uuid() 결과 중 첫 글자가 'd' 인 케이스 — 과거 오판하던 패턴
    for (const id of [
      'd3f9a1b2-1c4d-4e5f-8a9b-0c1d2e3f4a5b',
      'd0000000-0000-4000-8000-000000000000',
      'deadbeef-dead-4bee-8dea-dbeefdeadbee',
    ]) {
      expect(isDemoRecord({ id })).toBe(false);
    }
  });

  it('다른 hex 로 시작하는 일반 UUID 도 데모가 아니다', () => {
    for (const id of [
      'a3f9a1b2-1c4d-4e5f-8a9b-0c1d2e3f4a5b',
      'f0000000-0000-4000-8000-000000000000',
      '13371337-1337-4133-8133-713371337133',
    ]) {
      expect(isDemoRecord({ id })).toBe(false);
    }
  });
});

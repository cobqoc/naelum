import { describe, it, expect } from 'vitest';
import { INGREDIENT_UNITS } from '../units';
import { UNITS } from '../recipe';

// ICL-39 (2026-10-04): 두 폼에 복붙돼 있던 단위 목록을 단일 출처로 — 값·순서가 이전 리터럴과 같아야 한다.
describe('단위 목록', () => {
  it('재료 단위 17개 (냉장고 DetailFields 의 옛 리터럴과 동일)', () => {
    expect([...INGREDIENT_UNITS]).toEqual(['선택', 'g', 'kg', 'ml', 'L', '개', '큰술', '작은술', '컵', '줌', '꼬집', '조각', '장', '포기', '대', '모', '마리']);
  });
  it("레시피 UNITS = 재료 단위 + '기타' (lib/constants/recipe 의 옛 리터럴과 동일)", () => {
    expect([...UNITS]).toEqual(['선택', 'g', 'kg', 'ml', 'L', '개', '큰술', '작은술', '컵', '줌', '꼬집', '조각', '장', '포기', '대', '모', '마리', '기타']);
  });
});

import { describe, it, expect } from 'vitest';
import { firstPerKey } from '../firstPerKey';

type S = { completed_at: string; recipe: { id: string } | null };
const s = (recipeId: string | null, at: string): S => ({ completed_at: at, recipe: recipeId ? { id: recipeId } : null });
const key = (row: S) => row.recipe?.id;

// 2026-10-04 API1-42: 프로필 "만든 요리" — 레시피별 최근 완성 1건.
describe('firstPerKey', () => {
  it('중복 없는 목록은 그대로 (정상 경로 동일)', () => {
    const rows = [s('a', '3'), s('b', '2'), s('c', '1')];
    expect(firstPerKey(rows, key)).toEqual(rows);
  });

  it('같은 레시피 여러 세션 → 첫(=가장 최근, 입력이 내림차순) 1건만, 순서 보존', () => {
    const rows = [s('a', '9'), s('b', '8'), s('a', '5'), s('c', '4'), s('b', '1')];
    expect(firstPerKey(rows, key)).toEqual([s('a', '9'), s('b', '8'), s('c', '4')]);
  });

  it('키 없는 행(RLS 로 가려진 레시피 null 임베드)은 제외', () => {
    const rows = [s(null, '9'), s('a', '8'), s(null, '7')];
    expect(firstPerKey(rows, key)).toEqual([s('a', '8')]);
  });

  it('빈 목록 → 빈 목록', () => {
    expect(firstPerKey([], key)).toEqual([]);
  });
});

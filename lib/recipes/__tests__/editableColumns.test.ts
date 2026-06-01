import { describe, it, expect } from 'vitest';
import { pickEditableRecipeColumns, EDITABLE_RECIPE_COLUMNS } from '../editableColumns';

describe('pickEditableRecipeColumns (H1 mass-assignment 방어)', () => {
  it('편집 가능 콘텐츠 컬럼은 통과시킨다', () => {
    const out = pickEditableRecipeColumns({
      servings: 4,
      cook_time_minutes: 30,
      difficulty_level: 'easy',
      calories: 500,
    });
    expect(out).toEqual({
      servings: 4,
      cook_time_minutes: 30,
      difficulty_level: 'easy',
      calories: 500,
    });
  });

  it('카운터·통계·소유권·상태 컬럼은 전부 제거한다', () => {
    const out = pickEditableRecipeColumns({
      servings: 2,
      average_rating: 5,
      cooked_count: 9999,
      views_count: 100000,
      likes_count: 5000,
      saves_count: 4000,
      author_id: 'attacker-uuid',
      status: 'published',
      published_at: '2020-01-01',
      is_featured: true,
    });
    expect(out).toEqual({ servings: 2 });
    expect(out).not.toHaveProperty('average_rating');
    expect(out).not.toHaveProperty('cooked_count');
    expect(out).not.toHaveProperty('author_id');
    expect(out).not.toHaveProperty('status');
  });

  it('존재하지 않는 키는 출력에 추가하지 않는다 (undefined 미주입)', () => {
    const out = pickEditableRecipeColumns({ servings: 1 });
    for (const col of EDITABLE_RECIPE_COLUMNS) {
      if (col !== 'servings') expect(out).not.toHaveProperty(col);
    }
  });

  it('빈 객체는 빈 객체를 반환한다', () => {
    expect(pickEditableRecipeColumns({})).toEqual({});
  });
});

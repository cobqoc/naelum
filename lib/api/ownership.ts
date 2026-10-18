import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 레시피 소유자 확인 — recipes/[id] PUT·DELETE·visibility 의 같은 블록 3벌을 1벌로. (2026-10-04 API1-36, 행위보존)
 *
 * 원본 그대로: `recipes.select(cols).eq('id').single()` 실패·없음 → 404 `'레시피를 찾을 수 없습니다.'`,
 * 작성자가 아니면 403 `forbiddenMessage`(PUT·visibility '레시피를 수정할 권한이 없습니다.' / DELETE '레시피를 삭제할 권한이 없습니다.').
 * `columns` 는 소유 확인과 함께 읽을 컬럼(visibility 는 'author_id, published_at').
 */
export async function requireRecipeOwner(
  supabase: SupabaseClient,
  recipeId: string,
  userId: string,
  forbiddenMessage: string,
  columns = 'author_id',
): Promise<
  | { recipe: { author_id: string } & Record<string, unknown>; response?: undefined }
  | { response: NextResponse; recipe?: undefined }
> {
  const { data, error: fetchError } = await supabase
    .from('recipes')
    .select(columns)
    .eq('id', recipeId)
    .single();

  if (fetchError || !data) {
    return { response: NextResponse.json({ error: '레시피를 찾을 수 없습니다.' }, { status: 404 }) };
  }

  const recipe = data as unknown as { author_id: string } & Record<string, unknown>;
  if (recipe.author_id !== userId) {
    return { response: NextResponse.json({ error: forbiddenMessage }, { status: 403 }) };
  }
  return { recipe };
}

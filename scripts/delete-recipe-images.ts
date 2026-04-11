/**
 * 지정한 레시피 ID 목록의 이미지를 모두 삭제합니다.
 *
 * - recipes.thumbnail_url 와 recipe_steps.image_url 을 NULL 로 설정
 * - Supabase Storage(`recipe-images` 버킷)에서 실제 파일도 삭제
 *
 * 사용법:
 *   npx tsx scripts/delete-recipe-images.ts <recipe_id> [<recipe_id> ...]
 *   또는 RECIPE_IDS 환경변수에 콤마로 구분해 전달
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = 'recipe-images';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Storage public URL 에서 버킷 내부 경로를 추출합니다. */
function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  // public URL 형식: .../storage/v1/object/public/recipe-images/<path>
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function deleteRecipeImages(recipeId: string) {
  console.log(`\n[${recipeId}]`);

  // 1) 레시피 + 단계 이미지 URL 조회
  const { data: recipe, error: recipeErr } = await supabase
    .from('recipes')
    .select('id, title, thumbnail_url')
    .eq('id', recipeId)
    .single();

  if (recipeErr || !recipe) {
    console.log(`  SKIP: 레시피 없음 (${recipeErr?.message ?? 'not found'})`);
    return;
  }

  console.log(`  제목: ${recipe.title}`);

  const { data: steps, error: stepsErr } = await supabase
    .from('recipe_steps')
    .select('id, step_number, image_url')
    .eq('recipe_id', recipeId);

  if (stepsErr) {
    console.log(`  WARNING: 단계 조회 실패: ${stepsErr.message}`);
  }

  // 2) 삭제할 storage 경로 수집
  const paths: string[] = [];
  const thumbPath = extractStoragePath(recipe.thumbnail_url);
  if (thumbPath) paths.push(thumbPath);
  for (const step of steps ?? []) {
    const p = extractStoragePath(step.image_url);
    if (p) paths.push(p);
  }

  console.log(`  삭제 대상 파일 수: ${paths.length}`);

  // 3) Storage 파일 삭제
  if (paths.length > 0) {
    const { error: removeErr } = await supabase.storage.from(BUCKET).remove(paths);
    if (removeErr) {
      console.log(`  WARNING: storage 삭제 일부 실패: ${removeErr.message}`);
    } else {
      console.log(`  storage 파일 삭제 완료`);
    }
  }

  // 4) DB 레코드의 image_url NULL 처리
  const { error: updateRecipeErr } = await supabase
    .from('recipes')
    .update({ thumbnail_url: null })
    .eq('id', recipeId);
  if (updateRecipeErr) {
    console.log(`  WARNING: thumbnail_url 초기화 실패: ${updateRecipeErr.message}`);
  }

  const { error: updateStepsErr } = await supabase
    .from('recipe_steps')
    .update({ image_url: null })
    .eq('recipe_id', recipeId);
  if (updateStepsErr) {
    console.log(`  WARNING: 단계 image_url 초기화 실패: ${updateStepsErr.message}`);
  }

  console.log(`  완료`);
}

async function main() {
  const ids =
    process.argv.slice(2).length > 0
      ? process.argv.slice(2)
      : (process.env.RECIPE_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  if (ids.length === 0) {
    console.error('사용법: npx tsx scripts/delete-recipe-images.ts <recipe_id> [...]');
    process.exit(1);
  }

  console.log(`이미지 삭제 시작: ${ids.length}개 레시피`);
  console.log('='.repeat(55));

  for (const id of ids) {
    await deleteRecipeImages(id);
  }

  console.log('\n' + '='.repeat(55));
  console.log('완료');
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});

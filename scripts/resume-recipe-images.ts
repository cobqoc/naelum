/**
 * 이미지 생성이 중단된 레시피의 이미지를 재개합니다.
 *
 * - '이미지미완료' 태그가 있는 레시피를 찾아 누락된 이미지를 생성
 * - 썸네일 또는 단계 이미지가 null인 항목만 재생성
 * - 무료 할당량 초과 시 다시 중단하고 다음날 재시도
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ⚠️  절대 원칙: 유료 이미지 모델 사용 금지  ⚠️              ║
 * ║                                                              ║
 * ║  Imagen, DALL-E, Midjourney 등 유료 모델은                  ║
 * ║  어떤 상황에서도 절대 사용하지 않습니다.                     ║
 * ║  무료 할당량이 모두 소진되면 이미지 없이 저장하고            ║
 * ║  다음날 이 스크립트로 재개합니다.                            ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * 사용법: npx tsx scripts/resume-recipe-images.ts
 */
import { createClient } from '@supabase/supabase-js';
import { QuotaExhaustedError, buildThumbnailPrompt, buildStepPrompt, translateKoreanToEnglish } from './generate-recipe-images';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_ID = process.env.ADMIN_ID ?? '0132b4d2-5a56-4687-9d34-e1965b565be0';
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateSingleImage(prompt: string): Promise<Buffer | null> {
  const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true`;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90000) });

      if (res.status === 429) {
        const waitSec = attempt * 10;
        console.log(`  rate limit → ${waitSec}초 대기 후 재시도 (${attempt}/${maxRetries})`);
        await sleep(waitSec * 1000);
        continue;
      }

      if (!res.ok) {
        console.error(`  WARNING: 이미지 생성 오류 (${res.status})`);
        return null;
      }

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) {
        console.error('  WARNING: 이미지가 아닌 응답:', contentType);
        return null;
      }

      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      const msg = (err as Error).message;
      if (attempt < maxRetries) {
        console.log(`  오류 (${msg}) → 10초 대기 후 재시도 (${attempt}/${maxRetries})`);
        await sleep(10000);
      } else {
        console.error('  WARNING: 이미지 생성 실패:', msg);
      }
    }
  }

  return null;
}

async function uploadToStorage(imageBuffer: Buffer, fileName: string): Promise<string | null> {
  const contentType = fileName.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
  const { data, error } = await supabase.storage
    .from('recipe-images')
    .upload(fileName, imageBuffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('  WARNING: 업로드 실패:', error.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(data.path);

  return publicUrl;
}

async function main() {
  console.log('이미지 미완료 레시피를 검색합니다...\n');

  // 방법 1: '이미지미완료' 태그가 있는 레시피
  const { data: taggedRecipes } = await supabase
    .from('recipe_tags')
    .select('recipe_id')
    .eq('tag_name', '이미지미완료');

  const taggedIds = new Set((taggedRecipes ?? []).map((t: { recipe_id: string }) => t.recipe_id));

  // 방법 2: 썸네일이 없는 비공개 레시피 (이미지 생성 실패 후 태그 없이 저장된 경우)
  const { data: noThumbRecipes } = await supabase
    .from('recipes')
    .select('id')
    .is('thumbnail_url', null)
    .eq('status', 'private');

  const noThumbIds = new Set((noThumbRecipes ?? []).map((r: { id: string }) => r.id));

  // 방법 3: 단계 이미지가 하나라도 없는 비공개 레시피
  const { data: missingStepRecipes } = await supabase
    .from('recipe_steps')
    .select('recipe_id')
    .is('image_url', null);

  const missingStepIds = new Set((missingStepRecipes ?? []).map((s: { recipe_id: string }) => s.recipe_id));

  // 세 목록 합산 (중복 제거)
  const recipeIds = [...new Set([...taggedIds, ...noThumbIds, ...missingStepIds])];

  if (recipeIds.length === 0) {
    console.log('이미지 미완료 레시피가 없습니다. 모든 이미지가 완성되었습니다!');
    return;
  }

  console.log(`${recipeIds.length}개 레시피의 이미지를 재개합니다.\n`);

  let totalGenerated = 0;
  let quotaExhausted = false;

  for (const recipeId of recipeIds) {
    if (quotaExhausted) break;

    // 레시피 정보 조회
    const { data: recipe } = await supabase
      .from('recipes')
      .select('id, title, description, thumbnail_url')
      .eq('id', recipeId)
      .single();

    if (!recipe) continue;

    console.log(`━━━ "${recipe.title}" (${recipeId}) ━━━`);

    // 단계 조회 (이미지 누락 확인)
    const { data: steps } = await supabase
      .from('recipe_steps')
      .select('id, step_number, instruction, image_url')
      .eq('recipe_id', recipeId)
      .order('step_number');

    if (!steps) continue;

    const missingThumbnail = !recipe.thumbnail_url;
    const missingSteps = steps.filter((s) => !s.image_url);

    if (!missingThumbnail && missingSteps.length === 0) {
      console.log('  모든 이미지가 이미 존재합니다. 태그를 제거합니다.');
      await supabase.from('recipe_tags').delete().eq('recipe_id', recipeId).eq('tag_name', '이미지미완료');
      continue;
    }

    console.log(`  누락: 썸네일 ${missingThumbnail ? '1' : '0'}장, 단계 ${missingSteps.length}장`);

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);

    // 썸네일 재생성
    if (missingThumbnail) {
      console.log('  썸네일 생성 중...');
      const [titleEn, descriptionEn] = await Promise.all([
        translateKoreanToEnglish(recipe.title),
        translateKoreanToEnglish(recipe.description ?? ''),
      ]);
      const prompt = buildThumbnailPrompt(titleEn, descriptionEn);
      try {
        const buffer = await generateSingleImage(prompt);
        if (buffer) {
          const fileName = `${ADMIN_ID}/ai-thumbnail-${timestamp}-${randomId}.jpg`;
          const url = await uploadToStorage(buffer, fileName);
          if (url) {
            await supabase.from('recipes').update({ thumbnail_url: url }).eq('id', recipeId);
            console.log('  썸네일 생성 완료');
            totalGenerated++;
          }
        }
      } catch (err) {
        if (err instanceof QuotaExhaustedError) {
          quotaExhausted = true;
          break;
        }
        throw err;
      }
      await sleep(8000);
    }

    // 누락된 단계 이미지 재생성
    for (const step of missingSteps) {
      if (quotaExhausted) break;

      console.log(`  ${step.step_number}단계 이미지 생성 중...`);
      const [titleEn, instructionEn] = await Promise.all([
        translateKoreanToEnglish(recipe.title),
        translateKoreanToEnglish(step.instruction),
      ]);
      const prompt = buildStepPrompt(titleEn, instructionEn);
      try {
        const buffer = await generateSingleImage(prompt);
        if (buffer) {
          const fileName = `${ADMIN_ID}/ai-step-${timestamp}-${randomId}-${step.step_number}.jpg`;
          const url = await uploadToStorage(buffer, fileName);
          if (url) {
            await supabase.from('recipe_steps').update({ image_url: url }).eq('id', step.id);
            console.log(`  ${step.step_number}단계 이미지 생성 완료`);
            totalGenerated++;
          }
        }
      } catch (err) {
        if (err instanceof QuotaExhaustedError) {
          quotaExhausted = true;
          break;
        }
        throw err;
      }
      await sleep(8000);
    }

    // 모든 이미지가 완성되었으면 태그 제거
    if (!quotaExhausted) {
      const { data: checkSteps } = await supabase
        .from('recipe_steps')
        .select('image_url')
        .eq('recipe_id', recipeId)
        .is('image_url', null);

      const { data: checkRecipe } = await supabase
        .from('recipes')
        .select('thumbnail_url')
        .eq('id', recipeId)
        .single();

      if ((!checkSteps || checkSteps.length === 0) && checkRecipe?.thumbnail_url) {
        await supabase.from('recipe_tags').delete().eq('recipe_id', recipeId).eq('tag_name', '이미지미완료');
        console.log(`  ✓ 모든 이미지 완성! '이미지미완료' 태그 제거됨`);
      }
    }

    console.log('');
  }

  console.log(`\n완료: 총 ${totalGenerated}장 이미지 생성됨`);
  if (quotaExhausted) {
    console.log('할당량 초과로 중단됨. 내일 다시 실행하세요: npx tsx scripts/resume-recipe-images.ts');
  }
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});

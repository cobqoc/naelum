/**
 * 특정 레시피 ID의 이미지를 생성합니다.
 * 사용법: RECIPE_ID=<uuid> npx tsx scripts/generate-single-recipe-images.ts
 */
import { createClient } from '@supabase/supabase-js';
import { buildThumbnailPrompt, buildStepPrompt, translateKoreanToEnglish } from './generate-recipe-images';
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
  return new Promise((r) => setTimeout(r, ms));
}

async function generateImage(prompt: string): Promise<Buffer | null> {
  const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux-realism&nologo=true`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90000) });
      if (res.status === 429) { await sleep(attempt * 15000); continue; }
      if (!res.ok) { console.error(`이미지 생성 오류 (${res.status})`); return null; }
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.startsWith('image/')) { console.error('이미지 아닌 응답:', ct); return null; }
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt < 3) { await sleep(10000); } else { console.error('이미지 생성 실패:', (err as Error).message); }
    }
  }
  return null;
}

async function uploadToStorage(buf: Buffer, fileName: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('recipe-images').upload(fileName, buf, {
    contentType: 'image/jpeg', cacheControl: '3600', upsert: false,
  });
  if (error) { console.error('업로드 실패:', error.message); return null; }
  const { data: { publicUrl } } = supabase.storage.from('recipe-images').getPublicUrl(data.path);
  return publicUrl;
}

async function main() {
  const recipeId = process.env.RECIPE_ID;
  if (!recipeId) { console.error('RECIPE_ID 환경변수가 필요합니다.'); process.exit(1); }

  const { data: recipe } = await supabase
    .from('recipes')
    .select('id, title, description, thumbnail_url')
    .eq('id', recipeId)
    .single();

  if (!recipe) { console.error('레시피를 찾을 수 없습니다:', recipeId); process.exit(1); }

  const { data: steps } = await supabase
    .from('recipe_steps')
    .select('id, step_number, instruction, image_url')
    .eq('recipe_id', recipeId)
    .order('step_number');

  console.log(`\n레시피: "${recipe.title}" (${recipeId})`);
  console.log(`단계 수: ${steps?.length ?? 0}\n`);

  // 번역
  console.log('텍스트 번역 중...');
  const allTexts = [recipe.title, recipe.description ?? '', ...(steps ?? []).map((s) => s.instruction)];
  const translated = await Promise.all(allTexts.map(translateKoreanToEnglish));
  const titleEn = translated[0];
  const descEn = translated[1];
  const instructionsEn = translated.slice(2);
  console.log(`  제목: "${titleEn}"`);

  const ts = Date.now();
  const rid = Math.random().toString(36).substring(7);

  // 썸네일
  if (!recipe.thumbnail_url) {
    console.log('썸네일 생성 중...');
    const prompt = buildThumbnailPrompt(titleEn, descEn);
    console.log(`  프롬프트: ${prompt.substring(0, 80)}...`);
    const buf = await generateImage(prompt);
    if (buf) {
      const url = await uploadToStorage(buf, `${ADMIN_ID}/ai-thumbnail-${ts}-${rid}.jpg`);
      if (url) {
        await supabase.from('recipes').update({ thumbnail_url: url }).eq('id', recipeId);
        console.log('  썸네일 완료');
      }
    }
    await sleep(8000);
  } else {
    console.log('썸네일 이미 존재 → 건너뜀');
  }

  // 단계 이미지
  for (let i = 0; i < (steps ?? []).length; i++) {
    const step = steps![i];
    if (step.image_url) { console.log(`  ${step.step_number}단계 이미지 이미 존재 → 건너뜀`); continue; }

    console.log(`${step.step_number}단계 이미지 생성 중...`);
    const prompt = buildStepPrompt(titleEn, instructionsEn[i]);
    console.log(`  프롬프트: ${prompt.substring(0, 80)}...`);
    const buf = await generateImage(prompt);
    if (buf) {
      const url = await uploadToStorage(buf, `${ADMIN_ID}/ai-step-${ts}-${rid}-${step.step_number}.jpg`);
      if (url) {
        await supabase.from('recipe_steps').update({ image_url: url }).eq('id', step.id);
        console.log(`  ${step.step_number}단계 완료`);
      }
    }
    if (i < steps!.length - 1) await sleep(8000);
  }

  console.log('\n완료!');
}

main().catch((err) => { console.error('ERROR:', err.message); process.exit(1); });

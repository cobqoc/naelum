/**
 * YouTube 레시피 DB 삽입 스크립트
 * stdin으로 JSON을 받아 무료 AI 이미지를 생성하고 Supabase에 삽입합니다.
 *
 * - 무료 이미지 생성: Pollinations.ai (Flux 모델, API 키 불필요)
 * - 이미지 생성 실패 시 레시피를 임시저장(draft)하고 중단
 * - 중단된 레시피는 resume-recipe-images.ts로 재개
 *
 * 사용법: echo '<JSON>' | npx tsx scripts/import-youtube-recipe.ts
 */
import { createClient } from '@supabase/supabase-js';
import { generateRecipeImages } from './generate-recipe-images';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_ID = process.env.ADMIN_ID ?? '0132b4d2-5a56-4687-9d34-e1965b565be0';

interface RecipeInput {
  title: string;
  description?: string;
  video_url: string;
  servings?: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  cuisine_type?: string;
  dish_type?: string;
  calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_dairy_free?: boolean;
  is_low_carb?: boolean;
  ingredients: Array<{
    ingredient_name: string;
    quantity: number | null;
    unit: string;
    notes?: string;
    is_optional?: boolean;
  }>;
  steps: Array<{
    instruction: string;
    timer_minutes?: number | null;
    tip?: string;
  }>;
  tags?: string[];
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function main() {
  const raw = await readStdin();
  if (!raw.trim()) {
    console.error('ERROR: stdin이 비어있습니다. JSON 데이터를 전달해주세요.');
    process.exit(1);
  }

  let input: RecipeInput;
  try {
    input = JSON.parse(raw);
  } catch {
    console.error('ERROR: JSON 파싱 실패');
    process.exit(1);
  }

  if (!input.title || !input.ingredients?.length || !input.steps?.length) {
    console.error('ERROR: title, ingredients, steps는 필수입니다.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 중복 체크 1: 같은 video_url
  if (input.video_url) {
    const { data: existing } = await supabase
      .from('recipes')
      .select('id, title')
      .eq('video_url', input.video_url)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`DUPLICATE: 이미 등록된 영상입니다. (ID: ${existing[0].id}, 제목: ${existing[0].title})`);
      process.exit(0);
    }
  }

  // 중복 체크 2: 유사 제목 + 재료 100% 동일
  {
    const { data: similarRecipes } = await supabase
      .from('recipes')
      .select('id, title')
      .ilike('title', `%${input.title}%`)
      .limit(10);

    if (similarRecipes && similarRecipes.length > 0) {
      for (const similar of similarRecipes) {
        const { data: existingIngs } = await supabase
          .from('recipe_ingredients')
          .select('ingredient_name')
          .eq('recipe_id', similar.id)
          .order('display_order');

        if (existingIngs && existingIngs.length > 0) {
          const existingNames = new Set(existingIngs.map((i) => i.ingredient_name.trim().toLowerCase()));
          const newNames = new Set(input.ingredients.map((i) => i.ingredient_name.trim().toLowerCase()));

          if (existingNames.size === newNames.size) {
            const allMatch = [...existingNames].every((name) => newNames.has(name));
            if (allMatch) {
              console.log(`SIMILAR: 유사 레시피 발견! 제목: "${similar.title}" (ID: ${similar.id})`);
              console.log(`SIMILAR: 재료가 100% 동일합니다. 중복 레시피일 가능성이 높습니다.`);
              console.log(`SIMILAR: 그래도 저장하려면 FORCE=1 환경변수를 설정하세요.`);
              if (!process.env.FORCE) {
                process.exit(0);
              }
              console.log('FORCE 모드: 강제 저장합니다.');
            }
          }
        }
      }
    }
  }

  // 무료 AI 이미지 생성 (Pollinations.ai Flux)
  const description = input.description || `${input.title} 레시피입니다.`;

  const skipImages = process.env.SKIP_IMAGES === '1';
  let imageResult: { thumbnailUrl: string | null; stepImageUrls: (string | null)[]; interrupted: boolean; completedSteps: number; totalSteps: number };

  if (skipImages) {
    console.log('SKIP_IMAGES=1: 이미지 생성을 건너뜁니다.');
    imageResult = { thumbnailUrl: null, stepImageUrls: input.steps.map(() => null), interrupted: false, completedSteps: 0, totalSteps: input.steps.length };
  } else {
    console.log('무료 AI 이미지 생성을 시작합니다 (Pollinations.ai Flux)...');
    imageResult = await generateRecipeImages(
      input.title,
      description,
      input.steps,
    );
  }

  if (imageResult.interrupted) {
    console.log('INTERRUPTED: 무료 할당량 초과로 이미지 생성이 중단되었습니다.');
    console.log(`  생성된 이미지: 썸네일 ${imageResult.thumbnailUrl ? '1' : '0'}장 + ${imageResult.completedSteps}/${imageResult.totalSteps}단계`);
    console.log('  레시피는 비공개로 저장됩니다. 다음날 resume-recipe-images.ts로 재개하세요.');
  }

  // 레시피 삽입 (항상 비공개 draft)
  const { data: inserted, error: insertError } = await supabase
    .from('recipes')
    .insert({
      author_id: ADMIN_ID,
      title: input.title,
      description,
      thumbnail_url: imageResult.thumbnailUrl,
      video_url: input.video_url || null,
      servings: input.servings || null,
      prep_time_minutes: input.prep_time_minutes || null,
      cook_time_minutes: input.cook_time_minutes || null,
      difficulty_level: input.difficulty_level || null,
      cuisine_type: input.cuisine_type || 'other',
      dish_type: input.dish_type || 'other',
      calories: input.calories || null,
      protein_grams: input.protein_grams || null,
      carbs_grams: input.carbs_grams || null,
      fat_grams: input.fat_grams || null,
      is_vegetarian: input.is_vegetarian || false,
      is_vegan: input.is_vegan || false,
      is_gluten_free: input.is_gluten_free || false,
      is_dairy_free: input.is_dairy_free || false,
      is_low_carb: input.is_low_carb || false,
      is_published: true,
      is_public: false,
      published_at: null,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('ERROR: 레시피 삽입 실패:', insertError.message);
    process.exit(1);
  }

  const recipeId = inserted.id;
  console.log(`RECIPE_ID: ${recipeId}`);

  // 재료 삽입
  const ingredients = input.ingredients.map((ing, i) => ({
    recipe_id: recipeId,
    ingredient_name: ing.ingredient_name,
    quantity: ing.quantity,
    unit: ing.unit || '선택',
    notes: ing.notes || null,
    is_optional: ing.is_optional || false,
    display_order: i + 1,
  }));

  const { error: ingError } = await supabase
    .from('recipe_ingredients')
    .insert(ingredients);

  if (ingError) {
    console.error('WARNING: 재료 삽입 실패:', ingError.message);
  }

  // 조리 단계 삽입 (생성된 이미지만 포함, 나머지는 null)
  const steps = input.steps.map((step, i) => ({
    recipe_id: recipeId,
    step_number: i + 1,
    instruction: step.instruction,
    timer_minutes: step.timer_minutes || null,
    tip: step.tip || null,
    image_url: imageResult.stepImageUrls[i] || null,
  }));

  const { error: stepError } = await supabase
    .from('recipe_steps')
    .insert(steps);

  if (stepError) {
    console.error('WARNING: 단계 삽입 실패:', stepError.message);
  }

  // 태그 삽입
  if (input.tags && input.tags.length > 0) {
    const tags = input.tags.map((t) => ({
      recipe_id: recipeId,
      tag_name: t,
    }));

    const { error: tagError } = await supabase
      .from('recipe_tags')
      .insert(tags);

    if (tagError) {
      console.error('WARNING: 태그 삽입 실패:', tagError.message);
    }
  }

  // 이미지 미완료 태그 추가 (재개 시 찾기 위함)
  if (imageResult.interrupted) {
    await supabase.from('recipe_tags').insert({
      recipe_id: recipeId,
      tag_name: '이미지미완료',
    });
  }

  const imageCount = [imageResult.thumbnailUrl, ...imageResult.stepImageUrls].filter(Boolean).length;
  const totalImages = input.steps.length + 1;
  console.log(`SUCCESS: "${input.title}" 추가 완료 (재료 ${ingredients.length}개, 단계 ${steps.length}개, 태그 ${input.tags?.length || 0}개, 이미지 ${imageCount}/${totalImages}장)`);
  console.log(`STATUS: 비공개로 저장됨 (검토 후 공개 가능)`);

  if (imageResult.interrupted) {
    console.log(`RESUME: 다음 명령어로 이미지 생성을 재개하세요:`);
    console.log(`  npx tsx scripts/resume-recipe-images.ts`);
  }
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});

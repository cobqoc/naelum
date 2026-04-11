/**
 * YouTube 팁/노하우 DB 삽입 스크립트
 * stdin으로 JSON을 받아 AI 이미지를 생성하고 Supabase tip 테이블에 삽입합니다.
 *
 * 사용법: echo '<JSON>' | npx tsx scripts/import-youtube-tip.ts
 */
import { createClient } from '@supabase/supabase-js';
import { generateRecipeImages } from './generate-recipe-images';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_ID = process.env.ADMIN_ID ?? '0132b4d2-5a56-4687-9d34-e1965b565be0';

const VALID_CATEGORIES = ['손질법', '보관법', '조리법', '도구 사용법', '계량법', '기타'];

interface TipInput {
  title: string;
  description?: string;
  video_url: string;
  category?: string;
  duration_minutes?: number;
  steps: Array<{
    instruction: string;
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

  let input: TipInput;
  try {
    input = JSON.parse(raw);
  } catch {
    console.error('ERROR: JSON 파싱 실패');
    process.exit(1);
  }

  if (!input.title || !input.steps?.length) {
    console.error('ERROR: title, steps는 필수입니다.');
    process.exit(1);
  }

  // 카테고리 유효성 검사
  const category = VALID_CATEGORIES.includes(input.category || '') ? input.category! : '기타';

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 중복 체크 (description에 video_url 저장해서 체크)
  if (input.video_url) {
    const { data: existing } = await supabase
      .from('tip')
      .select('id, title')
      .ilike('description', `%${input.video_url}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`DUPLICATE: 이미 등록된 영상입니다. (ID: ${existing[0].id}, 제목: ${existing[0].title})`);
      process.exit(0);
    }
  }

  const description = input.description || `${input.title}에 대한 요리 팁입니다.`;

  // AI 이미지 생성 (SKIP_IMAGES=1 환경변수로 건너뜀 가능)
  const skipImages = process.env.SKIP_IMAGES === '1';
  let thumbnailUrl: string | null = null;
  let stepImageUrls: (string | null)[] = new Array(input.steps.length).fill(null);

  if (!skipImages) {
    console.log('AI 이미지 생성을 시작합니다 (Pollinations.ai Flux)...');
    const result = await generateRecipeImages(input.title, description, input.steps);
    thumbnailUrl = result.thumbnailUrl;
    stepImageUrls = result.stepImageUrls;
  } else {
    console.log('SKIP_IMAGES=1: 이미지 생성을 건너뜁니다.');
  }

  // tip에는 video_url 컬럼이 없으므로 description에 원본 URL 포함
  const fullDescription = input.video_url
    ? `${description}\n\n원본 영상: ${input.video_url}`
    : description;

  // 팁 삽입
  const { data: inserted, error: insertError } = await supabase
    .from('tip')
    .insert({
      author_id: ADMIN_ID,
      title: input.title,
      description: fullDescription,
      thumbnail_url: thumbnailUrl,
      category,
      duration_minutes: input.duration_minutes || null,
      is_public: false,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('ERROR: 팁 삽입 실패:', insertError.message);
    process.exit(1);
  }

  const tipId = inserted.id;
  console.log(`TIP_ID: ${tipId}`);

  // 단계 삽입 (AI 이미지 포함)
  const steps = input.steps.map((step, i) => ({
    tip_id: tipId,
    step_number: i + 1,
    instruction: step.instruction,
    tip: step.tip || null,
    image_url: stepImageUrls[i] || null,
  }));

  const { error: stepError } = await supabase
    .from('tip_steps')
    .insert(steps);

  if (stepError) {
    console.error('WARNING: 단계 삽입 실패:', stepError.message);
  }

  // 태그 삽입
  if (input.tags && input.tags.length > 0) {
    const tags = input.tags.map((t) => ({
      tip_id: tipId,
      tag: t,
    }));

    const { error: tagError } = await supabase
      .from('tip_tags')
      .insert(tags);

    if (tagError) {
      console.error('WARNING: 태그 삽입 실패:', tagError.message);
    }
  }

  const imageCount = [thumbnailUrl, ...stepImageUrls].filter(Boolean).length;
  console.log(`SUCCESS: "${input.title}" 팁 추가 완료 (단계 ${steps.length}개, 태그 ${input.tags?.length || 0}개, 이미지 ${imageCount}장)`);
  console.log(`STATUS: 비공개로 저장됨 (is_public: false)`);
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});

/**
 * Pollinations.ai (무료, 인증 불필요)로 레시피 이미지를 생성하고
 * Supabase Storage에 업로드합니다.
 *
 * - https://image.pollinations.ai/prompt/{prompt} — 완전 무료, API 키 불필요
 * - Flux 모델 사용 (고품질 음식 사진)
 * - 실패 시 null 반환 (이미지 없이 저장)
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ⚠️  절대 원칙: 유료 이미지 모델 사용 금지  ⚠️              ║
 * ║                                                              ║
 * ║  Imagen, DALL-E, Midjourney 등 유료 모델은                  ║
 * ║  어떤 상황에서도 절대 사용하지 않습니다.                     ║
 * ║  이미지 생성 실패 시 이미지 없이 저장하고                    ║
 * ║  나중에 resume-recipe-images.ts로 재개합니다.               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_ID = process.env.ADMIN_ID ?? '0132b4d2-5a56-4687-9d34-e1965b565be0';

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

/** 요청 간 딜레이 — Pollinations.ai rate limit 방지 */
const DELAY_BETWEEN_IMAGES_MS = 8000;  // 이미지 요청 사이 8초 대기
const DELAY_ON_RATE_LIMIT_MS  = 15000; // 429 응답 시 첫 재시도 전 15초 대기 (재시도마다 +15초)

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export class QuotaExhaustedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExhaustedError';
  }
}

/**
 * Pollinations.ai로 이미지 1장 생성 (무료, API 키 불필요)
 * 429 rate limit 시 최대 3회 재시도 (재시도마다 대기 시간 증가)
 * 실패 시 null 반환
 */
async function generateImage(prompt: string): Promise<Buffer | null> {
  const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux-realism&nologo=true`;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });

      if (res.status === 429) {
        const waitMs = DELAY_ON_RATE_LIMIT_MS * attempt;
        console.error(`WARNING: rate limit (429) → ${waitMs / 1000}초 대기 후 재시도 (${attempt}/${maxRetries})`);
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) {
        console.error(`WARNING: 이미지 생성 오류 (${res.status})`);
        return null;
      }

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) {
        console.error('WARNING: 이미지가 아닌 응답을 받았습니다:', contentType);
        return null;
      }

      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      const msg = (err as Error).message;
      if (attempt < maxRetries) {
        console.error(`WARNING: 이미지 생성 실패 (${msg}) → 10초 대기 후 재시도 (${attempt}/${maxRetries})`);
        await sleep(10000);
      } else {
        console.error('WARNING: 이미지 생성 실패:', msg);
      }
    }
  }

  return null;
}

/**
 * Supabase Storage에 이미지 업로드 후 public URL 반환
 */
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
    console.error('WARNING: Storage 업로드 실패:', error.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * 한국어 텍스트를 영어로 번역 (Google Translate 비공식 무료 API)
 * 한국어가 없으면 그대로 반환, 실패 시 원문 fallback
 */
export async function translateKoreanToEnglish(text: string): Promise<string> {
  if (!/[\uAC00-\uD7AF]/.test(text)) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return text;
    const data = await res.json() as [[string[]]];
    return data[0]?.map((item) => item[0]).join('') || text;
  } catch {
    return text;
  }
}

/**
 * 레시피 썸네일 이미지 생성 프롬프트 (영어 텍스트 전달 권장)
 */
export function buildThumbnailPrompt(title: string, description: string): string {
  return `Professional food photography of ${title}. ${description}. Beautifully plated, overhead top-down view, warm soft natural lighting, rustic wooden table, minimal elegant props, vibrant fresh colors, shallow depth of field, steam rising, appetizing, commercial food photography style, 4K ultra quality, no text, no watermark, no people`;
}

/**
 * 조리 단계 이미지 생성 프롬프트 (영어 텍스트 전달 권장)
 */
export function buildStepPrompt(title: string, instruction: string): string {
  return `Step-by-step cooking photo: ${instruction} while preparing ${title}. Close-up focus on the food and ingredients, no hands or people visible, realistic kitchen setting, warm side lighting, wooden cutting board or pan in frame, sharp focus on the cooking action, professional culinary photography, vivid colors, 4K quality, no text, no watermark`;
}

export interface ImageGenerationResult {
  thumbnailUrl: string | null;
  stepImageUrls: (string | null)[];
  interrupted: boolean;
  completedSteps: number;
  totalSteps: number;
}

/**
 * 레시피의 모든 이미지를 생성하고 업로드합니다.
 * 무료 할당량 초과 시 즉시 중단하고 생성된 이미지까지만 반환합니다.
 *
 * @param startFromStep 이미 생성된 단계를 건너뛰고 이 단계부터 시작 (재개용, 0-indexed)
 */
export async function generateRecipeImages(
  title: string,
  description: string,
  steps: Array<{ instruction: string }>,
  startFromStep: number = 0,
  existingThumbnailUrl: string | null = null,
): Promise<ImageGenerationResult> {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  let interrupted = false;

  console.log('이미지 생성 모델: Pollinations.ai (Flux, 무료)');

  // 텍스트 번역 (한국어 → 영어, Promise.all로 동시 처리)
  console.log('텍스트 번역 중...');
  const [titleEn, descriptionEn, ...instructionsEn] = await Promise.all([
    translateKoreanToEnglish(title),
    translateKoreanToEnglish(description),
    ...steps.map((s) => translateKoreanToEnglish(s.instruction)),
  ]);

  // 썸네일 생성 (기존 썸네일이 없을 때만)
  let thumbnailUrl = existingThumbnailUrl;
  if (!thumbnailUrl) {
    console.log('이미지 생성 중: 썸네일...');
    try {
      const thumbnailPrompt = buildThumbnailPrompt(titleEn, descriptionEn);
      const thumbnailBuffer = await generateImage(thumbnailPrompt);
      if (thumbnailBuffer) {
        const fileName = `${ADMIN_ID}/ai-thumbnail-${timestamp}-${randomId}.jpg`;
        thumbnailUrl = await uploadToStorage(thumbnailBuffer, fileName);
        if (thumbnailUrl) console.log('  썸네일 생성 완료');
      }
    } catch (err) {
      if (err instanceof QuotaExhaustedError) {
        return { thumbnailUrl: null, stepImageUrls: new Array(steps.length).fill(null), interrupted: true, completedSteps: 0, totalSteps: steps.length };
      }
    }
    // 다음 요청 전 딜레이
    await sleep(DELAY_BETWEEN_IMAGES_MS);
  } else {
    console.log('썸네일 이미 존재 → 건너뜀');
  }

  // 조리 단계별 이미지 생성
  const stepImageUrls: (string | null)[] = new Array(steps.length).fill(null);
  let completedSteps = startFromStep;

  for (let i = startFromStep; i < steps.length; i++) {
    console.log(`이미지 생성 중: ${i + 1}/${steps.length} 단계...`);

    try {
      const stepPrompt = buildStepPrompt(titleEn, instructionsEn[i]);
      const stepBuffer = await generateImage(stepPrompt);

      if (stepBuffer) {
        const fileName = `${ADMIN_ID}/ai-step-${timestamp}-${randomId}-${i + 1}.jpg`;
        const url = await uploadToStorage(stepBuffer, fileName);
        stepImageUrls[i] = url;
        if (url) console.log(`  ${i + 1}단계 이미지 생성 완료`);
      }
      completedSteps = i + 1;
    } catch (err) {
      if (err instanceof QuotaExhaustedError) {
        interrupted = true;
        console.error(`INTERRUPTED: ${i}/${steps.length} 단계에서 중단됨. 나머지 ${steps.length - i}단계는 다음에 재개하세요.`);
        break;
      }
    }

    // 마지막 단계가 아니면 다음 요청 전 딜레이
    if (i < steps.length - 1) {
      await sleep(DELAY_BETWEEN_IMAGES_MS);
    }
  }

  const successCount = [thumbnailUrl, ...stepImageUrls].filter(Boolean).length;
  console.log(`이미지 생성 결과: ${successCount}/${steps.length + 1}장 성공${interrupted ? ' (할당량 초과로 중단됨)' : ''}`);

  return { thumbnailUrl, stepImageUrls, interrupted, completedSteps, totalSteps: steps.length };
}

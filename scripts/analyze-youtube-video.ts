/**
 * Gemini API로 YouTube 영상을 직접 시청·분석하여 레시피 JSON을 추출합니다.
 *
 * 사용법: npx tsx scripts/analyze-youtube-video.ts "https://www.youtube.com/watch?v=VIDEO_ID"
 * 출력: import-youtube-recipe.ts에 파이프할 수 있는 JSON
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex);
      const value = trimmed.slice(eqIndex + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch { /* 무시 */ }
}
loadEnvLocal();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const RECIPE_EXTRACTION_PROMPT = `당신은 요리 레시피 전문 분석가입니다.
이 YouTube 영상을 시청하고, 영상에서 소개하는 레시피 정보를 정확히 추출하세요.

## 저작권 보호 원칙 (최우선)
유튜버의 문장, 말투, 독창적 표현을 절대 그대로 사용하지 않습니다.
내용(사실 정보)은 유지하되, 모든 텍스트를 간결한 설명체(~합니다)로 완전히 새로 작성합니다.
단순히 동의어를 교체하거나 어순을 바꾸는 수준도 안 됩니다. 문장 자체를 새로 써야 합니다.

나쁜 예: "볶아주세요~" → "볶아줍니다" (표현만 바꾼 것, 안 됨)
좋은 예: "볶아주세요~" → "중약불에서 재료가 부드러워질 때까지 볶습니다." (내용 유지, 문장 새로 작성)

## 데이터 추출 규칙
- 영상에서 실제로 언급되거나 보여지는 정보만 추출하세요.
- 추정하거나 지어내지 마세요. 확인할 수 없는 항목은 null로 남기세요.
- 재료의 양과 단위는 영상에서 언급된 그대로 적으세요 (직관적 단위 우선: g보다 "2대", "¼개" 등).
- 조리 단계는 영상의 실제 진행 순서를 따르되, 8~10단계 이내로 의미 단위로 묶어 작성하세요.

## 출력 형식 (JSON)
\`\`\`json
{
  "title": "레시피 제목 (영상 제목 기반)",
  "description": "레시피 설명 (영상에서 소개하는 내용 기반, 2~3문장)",
  "video_url": "YouTube URL",
  "servings": null 또는 숫자,
  "prep_time_minutes": null 또는 숫자,
  "cook_time_minutes": null 또는 숫자,
  "difficulty_level": null 또는 "easy"/"medium"/"hard",
  "cuisine_type": "korean" 등,
  "dish_type": "soup"/"main"/"side"/"dessert"/"snack" 등,
  "calories": null 또는 숫자,
  "protein_grams": null,
  "carbs_grams": null,
  "fat_grams": null,
  "is_vegetarian": false,
  "is_vegan": false,
  "is_gluten_free": false,
  "is_dairy_free": false,
  "is_low_carb": false,
  "ingredients": [
    {
      "ingredient_name": "재료명",
      "quantity": 숫자 또는 null,
      "unit": "단위 (g, ml, 큰술, 작은술, 개, 컵 등)",
      "notes": "비고 (선택)",
      "is_optional": false
    }
  ],
  "steps": [
    {
      "instruction": "조리 단계 설명",
      "timer_minutes": null 또는 숫자,
      "tip": "팁 (영상에서 언급한 경우만)"
    }
  ],
  "tags": ["태그1", "태그2"]
}
\`\`\`

JSON만 출력하세요. 다른 텍스트는 포함하지 마세요.`;

async function analyzeVideo(videoUrl: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              fileData: {
                fileUri: videoUrl,
                mimeType: 'video/*',
              },
            },
            {
              text: RECIPE_EXTRACTION_PROMPT,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Gemini API 오류 (${res.status}): ${error}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API 응답에 텍스트가 없습니다.');
  }

  return text;
}

async function main() {
  const videoUrl = process.argv[2];
  if (!videoUrl) {
    console.error('사용법: npx tsx scripts/analyze-youtube-video.ts "YouTube_URL"');
    process.exit(1);
  }

  console.error(`영상 분석 중: ${videoUrl}`);
  const json = await analyzeVideo(videoUrl);

  // JSON 유효성 검증
  try {
    const parsed = JSON.parse(json);
    // video_url을 항상 실제 입력 URL로 설정 (Gemini가 잘못된 URL을 생성할 수 있음)
    parsed.video_url = videoUrl;
    // stdout으로 JSON 출력 (import-youtube-recipe.ts로 파이프)
    console.log(JSON.stringify(parsed, null, 2));
  } catch {
    console.error('WARNING: Gemini 응답이 유효한 JSON이 아닙니다. 원본 출력:');
    console.log(json);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});

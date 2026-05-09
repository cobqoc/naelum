/**
 * MAFF 레시피 재료 잔여 일본어 → Gemini API 번역
 *
 * 실행: npx tsx scripts/translate-maff-gemini.ts
 *
 * 입력: data/maff-recipes-translated.json (이미 ING_DICT 처리된 것)
 * 캐시: data/maff-gemini-cache.json
 * 출력: data/maff-recipes-translated.json (인플레이스 업데이트)
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const TRANS_FILE = path.join(process.cwd(), 'data/maff-recipes-translated.json');
const CACHE_FILE = path.join(process.cwd(), 'data/maff-gemini-cache.json');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
// gemini-2.5-flash: 10 RPM 무료, 자주 429 발생
// gemini-1.5-flash: 15 RPM 무료, 더 안정적
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const BATCH_SIZE = 60;
const DELAY_MS = 5000;     // gemini-1.5-flash 15 RPM → 4초 간격으로 안전하게

const JP_REGEX = /[ぁ-ゟ゠-ヿ一-鿿]/;

function hasJapanese(s: string): boolean {
  return JP_REGEX.test(s);
}

async function translateBatch(names: string[]): Promise<Map<string, string>> {
  const prompt = `당신은 일본어 음식 재료명을 한국어로 번역하는 전문가입니다.
아래 JSON 배열의 각 항목을 한국어로 번역하세요.

규칙:
- 재료명만 번역 (이미 한국어가 섞인 경우 일본어 부분만 한국어로 변환)
- 괄호 안 조리법/상태도 번역 (예: （みじん切り）→ （다진）)
- 고유명사(지명, 품종명)는 발음 그대로 + 설명 (예: ゆずこしょう → 유즈고쇼(유자 고추 소금))
- 조리도구(竹串, 重石 등)도 번역
- 음식이 아닌 재료도 번역 (わら → 볏짚)
- 결과는 입력과 동일한 순서의 JSON 배열로만 반환 (추가 설명 없이)

입력:
${JSON.stringify(names, null, 2)}

출력 형식 (JSON 배열만):
`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const json = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // JSON 배열 파싱
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Gemini 응답에서 JSON 배열을 찾을 수 없음:\n' + text.slice(0, 400));
  }

  let translated: string[];
  try {
    translated = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error('JSON 파싱 실패: ' + jsonMatch[0].slice(0, 400));
  }

  if (translated.length !== names.length) {
    throw new Error(`길이 불일치: 입력 ${names.length}, 출력 ${translated.length}`);
  }

  const map = new Map<string, string>();
  for (let i = 0; i < names.length; i++) {
    map.set(names[i], translated[i] ?? names[i]);
  }
  return map;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY가 .env.local에 없습니다.');
    process.exit(1);
  }

  // 번역 대상 수집
  const data = JSON.parse(fs.readFileSync(TRANS_FILE, 'utf-8'));
  const toTranslate = new Set<string>();
  for (const r of data) {
    for (const ing of r.ingredients) {
      if (hasJapanese(ing.name)) toTranslate.add(ing.name);
    }
  }

  console.log(`번역 대상: ${toTranslate.size}개 고유 재료명`);

  // 캐시 로드
  let cache: Record<string, string> = {};
  if (fs.existsSync(CACHE_FILE)) {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    const cached = [...toTranslate].filter(n => cache[n]).length;
    console.log(`캐시 히트: ${cached}개`);
  }

  // 미번역 항목만 필터
  const remaining = [...toTranslate].filter(n => !cache[n]);
  console.log(`API 호출 필요: ${remaining.length}개`);

  // 배치 처리
  let batches = 0;
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(remaining.length / BATCH_SIZE);

    process.stdout.write(`배치 ${batchNum}/${totalBatches} (${batch.length}개)... `);

    let attempt = 0;
    while (attempt < 3) {
      try {
        const map = await translateBatch(batch);
        map.forEach((v, k) => { cache[k] = v; });
        console.log('✅');
        batches++;
        break;
      } catch (e) {
        attempt++;
        const msg = (e as Error).message;
        const is429 = msg.includes('429');
        if (attempt >= 3) {
          console.log(`❌ (${msg.slice(0, 80)})`);
        } else {
          const wait = is429 ? 120000 : DELAY_MS * 2;  // 429 → 2분 대기 (RPM 리셋)
          console.log(`⚠️ 재시도 ${attempt} (${Math.round(wait/1000)}초 대기)...`);
          await sleep(wait);
        }
      }
    }

    // 캐시 중간 저장
    if (batches % 5 === 0 || i + BATCH_SIZE >= remaining.length) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    }

    if (i + BATCH_SIZE < remaining.length) {
      await sleep(DELAY_MS);
    }
  }

  // 캐시 최종 저장
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`\n번역 캐시 저장: ${Object.keys(cache).length}개`);

  // JSON 업데이트
  let updatedCount = 0;
  for (const r of data) {
    for (const ing of r.ingredients) {
      if (hasJapanese(ing.name) && cache[ing.name]) {
        ing.name = cache[ing.name];
        updatedCount++;
      }
    }
  }

  fs.writeFileSync(TRANS_FILE, JSON.stringify(data, null, 2));
  console.log(`재료명 업데이트: ${updatedCount}개`);

  // 최종 통계
  let total = 0, stillJP = 0;
  for (const r of data) {
    for (const ing of r.ingredients) {
      total++;
      if (hasJapanese(ing.name)) stillJP++;
    }
  }
  console.log(`\n최종 미번역: ${stillJP}/${total} (${(stillJP/total*100).toFixed(1)}%)`);
}

main().catch(console.error);

/**
 * 농림수산식품교육문화정보원_고수요리법 OpenAPI → 낼름 DB 임포트
 * data.go.kr ID: 15050910
 *
 * 실행: npx tsx scripts/import-gos-recipes.ts
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

// ============================================================
// 설정
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

const API_URL = 'https://api.odcloud.kr/api/15050910/v1/uddi:69d46184-9441-4d4d-9c3f-e4de66a49643_201909261053';
const API_KEY = process.env.DATA_GO_KR_API_KEY!;
const PAGE_SIZE = 500;
const DELAY_MS = 500;

// ============================================================
// 타입
// ============================================================

interface GosRecord {
  제목: string;
  메뉴명: string;
  내용: string;
  등록일: string;
}

interface ParsedIngredient {
  ingredient_name: string;
  quantity: number | null;
  unit: string;
  notes: string | null;
  is_optional: boolean;
  display_order: number;
}

interface ParsedStep {
  step_number: number;
  instruction: string;
  image_url: string | null;
  timer_minutes: null;
  tip: null;
}

// ============================================================
// 유틸
// ============================================================

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ============================================================
// 재료 파싱 (import-recipes.ts와 동일한 UNIT_PATTERN 활용)
// ============================================================

const UNIT_PATTERN = '(g|kg|ml|L|개|큰술|작은술|컵|줌|꼬집|조각|장|포기|대|모|마리|쪽|톨|줄기|cm|mm|송이|봉지|팩|통|근|되|홉|스푼|알|T|t|ts|cc|oz)';

function parseIngredients(text: string): ParsedIngredient[] {
  if (!text?.trim()) return [];
  const parts = text.split(/[,，]/).map(s => s.trim()).filter(s => s);
  const ingredients: ParsedIngredient[] = [];

  for (const part of parts) {
    if (!part || part.length > 60) continue;
    const unitRegex = new RegExp(`^(.+?)\\s+(\\d+\\.?\\d*(?:\\/\\d+)?)\\s*${UNIT_PATTERN}(.*)$`);
    const match = part.match(unitRegex);
    if (match) {
      const qty = parseFloat(match[2].includes('/') ? eval(match[2]) : match[2]);
      ingredients.push({
        ingredient_name: match[1].trim(),
        quantity: isNaN(qty) ? null : qty,
        unit: match[3],
        notes: null,
        is_optional: false,
        display_order: ingredients.length + 1,
      });
    } else {
      const simpleMatch = part.match(/^(.+?)\s+(약간|적당량|조금|소량|적당히|적량|한줌|조금씩)(.*)$/);
      if (simpleMatch) {
        ingredients.push({
          ingredient_name: simpleMatch[1].trim(),
          quantity: null,
          unit: '약간',
          notes: null,
          is_optional: false,
          display_order: ingredients.length + 1,
        });
      } else if (part.length >= 2 && part.length <= 30) {
        ingredients.push({
          ingredient_name: part,
          quantity: null,
          unit: '선택',
          notes: null,
          is_optional: false,
          display_order: ingredients.length + 1,
        });
      }
    }
    if (ingredients.length >= 20) break;
  }
  return ingredients;
}

// ============================================================
// 조리 단계 추출
// ============================================================

const COOKING_VERBS = /[썰어|볶아|끓여|넣고|섞어|굽고|튀기|익히|완성|담아|뿌리|섞고|달구|두르|졸이|식히|버무|찌고|재워|만들|준비|세척|씻어|손질|절여|데쳐|건져|불려|으깨|다지]/;

function parseSteps(text: string): ParsedStep[] {
  const steps: ParsedStep[] = [];

  // 문단 단위로 분리
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim())
    .filter(p => p.length > 10 && p.length < 500);

  for (const para of paragraphs) {
    // 재료 관련 라인 스킵
    if (/재료\s*[-:]/i.test(para)) continue;
    if (/^(재료|소스|파인애플소스|양념)/i.test(para)) continue;

    // 조리 동사가 포함된 문장 우선
    if (COOKING_VERBS.test(para) || steps.length < 3) {
      steps.push({
        step_number: steps.length + 1,
        instruction: para,
        image_url: null,
        timer_minutes: null,
        tip: null,
      });
    }
    if (steps.length >= 10) break;
  }

  return steps;
}

// ============================================================
// API 호출
// ============================================================

async function fetchAll(): Promise<GosRecord[]> {
  const all: GosRecord[] = [];
  let page = 1;

  while (true) {
    const url = `${API_URL}?page=${page}&perPage=${PAGE_SIZE}&serviceKey=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API 오류 (${res.status}): ${await res.text()}`);
    const json = await res.json();
    all.push(...json.data);
    console.log(`  📡 페이지 ${page}: ${json.currentCount}건 (${all.length}/${json.totalCount})`);
    if (all.length >= json.totalCount) break;
    page++;
    await sleep(DELAY_MS);
  }
  return all;
}

// ============================================================
// 메인
// ============================================================

async function main() {
  console.log('========================================');
  console.log('고수요리법 레시피 임포트');
  console.log('========================================\n');

  // 1. 관리자 로그인
  console.log('1️⃣  관리자 로그인...');
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
  });
  if (authError || !authData.user) {
    console.error('❌ 로그인 실패:', authError?.message);
    process.exit(1);
  }
  const ADMIN_USER_ID = authData.user.id;
  console.log(`   관리자 UUID: ${ADMIN_USER_ID}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. 기존 제목 목록 (중복 방지)
  const { data: existingRows } = await supabase.from('recipes').select('title');
  const existingTitles = new Set((existingRows || []).map((r: { title: string }) => r.title.trim()));
  console.log(`2️⃣  기존 레시피 수: ${existingTitles.size}개\n`);

  // 3. API 전체 가져오기
  console.log('3️⃣  API 데이터 가져오기...');
  const records = await fetchAll();
  console.log(`   총 ${records.length}건 수신\n`);

  // 4. 임포트
  console.log('4️⃣  레시피 임포트...');
  let success = 0, skip = 0, error = 0;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const rawTitle = (rec['제목'] ?? '').trim();
    if (!rawTitle) { skip++; continue; }

    // 제목 정리 (블로그형 긴 제목 → 첫 부분만)
    const title = rawTitle.split(/[,，~~！！]/)[0].trim().slice(0, 200);
    if (!title || existingTitles.has(title)) { skip++; continue; }

    const htmlContent = rec['내용'] ?? '';
    const text = stripHtml(htmlContent);

    // 재료 추출
    const ingMatch = text.match(/재료\s*[-:]\s*([^\n]+)/);
    const ingredients = ingMatch ? parseIngredients(ingMatch[1]) : [];

    // 단계 추출
    const steps = parseSteps(text);

    // 이미지 추출 (첫 번째 이미지)
    const imgMatch = htmlContent.match(/src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif))"/i);
    const thumbnail = imgMatch?.[1] ?? null;

    // 설명 (이미지/재료 제외한 첫 단락)
    const descLines = text.split('\n').filter(l => l.length > 20 && !/재료/.test(l));
    const description = (descLines[0] ?? '').slice(0, 300) || `${title}입니다.`;

    try {
      const { data: insertedRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          author_id: ADMIN_USER_ID,
          title,
          description,
          thumbnail_url: thumbnail,
          cuisine_type: 'other',
          dish_type: 'main',
          status: 'published' as const,
        })
        .select('id')
        .single();

      if (recipeError || !insertedRecipe) {
        console.error(`  ❌ [${i + 1}] "${title}": ${recipeError?.message}`);
        error++;
        continue;
      }

      const recipeId = insertedRecipe.id;

      // 재료 삽입
      if (ingredients.length > 0) {
        await supabase.from('recipe_ingredients').insert(
          ingredients.map(ing => ({ ...ing, recipe_id: recipeId }))
        );
      }

      // 단계 삽입
      if (steps.length > 0) {
        await supabase.from('recipe_steps').insert(
          steps.map(s => ({ ...s, recipe_id: recipeId }))
        );
      }

      // 태그 삽입
      await supabase.from('recipe_tags').insert([
        { recipe_id: recipeId, tag: '고수요리비법' },
        { recipe_id: recipeId, tag: '공공데이터' },
      ]);

      existingTitles.add(title);
      success++;
      if (success % 50 === 0) {
        console.log(`  ✅ ${success}/${records.length - skip - error} 완료...`);
      }
    } catch (e) {
      console.error(`  ❌ [${i + 1}] 에러:`, e);
      error++;
    }
  }

  console.log('\n========================================');
  console.log('완료!');
  console.log(`  성공: ${success}건`);
  console.log(`  스킵: ${skip}건`);
  console.log(`  에러: ${error}건`);
  console.log('========================================');
}

main().catch(err => {
  console.error('❌ 스크립트 실패:', err);
  process.exit(1);
});

/**
 * 전북특별자치도_음식만드는법 CSV → 낼름 레시피+팁 임포트
 * data.go.kr ID: 15050012
 * - 레시피: 875건 (음식명, 재료, 설명, 칼로리)
 * - 팁: 팁 컬럼에 데이터 있는 항목 → tip 테이블
 *
 * 실행: npx tsx scripts/import-eumsik-recipes.ts
 */

import { createClient } from '@supabase/supabase-js';
import iconv from 'iconv-lite';
import { readFileSync, existsSync } from 'fs';
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

const CSV_URL = 'https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=FILE_000000001596673&fileDetailSn=1&insertDataPrcus=N';
const CSV_LOCAL_FALLBACK = 'C:/Users/db/Downloads/eumsik2.csv';

// ============================================================
// 타입
// ============================================================

interface EumsikRow {
  연번: string;
  음식명: string;
  내용: string;
  재료: string;
  관련이야기: string;
  칼로리: string;
  재료설명: string;
  재료설치: string;
  팁: string;
}

interface ParsedIngredient {
  ingredient_name: string;
  quantity: number | null;
  unit: string;
  notes: string | null;
  is_optional: boolean;
  display_order: number;
}

// ============================================================
// CSV 파싱 (EUC-KR)
// ============================================================

async function downloadAndParseCsv(): Promise<EumsikRow[]> {
  let buffer: Buffer;

  // 로컬 캐시 파일 우선 사용
  if (existsSync(CSV_LOCAL_FALLBACK)) {
    console.log(`  📂 로컬 파일 사용: ${CSV_LOCAL_FALLBACK}`);
    buffer = readFileSync(CSV_LOCAL_FALLBACK);
  } else {
    console.log('  📥 CSV 다운로드 중...');
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`CSV 다운로드 실패: ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
  }

  const text = iconv.decode(buffer, 'euc-kr');

  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) throw new Error('CSV 비어있음');

  // 헤더 파싱
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  console.log(`  컬럼: ${headers.join(', ')}`);
  console.log(`  총 ${lines.length - 1}행\n`);

  const rows: EumsikRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    // CSV 파싱 (따옴표 처리)
    const cells = parseCsvLine(lines[i]);
    if (cells.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (cells[idx] ?? '').trim(); });
    rows.push(row as unknown as EumsikRow);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ============================================================
// 재료 파싱
// ============================================================

const UNIT_PATTERN = '(g|kg|ml|L|개|큰술|작은술|컵|줌|꼬집|조각|장|포기|대|모|마리|쪽|톨|줄기|cm|mm|송이|봉지|팩|통|근|되|홉|스푼|알|T|t|ts|cc|oz)';

function parseIngredients(text: string): ParsedIngredient[] {
  if (!text?.trim()) return [];

  // 소스/양념 등 카테고리 헤더 처리
  // "파재료- 쪽파, 국물재료-마른 새우..." 형태를 처리
  const cleaned = text.replace(/[가-힣]+재료\s*[-:]\s*/g, ',');

  const parts = cleaned.split(/[,，]/).map(s => s.trim()).filter(s => s && s.length <= 60);
  const ingredients: ParsedIngredient[] = [];

  for (const part of parts) {
    if (!part) continue;
    const unitRegex = new RegExp(`^(.+?)\\s+(\\d+\\.?\\d*(?:\\/\\d+)?)\\s*${UNIT_PATTERN}(.*)$`);
    const match = part.match(unitRegex);

    if (match) {
      const raw = match[2];
      const qty = raw.includes('/') ? parseFloat(raw.split('/')[0]) / parseFloat(raw.split('/')[1]) : parseFloat(raw);
      ingredients.push({
        ingredient_name: match[1].trim(),
        quantity: isNaN(qty) ? null : qty,
        unit: match[3],
        notes: null,
        is_optional: false,
        display_order: ingredients.length + 1,
      });
    } else {
      const simpleMatch = part.match(/^(.+?)\s+(약간|적당량|조금|소량|적당히|한줌|조금씩)(.*)$/);
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
// 칼로리 파싱
// ============================================================

function parseCalories(text: string): number | null {
  if (!text?.trim()) return null;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// ============================================================
// 메인
// ============================================================

async function main() {
  console.log('========================================');
  console.log('음식만드는법 레시피+팁 임포트');
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

  // 2. 기존 제목 목록
  const { data: existingRows } = await supabase.from('recipes').select('title');
  const existingTitles = new Set((existingRows || []).map((r: { title: string }) => r.title.trim()));
  console.log(`2️⃣  기존 레시피 수: ${existingTitles.size}개\n`);

  // 3. CSV 다운로드
  console.log('3️⃣  CSV 다운로드 및 파싱...');
  const rows = await downloadAndParseCsv();

  // 4. 레시피 임포트
  console.log('4️⃣  레시피 임포트...');
  let recipeSuccess = 0, recipeSkip = 0, recipeError = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const title = (row['음식명'] ?? '').trim();
    if (!title) { recipeSkip++; continue; }
    if (existingTitles.has(title)) { recipeSkip++; continue; }

    const description = (row['내용'] ?? '').trim() || null;
    const calories = parseCalories(row['칼로리'] ?? '');
    const ingredients = parseIngredients(row['재료'] ?? '');

    try {
      const { data: insertedRecipe, error: recipeError2 } = await supabase
        .from('recipes')
        .insert({
          author_id: ADMIN_USER_ID,
          title,
          description,
          cuisine_type: 'korean',
          dish_type: 'other',
          is_published: true,
          calories,
        })
        .select('id')
        .single();

      if (recipeError2 || !insertedRecipe) {
        console.error(`  ❌ [${i + 1}] "${title}": ${recipeError2?.message}`);
        recipeError++;
        continue;
      }

      const recipeId = insertedRecipe.id;

      // 재료 삽입
      if (ingredients.length > 0) {
        await supabase.from('recipe_ingredients').insert(
          ingredients.map(ing => ({ ...ing, recipe_id: recipeId }))
        );
      }

      // 설명이 있으면 단계 1로 저장
      if (description) {
        await supabase.from('recipe_steps').insert({
          recipe_id: recipeId,
          step_number: 1,
          instruction: description.slice(0, 2000),
          image_url: null,
          timer_minutes: null,
          tip: null,
        });
      }

      // 태그
      await supabase.from('recipe_tags').insert([
        { recipe_id: recipeId, tag: '전통음식' },
        { recipe_id: recipeId, tag: '한식' },
        { recipe_id: recipeId, tag: '공공데이터' },
      ]);

      existingTitles.add(title);
      recipeSuccess++;
      if (recipeSuccess % 100 === 0) {
        console.log(`  ✅ 레시피 ${recipeSuccess}건 완료...`);
      }
    } catch (e) {
      console.error(`  ❌ [${i + 1}] 에러:`, e);
      recipeError++;
    }
  }

  console.log(`\n  레시피 - 성공: ${recipeSuccess}건, 스킵: ${recipeSkip}건, 에러: ${recipeError}건\n`);

  // 5. 팁 임포트
  console.log('5️⃣  팁 임포트...');
  let tipSuccess = 0, tipSkip = 0;

  for (const row of rows) {
    const tipText = (row['팁'] ?? '').trim();
    const foodName = (row['음식명'] ?? '').trim();
    if (!tipText || !foodName) { tipSkip++; continue; }

    const tipTitle = `${foodName} - 요리 팁`;

    try {
      const { data: insertedTip, error: tipError } = await supabase
        .from('tip')
        .insert({
          author_id: ADMIN_USER_ID,
          title: tipTitle.slice(0, 200),
          description: tipText.slice(0, 1000),
          category: '요리팁',
          is_public: true,
        })
        .select('id')
        .single();

      if (tipError || !insertedTip) {
        tipSkip++;
        continue;
      }

      // 팁 단계 삽입
      await supabase.from('tip_steps').insert({
        tip_id: insertedTip.id,
        step_number: 1,
        instruction: tipText.slice(0, 2000),
        tip: null,
        image_url: null,
      });

      // 팁 태그
      await supabase.from('tip_tags').insert([
        { tip_id: insertedTip.id, tag: '요리팁' },
        { tip_id: insertedTip.id, tag: foodName },
        { tip_id: insertedTip.id, tag: '공공데이터' },
      ]);

      tipSuccess++;
    } catch {
      tipSkip++;
    }
  }

  console.log(`  팁 - 성공: ${tipSuccess}건, 스킵: ${tipSkip}건`);

  console.log('\n========================================');
  console.log('완료!');
  console.log(`  레시피: ${recipeSuccess}건 추가`);
  console.log(`  팁: ${tipSuccess}건 추가`);
  console.log('========================================');
}

main().catch(err => {
  console.error('❌ 스크립트 실패:', err);
  process.exit(1);
});

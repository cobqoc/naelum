/**
 * 한식진흥원 아카이브 레시피 215개 → 낼름 레시피 임포트 (Draft)
 * 재료 목록은 있으나 레시피명이 없어 주재료 기반으로 제목 생성
 * is_published = false (비공개 draft)
 *
 * 실행: npx tsx scripts/import-hansik-recipes.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
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

const JSON_PATH = join(__dirname, '..', 'lib', 'data', 'hansik-recipe-groups.json');

// ============================================================
// 타입
// ============================================================

interface ParsedAmount {
  quantity: number | null;
  unit: string;
  notes: string | null;
}

interface RecipeGroup {
  recipeId: number;
  ingredients: Array<{
    name: string;
    amount: string;
    displayOrder: number;
    parsed: ParsedAmount;
  }>;
}

// ============================================================
// 메인
// ============================================================

async function main() {
  console.log('========================================');
  console.log('한식진흥원 아카이브 레시피 임포트 (Draft)');
  console.log('========================================\n');

  // 1. JSON 파일 읽기
  console.log('1️⃣  레시피 그룹 JSON 로드...');
  let groups: RecipeGroup[];
  try {
    groups = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));
  } catch {
    console.error('❌ JSON 파일 읽기 실패:', JSON_PATH);
    console.error('   먼저 npx tsx scripts/import-hansik-ingredients.ts 를 실행해주세요.');
    process.exit(1);
  }
  console.log(`   ${groups.length}개 레시피 그룹 로드됨\n`);

  // 2. 관리자 로그인
  console.log('2️⃣  관리자 로그인...');
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

  // 3. 기존 제목 목록 (중복 방지)
  const { data: existingRows } = await supabase.from('recipes').select('title');
  const existingTitles = new Set((existingRows || []).map((r: { title: string }) => r.title.trim()));
  console.log(`3️⃣  기존 레시피 수: ${existingTitles.size}개\n`);

  // 4. 임포트
  console.log('4️⃣  Draft 레시피 임포트...');
  let success = 0, skip = 0, error = 0;

  for (const group of groups) {
    // 주재료(분류=1) 기반 제목 생성
    const sortedIngs = [...group.ingredients].sort((a, b) => a.displayOrder - b.displayOrder);
    const mainIng = sortedIngs[0]?.name ?? '전통 재료';
    const title = `${mainIng} 전통 요리 (한식진흥원 #${group.recipeId})`;

    if (existingTitles.has(title)) { skip++; continue; }

    try {
      const { data: insertedRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          author_id: ADMIN_USER_ID,
          title,
          description: '한식진흥원 제공 전통 한식 레시피 (연변 조선족·북한 전통음식 아카이브). 레시피명 확보 후 업데이트 예정.',
          cuisine_type: 'korean',
          dish_type: 'other',
          status: 'draft' as const,  // 이름이 임시이므로 비공개
        })
        .select('id')
        .single();

      if (recipeError || !insertedRecipe) {
        console.error(`  ❌ 레시피 #${group.recipeId}: ${recipeError?.message}`);
        error++;
        continue;
      }

      const recipeId = insertedRecipe.id;

      // 재료 삽입
      if (sortedIngs.length > 0) {
        const ingredientRows = sortedIngs.map((ing, idx) => ({
          recipe_id: recipeId,
          ingredient_name: ing.name,
          quantity: ing.parsed.quantity,
          unit: ing.parsed.unit || '선택',
          notes: ing.parsed.notes,
          is_optional: false,
          display_order: idx + 1,
        }));
        await supabase.from('recipe_ingredients').insert(ingredientRows);
      }

      // 태그
      await supabase.from('recipe_tags').insert([
        { recipe_id: recipeId, tag: '한식진흥원' },
        { recipe_id: recipeId, tag: '전통음식' },
        { recipe_id: recipeId, tag: '드래프트' },
        { recipe_id: recipeId, tag: '공공데이터' },
      ]);

      existingTitles.add(title);
      success++;
    } catch (e) {
      console.error(`  ❌ 레시피 #${group.recipeId} 에러:`, e);
      error++;
    }
  }

  console.log('\n========================================');
  console.log('완료!');
  console.log(`  성공: ${success}건 (비공개 draft)`);
  console.log(`  스킵: ${skip}건`);
  console.log(`  에러: ${error}건`);
  console.log('\n  ℹ️  레시피명 확보 후 status=published 로 업데이트하세요.');
  console.log('========================================');
}

main().catch(err => {
  console.error('❌ 스크립트 실패:', err);
  process.exit(1);
});

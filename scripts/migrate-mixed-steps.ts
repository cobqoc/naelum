/**
 * 조리단계에 재료+단계가 혼합된 레시피 파싱 마이그레이션
 *
 * 대상: recipe_ingredients 없는 레시피 (489개)
 * 형식: instruction 필드가 "시간||설명||조리단계||재료||출처" 로 구성된 경우
 *
 * 처리 결과:
 *  - 재료 → recipe_ingredients 테이블에 정상 저장
 *  - 조리단계 → recipe_steps 를 개별 스텝으로 재구성
 *  - 파싱 불가 레시피는 건너뜀 (로그 출력)
 *
 * 실행: npx tsx scripts/migrate-mixed-steps.ts
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================
// 재료 파싱
// ============================================================

interface ParsedIngredient {
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  display_order: number;
}

const UNIT_PATTERN = '(g|kg|ml|L|개|큰술|작은술|컵|줌|꼬집|조각|장|포기|대|모|마리|쪽|톨|줄기|cm|mm|송이|봉지|팩|통|근|되|홉|스푼|알|T|t|ts|cc|oz)';
const APPROX_WORDS = /^(.+?)\s+(약간|적당량|조금|소량|적당히|한줌|조금씩|약간씩)(.*)$/;

// ½ ¼ ¾ 분수 변환
function parseFraction(s: string): number | null {
  const map: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.333, '⅔': 0.667 };
  if (map[s]) return map[s];
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number);
    return b ? a / b : null;
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function parseIngredients(text: string): ParsedIngredient[] {
  if (!text?.trim()) return [];

  // HTML 엔터티 디코드
  const decoded = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8226;/g, '')
    .replace(/&#\d+;/g, '')
    .trim();

  // 양념/소스 카테고리 헤더 제거: "양 념 :" or "소스재료-" 형태
  const cleaned = decoded
    .replace(/[가-힣\s]+재료\s*[-:]\s*/g, ',')
    .replace(/[가-힣\s]+양념\s*[-:]\s*/g, ',')
    .replace(/양\s*념\s*[:：]\s*/g, ',');

  const parts = cleaned
    .split(/[,，]/)
    .map(s => s.trim())
    .filter(s => s && s.length >= 1 && s.length <= 50);

  const ingredients: ParsedIngredient[] = [];

  for (const part of parts) {
    const unitRegex = new RegExp(
      `^(.+?)\\s+([½¼¾⅓⅔]|\\d+\\.?\\d*(?:[/／]\\d+)?)\\s*${UNIT_PATTERN}(.*)$`
    );
    const match = part.match(unitRegex);

    if (match) {
      const qty = parseFraction(match[2]);
      ingredients.push({
        ingredient_name: match[1].trim(),
        quantity: qty,
        unit: match[3],
        notes: null,
        display_order: ingredients.length + 1,
      });
      continue;
    }

    const approxMatch = part.match(APPROX_WORDS);
    if (approxMatch) {
      ingredients.push({
        ingredient_name: approxMatch[1].trim(),
        quantity: null,
        unit: '약간',
        notes: null,
        display_order: ingredients.length + 1,
      });
      continue;
    }

    if (part.length >= 2 && part.length <= 30) {
      ingredients.push({
        ingredient_name: part,
        quantity: null,
        unit: null,
        notes: null,
        display_order: ingredients.length + 1,
      });
    }

    if (ingredients.length >= 30) break;
  }

  return ingredients;
}

// ============================================================
// 조리단계 파싱
// ============================================================

function parseSteps(stepsText: string): string[] {
  if (!stepsText?.trim()) return [];

  // HTML 엔터티 디코드
  const text = stepsText
    .replace(/&#8226;/g, '•')
    .replace(/&#10102;/g, '①').replace(/&#10103;/g, '②').replace(/&#10104;/g, '③')
    .replace(/&#10105;/g, '④').replace(/&#10106;/g, '⑤').replace(/&#10107;/g, '⑥')
    .replace(/&#10108;/g, '⑦').replace(/&#10109;/g, '⑧').replace(/&#10110;/g, '⑨')
    .replace(/&#10111;/g, '⑩')
    .replace(/&amp;/g, '&')
    .trim();

  // 패턴 1: •1. •2. 형식
  if (/•\s*\d+\./.test(text)) {
    return text
      .split(/•\s*\d+\.\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // 패턴 2: ① ② 형식
  if (/[①②③④⑤⑥⑦⑧⑨⑩]/.test(text)) {
    return text
      .split(/[①②③④⑤⑥⑦⑧⑨⑩]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // 패턴 3: 1. 2. 으로 시작하는 줄
  if (/^\d+\./.test(text)) {
    return text
      .split(/(?=\d+\.\s)/)
      .map(s => s.replace(/^\d+\.\s*/, '').trim())
      .filter(s => s.length > 0);
  }

  // 패턴 4: \n 기준 분리
  const byLine = text.split(/\n+/).map(s => s.trim()).filter(s => s.length > 0);
  if (byLine.length > 1) return byLine;

  // 그 외: 통째로 하나의 스텝
  return [text];
}

// ============================================================
// 메인 로직
// ============================================================


async function main() {
  console.log('🔍 재료 없는 레시피 조회 중...\n');

  // 재료 없는 레시피 전체 조회
  // recipes 전체 페이징 조회 (서버 limit 1000 우회)
  const allRecipes: { id: string; title: string }[] = [];
  let recipeFrom = 0;
  while (true) {
    const { data: page, error } = await supabase
      .from('recipes')
      .select('id, title')
      .order('created_at')
      .range(recipeFrom, recipeFrom + 999);
    if (error) throw error;
    if (!page || page.length === 0) break;
    allRecipes.push(...page);
    if (page.length < 1000) break;
    recipeFrom += 1000;
  }
  const recipes = allRecipes;

  // 재료 있는 recipe_id 목록 페이징으로 전체 조회 (기본 limit 1000 우회)
  const withIngrSet = new Set<string>();
  let from = 0;
  while (true) {
    const { data: page } = await supabase
      .from('recipe_ingredients')
      .select('recipe_id')
      .range(from, from + 999);
    if (!page || page.length === 0) break;
    page.forEach(r => withIngrSet.add(r.recipe_id));
    if (page.length < 1000) break;
    from += 1000;
  }

  const targets = (recipes ?? []).filter(r => !withIngrSet.has(r.id));

  console.log(`전체 레시피 조회 수: ${recipes?.length}`);
  console.log(`재료 있는 recipe_id 수: ${withIngrSet.size}`);
  console.log(`대상 레시피: ${targets.length}개\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const recipe of targets) {
    // 해당 레시피 스텝 가져오기
    const { data: steps } = await supabase
      .from('recipe_steps')
      .select('id, recipe_id, step_number, instruction, tip')
      .eq('recipe_id', recipe.id)
      .order('step_number');

    if (!steps || steps.length === 0) {
      skipCount++;
      continue;
    }

    // || 포함된 스텝 찾기
    const pipedSteps = steps.filter(s => s.instruction.includes('||'));
    if (pipedSteps.length === 0) {
      skipCount++;
      continue;
    }

    // 재료 텍스트 추출:
    // 마지막 ||포함 스텝에서 ingredients 파트 찾기
    let ingredientsText = '';
    let descriptionText = '';
    let cookStepsText = '';

    // 단일 스텝 5파트 형식 우선 처리
    if (steps.length === 1 && pipedSteps.length === 1) {
      const parts = steps[0].instruction.split('||');
      if (parts.length >= 4) {
        // 형식: 시간||설명||조리단계||재료||출처
        descriptionText = (parts[1] ?? '').trim();
        cookStepsText   = (parts[2] ?? '').trim();
        ingredientsText = (parts[3] ?? '').trim();
      } else if (parts.length === 3) {
        // 형식: 시간||조리단계||재료 (설명 없음)
        cookStepsText   = (parts[1] ?? '').trim();
        ingredientsText = (parts[2] ?? '').trim();
      }
    } else {
      // 멀티스텝: 마지막 ||포함 스텝에서 재료 추출
      const lastPiped = pipedSteps[pipedSteps.length - 1];
      const parts = lastPiped.instruction.split('||');
      // 재료는 출처(푸드조아) 바로 앞 파트
      if (parts.length >= 3) {
        ingredientsText = parts[parts.length - 2].trim();
      } else if (parts.length === 2) {
        ingredientsText = parts[0].trim();
      }
    }

    const ingredients = parseIngredients(ingredientsText);
    if (ingredients.length === 0) {
      console.log(`  ⚠️  재료 파싱 실패: ${recipe.title}`);
      skipCount++;
      continue;
    }

    // 조리단계 파싱 (단일 스텝인 경우만 재구성, 멀티스텝은 클린업만)
    let newSteps: Array<{ step_number: number; instruction: string; tip: string | null }> = [];

    if (steps.length === 1) {
      const parsedStepTexts = parseSteps(cookStepsText);
      if (parsedStepTexts.length > 0) {
        newSteps = parsedStepTexts.map((text, i) => ({
          step_number: i + 1,
          instruction: text,
          tip: i === 0 && descriptionText ? descriptionText : null,
        }));
      } else {
        // 조리단계 파싱 실패 시 원본 유지하되 재료만 추출
        newSteps = [{
          step_number: 1,
          instruction: cookStepsText || steps[0].instruction,
          tip: descriptionText || null,
        }];
      }
    } else {
      // 멀티스텝: 각 스텝에서 || 이후 재료/출처 제거
      newSteps = steps.map(s => {
        let cleaned = s.instruction;
        if (s.instruction.includes('||')) {
          const parts = s.instruction.split('||');
          // 재료/출처 파트 제거 (마지막 || 이후 제거)
          // 단계 텍스트는 첫 번째 비어있지 않은 파트
          cleaned = parts
            .slice(0, parts.length >= 3 ? parts.length - 2 : 1)
            .map(p => p.trim())
            .filter(p => p.length > 0)
            .join(' ');
        }
        // HTML 엔터티 정리
        cleaned = cleaned
          .replace(/&#8226;/g, '•')
          .replace(/&#10102;/g, '①').replace(/&#10103;/g, '②').replace(/&#10104;/g, '③')
          .replace(/&#10105;/g, '④').replace(/&#10106;/g, '⑤').replace(/&#10107;/g, '⑥')
          .replace(/&#10108;/g, '⑦').replace(/&#10109;/g, '⑧').replace(/&#10110;/g, '⑨')
          .replace(/&#10111;/g, '⑩')
          .replace(/&amp;/g, '&')
          .trim();
        return {
          step_number: s.step_number,
          instruction: cleaned || s.instruction,
          tip: s.tip,
        };
      });
    }

    // DB 업데이트: 기존 스텝 삭제 후 재삽입
    try {
      // 1) 기존 스텝 삭제
      const { error: delError } = await supabase
        .from('recipe_steps')
        .delete()
        .eq('recipe_id', recipe.id);
      if (delError) throw delError;

      // 2) 새 스텝 삽입
      const stepsToInsert = newSteps
        .filter(s => s.instruction.trim().length > 0)
        .map(s => ({
          recipe_id: recipe.id,
          step_number: s.step_number,
          instruction: s.instruction,
          tip: s.tip,
        }));

      if (stepsToInsert.length === 0) {
        errorCount++;
        console.log(`  ❌ 스텝 없음: ${recipe.title}`);
        continue;
      }

      const { error: stepInsertError } = await supabase
        .from('recipe_steps')
        .insert(stepsToInsert);
      if (stepInsertError) throw stepInsertError;

      // 3) 재료 삽입
      const ingredientsToInsert = ingredients.map(ing => ({
        recipe_id: recipe.id,
        ingredient_name: ing.ingredient_name,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes,
        is_optional: false,
        display_order: ing.display_order,
      }));

      const { error: ingInsertError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert);
      if (ingInsertError) throw ingInsertError;

      successCount++;
      if (successCount % 50 === 0) {
        console.log(`  ✅ ${successCount}개 완료...`);
      }
    } catch (err) {
      errorCount++;
      console.error(`  ❌ 오류 (${recipe.title}):`, err);
    }
  }

  console.log('\n========================================');
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`⏭️  건너뜀: ${skipCount}개 (파싱 불가)`);
  console.log(`❌ 오류: ${errorCount}개`);
  console.log('========================================');

  // 최종 현황
  const { count: remaining } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 전체 레시피: ${remaining}개`);
}

main().catch(console.error);

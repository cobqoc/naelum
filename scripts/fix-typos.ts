/**
 * 레시피 오타 일괄 교정 스크립트
 *
 * 실행: npx tsx scripts/fix-typos.ts
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================
// 오타 교정 사전
// ============================================================

interface TypoRule {
  find: RegExp;
  replace: string;
  desc: string;
  target: 'steps' | 'ingredients' | 'both';
}

const TYPO_RULES: TypoRule[] = [
  // 재료명 띄어쓰기 교정
  { find: /다진마늘/g, replace: '다진 마늘', desc: '다진마늘→다진 마늘', target: 'both' },
  { find: /다진파(?=[,\s\.]|$)/g, replace: '다진 파', desc: '다진파→다진 파', target: 'both' },
  { find: /다진양파/g, replace: '다진 양파', desc: '다진양파→다진 양파', target: 'both' },
  { find: /다진대파/g, replace: '다진 대파', desc: '다진대파→다진 대파', target: 'both' },
  { find: /다진생강/g, replace: '다진 생강', desc: '다진생강→다진 생강', target: 'both' },
  { find: /다진홍고추/g, replace: '다진 홍고추', desc: '다진홍고추→다진 홍고추', target: 'both' },
  { find: /다진청양고추/g, replace: '다진 청양고추', desc: '다진청양고추→다진 청양고추', target: 'both' },

  // 재료명 오타
  { find: /애느타리/g, replace: '느타리', desc: '애느타리→느타리', target: 'both' },
  { find: /에느타리/g, replace: '느타리', desc: '에느타리→느타리', target: 'both' },

  // 다중 공백
  { find: /  +/g, replace: ' ', desc: '다중 공백 제거', target: 'both' },

  // 깨진 유니코드
  { find: /�/g, replace: '', desc: '깨진 문자 제거', target: 'both' },

  // 끝자리 알파벳 (혹시 남은 것)
  { find: /([가-힣\.])([a-z])$/gi, replace: '$1', desc: '끝자리 알파벳 제거', target: 'steps' },

  // 조리 단계 문장 정리
  { find: /\n\s*\n/g, replace: ' ', desc: '불필요한 줄바꿈', target: 'steps' },
];

// ============================================================
// 페이지네이션 유틸
// ============================================================

async function fetchAll(table: string, select: string) {
  const allData: Record<string, unknown>[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(offset, offset + limit - 1);

    if (error) { console.error(`Error fetching ${table}:`, error.message); break; }
    if (!data || data.length === 0) break;

    allData.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }

  return allData;
}

// ============================================================
// 메인 로직
// ============================================================

async function main() {
  console.log('🔧 레시피 오타 교정 스크립트 시작\n');

  // 1. 전체 데이터 가져오기
  console.log('📊 데이터 로딩 중...');
  const steps = await fetchAll('recipe_steps', 'id, instruction');
  const ingredients = await fetchAll('recipe_ingredients', 'id, ingredient_name, notes');
  console.log(`  조리 단계: ${steps.length}개`);
  console.log(`  재료: ${ingredients.length}개\n`);

  // 2. 오타 감지 및 수정
  let stepFixes = 0;
  let ingredientFixes = 0;

  // 2.1 조리 단계 수정
  console.log('🔍 조리 단계 오타 검사 중...');
  for (const step of steps) {
    const original = step.instruction as string;
    let fixed = original;

    for (const rule of TYPO_RULES) {
      if (rule.target === 'ingredients') continue;
      fixed = fixed.replace(rule.find, rule.replace);
      rule.find.lastIndex = 0;
    }

    // 앞뒤 공백 정리
    fixed = fixed.trim();

    if (fixed !== original) {
      const { error } = await supabase
        .from('recipe_steps')
        .update({ instruction: fixed })
        .eq('id', step.id);

      if (error) {
        console.error(`  ❌ step ${step.id}: ${error.message}`);
      } else {
        stepFixes++;
        if (stepFixes <= 5) {
          console.log(`  ✅ "${original.substring(0, 50)}..." → "${fixed.substring(0, 50)}..."`);
        }
      }
    }
  }

  // 2.2 재료명 수정
  console.log('\n🔍 재료명 오타 검사 중...');
  for (const ing of ingredients) {
    const originalName = ing.ingredient_name as string;
    let fixedName = originalName;

    for (const rule of TYPO_RULES) {
      if (rule.target === 'steps') continue;
      fixedName = fixedName.replace(rule.find, rule.replace);
      rule.find.lastIndex = 0;
    }

    fixedName = fixedName.trim();

    if (fixedName !== originalName) {
      const { error } = await supabase
        .from('recipe_ingredients')
        .update({ ingredient_name: fixedName })
        .eq('id', ing.id);

      if (error) {
        console.error(`  ❌ ingredient ${ing.id}: ${error.message}`);
      } else {
        ingredientFixes++;
        if (ingredientFixes <= 5) {
          console.log(`  ✅ "${originalName}" → "${fixedName}"`);
        }
      }
    }
  }

  // 2.3 재료 notes 정리 (혹시 남은 아티팩트)
  console.log('\n🔍 재료 메모 정리 중...');
  let notesFixes = 0;
  for (const ing of ingredients) {
    const notes = ing.notes as string | null;
    if (!notes) continue;

    // 불필요한 notes 패턴 제거
    // 예: "두부구이두부70g(1/5모), 2작은술" 같은 파싱 아티팩트
    const hasArtifact =
      /\d+g\(/.test(notes) ||
      /\d+\/\d+/.test(notes) ||
      /\d+작은술/.test(notes) ||
      /\d+큰술/.test(notes) ||
      notes === '조리 단계에서 사용';

    if (hasArtifact) {
      const { error } = await supabase
        .from('recipe_ingredients')
        .update({ notes: null })
        .eq('id', ing.id);

      if (!error) {
        notesFixes++;
        if (notesFixes <= 3) {
          console.log(`  ✅ notes 제거: "${notes}"`);
        }
      }
    }
  }

  // 3. 결과 요약
  console.log('\n' + '='.repeat(50));
  console.log('📊 오타 교정 결과');
  console.log('='.repeat(50));
  console.log(`✅ 조리 단계 수정: ${stepFixes}건`);
  console.log(`✅ 재료명 수정: ${ingredientFixes}건`);
  console.log(`✅ 재료 메모 정리: ${notesFixes}건`);
  console.log(`📦 총 수정: ${stepFixes + ingredientFixes + notesFixes}건`);
  console.log('='.repeat(50));
}

main().catch(console.error);

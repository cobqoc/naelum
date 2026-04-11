/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';

import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // 1. "전분" 추가재료가 있는 레시피 - 원래 재료에 녹말/전분이 있는지 확인
  console.log('=== "전분" 추가재료 확인 ===\n');
  const { data: starchIngs } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id')
    .eq('ingredient_name', '전분')
    .eq('notes', '조리 단계에서 사용');

  if (starchIngs) {
    for (const item of starchIngs) {
      const { data: recipe } = await supabase.from('recipes').select('title').eq('id', item.recipe_id).single();
      const { data: allIngs } = await supabase.from('recipe_ingredients').select('ingredient_name, notes').eq('recipe_id', item.recipe_id);
      const starchRelated = allIngs?.filter(i => /전분|녹말|감자가루|옥수수/.test(i.ingredient_name));
      console.log(`"${recipe?.title}"`);
      starchRelated?.forEach(i => console.log(`  - ${i.ingredient_name} ${i.notes ? `(${i.notes})` : ''}`));
      console.log('');
    }
  }

  // 2. "다진 마늘" 10개 - 정부 API 원본 재료에 마늘이 정말 없는지 확인
  console.log('\n=== "다진 마늘" 추가재료 확인 ===\n');
  const { data: garlicIngs } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id')
    .eq('ingredient_name', '다진 마늘')
    .eq('notes', '조리 단계에서 사용');

  if (garlicIngs) {
    // API에서 원본 확인
    const res = await fetch('http://openapi.foodsafetykorea.go.kr/api/4ab11cac0b164b9ab055/COOKRCP01/json/1/1000');
    const data = await res.json();
    const allRecipes = data.COOKRCP01?.row || [];

    for (const item of garlicIngs) {
      const { data: recipe } = await supabase.from('recipes').select('title').eq('id', item.recipe_id).single();
      if (!recipe) continue;

      // API에서 같은 이름의 레시피 찾기
      const apiRecipe = allRecipes.find((r: any) => r.RCP_NM === recipe.title);

      console.log(`"${recipe.title}"`);
      if (apiRecipe) {
        console.log(`  API 재료: ${apiRecipe.RCP_PARTS_DTLS.substring(0, 100)}...`);
        const hasGarlic = /마늘/.test(apiRecipe.RCP_PARTS_DTLS);
        console.log(`  원본 재료에 마늘 포함: ${hasGarlic ? 'YES' : 'NO'}`);
      } else {
        console.log('  API에서 찾지 못함');
      }
      console.log('');
    }
  }
}
main();

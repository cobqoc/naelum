import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // "다진 마늘"이 추가재료로 들어간 레시피 찾기
  const { data: extraGarlic } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id, ingredient_name, notes')
    .eq('ingredient_name', '다진 마늘')
    .eq('notes', '조리 단계에서 사용')
    .limit(20);

  if (!extraGarlic || extraGarlic.length === 0) {
    console.log('"다진 마늘" 추가재료 없음');
    return;
  }

  console.log(`"다진 마늘" 추가재료가 있는 레시피: ${extraGarlic.length}개\n`);

  for (const item of extraGarlic.slice(0, 10)) {
    const { data: allIngs } = await supabase
      .from('recipe_ingredients')
      .select('ingredient_name, quantity, unit, notes')
      .eq('recipe_id', item.recipe_id)
      .ilike('ingredient_name', '%마늘%');

    const { data: recipe } = await supabase
      .from('recipes')
      .select('title')
      .eq('id', item.recipe_id)
      .single();

    // 조리 단계도 확인
    const { data: steps } = await supabase
      .from('recipe_steps')
      .select('instruction')
      .eq('recipe_id', item.recipe_id)
      .order('step_number');

    const stepsWithGarlic = steps?.filter(s => /마늘/.test(s.instruction)) || [];

    console.log(`📌 "${recipe?.title}"`);
    console.log('  [재료]');
    allIngs?.forEach(ing => {
      console.log(`    - ${ing.ingredient_name} ${ing.quantity || ''}${ing.unit || ''} ${ing.notes ? `(${ing.notes})` : ''}`);
    });
    if (stepsWithGarlic.length > 0) {
      console.log('  [마늘 관련 조리 단계]');
      stepsWithGarlic.forEach(s => console.log(`    → ${s.instruction.substring(0, 80)}`));
    }
    console.log('');
  }

  // 전체 통계
  const { count } = await supabase
    .from('recipe_ingredients')
    .select('*', { count: 'exact', head: true })
    .eq('ingredient_name', '다진 마늘')
    .eq('notes', '조리 단계에서 사용');

  console.log(`\n총 ${count}개 레시피에 "다진 마늘" 추가재료가 잘못 들어감`);
}
main();

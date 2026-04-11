import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkRecipe(title: string) {
  const { data: recipe } = await supabase
    .from('recipes')
    .select('id, title, servings, prep_time_minutes, cook_time_minutes, difficulty_level')
    .eq('title', title)
    .single();

  if (!recipe) { console.log(`❌ "${title}" 못 찾음\n`); return; }

  const { data: ings } = await supabase
    .from('recipe_ingredients')
    .select('ingredient_name, quantity, unit, notes')
    .eq('recipe_id', recipe.id)
    .order('display_order');

  console.log(`📌 "${recipe.title}"`);
  console.log(`   인분: ${recipe.servings}, 준비: ${recipe.prep_time_minutes ?? 'null'}, 조리: ${recipe.cook_time_minutes ?? 'null'}, 난이도: ${recipe.difficulty_level ?? 'null'}`);
  console.log('   [재료]');
  ings?.forEach(i => {
    const qty = i.quantity ? `${i.quantity}${i.unit}` : i.unit;
    console.log(`     - ${i.ingredient_name} ${qty} ${i.notes ? `(${i.notes})` : ''}`);
  });

  // 마늘 관련 재료 중복 확인
  const garlicIngs = ings?.filter(i => /마늘/.test(i.ingredient_name)) || [];
  if (garlicIngs.length > 1) {
    console.log(`   ⚠️ 마늘 관련 재료 ${garlicIngs.length}개 (중복 가능)`);
  }

  // 전분/녹말 관련 확인
  const starchIngs = ings?.filter(i => /전분|녹말/.test(i.ingredient_name)) || [];
  if (starchIngs.length > 1) {
    console.log(`   ⚠️ 전분/녹말 관련 재료 ${starchIngs.length}개 (중복 가능)`);
  }

  console.log('');
}

async function main() {
  console.log('=== v3 임포트 검증 ===\n');

  await checkRecipe('배추토란국');
  await checkRecipe('부추 배무침');
  await checkRecipe('누룽지 피자');
  await checkRecipe('유자삼치구이');
  await checkRecipe('시금치 우유 소스와 그린매쉬드포테이토');
  await checkRecipe('호박잎다슬기된장국');
  await checkRecipe('양배추두부찜과 양파케첩소스');
  await checkRecipe('모듬탕수');

  // 전체 추가재료 통계
  const { data: extras } = await supabase
    .from('recipe_ingredients')
    .select('ingredient_name')
    .eq('notes', '조리 단계에서 사용');

  console.log('\n📊 추가재료 통계:');
  const counts: Record<string, number> = {};
  extras?.forEach(e => { counts[e.ingredient_name] = (counts[e.ingredient_name] || 0) + 1; });
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => console.log(`  ${name}: ${count}개`));
  console.log(`  총: ${extras?.length || 0}개`);
}
main();

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // 모든 "조리 단계에서 사용" 추가재료 찾기
  const { data: extraIngs } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id, ingredient_name')
    .eq('notes', '조리 단계에서 사용');

  if (!extraIngs) return;

  console.log(`총 "조리 단계에서 사용" 추가재료: ${extraIngs.length}개\n`);

  // 각 추가재료에 대해, 같은 레시피에 비슷한 원래 재료가 있는지 확인
  let duplicateCount = 0;
  const problemRecipes: string[] = [];

  for (const extra of extraIngs) {
    // 같은 레시피의 원래 재료 (추가재료 아닌 것) 조회
    const { data: origIngs } = await supabase
      .from('recipe_ingredients')
      .select('ingredient_name, notes')
      .eq('recipe_id', extra.recipe_id)
      .neq('notes', '조리 단계에서 사용');

    if (!origIngs) continue;

    // 원래 재료 중에 추가재료와 비슷한 것이 있는지 확인
    const extraName = extra.ingredient_name.replace(/\s/g, '').toLowerCase();
    const hasSimilar = origIngs.some(orig => {
      const origName = orig.ingredient_name.replace(/\s/g, '').toLowerCase();
      return origName.includes(extraName) || extraName.includes(origName);
    });

    if (hasSimilar) {
      duplicateCount++;
      const { data: recipe } = await supabase
        .from('recipes')
        .select('title')
        .eq('id', extra.recipe_id)
        .single();

      const similar = origIngs.filter(orig => {
        const origName = orig.ingredient_name.replace(/\s/g, '').toLowerCase();
        return origName.includes(extraName) || extraName.includes(origName);
      });

      const info = `"${recipe?.title}" - 추가: "${extra.ingredient_name}" ↔ 원래: ${similar.map(s => `"${s.ingredient_name}"`).join(', ')}`;
      problemRecipes.push(info);
    }
  }

  console.log(`\n❌ 중복 발견: ${duplicateCount}개\n`);
  problemRecipes.forEach(p => console.log(`  ${p}`));

  // 전체 추가재료 종류별 통계
  console.log('\n\n📊 추가재료 종류별 통계:');
  const counts: Record<string, number> = {};
  for (const extra of extraIngs) {
    counts[extra.ingredient_name] = (counts[extra.ingredient_name] || 0) + 1;
  }
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => console.log(`  ${name}: ${count}개`));
}
main();

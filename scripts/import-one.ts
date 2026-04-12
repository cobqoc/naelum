/**
 * "비타 오이 물김치" (SEQ 2981, 조리단계 있는 버전) 단일 임포트
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_ID = process.env.ADMIN_USER_ID!;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // API에서 SEQ 2981 찾기
  const FOODSAFETY_API_KEY = process.env.FOODSAFETY_API_KEY ?? process.env.DATA_GO_KR_API_KEY!;
  const res = await fetch(`http://openapi.foodsafetykorea.go.kr/api/${FOODSAFETY_API_KEY}/COOKRCP01/json/1/1000`);
  const data = await res.json();
  const all = data.COOKRCP01?.row || [];
  const recipe = all.find((r: { RCP_SEQ: string }) => r.RCP_SEQ === '2981');

  if (!recipe) { console.log('레시피 못 찾음'); return; }

  console.log('=== 찾은 레시피 ===');
  console.log('제목:', recipe.RCP_NM);
  console.log('재료:', recipe.RCP_PARTS_DTLS);
  for (let i = 1; i <= 10; i++) {
    const key = `MANUAL${String(i).padStart(2, '0')}`;
    if (recipe[key]?.trim()) console.log(`${key}: ${recipe[key]}`);
  }

  // 재료 파싱
  const parts = recipe.RCP_PARTS_DTLS.split(/[,\n]/).map((s: string) => s.trim()).filter((s: string) => s);
  const ingredients = parts.filter((p: string) => !/^[●■▶\[【]/.test(p)).map((part: string, idx: number) => {
    const match = part.match(/^(.+?)\s+([\d.\/]+)\s*(g|kg|ml|L|개|큰술|작은술|컵)(.*)$/);
    if (match) {
      return {
        ingredient_name: match[1].trim(),
        quantity: parseFloat(match[2]) || null,
        unit: match[3],
        notes: match[4]?.trim().replace(/^\(/, '').replace(/\)$/, '') || null,
        is_optional: false,
        display_order: idx + 1,
      };
    }
    return { ingredient_name: part.trim(), quantity: null, unit: '선택', notes: null, is_optional: false, display_order: idx + 1 };
  });

  // 조리 단계 파싱
  const steps: { step_number: number; instruction: string; image_url: string | null; timer_minutes: null; tip: null }[] = [];
  for (let i = 1; i <= 20; i++) {
    const key = `MANUAL${String(i).padStart(2, '0')}`;
    const imgKey = `MANUAL_IMG${String(i).padStart(2, '0')}`;
    if (recipe[key]?.trim()) {
      steps.push({
        step_number: steps.length + 1,
        instruction: recipe[key].trim().replace(/^\d+\.\s*/, ''),
        image_url: recipe[imgKey]?.trim() || null,
        timer_minutes: null,
        tip: null,
      });
    }
  }

  console.log(`\n파싱: 재료 ${ingredients.length}개, 단계 ${steps.length}개`);

  // 기존 조리단계 없는 "비타 오이 물김치" 삭제
  const { data: existing } = await supabase
    .from('recipes')
    .select('id')
    .eq('title', '비타 오이 물김치')
    .eq('author_id', ADMIN_ID);

  if (existing && existing.length > 0) {
    for (const ex of existing) {
      const { data: exSteps } = await supabase.from('recipe_steps').select('id').eq('recipe_id', ex.id);
      if (!exSteps || exSteps.length === 0) {
        await supabase.from('recipes').delete().eq('id', ex.id);
        console.log(`🗑️ 조리단계 없는 기존 레시피 삭제: ${ex.id}`);
      }
    }
  }

  // 삽입
  const thumbnailUrl = recipe.ATT_FILE_NO_MK?.trim() || recipe.ATT_FILE_NO_MAIN?.trim() || null;
  const { data: inserted, error: insertError } = await supabase
    .from('recipes')
    .insert({
      author_id: ADMIN_ID,
      title: recipe.RCP_NM,
      description: `${recipe.RCP_NM}입니다.`,
      thumbnail_url: thumbnailUrl,
      servings: null,
      cuisine_type: 'korean',
      dish_type: 'side',
      calories: recipe.INFO_ENG ? Math.round(parseFloat(recipe.INFO_ENG)) : null,
      protein_grams: parseFloat(recipe.INFO_PRO) || null,
      carbs_grams: parseFloat(recipe.INFO_CAR) || null,
      fat_grams: parseFloat(recipe.INFO_FAT) || null,
      sodium_mg: recipe.INFO_NA ? Math.round(parseFloat(recipe.INFO_NA)) : null,
      status: 'published' as const,
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) { console.error('삽입 실패:', insertError.message); return; }
  console.log('\n✅ 레시피 삽입! ID:', inserted.id);

  // 재료
  await supabase.from('recipe_ingredients').insert(ingredients.map((ing: { ingredient_name: string; quantity: number | null; unit: string; notes: string | null; is_optional: boolean; display_order: number }) => ({ recipe_id: inserted.id, ...ing })));
  console.log('✅ 재료 삽입 완료');

  // 단계
  await supabase.from('recipe_steps').insert(steps.map(s => ({ recipe_id: inserted.id, ...s })));
  console.log('✅ 단계 삽입 완료');

  // 태그
  await supabase.from('recipe_tags').insert(
    ['한식', 'KoreanFood', '반찬', 'SideDish', '김치', '물김치'].map(t => ({ recipe_id: inserted.id, tag_name: t }))
  );
  console.log('✅ 태그 삽입 완료');

  console.log('\n🎉 "비타 오이 물김치" (조리단계 있는 버전) 임포트 완료!');
}

main().catch(console.error);

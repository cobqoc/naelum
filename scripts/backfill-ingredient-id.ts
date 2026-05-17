/**
 * user_ingredients.ingredient_id 백필
 *
 * ingredient_id = NULL인 user_ingredients 행을 ingredient_name으로
 * ingredients_master에서 정확 일치 검색해 ingredient_id를 채운다.
 *
 * 목적: ingredient_id=NULL 기존 행 백필 (신규 저장은 resolveIngredientId가 자동 처리).
 *
 * 실행:
 *   dev:  npx tsx scripts/backfill-ingredient-id.ts
 *   prod: npx tsx scripts/backfill-ingredient-id.ts --prod
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';

loadEnvLocal();

const IS_PROD = process.argv.includes('--prod');

const SUPABASE_URL = IS_PROD
  ? process.env.PROD_SUPABASE_URL!
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = IS_PROD
  ? process.env.PROD_SUPABASE_SERVICE_ROLE_KEY!
  : process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('환경변수 누락. .env.local 확인');
    process.exit(1);
  }

  const env = IS_PROD ? 'PROD' : 'DEV';
  console.log(`\n=== user_ingredients.ingredient_id 백필 [${env}] ===\n`);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. ingredients_master 전체 로드 (name → id 맵 구축)
  console.log('ingredients_master 로드 중...');
  const masterMap = new Map<string, string>(); // name → id
  let from = 0;
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from('ingredients_master')
      .select('id, name')
      .range(from, from + PAGE - 1);
    if (error) { console.error(error); process.exit(1); }
    if (!data || data.length === 0) break;
    for (const row of data) masterMap.set(row.name, row.id);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`ingredients_master: ${masterMap.size}개 로드`);

  // 2. ingredient_id = NULL인 user_ingredients 로드
  console.log('ingredient_id=null 행 로드 중...');
  const nullRows: { id: string; ingredient_name: string }[] = [];
  from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('user_ingredients')
      .select('id, ingredient_name')
      .is('ingredient_id', null)
      .range(from, from + PAGE - 1);
    if (error) { console.error(error); process.exit(1); }
    if (!data || data.length === 0) break;
    nullRows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`ingredient_id=null 행: ${nullRows.length}개\n`);

  if (nullRows.length === 0) {
    console.log('백필할 행 없음. 완료.');
    return;
  }

  // 3. 정확 이름 매칭 후 배치 업데이트
  let matched = 0;
  let skipped = 0;

  const BATCH = 50;
  for (let i = 0; i < nullRows.length; i += BATCH) {
    const batch = nullRows.slice(i, i + BATCH);
    for (const row of batch) {
      const masterId = masterMap.get(row.ingredient_name);
      if (!masterId) { skipped++; continue; }

      const { error } = await supabase
        .from('user_ingredients')
        .update({ ingredient_id: masterId })
        .eq('id', row.id);

      if (error) {
        console.error(`UPDATE 실패 [${row.ingredient_name}]:`, error.message);
      } else {
        matched++;
      }
    }
    process.stdout.write(`\r진행: ${Math.min(i + BATCH, nullRows.length)} / ${nullRows.length}`);
  }

  console.log(`\n\n완료:`);
  console.log(`  매핑 성공: ${matched}개`);
  console.log(`  미매핑 (master에 없음): ${skipped}개`);
  console.log(`  커버리지: ${((matched / nullRows.length) * 100).toFixed(1)}%`);
}

main().catch(e => { console.error(e); process.exit(1); });

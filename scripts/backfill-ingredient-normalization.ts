/**
 * 정규화 기반 ingredient_id 백필
 *
 * 목적:
 *   recipe_ingredients.ingredient_id = NULL 행에 대해
 *   재료명 정규화(조리법 접두사 제거 + 별칭)를 적용하여 ingredient_id를 채운다.
 *
 *   예: "다진마늘" → normalize → "마늘" → 마늘 ID
 *       "다진파" → normalize → "대파" → 대파 ID
 *
 * 대상 테이블: recipe_ingredients (--table=recipe 옵션으로 기본)
 *             user_ingredients (--table=user 옵션)
 *
 * 실행:
 *   dev:  npx tsx scripts/backfill-ingredient-normalization.ts
 *   prod: npx tsx scripts/backfill-ingredient-normalization.ts --prod
 *   user: npx tsx scripts/backfill-ingredient-normalization.ts --table=user
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';

loadEnvLocal();

const IS_PROD = process.argv.includes('--prod');
const TABLE = process.argv.find(a => a.startsWith('--table='))?.split('=')[1] ?? 'recipe';
const DRY_RUN = process.argv.includes('--dry-run');

const SUPABASE_URL = IS_PROD
  ? process.env.PROD_SUPABASE_URL!
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = IS_PROD
  ? process.env.PROD_SUPABASE_SERVICE_ROLE_KEY!
  : process.env.SUPABASE_SERVICE_ROLE_KEY!;

// --- 정규화 로직 (lib/ingredients/normalizeIngredientName.ts 복사) ---
const PREP_PREFIXES: string[] = [
  '잘게 썬', '채 썬', '채썬', '잘게', '굵게',
  '다진', '볶은', '구운', '삶은', '데친', '말린', '으깬', '냉동',
];
const ALIASES: Record<string, string> = { '파': '대파', '무우': '무' };

function normalizeIngredientName(name: string): string {
  let n = name.trim();
  for (const prefix of PREP_PREFIXES) {
    if (n.startsWith(prefix)) {
      const rest = n.slice(prefix.length).trim();
      if (rest.length >= 1) { n = rest; break; }
    }
  }
  return ALIASES[n] ?? n;
}
// -------------------------------------------------------------------

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('환경변수 누락. .env.local 확인');
    process.exit(1);
  }

  const env = IS_PROD ? 'PROD' : 'DEV';
  const tableName = TABLE === 'user' ? 'user_ingredients' : 'recipe_ingredients';
  const nameCol = TABLE === 'user' ? 'ingredient_name' : 'ingredient_name';
  console.log(`\n=== 정규화 기반 ingredient_id 백필 [${env}] [${tableName}]${DRY_RUN ? ' [DRY-RUN]' : ''} ===\n`);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. ingredients_master 전체 로드
  console.log('ingredients_master 로드 중...');
  const masterByName = new Map<string, string>(); // name → id
  let from = 0;
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from('ingredients_master')
      .select('id, name')
      .range(from, from + PAGE - 1);
    if (error) { console.error(error); process.exit(1); }
    if (!data || data.length === 0) break;
    for (const row of data) masterByName.set(row.name, row.id);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`ingredients_master: ${masterByName.size}개 로드`);

  // 2. ingredient_id = NULL 행 로드
  console.log(`${tableName} ingredient_id=null 행 로드 중...`);
  const nullRows: { id: string; ingredient_name: string }[] = [];
  from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(tableName)
      .select(`id, ${nameCol}`)
      .is('ingredient_id', null)
      .range(from, from + PAGE - 1);
    if (error) { console.error(error); process.exit(1); }
    if (!data || data.length === 0) break;
    for (const row of data) nullRows.push({ id: row.id, ingredient_name: row[nameCol] });
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`ingredient_id=null 행: ${nullRows.length}개\n`);

  if (nullRows.length === 0) {
    console.log('백필할 행 없음. 완료.');
    return;
  }

  // 3. 정규화 매칭 후 배치 업데이트
  let exactMatched = 0;
  let normalizedMatched = 0;
  let skipped = 0;

  const matchLog: Array<{ name: string; normalized: string; masterId: string; via: string }> = [];

  for (const row of nullRows) {
    const name = row.ingredient_name;
    const normalized = normalizeIngredientName(name);

    let masterId: string | undefined;
    let via = '';

    if (masterByName.has(name)) {
      masterId = masterByName.get(name)!;
      via = 'exact';
      exactMatched++;
    } else if (masterByName.has(normalized)) {
      masterId = masterByName.get(normalized)!;
      via = `normalize(${name}→${normalized})`;
      normalizedMatched++;
    } else {
      skipped++;
      continue;
    }

    matchLog.push({ name, normalized, masterId, via });

    if (!DRY_RUN) {
      const { error } = await supabase
        .from(tableName)
        .update({ ingredient_id: masterId })
        .eq('id', row.id);
      if (error) console.error(`UPDATE 실패 [${name}]:`, error.message);
    }
  }

  if (DRY_RUN) {
    console.log('\n--- 정규화 매칭 미리보기 (상위 50개) ---');
    matchLog.filter(r => r.via.startsWith('normalize')).slice(0, 50).forEach(r => {
      console.log(`  ${r.name} → ${r.normalized}`);
    });
    console.log('--- 미리보기 끝 ---\n');
  }

  const total = nullRows.length;
  const filled = exactMatched + normalizedMatched;
  console.log('\n완료:');
  console.log(`  정확 일치:  ${exactMatched}개`);
  console.log(`  정규화 매칭: ${normalizedMatched}개`);
  console.log(`  미매핑:     ${skipped}개`);
  console.log(`  커버리지:   ${((filled / total) * 100).toFixed(1)}% (${filled}/${total})`);
}

main().catch(e => { console.error(e); process.exit(1); });

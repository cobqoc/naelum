/**
 * 재료 이름 표기를 통일하는 스크립트
 *
 * 사용법:
 *   npx tsx scripts/normalize-ingredients.ts scan          # 불일치 표기 스캔
 *   npx tsx scripts/normalize-ingredients.ts apply         # 정규화 적용
 *   npx tsx scripts/normalize-ingredients.ts apply --dry   # 드라이런 (변경 없이 미리보기)
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * 표기 통일 규칙 (표준명 → 변형 표기들)
 * 양, 단위는 절대 건드리지 않음. 이름 표기만 통일.
 */
const NORMALIZE_MAP: Record<string, string[]> = {
  // 맞춤법 통일
  '고춧가루': ['고추가루', '고추 가루', '고춧 가루'],
  '다진 마늘': ['마늘(다진것)', '마늘 다진것', '다진마늘', '마늘다진것', '마늘(다진)'],
  '다진 생강': ['생강(다진것)', '다진생강', '생강다진것'],
  '후춧가루': ['후추가루', '후추 가루', '후춧 가루'],
  '들깻가루': ['들깨가루', '들깨 가루'],
  '깨소금': ['깨 소금', '참깨소금'],
  '통깨': ['참깨', '볶은 깨'],
  '식용유': ['식용 유', '요리유'],
  '참기름': ['참깨기름', '참기름(참깨기름)'],
  '들기름': ['들깨기름'],
  '진간장': ['진 간장'],
  '국간장': ['국 간장', '조선간장'],
  '굴소스': ['굴 소스'],
  '물엿': ['물 엿', '조청'],
  '올리고당': ['올리고 당'],
  '청양고추': ['청양 고추'],
  '홍고추': ['홍 고추', '빨간고추', '빨간 고추'],
  '청고추': ['청 고추', '풋고추', '풋 고추'],
  '대파': ['대 파'],
  '쪽파': ['쪽 파'],
  '양파': ['양 파'],
  '감자': ['감 자'],
  '당근': ['당 근'],
  '깻잎': ['깨잎', '깻 잎'],
  '부추': ['부 추'],
  '미나리': ['미 나리'],
  '콩나물': ['콩 나물'],
  '숙주나물': ['숙주 나물', '숙주'],
  '두부': ['두 부'],
  '어묵': ['어 묵', '오뎅'],
  '떡볶이떡': ['떡볶이 떡', '떡볶이용 떡', '가래떡'],
};

/**
 * 정규화 대상 찾기
 */
function findNormalization(name: string): string | null {
  const trimmed = name.trim();
  for (const [standard, variants] of Object.entries(NORMALIZE_MAP)) {
    if (variants.some((v) => v === trimmed || v.toLowerCase() === trimmed.toLowerCase())) {
      return standard;
    }
  }
  return null;
}

async function scan() {
  const { data: ingredients, error } = await supabase
    .from('recipe_ingredients')
    .select('id, ingredient_name, recipe_id')
    .order('ingredient_name');

  if (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }

  if (!ingredients || ingredients.length === 0) {
    console.log('재료가 없습니다.');
    return;
  }

  const changes: Array<{ id: string; before: string; after: string }> = [];

  for (const ing of ingredients) {
    const normalized = findNormalization(ing.ingredient_name);
    if (normalized && normalized !== ing.ingredient_name.trim()) {
      changes.push({
        id: ing.id,
        before: ing.ingredient_name,
        after: normalized,
      });
    }
  }

  if (changes.length === 0) {
    console.log('정규화가 필요한 재료가 없습니다.');
    return;
  }

  // 그룹별로 표시
  const grouped: Record<string, Array<{ id: string; before: string }>> = {};
  for (const change of changes) {
    if (!grouped[change.after]) grouped[change.after] = [];
    grouped[change.after].push({ id: change.id, before: change.before });
  }

  console.log(`정규화 대상: ${changes.length}개 재료`);
  console.log('');

  for (const [standard, items] of Object.entries(grouped)) {
    const variants = [...new Set(items.map((i) => i.before))];
    console.log(`"${standard}" ← ${variants.map((v) => `"${v}"`).join(', ')} (${items.length}건)`);
  }

  console.log(`\nCHANGES: ${JSON.stringify(changes.length)}`);
}

async function apply(dryRun: boolean) {
  const { data: ingredients, error } = await supabase
    .from('recipe_ingredients')
    .select('id, ingredient_name, recipe_id')
    .order('ingredient_name');

  if (error || !ingredients) {
    console.error('ERROR:', error?.message || '데이터 없음');
    process.exit(1);
  }

  const changes: Array<{ id: string; before: string; after: string }> = [];

  for (const ing of ingredients) {
    const normalized = findNormalization(ing.ingredient_name);
    if (normalized && normalized !== ing.ingredient_name.trim()) {
      changes.push({ id: ing.id, before: ing.ingredient_name, after: normalized });
    }
  }

  if (changes.length === 0) {
    console.log('정규화가 필요한 재료가 없습니다.');
    return;
  }

  if (dryRun) {
    console.log(`[드라이런] 변경 예정: ${changes.length}건`);
    for (const c of changes.slice(0, 20)) {
      console.log(`  "${c.before}" → "${c.after}"`);
    }
    if (changes.length > 20) console.log(`  ... 외 ${changes.length - 20}건`);
    return;
  }

  let successCount = 0;
  for (const change of changes) {
    const { error: updateError } = await supabase
      .from('recipe_ingredients')
      .update({ ingredient_name: change.after })
      .eq('id', change.id);

    if (!updateError) {
      successCount++;
    } else {
      console.error(`WARNING: "${change.before}" 업데이트 실패:`, updateError.message);
    }
  }

  console.log(`SUCCESS: ${successCount}/${changes.length}개 재료 표기 통일 완료`);
}

async function main() {
  const action = process.argv[2] || 'scan';
  const dryRun = process.argv.includes('--dry');

  switch (action) {
    case 'scan':
      await scan();
      break;
    case 'apply':
      await apply(dryRun);
      break;
    default:
      console.error('사용법: npx tsx scripts/normalize-ingredients.ts [scan|apply] [--dry]');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});

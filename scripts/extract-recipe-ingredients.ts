/**
 * recipe_ingredients에 쓰인 재료명 중 ingredients_master에 없는 것을 추출해서 추가
 *
 * - 조리법 접두어 제거 (다진, 썬, 볶은 등)
 * - 중복·불필요 항목 필터링 (분량 포함, 너무 짧은 것)
 * - 카테고리 자동 분류
 * - dev 먼저 실행 → 확인 후 prod 실행
 *
 * 실행:
 *   npx tsx scripts/extract-recipe-ingredients.ts          # dev
 *   npx tsx scripts/extract-recipe-ingredients.ts --prod   # prod
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

// ============================================================
// 설정
// ============================================================

const isProd = process.argv.includes('--prod');

const SUPABASE_URL = isProd
  ? process.env.NEXT_PUBLIC_SUPABASE_URL_PROD ?? process.env.NEXT_PUBLIC_SUPABASE_URL!
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = isProd
  ? process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
  : process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BATCH_SIZE = 100;

// ============================================================
// 정규화 규칙
// ============================================================

// 조리법 접두어 (제거) — 공백 있는 것 먼저, 없는 것 나중
const COOKING_PREFIXES = [
  '얇게 썬 ', '얇게썬 ', '잘게 썬 ', '잘게썬 ', '편 썬 ', '편썬 ',
  '껍질 벗긴 ', '껍질벗긴 ', '씨 제거한 ', '손질한 ', '손질된 ',
  '다진 ', '썬 ', '볶은 ', '삶은 ', '구운 ', '채 썬 ', '갈은 ',
  '으깬 ', '불린 ', '익힌 ', '데친 ', '튀긴 ', '절인 ',
  // 공백 없는 형태
  '다진', '볶은', '삶은', '구운', '채썬', '갈은', '으깬', '불린', '익힌', '데친', '튀긴', '절인',
];

// 불필요 접미어 (제거)
const NOISE_SUFFIXES = [
  '적당량', '기호에 맞게', '기호에맞게', '약간', '소량', '조금',
  '(선택)', '(선택사항)', '(생략가능)',
];

// 단어가 포함되면 필터링 (불필요 항목)
const FILTER_KEYWORDS = [
  '육수', '물 ', '끓는물', '찬물', '뜨거운물', '소금물',
  '적당량', '기호', '약간', '조금',
];

// 명백히 재료가 아닌 항목
const NOT_INGREDIENTS = new Set([
  '물', '소금 후추', '소금&후추', '소금,후추', '소금 , 후추',
  'A', 'B', 'C', '재료', '끓는물', '찬물',
]);

// ============================================================
// 카테고리 자동 분류
// ============================================================

const CATEGORY_MAP: Array<{ keywords: string[]; category: string }> = [
  { keywords: ['고기', '쇠고기', '소고기', '돼지', '닭', '갈비', '삼겹', '안심', '등심', '목살', '사태', '양지', '항정살', '오리', '양고기', '소힘줄', '소양', '닭다리', '닭가슴', '닭날개', '닭봉', '닭안심'], category: 'meat' },
  { keywords: ['새우', '조개', '오징어', '생선', '해삼', '전복', '굴', '멸치', '꽃게', '대하', '홍합', '낙지', '문어', '꼴뚜기', '가자미', '도미', '광어', '우럭', '참치', '연어', '고등어', '삼치', '갈치', '대구', '명태', '북어', '황태', '조기', '임연수어', '아귀', '바지락', '모시조개', '소라', '꼬막', '다시마', '미역', '김', '톳', '파래', '매생이', '어묵', '젓갈', '액젓', '새우젓', '멸치액젓'], category: 'seafood' },
  { keywords: ['배추', '무', '양파', '마늘', '고추', '파', '시금치', '버섯', '당근', '호박', '감자', '콩나물', '양배추', '가지', '오이', '상추', '깻잎', '부추', '미나리', '쑥갓', '도라지', '고사리', '취나물', '냉이', '달래', '씀바귀', '두릅', '죽순', '연근', '우엉', '셀러리', '토란', '더덕', '인삼', '순무', '비트', '아스파라거스', '브로콜리', '브로컬리', '콜리플라워', '케일', '청경채', '숙주', '토마토', '옥수수', '파프리카', '피망', '단호박', '애호박', '고구마', '새송이버섯', '느타리버섯', '양송이버섯', '양송이', '표고버섯', '팽이버섯', '청피망', '홍피망', '방울토마토', '무순', '치커리', '양상추', '실파', '쪽파', '대파', '완두콩', '우엉'], category: 'veggie' },
  { keywords: ['사과', '배', '감', '귤', '딸기', '포도', '수박', '참외', '복숭아', '살구', '자두', '앵두', '대추', '밤', '잣', '호두', '은행', '유자', '레몬', '오렌지', '키위', '바나나', '망고', '파인애플', '석류', '매실', '블루베리', '라즈베리', '체리'], category: 'fruit' },
  { keywords: ['쌀', '밀가루', '찹쌀', '보리', '면', '국수', '떡', '수제비', '만두피', '당면', '냉면', '칼국수', '메밀', '옥수수가루', '전분', '녹말', '빵가루', '튀김가루', '부침가루', '라이스페이퍼', '식빵'], category: 'grain' },
  { keywords: ['간장', '고추장', '된장', '소금', '설탕', '식초', '참기름', '들기름', '후추', '깨', '겨자', '고춧가루', '카레', '케첩', '마요네즈', '기름', '올리브오일', '올리브유', '식용유', '맛술', '청주', '미림', '미림', '맛간장', '쌈장', '춘장', '굴소스', '물엿', '꿀', '조청', '매실청', '매실액', '고추기름', '들깻가루', '청양고추장', '저염간장', '정종', '흑임자', '흑깨', '백후추', '흰후추', '파슬리가루', '함초소금', '카레가루', '머스터드', '토마토케첩'], category: 'seasoning' },
  { keywords: ['우유', '치즈', '버터', '크림', '요거트', '연유', '생크림', '모짜렐라치즈', '슬라이스치즈', '파마산', '크림치즈', '체다'], category: 'dairy' },
  { keywords: ['달걀', '계란', '메추리알'], category: 'egg' },
  { keywords: ['두부', '순두부', '연두부', '유부'], category: 'soy' },
  { keywords: ['와인', '맥주', '소주', '청주', '화이트와인', '레드와인', '막걸리'], category: 'alcohol' },
];

function categorize(name: string): string {
  for (const { keywords, category } of CATEGORY_MAP) {
    for (const kw of keywords) {
      if (name.includes(kw)) return category;
    }
  }
  return 'other';
}

// ============================================================
// 이름 정규화
// ============================================================

function normalize(raw: string): string | null {
  let name = raw.trim();

  // 너무 짧거나 긴 것 제외 (한국어 1글자는 허용)
  if (name.length < 1 || name.length > 20) return null;
  // 영문·숫자 단일 문자
  if (name.length === 1 && /[A-Za-z0-9]/.test(name)) return null;

  // 명백히 재료가 아닌 것
  if (NOT_INGREDIENTS.has(name)) return null;

  // 숫자나 영문자만 있는 것
  if (/^[0-9A-Za-z\s,\.\(\)\/]+$/.test(name)) return null;

  // 접미어 제거
  for (const suffix of NOISE_SUFFIXES) {
    if (name.endsWith(suffix)) {
      name = name.slice(0, -suffix.length).trim();
    }
  }

  // 접두어 제거
  for (const prefix of COOKING_PREFIXES) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length).trim();
    }
  }

  // 괄호 내용 제거 (예: "소고기(등심)" → "소고기")
  name = name.replace(/\([^)]+\)/g, '').trim();

  // 슬래시 앞 첫 번째 항목만 (예: "소고기/돼지고기" → "소고기")
  if (name.includes('/')) {
    name = name.split('/')[0].trim();
  }

  // 콤마로 구분된 경우 첫 번째만
  if (name.includes(',') || name.includes('，')) {
    name = name.split(/[,，]/)[0].trim();
  }

  // [그룹명] 접두어 제거 (예: "[초고추장] 고추장" → "고추장")
  name = name.replace(/^\[[^\]]+\]\s*/, '').trim();

  // 특수 문자 포함 제거
  if (/[●■▶【】\[\]]/.test(name)) return null;

  // 필터 키워드
  for (const kw of FILTER_KEYWORDS) {
    if (name === kw.trim()) return null;
  }

  // 정규화 후 너무 짧아진 것 (한국어 1글자는 유효 재료명)
  if (name.length < 1) return null;

  return name;
}

// ============================================================
// 메인
// ============================================================

async function main() {
  console.log(`\n🥕 레시피 재료 추출 → ingredients_master 추가`);
  console.log(`📦 대상 DB: ${isProd ? '🔴 PROD' : '🟡 DEV'}\n`);

  if (isProd) {
    console.log('⚠️  프로덕션 DB에 쓰기 작업을 시작합니다. 3초 후 진행...');
    await new Promise(r => setTimeout(r, 3000));
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. recipe_ingredients 전체 재료명 수집
  console.log('📡 recipe_ingredients 재료명 수집 중...');
  const { data: riRows, error: riErr } = await supabase
    .from('recipe_ingredients')
    .select('ingredient_name');

  if (riErr || !riRows) {
    console.error('❌ recipe_ingredients 조회 실패:', riErr?.message);
    process.exit(1);
  }
  console.log(`  → ${riRows.length}건 조회\n`);

  // 2. 기존 ingredients_master 이름 수집
  console.log('📡 ingredients_master 기존 재료 수집 중...');
  const { data: masterRows, error: masterErr } = await supabase
    .from('ingredients_master')
    .select('name, name_ko');

  if (masterErr || !masterRows) {
    console.error('❌ ingredients_master 조회 실패:', masterErr?.message);
    process.exit(1);
  }

  const existingNames = new Set<string>();
  for (const row of masterRows) {
    if (row.name) existingNames.add(row.name.trim());
    if (row.name_ko) existingNames.add(row.name_ko.trim());
  }
  console.log(`  → 기존 ${existingNames.size}개\n`);

  // 3. 정규화 및 신규 재료 추출
  console.log('🔧 재료명 정규화 중...');
  const rawNames = [...new Set(riRows.map(r => r.ingredient_name))];
  const normalized = new Map<string, string>(); // normalized → raw (대표)
  const skipped: string[] = [];

  for (const raw of rawNames) {
    const norm = normalize(raw);
    if (!norm) { skipped.push(raw); continue; }
    if (existingNames.has(norm)) continue; // 이미 있음
    if (!normalized.has(norm)) normalized.set(norm, raw);
  }

  console.log(`  원본: ${rawNames.length}개`);
  console.log(`  스킵(정규화 불가): ${skipped.length}개`);
  console.log(`  신규 추가 대상: ${normalized.size}개\n`);

  if (normalized.size === 0) {
    console.log('✅ 추가할 신규 재료 없음');
    return;
  }

  // 4. 배치 삽입
  console.log('💾 ingredients_master 삽입 중...');
  const toInsert = Array.from(normalized.keys());
  let insertedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const rows = batch.map(name => ({
      name,
      name_ko: name,
      category: categorize(name),
      common_units: '["g", "개"]',
      status: 'approved',
      data_source: 'recipe_extract',
      attribution: '레시피 재료 자동 추출',
    }));

    const { error } = await supabase
      .from('ingredients_master')
      .upsert(rows, { onConflict: 'name', ignoreDuplicates: true });

    if (error) {
      console.error(`  ❌ 배치 ${Math.floor(i / BATCH_SIZE) + 1} 오류:`, error.message);
      errorCount += batch.length;
    } else {
      insertedCount += batch.length;
      process.stdout.write(`\r  진행: ${insertedCount + errorCount}/${toInsert.length}`);
    }
  }

  console.log(`\n\n${'='.repeat(50)}`);
  console.log('📊 결과');
  console.log('='.repeat(50));
  console.log(`✅ 삽입: ${insertedCount}개`);
  console.log(`❌ 오류: ${errorCount}개`);
  console.log(`⏭️  스킵: ${skipped.length}개`);
  console.log('='.repeat(50));

  // 스킵된 항목 샘플 출력
  if (skipped.length > 0) {
    console.log('\n스킵 샘플 (최대 20개):');
    skipped.slice(0, 20).forEach(s => console.log(`  - "${s}"`));
  }
}

main().catch(err => {
  console.error('❌ 스크립트 실패:', err);
  process.exit(1);
});

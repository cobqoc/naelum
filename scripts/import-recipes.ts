/**
 * 식약처(FOODSAFETYKOREA) 공공 레시피 API → 낼름 DB 임포트 스크립트 v2
 *
 * 개선사항:
 * - API에서 제공하지 않는 필드는 null (가짜 데이터 제거)
 * - 조리 단계 분석하여 누락 재료 자동 추출
 * - 전체 1,146개 레시피 페이지네이션 처리
 * - 기존 관리자 레시피 삭제 후 재임포트
 *
 * 실행: npx tsx scripts/import-recipes.ts
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

// ============================================================
// 설정
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

const API_KEY = process.env.FOODSAFETY_API_KEY ?? process.env.DATA_GO_KR_API_KEY!;
const PAGE_SIZE = 1000;

// ============================================================
// 타입 정의
// ============================================================

interface GovRecipe {
  RCP_SEQ: string;
  RCP_NM: string;
  RCP_WAY2: string;
  RCP_PAT2: string;
  INFO_WGT: string;
  INFO_ENG: string;
  INFO_CAR: string;
  INFO_PRO: string;
  INFO_FAT: string;
  INFO_NA: string;
  HASH_TAG: string;
  ATT_FILE_NO_MAIN: string;
  ATT_FILE_NO_MK: string;
  RCP_PARTS_DTLS: string;
  RCP_NA_TIP: string;
  [key: string]: string;
}

interface ParsedIngredient {
  ingredient_name: string;
  quantity: number | null;
  unit: string;
  notes: string | null;
  is_optional: boolean;
  display_order: number;
}

interface ParsedStep {
  step_number: number;
  instruction: string;
  image_url: string | null;
  timer_minutes: number | null;
  tip: string | null;
}

// ============================================================
// 매핑 테이블
// ============================================================

const DISH_TYPE_MAP: Record<string, string> = {
  '반찬': 'side',
  '국&찌개': 'soup',
  '밥': 'rice',
  '일품': 'main',
  '후식': 'dessert',
  '김치': 'side',
  '찜': 'main',
  '조림': 'side',
  '볶음': 'main',
};

const CATEGORY_TAG_MAP: Record<string, string[]> = {
  '반찬': ['반찬', 'SideDish'],
  '국&찌개': ['국물요리', 'Soup'],
  '밥': ['밥요리', 'RiceDish'],
  '일품': ['메인요리', 'MainDish'],
  '후식': ['디저트', 'Dessert'],
  '김치': ['김치', 'Kimchi'],
  '찜': ['찜요리', 'SteamedDish'],
  '조림': ['조림', 'BraisedDish'],
  '볶음': ['볶음요리', 'StirFry'],
};

// 조리 단계에서 감지할 기본 조리 재료 (보수적: 진짜 누락된 기본 재료만)
interface StepIngredientPattern {
  pattern: RegExp;
  name: string;
  aliases: string[];
  notes: string | null;
}

const STEP_INGREDIENT_PATTERNS: StepIngredientPattern[] = [
  { pattern: /소금물|소금\s*약간|소금을|소금으로|소금\s*한/, name: '소금', aliases: ['소금', '천일염', '꽃소금'], notes: null },
  { pattern: /후추|후춧가루/, name: '후추', aliases: ['후추', '후춧가루', '흰후추', '검은후추', '백후추', '흑후추'], notes: null },
  { pattern: /식용유를|식용유\s*두르|식용유에/, name: '식용유', aliases: ['식용유', '기름', '포도씨유', '카놀라유', '해바라기유', '식물성기름'], notes: null },
  { pattern: /올리브유|올리브\s*오일/, name: '올리브유', aliases: ['올리브유', '올리브오일', '올리브'], notes: null },
  { pattern: /참기름을|참기름\s*넣|참기름으로/, name: '참기름', aliases: ['참기름'], notes: null },
  { pattern: /들기름을|들기름\s*두르/, name: '들기름', aliases: ['들기름'], notes: null },
  { pattern: /끓는\s*물|물\s+\d+\s*(ml|컵|L)/, name: '물', aliases: ['물', '육수', '다시마물', '멸치육수'], notes: null },
];

// ============================================================
// 유틸리티 함수
// ============================================================

function parseNumber(value: string): number | null {
  if (!value || !value.trim()) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseIntSafe(value: string): number | null {
  const num = parseNumber(value);
  return num !== null ? Math.round(num) : null;
}

// ============================================================
// 재료명 정규화
// ============================================================

function normalizeIngredientName(name: string): string {
  // "마늘다진것" → "다진 마늘", "양파다진것" → "다진 양파"
  name = name.replace(/(.+?)다진것/, '다진 $1');
  // "쇠고기간것" → "간 쇠고기"
  name = name.replace(/(.+?)간것/, '간 $1');
  // 앞뒤 공백, 불필요한 기호 제거
  name = name.replace(/^[:\s·\-]+|[:\s·\-]+$/g, '').trim();
  return name;
}

// ============================================================
// 재료 파싱
// ============================================================

const UNIT_PATTERN = '(g|kg|ml|L|개|큰술|작은술|컵|줌|꼬집|조각|장|포기|대|모|마리|쪽|톨|줄기|cm|mm|송이|봉지|팩|통|근|되|홉|스푼|알|T|t|ts|cc|oz)';

function parseIngredients(text: string): ParsedIngredient[] {
  if (!text || !text.trim()) return [];

  // HTML 태그 제거 (<br> 등)
  let cleaned = text.replace(/<br\s*\/?>/gi, '\n');

  // 카테고리 헤더를 별도 줄로 분리: "[양념]다진 마늘" → "[양념]\n다진 마늘"
  cleaned = cleaned.replace(/(\[.+?\])\s*(?=[가-힣a-zA-Z])/g, '$1\n');
  cleaned = cleaned.replace(/(●.+?)\s*(?=\n|$)/g, '$1\n');

  // 쉼표 없이 여러 재료가 붙어있는 경우 분리:
  // "대파 2.5g 다진 마늘 1.25g" → "대파 2.5g, 다진 마늘 1.25g"
  const unitGroup = '(?:g|kg|ml|L|개|큰술|작은술|컵|줌|꼬집|조각|장|포기|대|모|마리|쪽|톨|줄기|cm|mm|송이|봉지|팩|통|근|되|홉|스푼|알)';
  cleaned = cleaned.replace(
    new RegExp(`(\\d+\\.?\\d*\\s*${unitGroup})\\s+(?=[가-힣a-zA-Z])`, 'g'),
    '$1, '
  );

  const parts = cleaned.split(/[,\n]/).map(s => s.trim()).filter(s => s);
  const ingredients: ParsedIngredient[] = [];
  let currentCategory: string | null = null;

  for (let part of parts) {
    // "1인분 기준" 같은 설명 스킵
    if (/^\d+인분/.test(part)) continue;

    // 카테고리 헤더 감지: [양념장], ●소스재료, 【주재료】 등
    const categoryMatch = part.match(/^[●■▶\-]\s*(.+?)$/) || part.match(/^\[(.+?)\]$/) || part.match(/^【(.+?)】$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].replace(/재료|:|\s/g, '').trim() || null;
      continue;
    }

    // 카테고리가 재료명에 붙어있는 경우 분리: "[소스소개] 탕수소스:감자녹말가루 7g"
    const inlineCategoryMatch = part.match(/^\[(.+?)\]\s*(.+)$/);
    if (inlineCategoryMatch) {
      currentCategory = inlineCategoryMatch[1].replace(/재료|:|\s/g, '').trim() || null;
      part = inlineCategoryMatch[2];
    }

    // "소스 :" 같은 인라인 카테고리
    const colonCategoryMatch = part.match(/^(.+?)\s*:\s*(.+)$/);
    if (colonCategoryMatch && colonCategoryMatch[1].length <= 10) {
      currentCategory = colonCategoryMatch[1].trim();
      part = colonCategoryMatch[2];
    }

    // 빈 문자열이나 단독 숫자 스킵
    if (!part || /^\d+$/.test(part)) continue;

    // 괄호 안의 대체 분량 표기 제거: "75g(3/4모)" → "75g", "20g(5마리)" → "20g"
    part = part.replace(/\(\d+[\/\d]*\s*[가-힣a-zA-Z]+\)/g, '');
    // 괄호 안의 수량 처리: "다진 마늘(8g)" → "다진 마늘 8g"
    part = part.replace(/\((\d+\.?\d*)\s*(g|kg|ml|L|개|큰술|작은술|컵)\)/, ' $1$2');

    // 탐욕적 매칭: 마지막 수량+단위 앞까지를 이름으로 잡기
    const unitRegex = new RegExp(`^(.+?)\\s+(\\d+\\.?\\d*(?:\\/\\d+)?)\\s*${UNIT_PATTERN}(.*)$`);
    const match = part.match(unitRegex);

    if (match) {
      const name = normalizeIngredientName(match[1].trim());
      const qty = parseFloat(match[2]);
      const unit = match[3];
      // notes에는 카테고리만 넣고 잔여 파싱 아티팩트는 무시
      const notes = currentCategory || null;

      ingredients.push({
        ingredient_name: name,
        quantity: isNaN(qty) ? null : qty,
        unit,
        notes,
        is_optional: false,
        display_order: ingredients.length + 1,
      });
    } else {
      // "약간", "적당량" 등 분리 시도
      const simpleMatch = part.match(/^(.+?)\s+(약간|적당량|조금|소량|적당히|적량|반개|반줌|한줌|조금씩|적당)(.*)$/);
      if (simpleMatch) {
        const name = normalizeIngredientName(simpleMatch[1].trim());
        const notes = currentCategory || null;
        ingredients.push({
          ingredient_name: name,
          quantity: null,
          unit: '선택',
          notes,
          is_optional: false,
          display_order: ingredients.length + 1,
        });
      } else {
        // 파싱 실패 → 전체를 이름으로
        const name = normalizeIngredientName(part.trim());
        if (!name) continue;
        const notes = currentCategory || null;
        ingredients.push({
          ingredient_name: name,
          quantity: null,
          unit: '선택',
          notes,
          is_optional: false,
          display_order: ingredients.length + 1,
        });
      }
    }
  }

  return ingredients;
}

// ============================================================
// 조리 단계에서 누락된 재료 추출
// ============================================================

function extractIngredientsFromSteps(
  steps: ParsedStep[],
  existingIngredients: ParsedIngredient[]
): ParsedIngredient[] {
  const allStepText = steps.map(s => s.instruction).join(' ');
  // 기존 재료명 원본 + 정규화 버전 모두 보관
  const existingNamesNormalized = existingIngredients.map(i => i.ingredient_name.toLowerCase().replace(/\s/g, ''));

  const additionalIngredients: ParsedIngredient[] = [];
  const addedNames = new Set<string>();

  for (const entry of STEP_INGREDIENT_PATTERNS) {
    const { pattern, name, aliases, notes } = entry;
    if (pattern.test(allStepText)) {
      const normalizedName = name.toLowerCase().replace(/\s/g, '');

      // 동의어 + 재료명 자체 모두 포함하여 중복 체크
      const allAliases = [name, ...aliases];
      const alreadyExists = allAliases.some(alias => {
        const normalizedAlias = alias.toLowerCase().replace(/\s/g, '');
        return existingNamesNormalized.some(
          existing => existing.includes(normalizedAlias) || normalizedAlias.includes(existing)
        );
      });

      if (!alreadyExists && !addedNames.has(normalizedName)) {
        addedNames.add(normalizedName);
        additionalIngredients.push({
          ingredient_name: name,
          quantity: null,
          unit: '선택',
          notes: notes || null,
          is_optional: false,
          display_order: existingIngredients.length + additionalIngredients.length + 1,
        });
      }
    }
  }

  return additionalIngredients;
}

// ============================================================
// 조리 단계에서 재료 심층 추출 (재료 목록이 비어있는 레시피용)
// ============================================================

function extractIngredientsFromStepsDeep(steps: ParsedStep[]): ParsedIngredient[] {
  const allText = steps.map(s => s.instruction).join(' ');
  const ingredients: ParsedIngredient[] = [];
  const addedNames = new Set<string>();

  // 수량+단위가 있는 재료 패턴: "물 1컵", "된장 9g", "멸치다시마국물 1컵"
  const qtyPatterns = [
    /([가-힣]+(?:\s[가-힣]+)?)\s+(\d+\.?\d*)\s*(g|kg|ml|L|컵|큰술|작은술|개|쪽|줌|장)/g,
    /([가-힣]+(?:\s[가-힣]+)?)\((\d+\.?\d*)\s*(g|kg|ml|L|컵|큰술|작은술|개|쪽)\)/g,
  ];

  for (const pattern of qtyPatterns) {
    let match;
    while ((match = pattern.exec(allText)) !== null) {
      const name = normalizeIngredientName(match[1].trim());
      const qty = parseFloat(match[2]);
      const unit = match[3];

      // 조리 동사/부사/문장 조각 제외
      if (/^(약|정도|가량|동안|이상|이하|에서|위에|으로|까지|불에서|불로|넣고|넣어|넣은|섞어|볶아|끓여|졸여|데쳐|썰어|자른|만든|풀고|우려|뿌려|입힌|감아)/.test(name)) continue;
      if (name.length <= 1) continue;

      const normalized = name.replace(/\s/g, '').toLowerCase();
      if (!addedNames.has(normalized)) {
        addedNames.add(normalized);
        ingredients.push({
          ingredient_name: name,
          quantity: isNaN(qty) ? null : qty,
          unit,
          notes: null,
          is_optional: false,
          display_order: ingredients.length + 1,
        });
      }
    }
  }

  // 주요 식재료 키워드 감지 (수량 없이 언급되는 것들)
  const foodKeywords = [
    { pattern: /양배추/, name: '양배추' },
    { pattern: /두부/, name: '두부' },
    { pattern: /돼지고기|다진\s*돼지고기/, name: '돼지고기' },
    { pattern: /쇠고기|소고기|다진\s*소고기/, name: '쇠고기' },
    { pattern: /닭고기|닭가슴살/, name: '닭고기' },
    { pattern: /호박잎/, name: '호박잎' },
    { pattern: /다슬기/, name: '다슬기' },
    { pattern: /당근/, name: '당근' },
    { pattern: /양파/, name: '양파' },
    { pattern: /대파|파를/, name: '대파' },
    { pattern: /부추/, name: '부추' },
    { pattern: /배추/, name: '배추' },
    { pattern: /토란/, name: '토란' },
    { pattern: /표고버섯/, name: '표고버섯' },
    { pattern: /느타리버섯/, name: '느타리버섯' },
    { pattern: /팽이버섯/, name: '팽이버섯' },
    { pattern: /달걀|계란/, name: '달걀' },
    { pattern: /감자/, name: '감자' },
    { pattern: /시금치/, name: '시금치' },
    { pattern: /멸치/, name: '멸치' },
    { pattern: /다시마|건다시마/, name: '다시마' },
    { pattern: /된장/, name: '된장' },
    { pattern: /고추장/, name: '고추장' },
    { pattern: /간장/, name: '간장' },
    { pattern: /고춧가루/, name: '고춧가루' },
    { pattern: /토마토케첩|케첩/, name: '토마토케첩' },
    { pattern: /매실액/, name: '매실액' },
    { pattern: /다진\s*마늘|마늘/, name: '마늘' },
    { pattern: /생강/, name: '생강' },
    { pattern: /소금/, name: '소금' },
    { pattern: /설탕/, name: '설탕' },
    { pattern: /후춧가루|후추/, name: '후추' },
    { pattern: /참기름/, name: '참기름' },
    { pattern: /식용유/, name: '식용유' },
    { pattern: /밀가루/, name: '밀가루' },
    { pattern: /깨소금|통깨/, name: '통깨' },
  ];

  for (const { pattern, name } of foodKeywords) {
    if (pattern.test(allText)) {
      const normalized = name.replace(/\s/g, '').toLowerCase();
      if (!addedNames.has(normalized)) {
        addedNames.add(normalized);
        ingredients.push({
          ingredient_name: name,
          quantity: null,
          unit: '선택',
          notes: null,
          is_optional: false,
          display_order: ingredients.length + 1,
        });
      }
    }
  }

  return ingredients;
}

// ============================================================
// 조리 단계 파싱
// ============================================================

function parseSteps(recipe: GovRecipe): ParsedStep[] {
  const steps: ParsedStep[] = [];

  for (let i = 1; i <= 20; i++) {
    const stepNum = i.toString().padStart(2, '0');
    const manual = recipe[`MANUAL${stepNum}`];
    const manualImg = recipe[`MANUAL_IMG${stepNum}`];

    if (manual && manual.trim()) {
      let instruction = manual.trim().replace(/^\d+\.\s*/, '');
      // 식약처 API 데이터의 끝에 붙은 의미 없는 알파벳 제거 (예: "건진다.a" → "건진다.")
      instruction = instruction.replace(/[a-zA-Z]$/, '').trim();

      steps.push({
        step_number: steps.length + 1,
        instruction,
        image_url: manualImg && manualImg.trim() ? manualImg.trim() : null,
        timer_minutes: null,
        tip: null,
      });
    }
  }

  return steps;
}

// ============================================================
// 태그 생성
// ============================================================

function generateTags(recipe: GovRecipe): string[] {
  const tags: string[] = ['한식', 'KoreanFood'];

  const categoryTags = CATEGORY_TAG_MAP[recipe.RCP_PAT2];
  if (categoryTags) {
    tags.push(...categoryTags);
  }

  if (recipe.RCP_WAY2 && recipe.RCP_WAY2.trim()) {
    tags.push(recipe.RCP_WAY2.trim());
  }

  if (recipe.HASH_TAG) {
    const hashTags = recipe.HASH_TAG
      .split('#')
      .map(t => t.trim())
      .filter(t => t && !tags.includes(t));
    tags.push(...hashTags);
  }

  return [...new Set(tags)].slice(0, 10);
}

// ============================================================
// API 호출 (페이지네이션)
// ============================================================

async function fetchAllRecipes(): Promise<GovRecipe[]> {
  const allRecipes: GovRecipe[] = [];

  // 첫 번째 호출로 전체 개수 확인
  console.log('📡 식약처 API 호출 중 (1/2)...');
  const url1 = `http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/COOKRCP01/json/1/${PAGE_SIZE}`;
  const res1 = await fetch(url1);
  const data1 = await res1.json();

  if (data1.COOKRCP01?.RESULT?.CODE !== 'INFO-000') {
    throw new Error(`API 오류: ${data1.COOKRCP01?.RESULT?.MSG}`);
  }

  const totalCount = parseInt(data1.COOKRCP01.total_count, 10);
  const batch1 = data1.COOKRCP01.row || [];
  allRecipes.push(...batch1);
  console.log(`  → ${batch1.length}개 수신 (전체: ${totalCount}개)`);

  // 나머지 페이지 호출
  if (totalCount > PAGE_SIZE) {
    console.log('📡 식약처 API 호출 중 (2/2)...');
    const url2 = `http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/COOKRCP01/json/${PAGE_SIZE + 1}/${totalCount}`;
    const res2 = await fetch(url2);
    const data2 = await res2.json();

    if (data2.COOKRCP01?.RESULT?.CODE === 'INFO-000') {
      const batch2 = data2.COOKRCP01.row || [];
      allRecipes.push(...batch2);
      console.log(`  → ${batch2.length}개 추가 수신`);
    }
  }

  console.log(`✅ 총 ${allRecipes.length}개 레시피 수신 완료\n`);
  return allRecipes;
}

// ============================================================
// 메인 로직
// ============================================================

async function main() {
  console.log('🚀 낼름 레시피 임포트 v2 시작\n');

  // 1. 관리자 로그인
  console.log('📋 관리자 계정 로그인 중...');
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (authError || !authData.user) {
    console.error('❌ 관리자 로그인 실패:', authError?.message);
    process.exit(1);
  }

  const ADMIN_USER_ID = authData.user.id;
  console.log(`✅ 관리자 UUID: ${ADMIN_USER_ID}\n`);

  // 2. Service Role 클라이언트 생성
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 3. 기존 관리자 레시피 전체 삭제
  console.log('🗑️ 기존 관리자 레시피 삭제 중...');
  const { data: existingRecipes } = await supabase
    .from('recipes')
    .select('id')
    .eq('author_id', ADMIN_USER_ID);

  const existingCount = existingRecipes?.length || 0;
  if (existingCount > 0) {
    const { error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('author_id', ADMIN_USER_ID);

    if (deleteError) {
      console.error('❌ 삭제 실패:', deleteError.message);
      process.exit(1);
    }
    console.log(`✅ 기존 ${existingCount}개 레시피 삭제 완료\n`);
  } else {
    console.log('✅ 삭제할 레시피 없음\n');
  }

  // 4. 전체 API 호출
  const recipes = await fetchAllRecipes();

  // 5. 각 레시피 변환 및 삽입
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let extraIngredientCount = 0;
  const startTime = Date.now();

  for (let idx = 0; idx < recipes.length; idx++) {
    const recipe = recipes[idx];

    try {
      const title = recipe.RCP_NM?.trim();
      if (!title) {
        skipCount++;
        continue;
      }

      // 재료, 단계, 태그 파싱
      const baseIngredients = parseIngredients(recipe.RCP_PARTS_DTLS);
      const steps = parseSteps(recipe);
      const tags = generateTags(recipe);

      // 조리 단계가 없으면 스킵
      if (steps.length === 0) {
        console.log(`  ⏭️ [${idx + 1}/${recipes.length}] 조리 단계 없음: "${title}"`);
        skipCount++;
        continue;
      }

      // 재료 추출: 원본 재료가 비어있으면 조리 단계에서 심층 추출
      let allIngredients: ParsedIngredient[];
      if (baseIngredients.length === 0) {
        allIngredients = extractIngredientsFromStepsDeep(steps);
        extraIngredientCount += allIngredients.length;
      } else {
        const additionalIngredients = extractIngredientsFromSteps(steps, baseIngredients);
        allIngredients = [...baseIngredients, ...additionalIngredients];
        extraIngredientCount += additionalIngredients.length;
      }

      // 썸네일 이미지
      const thumbnailUrl =
        (recipe.ATT_FILE_NO_MK?.trim()) ||
        (recipe.ATT_FILE_NO_MAIN?.trim()) ||
        null;

      // 설명 생성 (RCP_NA_TIP은 나트륨 팁이므로 설명으로 부적절)
      const cookingMethod = recipe.RCP_WAY2?.trim();
      const category = recipe.RCP_PAT2?.trim();
      const descParts = [cookingMethod, category].filter(Boolean);
      const description = descParts.length > 0
        ? `${descParts.join(' 방식의 ')} 요리, ${title}입니다.`
        : `${title}입니다.`;

      // 5.1 recipes 테이블 삽입
      const { data: insertedRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          author_id: ADMIN_USER_ID,
          title,
          description,
          thumbnail_url: thumbnailUrl,
          servings: null,
          prep_time_minutes: null,
          cook_time_minutes: null,
          difficulty_level: null,
          cuisine_type: 'korean',
          dish_type: DISH_TYPE_MAP[recipe.RCP_PAT2] || 'other',
          meal_type: null,
          calories: parseIntSafe(recipe.INFO_ENG),
          protein_grams: parseNumber(recipe.INFO_PRO),
          carbs_grams: parseNumber(recipe.INFO_CAR),
          fat_grams: parseNumber(recipe.INFO_FAT),
          sodium_mg: parseIntSafe(recipe.INFO_NA),
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (recipeError || !insertedRecipe) {
        console.error(`  ❌ [${idx + 1}/${recipes.length}] "${title}": ${recipeError?.message}`);
        errorCount++;
        continue;
      }

      const recipeId = insertedRecipe.id;

      // 5.2 recipe_ingredients 삽입
      if (allIngredients.length > 0) {
        const ingredientRows = allIngredients.map(ing => ({
          recipe_id: recipeId,
          ingredient_name: ing.ingredient_name,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
          is_optional: ing.is_optional,
          display_order: ing.display_order,
        }));

        const { error: ingError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientRows);

        if (ingError) {
          console.warn(`  ⚠️ 재료 경고 "${title}": ${ingError.message}`);
        }
      }

      // 5.3 recipe_steps 삽입
      const stepRows = steps.map(step => ({
        recipe_id: recipeId,
        step_number: step.step_number,
        instruction: step.instruction,
        image_url: step.image_url,
        timer_minutes: step.timer_minutes,
        tip: step.tip,
      }));

      const { error: stepError } = await supabase
        .from('recipe_steps')
        .insert(stepRows);

      if (stepError) {
        console.warn(`  ⚠️ 단계 경고 "${title}": ${stepError.message}`);
      }

      // 5.4 recipe_tags 삽입
      if (tags.length > 0) {
        const tagRows = tags.map(tag => ({
          recipe_id: recipeId,
          tag_name: tag,
        }));

        const { error: tagError } = await supabase
          .from('recipe_tags')
          .insert(tagRows);

        if (tagError) {
          console.warn(`  ⚠️ 태그 경고 "${title}": ${tagError.message}`);
        }
      }

      successCount++;

      // 진행률 표시 (50개마다)
      if (successCount % 50 === 0 || successCount === 1) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const extraCount = allIngredients.length - baseIngredients.length;
        const extra = extraCount > 0 ? ` (+${extraCount} 추가재료)` : '';
        console.log(`  ✅ [${idx + 1}/${recipes.length}] "${title}" (재료: ${allIngredients.length}개${extra}, 단계: ${steps.length}개) [${elapsed}초]`);
      }

    } catch (err) {
      console.error(`  ❌ [${idx + 1}/${recipes.length}] 예외: "${recipe.RCP_NM}": ${err}`);
      errorCount++;
    }
  }

  // 6. 결과 요약
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('📊 임포트 결과 요약');
  console.log('='.repeat(60));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`⏭️ 스킵: ${skipCount}개`);
  console.log(`❌ 실패: ${errorCount}개`);
  console.log(`📦 총 처리: ${recipes.length}개`);
  console.log(`🔍 조리단계에서 추출한 추가 재료: ${extraIngredientCount}개`);
  console.log(`⏱️ 소요 시간: ${totalTime}초`);
  console.log('='.repeat(60));
}

main().catch(console.error);

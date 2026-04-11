/**
 * 한식진흥원 아카이브 레시피 API → 낼름 ingredients_master 임포트 스크립트
 *
 * - API에서 2,033건의 재료 데이터를 가져와 고유 재료명 추출
 * - ingredients_master 테이블에 신규 재료 추가
 * - 레시피-재료 그룹 데이터를 JSON 파일로 저장
 *
 * 실행: npx tsx scripts/import-hansik-ingredients.ts
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

// ============================================================
// 설정
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const HANSIK_API_BASE = 'https://api.odcloud.kr/api/15136607/v1/uddi:307127d7-e398-458e-a0e8-d805edd6ef76';
const API_KEY = process.env.DATA_GO_KR_API_KEY!;
const PAGE_SIZE = 500;
const DELAY_MS = 500;

const ATTRIBUTION = '한식진흥원 제공 (공공데이터포털, data.go.kr)';
const DATA_SOURCE = 'hansik_api';

// ============================================================
// 타입
// ============================================================

interface HansikApiResponse {
  currentCount: number;
  data: HansikRecord[];
  matchCount: number;
  page: number;
  perPage: number;
  totalCount: number;
}

interface HansikRecord {
  내용: string;
  레시피ID: number;
  명칭: string;
  분류: number;
  재료ID: number;
}

interface ParsedAmount {
  quantity: number | null;
  unit: string;
  notes: string | null;
}

interface IngredientInfo {
  name: string;
  category: string;
  commonUnits: string[];
  recipeCount: number;
}

interface RecipeGroup {
  recipeId: number;
  ingredients: Array<{
    name: string;
    amount: string;
    displayOrder: number;
    parsed: ParsedAmount;
  }>;
}

// ============================================================
// 유틸
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 단위 정규식
const AMOUNT_REGEX = /^(\d+\.?\d*(?:\/\d+)?)\s*(kg|g|ml|L|l|개|큰술|작은술|컵|줌|꼬집|조각|장|포기|대|모|마리|쪽|톨|줄기|cm|mm|송이|봉지|팩|통|근|되|홉|스푼|알|T|t|ts|cc|oz|리터|그램|인분)\s*(.*)$/;
const QUALITATIVE_UNITS = ['약간', '적당량', '조금', '소량', '적당히', '충분히', '넉넉히'];

function evalFraction(s: string): number {
  if (s.includes('/')) {
    const [num, den] = s.split('/');
    return parseFloat(num) / parseFloat(den);
  }
  return parseFloat(s);
}

function parseAmount(content: string): ParsedAmount {
  const trimmed = content.trim();

  for (const q of QUALITATIVE_UNITS) {
    if (trimmed === q || trimmed.endsWith(q)) {
      return { quantity: null, unit: q, notes: null };
    }
  }

  let raw = trimmed;
  let parenNote: string | null = null;
  const parenMatch = trimmed.match(/^([^(]+)\(([^)]+)\)(.*)$/);
  if (parenMatch) {
    raw = (parenMatch[1] + parenMatch[3]).trim();
    parenNote = parenMatch[2].trim();
  }

  const m = AMOUNT_REGEX.exec(raw);
  if (m) {
    const quantity = evalFraction(m[1]);
    const unit = m[2];
    const extra = m[3]?.trim() || null;
    const notes = [parenNote, extra].filter(Boolean).join(', ') || null;
    return { quantity, unit, notes };
  }

  const numOnly = raw.match(/^(\d+\.?\d*(?:\/\d+)?)\s*$/);
  if (numOnly) {
    return { quantity: evalFraction(numOnly[1]), unit: '', notes: parenNote };
  }

  return { quantity: null, unit: trimmed, notes: null };
}

// ============================================================
// 카테고리 자동 분류
// ============================================================

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  meat: [
    '고기', '쇠고기', '소고기', '돼지', '닭', '갈비', '삼겹', '안심', '등심',
    '목살', '사태', '양지', '차돌', '수육', '편육', '족발', '내장', '곱창',
    '간', '염통', '허파', '양', '우설', '꼬리', '볼살', '항정살', '갈매기살',
    '오리', '양고기', '토끼', '꿩', '말고기', '노루', '멧돼지',
  ],
  seafood: [
    '새우', '조개', '오징어', '생선', '해삼', '전복', '굴', '멸치', '꽃게',
    '대하', '홍합', '낙지', '문어', '꼴뚜기', '가자미', '도미', '광어', '우럭',
    '참치', '연어', '고등어', '삼치', '갈치', '대구', '명태', '북어', '황태',
    '조기', '임연수', '미역', '다시마', '김', '톳', '파래', '매생이', '어묵',
    '젓갈', '액젓', '까나리', '새우젓', '소라', '바지락', '꼬막', '해파리',
  ],
  veggie: [
    '배추', '무', '양파', '마늘', '고추', '파', '시금치', '버섯', '당근',
    '호박', '감자', '콩나물', '양배추', '가지', '오이', '상추', '깻잎', '부추',
    '미나리', '쑥갓', '도라지', '고사리', '취나물', '냉이', '달래', '씀바귀',
    '두릅', '죽순', '연근', '우엉', '셀러리', '토란', '고구마', '더덕', '인삼',
    '순무', '비트', '아스파라거스', '콩', '팥', '녹두', '피망', '파프리카',
    '브로콜리', '콜리플라워', '케일', '청경채', '숙주', '토마토', '옥수수',
  ],
  fruit: [
    '사과', '배', '감', '귤', '딸기', '포도', '수박', '참외', '복숭아',
    '살구', '자두', '앵두', '대추', '밤', '잣', '호두', '은행', '유자',
    '레몬', '오렌지', '키위', '바나나', '망고', '파인애플', '석류', '매실',
  ],
  grain: [
    '쌀', '밀가루', '찹쌀', '보리', '면', '국수', '떡', '수제비', '만두피',
    '당면', '냉면', '칼국수', '메밀', '옥수수가루', '전분', '녹말', '분탕',
  ],
  seasoning: [
    '간장', '고추장', '된장', '소금', '설탕', '식초', '참기름', '들기름',
    '후추', '깨', '겨자', '고춧가루', '카레', '케첩', '마요네즈', '기름',
    '올리브유', '식용유', '맛술', '청주', '미림', '맛간장', '쌈장', '춘장',
    '굴소스', '물엿', '꿀', '조청', '매실청', '생강', '계피', '팔각',
    '월계수', '정향', '육수', '멸치액젓', '고춧기름', '들깻가루',
  ],
  dairy: [
    '우유', '치즈', '버터', '크림', '요거트', '연유', '생크림',
  ],
};

function categorizeIngredient(name: string): string {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (name.includes(kw)) return category;
    }
  }
  return 'other';
}

// ============================================================
// API 호출
// ============================================================

async function fetchAll(): Promise<HansikRecord[]> {
  const all: HansikRecord[] = [];
  let page = 1;

  while (true) {
    const url = `${HANSIK_API_BASE}?page=${page}&perPage=${PAGE_SIZE}&serviceKey=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API 호출 실패 (${res.status}): ${await res.text()}`);
    }
    const json: HansikApiResponse = await res.json();
    all.push(...json.data);

    console.log(`  📡 페이지 ${page}: ${json.currentCount}건 (${all.length}/${json.totalCount})`);

    if (all.length >= json.totalCount) break;
    page++;
    await sleep(DELAY_MS);
  }

  return all;
}

// ============================================================
// 재료 분석
// ============================================================

function analyzeIngredients(records: HansikRecord[]): {
  ingredients: IngredientInfo[];
  recipeGroups: RecipeGroup[];
} {
  // 재료별 정보 수집
  const ingredientMap = new Map<string, { units: Set<string>; recipeIds: Set<number> }>();
  // 레시피별 그룹
  const recipeMap = new Map<number, RecipeGroup>();

  for (const rec of records) {
    const name = (rec['명칭'] ?? '').trim();
    const amount = (rec['내용'] ?? '').trim();
    if (!name) continue;
    const parsed = parseAmount(amount);

    // 재료 정보 수집
    if (!ingredientMap.has(name)) {
      ingredientMap.set(name, { units: new Set(), recipeIds: new Set() });
    }
    const info = ingredientMap.get(name)!;
    if (parsed.unit && !QUALITATIVE_UNITS.includes(parsed.unit)) {
      info.units.add(parsed.unit);
    }
    info.recipeIds.add(rec['레시피ID']);

    // 레시피 그룹 수집
    const recipeId = rec['레시피ID'];
    if (!recipeMap.has(recipeId)) {
      recipeMap.set(recipeId, { recipeId, ingredients: [] });
    }
    recipeMap.get(recipeId)!.ingredients.push({
      name,
      amount,
      displayOrder: rec['분류'],
      parsed,
    });
  }

  // IngredientInfo 배열 생성
  const ingredients: IngredientInfo[] = [];
  for (const [name, info] of ingredientMap) {
    ingredients.push({
      name,
      category: categorizeIngredient(name),
      commonUnits: Array.from(info.units),
      recipeCount: info.recipeIds.size,
    });
  }

  // 레시피 그룹 정렬
  const recipeGroups = Array.from(recipeMap.values());
  for (const group of recipeGroups) {
    group.ingredients.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  return { ingredients, recipeGroups };
}

// ============================================================
// DB 임포트
// ============================================================

async function importToSupabase(ingredients: IngredientInfo[]): Promise<{
  inserted: number;
  skipped: number;
  errors: number;
}> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // 기존 재료명 가져오기 (중복 체크용)
  const { data: existing } = await supabase
    .from('ingredients_master')
    .select('name, name_ko');

  const existingNames = new Set<string>();
  if (existing) {
    for (const row of existing) {
      if (row.name) existingNames.add(row.name);
      if (row.name_ko) existingNames.add(row.name_ko);
    }
  }
  console.log(`  📦 기존 재료 수: ${existingNames.size}개`);

  // 배치 삽입 (50개씩)
  const BATCH_SIZE = 50;
  const toInsert = ingredients.filter(ing => !existingNames.has(ing.name));
  console.log(`  🆕 신규 재료: ${toInsert.length}개 (기존 중복 ${ingredients.length - toInsert.length}개 스킵)`);

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const rows = batch.map(ing => ({
      name: ing.name,
      name_ko: ing.name,
      category: ing.category,
      common_units: ing.commonUnits.length > 0 ? JSON.stringify(ing.commonUnits) : '["g"]',
      status: 'approved',
      data_source: DATA_SOURCE,
      external_id: ing.name,
      attribution: ATTRIBUTION,
    }));

    const { error } = await supabase
      .from('ingredients_master')
      .upsert(rows, { onConflict: 'name', ignoreDuplicates: true });

    if (error) {
      console.error(`  ❌ 배치 ${Math.floor(i / BATCH_SIZE) + 1} 에러:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`  ✅ 배치 ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length}건 삽입 (${inserted}/${toInsert.length})`);
    }
  }

  skipped = ingredients.length - toInsert.length;
  return { inserted, skipped, errors };
}

// ============================================================
// 레시피 그룹 JSON 저장
// ============================================================

function saveRecipeGroups(groups: RecipeGroup[]): string {
  const dir = join(__dirname, '..', 'lib', 'data');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const filePath = join(dir, 'hansik-recipe-groups.json');
  writeFileSync(filePath, JSON.stringify(groups, null, 2), 'utf-8');
  return filePath;
}

// ============================================================
// 메인
// ============================================================

async function main() {
  console.log('========================================');
  console.log('한식진흥원 아카이브 레시피 재료 임포트');
  console.log('========================================\n');

  // 1. API에서 전체 데이터 가져오기
  console.log('1️⃣  API 데이터 가져오기...');
  const records = await fetchAll();
  console.log(`   총 ${records.length}건 수신\n`);

  // 2. 재료 분석
  console.log('2️⃣  재료 분석...');
  const { ingredients, recipeGroups } = analyzeIngredients(records);
  console.log(`   고유 재료: ${ingredients.length}개`);
  console.log(`   레시피 그룹: ${recipeGroups.length}개\n`);

  // 카테고리별 통계
  const catStats: Record<string, number> = {};
  for (const ing of ingredients) {
    catStats[ing.category] = (catStats[ing.category] || 0) + 1;
  }
  console.log('   카테고리별 분포:');
  for (const [cat, count] of Object.entries(catStats).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${cat}: ${count}개`);
  }
  console.log();

  // 3. DB 임포트
  console.log('3️⃣  Supabase 임포트...');
  const result = await importToSupabase(ingredients);
  console.log(`   삽입: ${result.inserted}건`);
  console.log(`   스킵(중복): ${result.skipped}건`);
  console.log(`   에러: ${result.errors}건\n`);

  // 4. 레시피 그룹 JSON 저장
  console.log('4️⃣  레시피 그룹 JSON 저장...');
  const jsonPath = saveRecipeGroups(recipeGroups);
  console.log(`   저장: ${jsonPath}\n`);

  // 5. 요약
  console.log('========================================');
  console.log('완료!');
  console.log(`  API 레코드: ${records.length}건`);
  console.log(`  고유 재료: ${ingredients.length}개`);
  console.log(`  신규 삽입: ${result.inserted}건`);
  console.log(`  출처: ${ATTRIBUTION}`);
  console.log('========================================');
}

main().catch(err => {
  console.error('❌ 스크립트 실패:', err);
  process.exit(1);
});

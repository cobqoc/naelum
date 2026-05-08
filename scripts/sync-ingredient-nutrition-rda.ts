/**
 * 농촌진흥청 국립식량과학원 국가표준식품성분정보 API → ingredients_master 영양정보 동기화
 *
 * 엔드포인트: https://apis.data.go.kr/1390803/AgriFood/NationStdFood/V2
 * - getKoreanFoodNationStdList     : 식품군별 코드 목록 조회 (파라미터: fd_Grupp, page_No, Page_Size)
 * - getKoreanFoodNationStdIdntList : 코드별 상세 영양성분 조회 (파라미터: food_Code)
 *
 * 식품군: A(곡류) B(감자/전분) C(당류) D(두류) E(견과/종실) F(채소) G(버섯) H(과일)
 *         I(육류) J(난류) K(어패류) L(해조류) M(유제품) N(유지) O(차류) P(음료)
 *         Q(주류) R(조미료) S(조리가공) T(기타) — 총 ~2,900개 항목
 *
 * 전략:
 *  1단계: 전체 식품 목록 다운로드 → scripts/cache/rda-food-list.json 캐시
 *  2단계: ingredients_master 재료명과 매칭
 *  3단계: 매칭된 재료의 영양 상세 조회 후 DB 업데이트
 *
 * 실행:
 *   npx tsx scripts/sync-ingredient-nutrition-rda.ts              # dev, 미매칭만
 *   npx tsx scripts/sync-ingredient-nutrition-rda.ts --overwrite  # dev, 전체 덮어쓰기
 *   npx tsx scripts/sync-ingredient-nutrition-rda.ts --prod       # prod
 *   npx tsx scripts/sync-ingredient-nutrition-rda.ts --download-only  # 목록만 다운로드
 */

import { createClient } from '@supabase/supabase-js';
import { parseStringPromise } from 'xml2js';
import * as fs from 'fs';
import * as path from 'path';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

// ============================================================
// 설정
// ============================================================

const isProd = process.argv.includes('--prod');
const overwrite = process.argv.includes('--overwrite');
const downloadOnly = process.argv.includes('--download-only');

const SUPABASE_URL = isProd
  ? process.env.NEXT_PUBLIC_SUPABASE_URL_PROD ?? process.env.NEXT_PUBLIC_SUPABASE_URL!
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = isProd
  ? process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
  : process.env.SUPABASE_SERVICE_ROLE_KEY!;

const API_KEY = process.env.DATA_GO_KR_API_KEY ?? '';
const BASE = 'https://apis.data.go.kr/1390803/AgriFood/NationStdFood/V2';
const PAGE_SIZE = 20; // API 최대값 20
const DELAY_MS = 400;

// 식품군 코드 A~T (총 ~2,900개)
const FOOD_GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];

const CACHE_DIR = path.join(__dirname, 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'rda-food-list.json');
const PROGRESS_FILE = path.join(CACHE_DIR, 'rda-download-progress.json');

// ============================================================
// 타입
// ============================================================

interface FoodItem {
  food_Code: string;
  food_Nm: string;
  food_Eng_Nm?: string;
  food_Grupp?: string;
}

interface NutrientEntry {
  name: string;   // irdnt_Nm
  value: string;  // cont_Info
  unit: string;   // irdnt_Unit_Nm
}

// ============================================================
// 유틸
// ============================================================

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function toNum(val?: string): number | undefined {
  if (!val || val.trim() === '' || val === 'N/A' || val === '-') return undefined;
  const n = parseFloat(val);
  return isNaN(n) ? undefined : n;
}

const FETCH_HEADERS = {
  'User-Agent': 'curl/8.7.1',
  'Accept': '*/*',
};

async function fetchXmlAsJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  return parseStringPromise(xml, { explicitArray: false, ignoreAttrs: true });
}

// ============================================================
// 1단계: 전체 식품 목록 다운로드
// ============================================================

async function downloadAllFoods(): Promise<FoodItem[]> {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

  // 이전 진행 상태 복원
  let progress: { completed: string[]; foods: FoodItem[] } = { completed: [], foods: [] };
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    console.log(`  이전 진행 복원: ${progress.completed.join(',')} 그룹 완료, ${progress.foods.length}개 로드`);
  }

  const all: FoodItem[] = [...progress.foods];
  let apiCalls = 0;

  for (const fd_Grupp of FOOD_GROUPS) {
    if (progress.completed.includes(fd_Grupp)) {
      console.log(`  그룹 ${fd_Grupp}: 스킵 (이미 완료)`);
      continue;
    }

    const groupItems: FoodItem[] = [];
    let pageNo = 1;
    let totalCount = 0;

    try {
      do {
        const url = `${BASE}/getKoreanFoodNationStdList?serviceKey=${API_KEY}&page_No=${pageNo}&Page_Size=${PAGE_SIZE}&fd_Grupp=${fd_Grupp}`;
        const json = await fetchXmlAsJson(url) as Record<string, unknown>;
        apiCalls++;

        const header = (json?.response as Record<string, unknown>)?.header as Record<string, unknown>;
        const code = String(header?.result_Code ?? '');

        if (code !== '200' && code !== '00') {
          if (code === '301') break; // 데이터 없음 — 스킵
          throw new Error(`그룹 ${fd_Grupp} 페이지 ${pageNo} 오류: ${header?.result_Msg}`);
        }

        const body = (json?.response as Record<string, unknown>)?.body as Record<string, unknown>;
        if (!totalCount) {
          totalCount = parseInt(String(body?.total_Count ?? '0'), 10) || 0;
        }

        const items = (body?.items as Record<string, unknown>)?.item;
        if (!items) break;

        const arr: Record<string, unknown>[] = Array.isArray(items) ? items : [items];
        for (const it of arr) {
          groupItems.push({
            food_Code: String(it.food_Code ?? ''),
            food_Nm: String(it.food_Nm ?? ''),
            food_Eng_Nm: it.food_Eng_Nm ? String(it.food_Eng_Nm) : undefined,
            food_Grupp: it.food_Grupp ? String(it.food_Grupp) : undefined,
          });
        }

        pageNo++;
        await sleep(DELAY_MS);
      } while ((pageNo - 1) * PAGE_SIZE < totalCount);
    } catch (err) {
      // 429 등 에러 발생 시 완료된 그룹만 저장 (현재 그룹 제외)
      progress.foods = all; // groupItems 미포함 — 현재 그룹은 다음 실행에서 처음부터 재시도
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      console.log(`\n⚠️  중단 (API 한도 또는 오류). 진행 상태 저장됨.`);
      console.log(`   완료 그룹: [${progress.completed.join(', ')}]`);
      console.log(`   내일 재실행하면 그룹 ${fd_Grupp}부터 재개합니다.`);
      throw err;
    }

    all.push(...groupItems);
    progress.completed.push(fd_Grupp);
    progress.foods = all;
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    console.log(`  그룹 ${fd_Grupp}: ${groupItems.length}개 (누적 API 호출 ${apiCalls}회)`);
  }

  // 완료 — 캐시 저장 후 진행 파일 삭제
  fs.writeFileSync(CACHE_FILE, JSON.stringify(all, null, 2), 'utf-8');
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
  console.log(`\n✅ 전체 다운로드 완료: ${all.length}개 (API 호출 ${apiCalls}회)`);
  return all;
}

// ============================================================
// 2단계: 재료명 매칭
// ============================================================

function findBestMatch(name: string, foods: FoodItem[]): FoodItem | null {
  const clean = name.trim();

  // 1) 완전 일치
  const exact = foods.find(f => f.food_Nm.trim() === clean);
  if (exact) return exact;

  // 2) 부분 포함 (재료명이 식품명에 포함)
  const inFood = foods.find(f => f.food_Nm.includes(clean) && clean.length >= 2);
  if (inFood) return inFood;

  // 3) 식품명이 재료명에 포함 (단, 식품명이 2자 이상)
  const inIngr = foods.find(f =>
    f.food_Nm.trim().length >= 2 && clean.includes(f.food_Nm.trim())
  );
  if (inIngr) return inIngr;

  return null;
}

// ============================================================
// 3단계: 영양 상세 조회
// ============================================================

const NUTRIENT_MAP: Record<string, string> = {
  // 일반성분
  '에너지': 'calories',
  '수분': 'moisture',
  '단백질': 'protein',
  '지방': 'fat',
  '회분': 'ash',
  '탄수화물': 'carbs',
  '당류': 'sugar',
  '총 식이섬유': 'fiber',
  // 무기질
  '칼슘': 'calcium',
  '철': 'iron',
  '인': 'phosphorus',
  '칼륨': 'potassium',
  '나트륨': 'sodium',
  '아연': 'zinc',
  // 비타민
  '비타민A': 'vitamin_a',
  '레티놀': 'retinol',
  '베타카로틴': 'beta_carotene',
  '티아민': 'vitamin_b1',
  '리보플라빈': 'vitamin_b2',
  '니아신': 'niacin',
  '비타민 C': 'vitamin_c',
  '비타민 D': 'vitamin_d',
  // 지방산/기타
  '총 포화 지방산': 'saturated_fat',
  '총 트랜스 지방산': 'trans_fat',
  '콜레스테롤': 'cholesterol',
};

interface ParsedNutrition {
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  detail: Record<string, number>;
}

async function fetchNutrition(foodCode: string): Promise<NutrientEntry[] | null> {
  const url = `${BASE}/getKoreanFoodNationStdIdntList?serviceKey=${API_KEY}&food_Code=${encodeURIComponent(foodCode)}`;
  const json = await fetchXmlAsJson(url) as Record<string, unknown>;

  const header = (json?.response as Record<string, unknown>)?.header as Record<string, unknown>;
  const code = String(header?.result_Code ?? '');
  if (code !== '200' && code !== '00') return null;

  const body = (json?.response as Record<string, unknown>)?.body as Record<string, unknown>;
  const items = (body?.items as Record<string, unknown>)?.item;
  if (!items) return null;

  // item은 단일 객체, irdnt는 배열 또는 단일
  const item = Array.isArray(items) ? items[0] : items as Record<string, unknown>;
  const irdnt = item?.irdnt as Record<string, unknown>;
  if (!irdnt) return null;

  // irdnttcket: 영양성분 배열
  const tckets = irdnt?.irdnttcket;
  if (!tckets) return null;

  const arr: Record<string, unknown>[] = Array.isArray(tckets) ? tckets : [tckets];
  return arr
    .filter(t => t.irdnt_Nm && t.cont_Info)
    .map(t => ({
      name: String(t.irdnt_Nm ?? ''),
      value: String(t.cont_Info ?? ''),
      unit: String(t.irdnt_Unit_Nm ?? ''),
    }));
}

function parseNutrients(nutrients: NutrientEntry[]): ParsedNutrition {
  const result: ParsedNutrition = { detail: {} };

  for (const n of nutrients) {
    const field = NUTRIENT_MAP[n.name];
    const val = toNum(n.value);
    if (!field || val == null) continue;

    if (field === 'calories') result.calories = Math.round(val);
    else if (field === 'protein') result.protein = val;
    else if (field === 'fat') result.fat = val;
    else if (field === 'carbs') result.carbs = val;
    else result.detail[field] = val;
  }

  return result;
}

// ============================================================
// 메인
// ============================================================

async function main() {
  if (!API_KEY) {
    console.error('❌ DATA_GO_KR_API_KEY 환경변수 필요');
    process.exit(1);
  }

  console.log(`\n🌾 농촌진흥청 국가표준식품성분 동기화`);
  console.log(`📦 대상 DB: ${isProd ? '🔴 PROD' : '🟡 DEV'}`);
  console.log(`🔄 모드: ${overwrite ? '전체 덮어쓰기' : '미매칭 재료만'}\n`);

  if (isProd) {
    console.log('⚠️  프로덕션 DB 쓰기 작업. 3초 후 진행...');
    await sleep(3000);
  }

  // 1단계: 전체 식품 목록 로드 (캐시 우선)
  let foods: FoodItem[];

  if (fs.existsSync(CACHE_FILE)) {
    console.log(`📂 캐시 파일 로드: ${CACHE_FILE}`);
    foods = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    console.log(`  → ${foods.length}개 식품 데이터 로드됨\n`);
  } else if (fs.existsSync(PROGRESS_FILE) && !downloadOnly) {
    // 진행 중인 다운로드 파일이 있으면 먼저 완료
    console.log('📡 이전 다운로드 재개 중...');
    foods = await downloadAllFoods();
    console.log();
  } else {
    console.log('📡 전체 식품 목록 다운로드 중...');
    console.log('  (Page_Size=20 기준 ~146회 API 호출 필요 — 일일 한도 초과 시 자동 저장 후 내일 재개)\n');
    foods = await downloadAllFoods();
    console.log();
  }

  if (downloadOnly) {
    console.log('✅ --download-only 완료. 캐시 파일 저장됨.');
    return;
  }

  // 2단계: 재료 조회
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let query = supabase.from('ingredients_master').select('id, name, name_ko').order('name');
  if (!overwrite) {
    query = query.is('calories_per_100g', null);
  }

  const { data: ingredients, error } = await query;
  if (error || !ingredients) {
    console.error('❌ 재료 조회 실패:', error?.message);
    process.exit(1);
  }

  console.log(`🥕 대상 재료: ${ingredients.length}개`);
  console.log(`📊 DB 내 식품 목록: ${foods.length}개\n`);

  let success = 0, notFound = 0, failed = 0;

  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i];
    const searchName = ing.name_ko ?? ing.name;
    process.stdout.write(`[${i + 1}/${ingredients.length}] ${searchName} ... `);

    try {
      const match = findBestMatch(searchName, foods);

      if (!match) {
        console.log('⚠️  미매칭');
        notFound++;
        continue;
      }

      // 3단계: 영양 상세 조회
      const nutrients = await fetchNutrition(match.food_Code);
      await sleep(DELAY_MS);

      if (!nutrients || nutrients.length === 0) {
        console.log(`⚠️  영양정보 없음 (코드: ${match.food_Code})`);
        notFound++;
        continue;
      }

      const parsed = parseNutrients(nutrients);

      const nutritionDetail = {
        ...parsed.detail,
        source: '농촌진흥청_국가표준식품성분10.0',
        food_code: match.food_Code,
        food_name_matched: match.food_Nm,
        food_group: match.food_Grupp,
      };

      const updatePayload: Record<string, unknown> = {
        nutrition_detail: nutritionDetail,
        updated_at: new Date().toISOString(),
      };
      if (parsed.calories != null) updatePayload.calories_per_100g = parsed.calories;
      if (parsed.protein  != null) updatePayload.protein_per_100g  = parsed.protein;
      if (parsed.fat      != null) updatePayload.fat_per_100g      = parsed.fat;
      if (parsed.carbs    != null) updatePayload.carbs_per_100g    = parsed.carbs;

      const { error: updateError } = await supabase
        .from('ingredients_master')
        .update(updatePayload)
        .eq('id', ing.id);

      if (updateError) {
        console.log(`❌ DB 오류: ${updateError.message}`);
        failed++;
      } else {
        console.log(`✅ ${match.food_Nm} (${parsed.calories ?? '?'}kcal)`);
        success++;
      }
    } catch (err) {
      console.log(`❌ 예외: ${err}`);
      failed++;
      await sleep(DELAY_MS * 2);
    }
  }

  console.log('\n─────────────────────────────');
  console.log(`✅ 성공: ${success}개`);
  console.log(`⚠️  미매칭: ${notFound}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log('─────────────────────────────\n');
}

main().catch(err => {
  console.error('❌ 스크립트 실패:', err);
  process.exit(1);
});

/**
 * 식약처 식품영양성분 DB API(I2790) → ingredients_master 영양정보 동기화
 *
 * 사전 준비:
 *   1. https://openapi.foodsafetykorea.go.kr 에서 I2790 서비스 API 키 발급
 *   2. 환경변수 설정: FOODSAFETY_API_KEY=발급받은키
 *
 * 실행:
 *   FOODSAFETY_API_KEY=발급받은키 npx tsx scripts/sync-ingredient-nutrition.ts
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

// ============================================================
// 설정
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const API_KEY = process.env.DATA_GO_KR_API_KEY ?? process.env.FOODSAFETY_API_KEY ?? '';
// data.go.kr 식품영양성분DB 정보 API (FoodNtrCpntDbInfo02)
const BASE_URL = 'https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02';
const DELAY_MS = 500; // 요청 간격 (Rate Limit 방지)

// ============================================================
// 타입 정의
// ============================================================

interface I2790Row {
  FOOD_CD: string;
  FOOD_NM_KR: string;
  FOOD_NM_EN?: string;
  SERVING_SIZE?: string;
  AMT_NUM1?: string;  // 열량 (kcal)
  AMT_NUM2?: string;  // 수분 (g)
  AMT_NUM3?: string;  // 단백질 (g)
  AMT_NUM4?: string;  // 지방 (g)
  AMT_NUM5?: string;  // 회분 (g)
  AMT_NUM6?: string;  // 탄수화물 (g)
  AMT_NUM7?: string;  // 당류 (g)
  AMT_NUM8?: string;  // 식이섬유 (g)
  AMT_NUM9?: string;  // 칼슘 (mg)
  AMT_NUM10?: string; // 철 (mg)
  AMT_NUM11?: string; // 인 (mg)
  AMT_NUM12?: string; // 칼륨 (mg)
  AMT_NUM13?: string; // 나트륨 (mg)
  AMT_NUM14?: string; // 비타민A (μg RAE)
  AMT_NUM15?: string; // 레티놀 (μg)
  AMT_NUM16?: string; // 베타카로틴 (μg)
  AMT_NUM17?: string; // 티아민 B1 (mg)
  AMT_NUM18?: string; // 리보플라빈 B2 (mg)
  AMT_NUM19?: string; // 니아신 (mg) — 주의: 새 API에서 다른 필드일 수 있음
  AMT_NUM20?: string; // 비타민C (mg)
  AMT_NUM21?: string; // 비타민D (μg)
  AMT_NUM22?: string; // 포화지방산 (g)
  AMT_NUM23?: string; // 트랜스지방산 (g)
  AMT_NUM24?: string; // 콜레스테롤 (mg)
  AMT_NUM25?: string; // 아연 (mg)
}

interface NutritionDetail {
  fiber?: number;
  sodium?: number;
  sugar?: number;
  moisture?: number;
  calcium?: number;
  iron?: number;
  phosphorus?: number;
  potassium?: number;
  zinc?: number;
  vitamin_a?: number;
  retinol?: number;
  beta_carotene?: number;
  vitamin_b1?: number;
  vitamin_b2?: number;
  vitamin_c?: number;
  vitamin_d?: number;
  niacin?: number;
  saturated_fat?: number;
  trans_fat?: number;
  cholesterol?: number;
  source: string;
  food_code: string;
}

// ============================================================
// 유틸
// ============================================================

function toNum(val?: string): number | undefined {
  if (!val || val.trim() === '' || val === 'N/A') return undefined;
  const n = parseFloat(val);
  return isNaN(n) ? undefined : n;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** 두 문자열의 유사도 점수 (0~1) */
function similarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (s2.includes(s1) || s1.includes(s2)) return 0.8;
  return 0;
}

// ============================================================
// data.go.kr 식품영양성분DB API 호출
// ============================================================

async function fetchNutritionFromAPI(foodName: string): Promise<I2790Row | null> {
  const encodedName = encodeURIComponent(foodName);
  const url = `${BASE_URL}?serviceKey=${API_KEY}&type=json&FOOD_NM_KR=${encodedName}&numOfRows=10&pageNo=1`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  API 오류 (${res.status}): ${foodName}`);
    return null;
  }

  const json = await res.json();
  if (json?.header?.resultCode !== '00') return null;

  const rows: I2790Row[] = json?.body?.items ?? [];
  if (rows.length === 0) return null;

  // 완전일치만 허용 (부분 매칭은 요리명 DB와 혼동될 수 있어 제외)
  return rows.find(r => r.FOOD_NM_KR.trim() === foodName.trim()) ?? null;
}

// ============================================================
// 영양 데이터 파싱
// ============================================================

function parseNutritionDetail(row: I2790Row): NutritionDetail {
  const detail: NutritionDetail = {
    source: '식약처_I2790',
    food_code: row.FOOD_CD,
  };

  const f = (val?: string) => toNum(val);

  if (f(row.AMT_NUM2)  != null) detail.moisture       = f(row.AMT_NUM2)!;
  if (f(row.AMT_NUM7)  != null) detail.sugar          = f(row.AMT_NUM7)!;
  if (f(row.AMT_NUM8)  != null) detail.fiber          = f(row.AMT_NUM8)!;
  if (f(row.AMT_NUM9)  != null) detail.calcium        = f(row.AMT_NUM9)!;
  if (f(row.AMT_NUM10) != null) detail.iron           = f(row.AMT_NUM10)!;
  if (f(row.AMT_NUM11) != null) detail.phosphorus     = f(row.AMT_NUM11)!;
  if (f(row.AMT_NUM12) != null) detail.potassium      = f(row.AMT_NUM12)!;
  if (f(row.AMT_NUM13) != null) detail.sodium         = f(row.AMT_NUM13)!;
  if (f(row.AMT_NUM14) != null) detail.vitamin_a      = f(row.AMT_NUM14)!;
  if (f(row.AMT_NUM15) != null) detail.retinol        = f(row.AMT_NUM15)!;
  if (f(row.AMT_NUM16) != null) detail.beta_carotene  = f(row.AMT_NUM16)!;
  if (f(row.AMT_NUM17) != null) detail.vitamin_b1     = f(row.AMT_NUM17)!;
  if (f(row.AMT_NUM18) != null) detail.vitamin_b2     = f(row.AMT_NUM18)!;
  if (f(row.AMT_NUM19) != null) detail.niacin         = f(row.AMT_NUM19)!;
  if (f(row.AMT_NUM20) != null) detail.vitamin_c      = f(row.AMT_NUM20)!;
  if (f(row.AMT_NUM21) != null) detail.vitamin_d      = f(row.AMT_NUM21)!;
  if (f(row.AMT_NUM22) != null) detail.saturated_fat  = f(row.AMT_NUM22)!;
  if (f(row.AMT_NUM23) != null) detail.trans_fat      = f(row.AMT_NUM23)!;
  if (f(row.AMT_NUM24) != null) detail.cholesterol    = f(row.AMT_NUM24)!;
  if (f(row.AMT_NUM25) != null) detail.zinc           = f(row.AMT_NUM25)!;

  return detail;
}

// ============================================================
// 메인
// ============================================================

async function main() {
  if (!API_KEY) {
    console.error('❌ FOODSAFETY_API_KEY 환경변수가 필요합니다.');
    console.error('   실행: FOODSAFETY_API_KEY=발급받은키 npx tsx scripts/sync-ingredient-nutrition.ts');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 전체 재료 목록 조회
  const { data: ingredients, error } = await supabase
    .from('ingredients_master')
    .select('id, name, name_ko')
    .order('name');

  if (error || !ingredients) {
    console.error('❌ 재료 목록 조회 실패:', error?.message);
    process.exit(1);
  }

  console.log(`\n🥕 총 ${ingredients.length}개 재료 영양정보 동기화 시작\n`);

  let success = 0;
  let notFound = 0;
  let failed = 0;

  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i];
    const searchName = ing.name_ko ?? ing.name;
    process.stdout.write(`[${i + 1}/${ingredients.length}] ${searchName} ... `);

    try {
      const row = await fetchNutritionFromAPI(searchName);

      if (!row) {
        console.log('⚠️  데이터 없음');
        notFound++;
        await sleep(DELAY_MS);
        continue;
      }

      const nutritionDetail = parseNutritionDetail(row);

      // 기존 컬럼 + nutrition_detail 동시 업데이트
      const updatePayload: Record<string, unknown> = {
        nutrition_detail: nutritionDetail,
        updated_at: new Date().toISOString(),
      };

      const calories = toNum(row.AMT_NUM1);
      const protein  = toNum(row.AMT_NUM3);
      const fat      = toNum(row.AMT_NUM4);
      const carbs    = toNum(row.AMT_NUM6);

      if (calories != null) updatePayload.calories_per_100g = Math.round(calories);
      if (protein  != null) updatePayload.protein_per_100g  = protein;
      if (fat      != null) updatePayload.fat_per_100g      = fat;
      if (carbs    != null) updatePayload.carbs_per_100g    = carbs;

      const { error: updateError } = await supabase
        .from('ingredients_master')
        .update(updatePayload)
        .eq('id', ing.id);

      if (updateError) {
        console.log(`❌ 업데이트 실패: ${updateError.message}`);
        failed++;
      } else {
        console.log(`✅ ${row.FOOD_NM_KR}`);
        success++;
      }
    } catch (err) {
      console.log(`❌ 예외: ${err}`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log('\n─────────────────────────────');
  console.log(`✅ 성공: ${success}개`);
  console.log(`⚠️  데이터 없음: ${notFound}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log('─────────────────────────────\n');
}

main();

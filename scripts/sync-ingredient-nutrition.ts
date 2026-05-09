/**
 * 식약처 식품영양성분 DB API(I2790) → ingredients_master 영양정보 동기화
 *
 * 전략: 재료별 API 검색 + 로컬 퍼지 매칭 (5개 병렬, 50ms 딜레이)
 * → 식약처 API는 rate limit 없음 확인, 기존 500ms → 50ms + 병렬로 8분 → ~1분
 *
 * 실행:
 *   npx tsx scripts/sync-ingredient-nutrition.ts              # dev, 미매칭만
 *   npx tsx scripts/sync-ingredient-nutrition.ts --overwrite  # dev, 전체 덮어쓰기
 *   npx tsx scripts/sync-ingredient-nutrition.ts --prod       # prod
 *   npx tsx scripts/sync-ingredient-nutrition.ts --dry-run    # 매칭 결과만 출력
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

// ============================================================
// 설정
// ============================================================

const API_KEY = process.env.DATA_GO_KR_API_KEY ?? process.env.FOODSAFETY_API_KEY ?? '';
const BASE_URL = 'https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02';
const CONCURRENCY = 5;  // 동시 처리 수
const DELAY_MS    = 50; // 배치 간 딜레이 (ms)

const overwrite = process.argv.includes('--overwrite');
const isProd    = process.argv.includes('--prod');
const dryRun    = process.argv.includes('--dry-run');

// ============================================================
// 타입
// ============================================================

interface I2790Row {
  FOOD_CD: string;
  FOOD_NM_KR: string;
  AMT_NUM1?: string;  // 열량 (kcal)
  AMT_NUM2?: string;  // 수분 (g)
  AMT_NUM3?: string;  // 단백질 (g)
  AMT_NUM4?: string;  // 지방 (g)
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
  AMT_NUM19?: string; // 니아신 (mg)
  AMT_NUM20?: string; // 비타민C (mg)
  AMT_NUM21?: string; // 비타민D (μg)
  AMT_NUM22?: string; // 포화지방산 (g)
  AMT_NUM23?: string; // 트랜스지방산 (g)
  AMT_NUM24?: string; // 콜레스테롤 (mg)
  AMT_NUM25?: string; // 아연 (mg)
}

interface NutritionDetail {
  fiber?: number; sodium?: number; sugar?: number; moisture?: number;
  calcium?: number; iron?: number; phosphorus?: number; potassium?: number;
  zinc?: number; vitamin_a?: number; retinol?: number; beta_carotene?: number;
  vitamin_b1?: number; vitamin_b2?: number; vitamin_c?: number; vitamin_d?: number;
  niacin?: number; saturated_fat?: number; trans_fat?: number; cholesterol?: number;
  source: string;
  food_code: string;
}

interface MatchResult {
  row: I2790Row;
  score: number;
  matchedQuery: string;
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

// ============================================================
// 이름 정규화 & 퍼지 매칭
// ============================================================

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
  return dp[m][n];
}

function normalizeQuery(name: string): string {
  return name.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/고기$/, '').replace(/\s+/g, ' ').trim();
}

function normalizeFoodApiName(apiName: string): string {
  return apiName.split(/[,_]/)[0].replace(/\([^)]*\)/g, '').trim();
}

function calcSimilarity(query: string, apiName: string): number {
  const q  = query.toLowerCase();
  const qn = normalizeQuery(query).toLowerCase();
  const hasSep = apiName.includes(',') || apiName.includes('_');
  const a = normalizeFoodApiName(apiName).toLowerCase();

  if (q === a || (qn && qn !== q && qn === a)) return 1.0;

  const lev = (x: string) => {
    const d = levenshtein(x, a);
    const ml = Math.max(x.length, a.length);
    return ml === 0 ? 1.0 : Math.max(0, 1 - d / ml);
  };

  if (hasSep) {
    if (q.startsWith(a) || (qn && qn.startsWith(a))) return 0.88;
    return Math.max(lev(q), qn ? lev(qn) : 0);
  } else {
    if ((a.startsWith(q) && a.length > q.length) || (qn && a.startsWith(qn) && a.length > qn.length)) return 0.4;
    if (q.startsWith(a)  && a.length >= 2) return 0.88;
    if (qn && qn.startsWith(a) && a.length >= 2) return 0.88;
    return Math.max(lev(q), qn ? lev(qn) : 0);
  }
}

const SYNONYMS: Record<string, string[]> = {
  '계란': ['달걀'], '달걀': ['계란'],
  '계란노른자': ['달걀노른자'], '달걀노른자': ['계란노른자'],
  '계란흰자': ['달걀흰자'], '달걀흰자': ['계란흰자'],
  '소고기': ['쇠고기'], '쇠고기': ['소고기'],
  '파': ['대파'],
};

function getSearchQueries(name: string): string[] {
  const queries = new Set<string>();
  queries.add(name);
  const normalized = normalizeQuery(name);
  if (normalized && normalized !== name) queries.add(normalized);
  for (const [key, synonyms] of Object.entries(SYNONYMS))
    if (name === key) synonyms.forEach(s => queries.add(s));
  return Array.from(queries);
}

const MATCH_THRESHOLD = 0.75;

// ============================================================
// API 호출
// ============================================================

async function fetchRowsFromAPI(query: string): Promise<I2790Row[]> {
  const url = `${BASE_URL}?serviceKey=${API_KEY}&type=json&FOOD_NM_KR=${encodeURIComponent(query)}&numOfRows=100&pageNo=1`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  if (json?.header?.resultCode !== '00') return [];
  return json?.body?.items ?? [];
}

async function findBestMatch(foodName: string): Promise<MatchResult | null> {
  const queries = getSearchQueries(foodName);
  const allRows: { row: I2790Row; query: string }[] = [];

  for (let i = 0; i < queries.length; i++) {
    const rows = await fetchRowsFromAPI(queries[i]);
    rows.forEach(row => allRows.push({ row, query: queries[i] }));
    if (i < queries.length - 1) await sleep(30);
  }

  let best: MatchResult | null = null;
  for (const { row, query } of allRows) {
    const score = Math.max(calcSimilarity(foodName, row.FOOD_NM_KR), calcSimilarity(query, row.FOOD_NM_KR));
    if (score < MATCH_THRESHOLD) continue;
    const finalScore = score + (row.FOOD_NM_KR.includes('생것') ? 0.05 : 0);
    if (!best || finalScore > best.score) best = { row, score: finalScore, matchedQuery: query };
  }
  return best;
}

// ============================================================
// 영양 데이터 파싱
// ============================================================

function parseNutritionDetail(row: I2790Row): NutritionDetail {
  const detail: NutritionDetail = { source: '식약처_I2790', food_code: row.FOOD_CD };
  const f = (val?: string) => toNum(val);
  if (f(row.AMT_NUM2)  != null) detail.moisture      = f(row.AMT_NUM2)!;
  if (f(row.AMT_NUM7)  != null) detail.sugar         = f(row.AMT_NUM7)!;
  if (f(row.AMT_NUM8)  != null) detail.fiber         = f(row.AMT_NUM8)!;
  if (f(row.AMT_NUM9)  != null) detail.calcium       = f(row.AMT_NUM9)!;
  if (f(row.AMT_NUM10) != null) detail.iron          = f(row.AMT_NUM10)!;
  if (f(row.AMT_NUM11) != null) detail.phosphorus    = f(row.AMT_NUM11)!;
  if (f(row.AMT_NUM12) != null) detail.potassium     = f(row.AMT_NUM12)!;
  if (f(row.AMT_NUM13) != null) detail.sodium        = f(row.AMT_NUM13)!;
  if (f(row.AMT_NUM14) != null) detail.vitamin_a     = f(row.AMT_NUM14)!;
  if (f(row.AMT_NUM15) != null) detail.retinol       = f(row.AMT_NUM15)!;
  if (f(row.AMT_NUM16) != null) detail.beta_carotene = f(row.AMT_NUM16)!;
  if (f(row.AMT_NUM17) != null) detail.vitamin_b1    = f(row.AMT_NUM17)!;
  if (f(row.AMT_NUM18) != null) detail.vitamin_b2    = f(row.AMT_NUM18)!;
  if (f(row.AMT_NUM19) != null) detail.niacin        = f(row.AMT_NUM19)!;
  if (f(row.AMT_NUM20) != null) detail.vitamin_c     = f(row.AMT_NUM20)!;
  if (f(row.AMT_NUM21) != null) detail.vitamin_d     = f(row.AMT_NUM21)!;
  if (f(row.AMT_NUM22) != null) detail.saturated_fat = f(row.AMT_NUM22)!;
  if (f(row.AMT_NUM23) != null) detail.trans_fat     = f(row.AMT_NUM23)!;
  if (f(row.AMT_NUM24) != null) detail.cholesterol   = f(row.AMT_NUM24)!;
  if (f(row.AMT_NUM25) != null) detail.zinc          = f(row.AMT_NUM25)!;
  return detail;
}

// ============================================================
// 메인
// ============================================================

async function main() {
  if (!API_KEY) { console.error('❌ DATA_GO_KR_API_KEY 환경변수가 필요합니다.'); process.exit(1); }

  const supabaseUrl = isProd
    ? (process.env.PROD_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!)
    : process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = isProd
    ? (process.env.PROD_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!)
    : process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: ingredients, error } = await supabase
    .from('ingredients_master').select('id, name, name_ko, calories_per_100g').order('name');

  if (error || !ingredients) { console.error('❌ 재료 목록 조회 실패:', error?.message); process.exit(1); }

  const targets = overwrite ? ingredients : ingredients.filter(i => i.calories_per_100g == null);

  console.log(`\n🥕 ${isProd ? '[PROD]' : '[DEV]'} 대상: ${targets.length}개 (전체 ${ingredients.length}개)`);
  if (dryRun) console.log('🔍 dry-run 모드\n'); else console.log('');

  let success = 0, fuzzySuccess = 0, notFound = 0, failed = 0;
  let done = 0;

  // CONCURRENCY개씩 병렬 처리
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);

    await Promise.all(batch.map(async (ing) => {
      const searchName = ing.name_ko ?? ing.name;
      const idx = ++done;
      process.stdout.write(`[${idx}/${targets.length}] ${searchName} ... `);

      try {
        const match = await findBestMatch(searchName);

        if (!match) {
          console.log('⚠️  매칭 없음');
          notFound++;
          return;
        }

        const { row, score, matchedQuery } = match;
        const isFuzzy = row.FOOD_NM_KR.trim() !== searchName.trim();
        const label = isFuzzy
          ? `🔀 ${row.FOOD_NM_KR} (쿼리: ${matchedQuery}, 유사도: ${(score * 100).toFixed(0)}%)`
          : `✅ ${row.FOOD_NM_KR}`;

        if (dryRun) { console.log(label); if (isFuzzy) fuzzySuccess++; else success++; return; }

        const nutritionDetail = parseNutritionDetail(row);
        const payload: Record<string, unknown> = { nutrition_detail: nutritionDetail, updated_at: new Date().toISOString() };
        const calories = toNum(row.AMT_NUM1), protein = toNum(row.AMT_NUM3);
        const fat = toNum(row.AMT_NUM4), carbs = toNum(row.AMT_NUM6);
        if (calories != null) payload.calories_per_100g = Math.round(calories);
        if (protein  != null) payload.protein_per_100g  = protein;
        if (fat      != null) payload.fat_per_100g      = fat;
        if (carbs    != null) payload.carbs_per_100g    = carbs;

        const { error: updateError } = await supabase.from('ingredients_master').update(payload).eq('id', ing.id);
        if (updateError) { console.log(`❌ ${updateError.message}`); failed++; }
        else { console.log(label); if (isFuzzy) fuzzySuccess++; else success++; }
      } catch (err) {
        console.log(`❌ 예외: ${err}`);
        failed++;
      }
    }));

    if (i + CONCURRENCY < targets.length) await sleep(DELAY_MS);
  }

  console.log('\n─────────────────────────────');
  console.log(`✅ 정확 매칭: ${success}개`);
  console.log(`🔀 퍼지 매칭: ${fuzzySuccess}개`);
  console.log(`⚠️  데이터 없음: ${notFound}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`📊 총 매칭률: ${(((success + fuzzySuccess) / targets.length) * 100).toFixed(1)}%`);
  console.log('─────────────────────────────\n');
}

main();

/**
 * 농림수산식품교육문화정보원 레시피 API → 낼름 DB 임포트 스크립트
 *
 * API 3종 세트 (RECIPE_ID로 연결):
 *   - 레시피 기본정보 (Grid_20150827000000000226_1): 537개
 *   - 레시피 재료정보 (Grid_20150827000000000227_1): 6,104건
 *   - 레시피 과정정보 (Grid_20150827000000000228_1): 3,022건
 *
 * 재임포트 시 기존 mafra 태그 레시피만 삭제하므로 수동 작성 레시피는 보존됨.
 *
 * 실행: npx tsx scripts/import-mafra-recipes.ts
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

const MAFRA_API_KEY = process.env.MAFRA_API_KEY!;
const MAFRA_BASE = 'http://211.237.50.150:7080/openapi';
const GRID_BASIC    = 'Grid_20150827000000000226_1'; // 기본정보
const GRID_IRDNT    = 'Grid_20150827000000000227_1'; // 재료정보
const GRID_PROCESS  = 'Grid_20150827000000000228_1'; // 과정정보
const BATCH_SIZE = 1000;
const SOURCE_TAG = '농림수산식품교육문화정보원'; // 재임포트 시 삭제 기준 태그

// ============================================================
// 타입 정의
// ============================================================

interface MafraBasic {
  ROW_NUM: number;
  RECIPE_ID: number;
  RECIPE_NM_KO: string;
  SUMRY: string;
  NATION_CODE: string;
  NATION_NM: string;
  TY_CODE: string;
  TY_NM: string;
  COOKING_TIME: string;
  CALORIE: string;
  QNT: string;
  LEVEL_NM: string;
  IRDNT_CODE: string;
  PC_NM: string;
}

interface MafraIrdnt {
  RECIPE_ID: number;
  IRDNT_SN: number;
  IRDNT_NM: string;
  IRDNT_CPCTY: string;
  IRDNT_TY_CODE: string;
  IRDNT_TY_NM: string;
}

interface MafraProcess {
  RECIPE_ID: number;
  COOKING_NO: number;
  COOKING_DC: string;
  STEP_TIP: string;
}

// ============================================================
// 매핑 테이블
// ============================================================

const CUISINE_MAP: Record<string, string> = {
  '한식': 'korean',
  '중국': 'chinese',
  '일식': 'japanese',
  '서양': 'western',
  '이탈리안': 'italian',
  '동남아': 'other',
  '기타': 'other',
};

const DISH_MAP: Record<string, string> = {
  '밥': 'rice',
  '죽': 'rice',
  '국': 'soup',
  '찌개': 'soup',
  '탕': 'soup',
  '전골': 'soup',
  '반찬': 'side',
  '나물': 'side',
  '조림': 'side',
  '볶음': 'side',
  '무침': 'side',
  '김치': 'side',
  '메인': 'main',
  '일품': 'main',
  '찜': 'main',
  '구이': 'main',
  '면': 'noodle',
  '만두': 'noodle',
  '떡/한과': 'dessert',
  '후식': 'dessert',
  '디저트': 'dessert',
  '빵': 'bread',
  '샐러드': 'salad',
  '음청': 'beverage',
};

const DIFFICULTY_MAP: Record<string, string> = {
  '초보환영': 'easy',
  '보통': 'medium',
  '어려움': 'hard',
};

// ============================================================
// 파싱 유틸리티
// ============================================================

/** "60분" → 60, "1시간30분" → 90 */
function parseCookingTime(val: string): number | null {
  if (!val?.trim()) return null;
  let minutes = 0;
  const hourMatch = val.match(/(\d+)\s*시간/);
  const minMatch  = val.match(/(\d+)\s*분/);
  if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
  if (minMatch)  minutes += parseInt(minMatch[1]);
  return minutes > 0 ? minutes : null;
}

/** "580Kcal" → 580 */
function parseCalorie(val: string): number | null {
  if (!val?.trim()) return null;
  const m = val.match(/(\d+(?:\.\d+)?)/);
  return m ? Math.round(parseFloat(m[1])) : null;
}

/** "4인분" → 4 */
function parseServings(val: string): number | null {
  if (!val?.trim()) return null;
  const m = val.match(/(\d+)/);
  return m ? parseInt(m[1]) : null;
}

/** "4컵", "200g", "1/2모", "약간" 등 → { quantity, unit } */
function parseCapacity(val: string): { quantity: number | null; unit: string } {
  if (!val?.trim()) return { quantity: null, unit: '선택' };
  const v = val.trim();

  // 분수 처리: "1/2모" → 0.5
  const fracMatch = v.match(/^(\d+)\/(\d+)\s*(.*)$/);
  if (fracMatch) {
    const qty = parseInt(fracMatch[1]) / parseInt(fracMatch[2]);
    const unit = fracMatch[3].trim() || '선택';
    return { quantity: qty, unit };
  }

  // 정수/소수 + 단위
  const numMatch = v.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
  if (numMatch) {
    return { quantity: parseFloat(numMatch[1]), unit: numMatch[2].trim() };
  }

  // 숫자만
  const numOnly = v.match(/^(\d+(?:\.\d+)?)$/);
  if (numOnly) {
    return { quantity: parseFloat(numOnly[1]), unit: '선택' };
  }

  // 약간, 적당량 등
  return { quantity: null, unit: '선택' };
}

// ============================================================
// API 호출
// ============================================================

async function fetchGrid<T>(gridId: string, totalHint?: number): Promise<T[]> {
  const all: T[] = [];

  // 전체 개수 파악
  const firstUrl = `${MAFRA_BASE}/${MAFRA_API_KEY}/json/${gridId}/1/1`;
  const firstRes = await fetch(firstUrl);
  const firstData = await firstRes.json();
  const key = Object.keys(firstData)[0];
  const totalCnt: number = totalHint ?? firstData[key]?.totalCnt ?? 0;

  if (totalCnt === 0) return all;

  const pages = Math.ceil(totalCnt / BATCH_SIZE);
  for (let page = 0; page < pages; page++) {
    const start = page * BATCH_SIZE + 1;
    const end   = Math.min(start + BATCH_SIZE - 1, totalCnt);
    const url   = `${MAFRA_BASE}/${MAFRA_API_KEY}/json/${gridId}/${start}/${end}`;
    const res   = await fetch(url);
    const data  = await res.json();
    const k     = Object.keys(data)[0];
    const rows: T[] = data[k]?.row ?? [];
    all.push(...rows);
    if (pages > 1) {
      console.log(`  → ${gridId} 배치 ${page + 1}/${pages}: ${rows.length}건 수신 (누적: ${all.length}/${totalCnt})`);
    }
  }

  return all;
}

// ============================================================
// 메인 로직
// ============================================================

async function main() {
  console.log('🚀 농림수산식품교육문화정보원 레시피 임포트 시작\n');

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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. 기존 mafra 태그 레시피 삭제 (수동 작성 레시피는 보존)
  console.log(`🗑️ 기존 [${SOURCE_TAG}] 레시피 삭제 중...`);
  const { data: mafraTagRows } = await supabase
    .from('recipe_tags')
    .select('recipe_id')
    .eq('tag_name', SOURCE_TAG);

  const mafraRecipeIds = [...new Set((mafraTagRows ?? []).map(r => r.recipe_id))];

  if (mafraRecipeIds.length > 0) {
    const { error: delErr } = await supabase
      .from('recipes')
      .delete()
      .in('id', mafraRecipeIds);
    if (delErr) {
      console.error('❌ 삭제 실패:', delErr.message);
      process.exit(1);
    }
    console.log(`✅ 기존 ${mafraRecipeIds.length}개 삭제 완료\n`);
  } else {
    console.log('✅ 삭제할 기존 레시피 없음\n');
  }

  // 3. API에서 전체 데이터 수신
  console.log('📡 레시피 기본정보 수신 중...');
  const basics = await fetchGrid<MafraBasic>(GRID_BASIC);
  console.log(`✅ 기본정보 ${basics.length}개 수신\n`);

  console.log('📡 레시피 재료정보 수신 중...');
  const irdnts = await fetchGrid<MafraIrdnt>(GRID_IRDNT);
  console.log(`✅ 재료정보 ${irdnts.length}건 수신\n`);

  console.log('📡 레시피 과정정보 수신 중...');
  const processes = await fetchGrid<MafraProcess>(GRID_PROCESS);
  console.log(`✅ 과정정보 ${processes.length}건 수신\n`);

  // 4. RECIPE_ID 기준으로 그룹화
  const irdntMap = new Map<number, MafraIrdnt[]>();
  for (const i of irdnts) {
    if (!irdntMap.has(i.RECIPE_ID)) irdntMap.set(i.RECIPE_ID, []);
    irdntMap.get(i.RECIPE_ID)!.push(i);
  }

  const processMap = new Map<number, MafraProcess[]>();
  for (const p of processes) {
    if (!processMap.has(p.RECIPE_ID)) processMap.set(p.RECIPE_ID, []);
    processMap.get(p.RECIPE_ID)!.push(p);
  }

  // 5. 레시피별 DB 삽입
  let successCount = 0;
  let skipCount    = 0;
  let errorCount   = 0;
  const startTime  = Date.now();

  for (let idx = 0; idx < basics.length; idx++) {
    const basic = basics[idx];

    try {
      const title = basic.RECIPE_NM_KO?.trim();
      if (!title) { skipCount++; continue; }

      const recipeId = basic.RECIPE_ID;
      const steps    = (processMap.get(recipeId) ?? [])
        .sort((a, b) => a.COOKING_NO - b.COOKING_NO);
      const irdntList = (irdntMap.get(recipeId) ?? [])
        .sort((a, b) => a.IRDNT_SN - b.IRDNT_SN);

      // 조리 단계 없으면 스킵
      if (steps.length === 0) {
        console.log(`  ⏭️ [${idx + 1}/${basics.length}] 조리 단계 없음: "${title}"`);
        skipCount++;
        continue;
      }

      // 5.1 recipes 삽입
      const { data: inserted, error: recipeErr } = await supabase
        .from('recipes')
        .insert({
          author_id:        ADMIN_USER_ID,
          title,
          description:      basic.SUMRY?.trim() || null,
          thumbnail_url:    null,
          servings:         parseServings(basic.QNT),
          prep_time_minutes: null,
          cook_time_minutes: parseCookingTime(basic.COOKING_TIME),
          difficulty_level: DIFFICULTY_MAP[basic.LEVEL_NM] ?? null,
          cuisine_type:     CUISINE_MAP[basic.NATION_NM] ?? 'other',
          dish_type:        DISH_MAP[basic.TY_NM] ?? 'other',
          meal_type:        null,
          calories:         parseCalorie(basic.CALORIE),
          protein_grams:    null,
          carbs_grams:      null,
          fat_grams:        null,
          sodium_mg:        null,
          status:           'published' as const,
          published_at:     new Date().toISOString(),
        })
        .select('id')
        .single();

      if (recipeErr || !inserted) {
        console.error(`  ❌ [${idx + 1}/${basics.length}] "${title}": ${recipeErr?.message}`);
        errorCount++;
        continue;
      }

      const dbId = inserted.id;

      // 5.2 recipe_ingredients 삽입
      if (irdntList.length > 0) {
        const ingRows = irdntList.map((i, order) => {
          const { quantity, unit } = parseCapacity(i.IRDNT_CPCTY);
          return {
            recipe_id:       dbId,
            ingredient_name: i.IRDNT_NM?.trim() || '재료',
            quantity,
            unit,
            notes:           i.IRDNT_TY_NM === '부재료' ? '부재료' : null,
            is_optional:     false,
            display_order:   order + 1,
          };
        });

        const { error: ingErr } = await supabase
          .from('recipe_ingredients')
          .insert(ingRows);

        if (ingErr) console.warn(`  ⚠️ 재료 경고 "${title}": ${ingErr.message}`);
      }

      // 5.3 recipe_steps 삽입
      const stepRows = steps.map((s, i) => ({
        recipe_id:   dbId,
        step_number: i + 1,
        instruction: s.COOKING_DC?.trim() || '',
        image_url:   null,
        timer_minutes: null,
        tip:         s.STEP_TIP?.trim() || null,
      }));

      const { error: stepErr } = await supabase
        .from('recipe_steps')
        .insert(stepRows);

      if (stepErr) console.warn(`  ⚠️ 단계 경고 "${title}": ${stepErr.message}`);

      // 5.4 recipe_tags 삽입
      const tags = [
        SOURCE_TAG,
        basic.NATION_NM,
        basic.TY_NM,
      ].filter(Boolean);

      const { error: tagErr } = await supabase
        .from('recipe_tags')
        .insert(tags.map(tag => ({ recipe_id: dbId, tag_name: tag })));

      if (tagErr) console.warn(`  ⚠️ 태그 경고 "${title}": ${tagErr.message}`);

      successCount++;

      if (successCount === 1 || successCount % 50 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`  ✅ [${idx + 1}/${basics.length}] "${title}" (재료: ${irdntList.length}개, 단계: ${steps.length}개) [${elapsed}초]`);
      }

    } catch (err) {
      console.error(`  ❌ [${idx + 1}/${basics.length}] 예외: "${basic.RECIPE_NM_KO}": ${err}`);
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
  console.log(`📦 총 처리: ${basics.length}개`);
  console.log(`⏱️ 소요 시간: ${totalTime}초`);
  console.log('='.repeat(60));
}

main().catch(console.error);

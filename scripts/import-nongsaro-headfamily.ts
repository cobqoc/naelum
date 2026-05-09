/**
 * 농사로 Open API — 종가음식(headFamilyFood) 257개 임포트
 *
 * - 조리 단계 없음 → status: draft, recipe_steps 없음
 * - 재료: clsrcFdMatrlDtl 쉼표 구분 파싱
 * - 태그: 종가음식, 지역, 분류
 * - 이미지: https://www.nongsaro.go.kr/{rtnFileCours}/{rtnStreFileNm}
 * - 라이선스: 공공누리 1유형 (출처 표시)
 *
 * 실행:
 *   npx tsx scripts/import-nongsaro-headfamily.ts          # dev, 드라이런
 *   npx tsx scripts/import-nongsaro-headfamily.ts --import  # dev, 실제 삽입
 *   npx tsx scripts/import-nongsaro-headfamily.ts --import --prod  # prod
 */

import { createClient } from '@supabase/supabase-js';
import { parseStringPromise } from 'xml2js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

// ============================================================
// 설정
// ============================================================

const doImport  = process.argv.includes('--import');
const isProd    = process.argv.includes('--prod');

const SUPABASE_URL = isProd
  ? (process.env.NEXT_PUBLIC_SUPABASE_URL_PROD ?? process.env.NEXT_PUBLIC_SUPABASE_URL!)
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = isProd
  ? (process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ?? process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

const API_KEY  = process.env.NONGSARO_API_KEY!;
const BASE_URL = 'https://api.nongsaro.go.kr/service/headFamilyFood';
const PAGE_SIZE = 50;
const DELAY_MS  = 300;
const SOURCE_TAG = '종가음식';
const IMG_BASE   = 'https://www.nongsaro.go.kr';

// ============================================================
// 타입
// ============================================================

interface ListItem {
  cntntsNo: string;
  clsrcFdNm: string;
  atptCodeNm: string;
  clsrcFdClCodeLclasNm: string;
  clsrcFdClCodeSclasNm: string;
  clsrcNm: string;
}

interface DetailItem extends ListItem {
  clsrcFdMatrlDtl: string;  // 재료 (쉼표 구분)
  fdStoryDtl: string;        // 음식 이야기
  rtnFileCours: string;      // 이미지 경로
  rtnStreFileNm: string;      // 이미지 파일명
}

// ============================================================
// 유틸
// ============================================================

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function cdataText(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (Array.isArray(val)) return String(val[0] ?? '').trim();
  return String(val).trim();
}

async function fetchXml(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const xml = await res.text();
  return parseStringPromise(xml, { explicitArray: false, ignoreAttrs: true });
}

// ============================================================
// API 조회
// ============================================================

async function fetchList(): Promise<ListItem[]> {
  const all: ListItem[] = [];
  let pageNo = 1;
  let total  = 0;

  do {
    const url = `${BASE_URL}/headFamilyFoodLst?apiKey=${API_KEY}&pageNo=${pageNo}&numOfRows=${PAGE_SIZE}`;
    const json = await fetchXml(url) as Record<string, unknown>;
    const body = (json?.response as Record<string, unknown>)?.body as Record<string, unknown>;
    const items = (body?.items as Record<string, unknown>);

    if (!total) total = parseInt(String(items?.totalCount ?? '0'), 10);

    const rawItems = items?.item;
    if (!rawItems) break;

    const arr = Array.isArray(rawItems) ? rawItems : [rawItems];
    for (const it of arr as Record<string, unknown>[]) {
      all.push({
        cntntsNo:               cdataText(it.cntntsNo),
        clsrcFdNm:              cdataText(it.clsrcFdNm),
        atptCodeNm:             cdataText(it.atptCodeNm),
        clsrcFdClCodeLclasNm:   cdataText(it.clsrcFdClCodeLclasNm),
        clsrcFdClCodeSclasNm:   cdataText(it.clsrcFdClCodeSclasNm),
        clsrcNm:                cdataText(it.clsrcNm),
      });
    }

    console.log(`  목록 p${pageNo}: ${arr.length}건 (누적 ${all.length}/${total})`);
    pageNo++;
    await sleep(DELAY_MS);
  } while (all.length < total);

  return all;
}

async function fetchDetail(cntntsNo: string): Promise<DetailItem | null> {
  const url = `${BASE_URL}/headFamilyFoodDtl?apiKey=${API_KEY}&cntntsNo=${cntntsNo}`;
  const json = await fetchXml(url) as Record<string, unknown>;
  const body = (json?.response as Record<string, unknown>)?.body as Record<string, unknown>;
  const item = body?.item as Record<string, unknown> | undefined;

  if (!item || !cdataText(item.clsrcFdNm)) return null;

  return {
    cntntsNo,
    clsrcFdNm:              cdataText(item.clsrcFdNm),
    atptCodeNm:             cdataText(item.atptCodeNm),
    clsrcFdClCodeLclasNm:   cdataText(item.clsrcFdClCodeLclasNm),
    clsrcFdClCodeSclasNm:   cdataText(item.clsrcFdClCodeSclasNm),
    clsrcNm:                cdataText(item.clsrcNm),
    clsrcFdMatrlDtl:        cdataText(item.clsrcFdMatrlDtl),
    fdStoryDtl:             cdataText(item.fdStoryDtl),
    rtnFileCours:           cdataText(item.rtnFileCours),
    rtnStreFileNm:           cdataText(item.rtnStreFileNm),
  };
}

// ============================================================
// 재료 파싱
// ============================================================

function parseIngredients(raw: string): { name: string }[] {
  if (!raw) return [];
  return raw
    .split(/[,，、]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length <= 50)
    .map(name => ({ name }));
}

// ============================================================
// 메인
// ============================================================

async function main() {
  console.log('\n🏛️  농사로 종가음식 임포트');
  console.log(`📦 대상 DB: ${isProd ? '🔴 PROD' : '🟡 DEV'}`);
  console.log(`📋 모드: ${doImport ? '실제 삽입' : '드라이런 (--import 없이 실행됨)'}\n`);

  if (!API_KEY) { console.error('❌ NONGSARO_API_KEY 필요'); process.exit(1); }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) { console.error('❌ ADMIN_EMAIL / ADMIN_PASSWORD 필요'); process.exit(1); }

  if (isProd) { console.log('⚠️  프로덕션. 3초 후 진행...'); await sleep(3000); }

  // 1. 관리자 UUID 확인 (실제 삽입 시에만 필요)
  let ADMIN_USER_ID: string | null = process.env.AUTHOR_ID ?? null;

  if (doImport && !ADMIN_USER_ID && ADMIN_EMAIL && ADMIN_PASSWORD) {
    console.log('🔑 관리자 로그인 시도...');
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
    });
    if (authError || !authData.user) {
      console.log(`⚠️  로그인 실패 (author_id = null로 진행): ${authError?.message}`);
    } else {
      ADMIN_USER_ID = authData.user.id;
    }
  }
  console.log(`   author_id: ${ADMIN_USER_ID ?? 'null'}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. 기존 종가음식 삭제
  if (doImport) {
    console.log(`🗑️  기존 [${SOURCE_TAG}] 태그 레시피 삭제...`);
    const { data: tagRows } = await supabase
      .from('recipe_tags').select('recipe_id').eq('tag_name', SOURCE_TAG);
    const ids = [...new Set((tagRows ?? []).map(r => r.recipe_id))];
    if (ids.length > 0) {
      await supabase.from('recipes').delete().in('id', ids);
      console.log(`   ${ids.length}개 삭제 완료\n`);
    } else {
      console.log('   삭제할 기존 레시피 없음\n');
    }
  }

  // 3. 목록 조회
  console.log('📡 종가음식 목록 조회...');
  const list = await fetchList();
  console.log(`\n✅ 총 ${list.length}개 목록 수신\n`);

  // 4. 상세 조회 + 삽입
  let success = 0, skip = 0, error = 0;

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    process.stdout.write(`[${i + 1}/${list.length}] ${item.clsrcFdNm} ... `);

    try {
      const detail = await fetchDetail(item.cntntsNo);
      await sleep(DELAY_MS);

      if (!detail) { console.log('⏭️ 상세 없음'); skip++; continue; }

      const ingredients = parseIngredients(detail.clsrcFdMatrlDtl);
      const imageUrl = detail.rtnStreFileNm
        ? `${IMG_BASE}/${detail.rtnFileCours}/${detail.rtnStreFileNm}`
        : null;

      const tags = [
        SOURCE_TAG,
        detail.atptCodeNm,
        detail.clsrcFdClCodeLclasNm,
        detail.clsrcFdClCodeSclasNm,
      ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

      if (!doImport) {
        console.log(`✅ [드라이런] 재료 ${ingredients.length}개, 태그: ${tags.join(', ')}`);
        success++;
        continue;
      }

      // recipes 삽입
      const { data: inserted, error: recipeErr } = await supabase
        .from('recipes')
        .insert({
          author_id:   ADMIN_USER_ID,
          title:       detail.clsrcFdNm,
          description: detail.fdStoryDtl || null,
          status:      'draft',
          source_url:  `https://www.nongsaro.go.kr/portal/ps/psz/psza/contentSub.ps?menuId=PS03911&cntntsNo=${detail.cntntsNo}`,
          thumbnail_url: imageUrl,
        })
        .select('id')
        .single();

      if (recipeErr || !inserted) {
        console.log(`❌ recipes 삽입 실패: ${recipeErr?.message}`);
        error++;
        continue;
      }
      const recipeId = inserted.id;

      // recipe_tags
      if (tags.length > 0) {
        await supabase.from('recipe_tags').insert(tags.map(t => ({ recipe_id: recipeId, tag_name: t })));
      }

      // recipe_ingredients (이름만, 수량/단위 없음)
      if (ingredients.length > 0) {
        await supabase.from('recipe_ingredients').insert(
          ingredients.map((ing, idx) => ({
            recipe_id:      recipeId,
            ingredient_name: ing.name,
            display_order:  idx + 1,
          }))
        );
      }

      console.log(`✅ 재료 ${ingredients.length}개`);
      success++;
    } catch (err) {
      console.log(`❌ 예외: ${err}`);
      error++;
    }
  }

  console.log('\n─────────────────────────────');
  console.log(`✅ 성공: ${success}개`);
  console.log(`⏭️  스킵: ${skip}개`);
  console.log(`❌ 실패: ${error}개`);
  console.log('─────────────────────────────\n');
  if (!doImport) console.log('💡 실제 삽입: --import 플래그 추가\n');
}

main().catch(err => { console.error('❌', err); process.exit(1); });

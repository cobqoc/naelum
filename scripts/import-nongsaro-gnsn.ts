/**
 * 농사로 Open API — 인삼레시피(gnsnRecipe) 100개 임포트
 *
 * cn 필드 HTML 파싱:
 *   ㅇ재료 → 쉼표 구분 재료 파싱
 *   ㅇ만드는 법 → 번호 순서 단계 파싱
 *   ㅇ자료출처 → 무시
 *
 * - status: published (조리법 있음)
 * - 태그: 인삼레시피, 분류(clCode)
 * - 라이선스: 공공누리 1유형
 *
 * 실행:
 *   npx tsx scripts/import-nongsaro-gnsn.ts           # dev, 드라이런
 *   npx tsx scripts/import-nongsaro-gnsn.ts --import   # dev, 실제 삽입
 *   npx tsx scripts/import-nongsaro-gnsn.ts --import --prod
 */

import { createClient } from '@supabase/supabase-js';
import { parseStringPromise } from 'xml2js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

// ============================================================
// 설정
// ============================================================

const doImport = process.argv.includes('--import');
const isProd   = process.argv.includes('--prod');

const SUPABASE_URL = isProd
  ? (process.env.NEXT_PUBLIC_SUPABASE_URL_PROD ?? process.env.NEXT_PUBLIC_SUPABASE_URL!)
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = isProd
  ? (process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ?? process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

const API_KEY   = process.env.NONGSARO_API_KEY!;
const BASE_URL  = 'https://api.nongsaro.go.kr/service/gnsnRecipe';
const PAGE_SIZE = 50;
const DELAY_MS  = 300;
const SOURCE_TAG = '인삼레시피';

// ============================================================
// 타입
// ============================================================

interface ListItem {
  cntntsNo: string;
  cntntsSj: string;
  clCode: string;
  imgUrl: string;
  registDt: string;
}

interface ParsedIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
}

interface ParsedRecipe {
  title: string;
  clCode: string;
  imgUrl: string;
  ingredients: ParsedIngredient[];
  steps: string[];
  sourceNote: string;
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
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  return parseStringPromise(xml, { explicitArray: false, ignoreAttrs: true });
}

// HTML 태그 제거 + 엔티티 디코딩
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// 재료 한 항목 파싱: "인삼 70g" → { name: "인삼", quantity: 70, unit: "g" }
function parseIngredient(raw: string): ParsedIngredient | null {
  const s = raw.replace(/\s+/g, ' ').trim();
  if (!s || s.length > 60) return null;

  // 수량+단위 패턴: "재료명 숫자[/숫자] 단위" 또는 "재료명 숫자단위"
  const numUnitPattern = /^(.+?)\s+([\d./]+)\s*([가-힣a-zA-Z]+)$/;
  const m = s.match(numUnitPattern);
  if (m) {
    const rawQty = m[2].includes('/') ? eval(m[2]) : parseFloat(m[2]);
    const qty = isNaN(rawQty) ? null : rawQty;
    return { name: m[1].trim(), quantity: qty, unit: m[3].trim() };
  }

  // 약간/적당량/조금 등 → quantity/unit null
  const noQtyPattern = /^(.+?)\s+(약간|적당량|조금|소량|다소|적량)$/;
  const m2 = s.match(noQtyPattern);
  if (m2) {
    return { name: m2[1].trim(), quantity: null, unit: m2[2].trim() };
  }

  // 파싱 불가 → 이름 전체 저장
  return { name: s, quantity: null, unit: null };
}

// cn HTML → 재료/단계 파싱
function parseCn(html: string): { ingredients: ParsedIngredient[]; steps: string[]; sourceNote: string } {
  const text = stripHtml(html);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let section: 'none' | 'ingredients' | 'steps' | 'source' = 'none';
  const ingLines: string[] = [];
  const steps: string[] = [];
  let sourceNote = '';

  for (const line of lines) {
    if (line.includes('ㅇ재료') || line === '재료') { section = 'ingredients'; continue; }
    if (line.includes('ㅇ만드는 법') || line.includes('ㅇ만드는법')) { section = 'steps'; continue; }
    if (line.includes('ㅇ자료출처') || line.includes('ㅇ출처')) { section = 'source'; continue; }

    if (section === 'ingredients') ingLines.push(line);
    else if (section === 'steps') {
      // 번호 있는 줄만 단계로
      if (/^\d+[.).]/.test(line)) steps.push(line.replace(/^\d+[.).]?\s*/, '').trim());
      else if (steps.length > 0) steps[steps.length - 1] += ' ' + line;
    }
    else if (section === 'source') sourceNote += line + ' ';
  }

  // 재료 쉼표 분리
  const ingRaw = ingLines.join(', ');
  const ingredients: ParsedIngredient[] = ingRaw
    .split(/[,，]/)
    .map(s => parseIngredient(s))
    .filter((i): i is ParsedIngredient => i !== null && i.name.length > 0);

  return { ingredients, steps, sourceNote: sourceNote.trim() };
}

// ============================================================
// API 조회
// ============================================================

async function fetchList(): Promise<ListItem[]> {
  const all: ListItem[] = [];
  let pageNo = 1;
  let total  = 0;

  do {
    const url = `${BASE_URL}/gnsnRecipeLst?apiKey=${API_KEY}&pageNo=${pageNo}&numOfRows=${PAGE_SIZE}`;
    const json = await fetchXml(url) as Record<string, unknown>;
    const body  = (json?.response as Record<string, unknown>)?.body as Record<string, unknown>;
    const items = body?.items as Record<string, unknown>;
    if (!total) total = parseInt(String(items?.totalCount ?? '0'), 10);

    const rawItems = items?.item;
    if (!rawItems) break;

    const arr = Array.isArray(rawItems) ? rawItems : [rawItems];
    for (const it of arr as Record<string, unknown>[]) {
      all.push({
        cntntsNo: cdataText(it.cntntsNo),
        cntntsSj: cdataText(it.cntntsSj),
        clCode:   cdataText(it.clCode),
        imgUrl:   cdataText(it.imgUrl),
        registDt: cdataText(it.registDt),
      });
    }
    console.log(`  목록 p${pageNo}: ${arr.length}건 (누적 ${all.length}/${total})`);
    pageNo++;
    await sleep(DELAY_MS);
  } while (all.length < total);

  return all;
}

async function fetchDetail(cntntsNo: string): Promise<ParsedRecipe | null> {
  const url = `${BASE_URL}/gnsnRecipeDtl?apiKey=${API_KEY}&cntntsNo=${cntntsNo}`;
  const json = await fetchXml(url) as Record<string, unknown>;
  const body = (json?.response as Record<string, unknown>)?.body as Record<string, unknown>;
  const item = body?.item as Record<string, unknown> | undefined;
  if (!item) return null;

  const cn     = cdataText(item.cn);
  const title  = cdataText(item.cntntsSj);
  const clCode = cdataText(item.clCode);
  const imgUrl = cdataText(item.imgUrl);
  if (!title || !cn) return null;

  const { ingredients, steps, sourceNote } = parseCn(cn);

  return { title, clCode, imgUrl, ingredients, steps, sourceNote };
}

// ============================================================
// 메인
// ============================================================

async function main() {
  console.log('\n🌿 농사로 인삼레시피 임포트');
  console.log(`📦 대상 DB: ${isProd ? '🔴 PROD' : '🟡 DEV'}`);
  console.log(`📋 모드: ${doImport ? '실제 삽입' : '드라이런'}\n`);

  if (!API_KEY) { console.error('❌ NONGSARO_API_KEY 필요'); process.exit(1); }
  if (isProd) { console.log('⚠️  프로덕션. 3초 후 진행...'); await sleep(3000); }

  // 1. author_id 확인
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

  // 2. 기존 인삼레시피 삭제
  if (doImport) {
    console.log(`🗑️  기존 [${SOURCE_TAG}] 태그 레시피 삭제...`);
    const { data: tagRows } = await supabase
      .from('recipe_tags').select('recipe_id').eq('tag_name', SOURCE_TAG);
    const ids = [...new Set((tagRows ?? []).map(r => r.recipe_id))];
    if (ids.length > 0) {
      await supabase.from('recipes').delete().in('id', ids);
      console.log(`   ${ids.length}개 삭제\n`);
    } else {
      console.log('   삭제할 기존 레시피 없음\n');
    }
  }

  // 3. 목록 조회
  console.log('📡 인삼레시피 목록 조회...');
  const list = await fetchList();
  console.log(`\n✅ 총 ${list.length}개 목록 수신\n`);

  // 4. 상세 조회 + 삽입
  let success = 0, skip = 0, error = 0;

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    process.stdout.write(`[${i + 1}/${list.length}] ${item.cntntsSj} ... `);

    try {
      const detail = await fetchDetail(item.cntntsNo);
      await sleep(DELAY_MS);

      if (!detail) { console.log('⏭️ 상세 없음'); skip++; continue; }
      if (detail.steps.length === 0) { console.log('⏭️ 조리 단계 없음'); skip++; continue; }

      const tags = [SOURCE_TAG, detail.clCode].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

      if (!doImport) {
        console.log(`✅ [드라이런] 재료 ${detail.ingredients.length}개, 단계 ${detail.steps.length}개, 태그: ${tags.join(', ')}`);
        success++;
        continue;
      }

      // recipes 삽입
      const { data: inserted, error: recipeErr } = await supabase
        .from('recipes')
        .insert({
          author_id:    ADMIN_USER_ID,
          title:        detail.title,
          description:  detail.sourceNote || null,
          status:       'published',
          thumbnail_url: detail.imgUrl || null,
          source_url:   `https://www.nongsaro.go.kr/portal/ps/psz/psza/contentSub.ps?menuId=PS03915&cntntsNo=${item.cntntsNo}`,
        })
        .select('id')
        .single();

      if (recipeErr || !inserted) {
        console.log(`❌ 삽입 실패: ${recipeErr?.message}`);
        error++;
        continue;
      }
      const recipeId = inserted.id;

      // recipe_tags
      if (tags.length > 0) {
        await supabase.from('recipe_tags').insert(tags.map(t => ({ recipe_id: recipeId, tag_name: t })));
      }

      // recipe_steps
      if (detail.steps.length > 0) {
        await supabase.from('recipe_steps').insert(
          detail.steps.map((instruction, idx) => ({
            recipe_id:    recipeId,
            step_number:  idx + 1,
            instruction,
          }))
        );
      }

      // recipe_ingredients
      if (detail.ingredients.length > 0) {
        await supabase.from('recipe_ingredients').insert(
          detail.ingredients.map((ing, idx) => ({
            recipe_id:       recipeId,
            ingredient_name: ing.name,
            quantity:        ing.quantity,
            unit:            ing.unit,
            display_order:   idx + 1,
          }))
        );
      }

      console.log(`✅ 재료 ${detail.ingredients.length}개, 단계 ${detail.steps.length}개`);
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

/**
 * 농사로 Open API — 지역특산물(localSpcprd) 임포트
 *
 * 지역특산물 목록에서 ingredients_master에 없는 신규 재료만 추가.
 * 이미 동일 이름이 있으면 스킵 (중복 방지).
 *
 * 라이선스: 공공누리 1유형 (출처 표시 의무)
 *
 * 실행:
 *   npx tsx scripts/import-nongsaro-locspc.ts           # 드라이런 (실제 삽입 없음)
 *   npx tsx scripts/import-nongsaro-locspc.ts --import   # dev 실제 삽입
 *   npx tsx scripts/import-nongsaro-locspc.ts --import --prod
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const doImport = process.argv.includes('--import');
const isProd   = process.argv.includes('--prod');

const SUPABASE_URL = isProd
  ? (process.env.NEXT_PUBLIC_SUPABASE_URL_PROD ?? process.env.NEXT_PUBLIC_SUPABASE_URL!)
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = isProd
  ? (process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ?? process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : process.env.SUPABASE_SERVICE_ROLE_KEY!;

const API_KEY  = process.env.NONGSARO_API_KEY!;
const BASE_URL = 'https://api.nongsaro.go.kr/service/localSpcprd/localSpcprdLst';
const PAGE_SIZE = 100;
const DELAY_MS  = 300;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function extractCdata(xml: string, tag: string): string {
  const m = new RegExp(`<${tag}><\\!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, 's').exec(xml);
  return m ? m[1].trim() : '';
}

// ── 목록 전체 수집 ──────────────────────────────────────────────

interface SpecialtyItem {
  cntntsNo: string;
  name: string;
  areaNm: string;
  imgUrl: string;
}

async function fetchAll(): Promise<SpecialtyItem[]> {
  const all: SpecialtyItem[] = [];
  let pageNo = 1;
  let total = Infinity;

  while (all.length < total) {
    const url = `${BASE_URL}?apiKey=${API_KEY}&pageNo=${pageNo}&numOfRows=${PAGE_SIZE}`;
    const res = await fetch(url);
    const xml = await res.text();

    // totalCount
    if (pageNo === 1) {
      const m = /<totalCount[^>]*>(.*?)<\/totalCount>/s.exec(xml);
      total = m ? parseInt(m[1]) : 0;
      console.log(`📦 총 ${total}개`);
    }

    const itemBlocks = xml.match(/<item>(.*?)<\/item>/gs) ?? [];
    if (itemBlocks.length === 0) break;

    for (const block of itemBlocks) {
      const name = extractCdata(block, 'cntntsSj').replace(/\d+$/, '').trim(); // 끝 숫자 제거
      const areaNm  = extractCdata(block, 'areaNm');
      const cntntsNo = extractCdata(block, 'cntntsNo');
      const imgUrl   = extractCdata(block, 'imgUrl');
      if (name) all.push({ cntntsNo, name, areaNm, imgUrl });
    }

    console.log(`  p${pageNo}: ${itemBlocks.length}건 (누적 ${all.length})`);
    pageNo++;
    await sleep(DELAY_MS);
  }
  return all;
}

// ── 메인 ──────────────────────────────────────────────────────

async function main() {
  console.log('🌾 농사로 지역특산물 임포트');
  console.log(`📦 대상: ${isProd ? '🔴 PROD' : '🟡 DEV'} | 모드: ${doImport ? '실제 삽입' : '드라이런'}`);

  const items = await fetchAll();

  // 고유 이름으로 중복 제거 (같은 이름 다른 지역 → 대표 1개)
  const nameMap = new Map<string, SpecialtyItem>();
  for (const item of items) {
    if (!nameMap.has(item.name)) nameMap.set(item.name, item);
  }
  const unique = [...nameMap.values()];
  console.log(`\n📊 고유 재료명: ${unique.length}개 (전체 ${items.length}개)`);

  if (!doImport) {
    console.log('\n[드라이런] 처음 20개:');
    unique.slice(0, 20).forEach(i => console.log(`  - ${i.name} (${i.areaNm})`));
    console.log('\n실제 삽입: --import 플래그 추가');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 기존 name 목록 조회
  const { data: existing } = await supabase
    .from('ingredients_master')
    .select('name');
  const existingNames = new Set((existing ?? []).map((r: { name: string }) => r.name));
  console.log(`\n📋 기존 재료 ${existingNames.size}개`);

  const toInsert = unique.filter(i => !existingNames.has(i.name));
  console.log(`✅ 신규 추가 대상: ${toInsert.length}개`);

  if (toInsert.length === 0) {
    console.log('추가할 새 재료 없음.');
    return;
  }

  const rows = toInsert.map(item => ({
    name: item.name,
    name_ko: item.name,
    category: 'other',
    status: 'approved',
    data_source: 'nongsaro_localSpcprd',
    external_id: item.cntntsNo,
    attribution: '출처: 농사로 지역특산물 (공공누리 1유형)',
    description: `지역특산물 (${item.areaNm})`,
    image_url: item.imgUrl || null,
  }));

  // 100개씩 배치 upsert (이름 중복 시 스킵)
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error, count } = await supabase
      .from('ingredients_master')
      .upsert(batch, { onConflict: 'name', ignoreDuplicates: true })
      .select('id');
    if (error) {
      console.error(`❌ 삽입 에러 (batch ${i / 100 + 1}):`, error.message);
    } else {
      inserted += (count ?? batch.length);
      console.log(`  삽입 ${inserted}/${rows.length}개`);
    }
  }

  console.log(`\n🎉 완료: ${inserted}개 신규 재료 추가`);
}

main().catch(e => { console.error(e); process.exit(1); });

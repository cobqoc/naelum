/**
 * 농사로 Open API — 향토음식 한영대역사전(korEngDictionary)으로 name_en 업데이트
 *
 * '식재료명' 카테고리 항목만 사용 (조리용어 제외).
 * ingredients_master에서 name = wrdCn(한국어)으로 매칭 → name_en이 비어있으면 업데이트.
 *
 * 라이선스: 공공누리 1유형 (출처 표시 의무)
 *
 * 실행:
 *   npx tsx scripts/import-nongsaro-koreng.ts           # 드라이런
 *   npx tsx scripts/import-nongsaro-koreng.ts --import   # dev 실제 업데이트
 *   npx tsx scripts/import-nongsaro-koreng.ts --import --prod
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
const BASE_URL = 'https://api.nongsaro.go.kr/service/korEngDictionary/korEngDictionaryLst';
const PAGE_SIZE = 100;
const DELAY_MS  = 300;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function extractCdata(xml: string, tag: string): string {
  const m = new RegExp(`<${tag}><\\!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, 's').exec(xml);
  return m ? m[1].trim() : '';
}

// HTML 태그·엔티티 제거, 앞뒤 " -" 정리
function cleanEnglish(raw: string): string {
  return raw
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')    // HTML 태그 제거
    .replace(/\([^)]*[가-힣][^)]*\)/g, '') // 괄호 안 한글 제거 (예: (집합적))
    .replace(/\*/g, '')         // 모든 * 제거
    .replace(/^\s*-\s*/, '')    // 앞의 "- " 제거
    .replace(/\s+/g, ' ')
    .trim();
}

// 영어 이름만 추출 (괄호 안 설명 제거, 첫 번째 단어/구 사용)
function extractPrimaryEnglish(raw: string): string {
  const cleaned = cleanEnglish(raw);
  // "(어류) mackerel" → "mackerel"
  const withoutParen = cleaned.replace(/^\([^)]+\)\s*/, '');
  // "mackerel, flatfish, flounder" → "mackerel" (첫 번째 항목)
  const firstItem = withoutParen.split(/[,;]/)[0].trim();
  // "(Am) eggplant" → "eggplant"
  const withoutTag = firstItem.replace(/^\([^)]+\)\s*/, '');
  return withoutTag.trim();
}

interface DictItem {
  wrdCn: string;   // 한국어
  nameEn: string;  // 영어 (정제)
}

// ── 전체 수집 (식재료명만) ────────────────────────────────────

async function fetchAll(): Promise<DictItem[]> {
  const all: DictItem[] = [];
  let pageNo = 1;
  let total = Infinity;

  while (all.length < total) {
    const url = `${BASE_URL}?apiKey=${API_KEY}&pageNo=${pageNo}&numOfRows=${PAGE_SIZE}`;
    const res = await fetch(url);
    const xml = await res.text();

    if (pageNo === 1) {
      const m = /<totalCount[^>]*>(.*?)<\/totalCount>/s.exec(xml);
      total = m ? parseInt(m[1]) : 0;
      console.log(`📦 총 ${total}개 (식재료명만 필터)`);
    }

    const itemBlocks = xml.match(/<item>(.*?)<\/item>/gs) ?? [];
    if (itemBlocks.length === 0) break;

    for (const block of itemBlocks) {
      const cat   = extractCdata(block, 'wrdRelmInfoNm');
      if (cat !== '식재료명') continue;

      const wrdCn  = extractCdata(block, 'wrdCn').replace(/\d+$/, '').trim();
      const wrdEng = extractCdata(block, 'wrdEngCn');
      const nameEn = extractPrimaryEnglish(wrdEng);

      // 한국어 조사/동사어미 포함 → 조리 문장 스킵
      if (/[를을에서의]/.test(wrdCn)) continue;  // 목적격/처소격/소유격 조사
      if (/[다]$/.test(wrdCn) && wrdCn.length > 4) continue;  // 동사형 어미
      // 영어가 동사구(조리법)이면 스킵
      if (/^(season|cut|catch|boil|put|pour|strain|simmer|gnaw|roast|chop|a small|two |one )/.test(nameEn.toLowerCase())) continue;
      // 영어가 너무 길면 단순한 재료명이 아님
      if (nameEn.split(' ').length > 5) continue;

      if (wrdCn && nameEn && /[a-zA-Z]/.test(nameEn)) {
        all.push({ wrdCn, nameEn });
      }
    }

    console.log(`  p${pageNo}: ${itemBlocks.length}건 읽음 (식재료명 누적 ${all.length})`);
    pageNo++;
    await sleep(DELAY_MS);
    if (all.length >= total) break;
    if (itemBlocks.length < PAGE_SIZE) break;
  }
  return all;
}

// ── 메인 ─────────────────────────────────────────────────────

async function main() {
  console.log('📚 농사로 한영사전 → ingredients_master name_en 업데이트');
  console.log(`📦 대상: ${isProd ? '🔴 PROD' : '🟡 DEV'} | 모드: ${doImport ? '실제 업데이트' : '드라이런'}`);

  const items = await fetchAll();

  // 한국어 이름 중복 시 첫 번째 항목만 사용
  const koMap = new Map<string, string>();
  for (const item of items) {
    if (!koMap.has(item.wrdCn)) koMap.set(item.wrdCn, item.nameEn);
  }
  console.log(`\n📊 고유 식재료명: ${koMap.size}개`);

  if (!doImport) {
    console.log('\n[드라이런] 처음 20개:');
    let cnt = 0;
    for (const [ko, en] of koMap) {
      console.log(`  ${ko} → ${en}`);
      if (++cnt >= 20) break;
    }
    console.log('\n실제 업데이트: --import 플래그 추가');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ingredients_master에서 name_en이 비어있는 재료 조회
  const { data: masterRows } = await supabase
    .from('ingredients_master')
    .select('id, name')
    .or('name_en.is.null,name_en.eq.');
  const toUpdate = (masterRows ?? []).filter((r: { id: string; name: string }) => koMap.has(r.name));
  console.log(`\n✅ 매칭 업데이트 대상: ${toUpdate.length}개`);

  if (toUpdate.length === 0) {
    console.log('업데이트할 항목 없음 (이미 모두 채워져 있거나 매칭 없음).');
    return;
  }

  let updated = 0;
  for (const row of toUpdate as { id: string; name: string }[]) {
    const nameEn = koMap.get(row.name)!;
    const { error } = await supabase
      .from('ingredients_master')
      .update({ name_en: nameEn })
      .eq('id', row.id);
    if (error) {
      console.error(`  ❌ ${row.name}: ${error.message}`);
    } else {
      updated++;
      if (updated <= 10 || updated % 20 === 0) {
        console.log(`  ✓ [${updated}/${toUpdate.length}] ${row.name} → ${nameEn}`);
      }
    }
  }

  console.log(`\n🎉 완료: ${updated}개 name_en 업데이트`);
}

main().catch(e => { console.error(e); process.exit(1); });

/**
 * wikim.re.kr 실제 페이지에서 소개글 + 태그 긁어서 DB 업데이트
 * 실행: npx tsx scripts/fix-kimchi-tags-desc.ts
 */

import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import { loadEnvLocal } from './lib/env';
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ODCLOUD_API_KEY = process.env.DATA_GO_KR_API_KEY!;
const ODCLOUD_URL = 'https://api.odcloud.kr/api/15035943/v1/uddi:99c81169-63b9-444a-a963-ca855d0b5135';

interface OdcloudItem {
  '레시피 제목': string;
  키워드: string;
  링크: string;
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function extractAiSeq(url: string): string | null {
  return url.match(/ai_seq=(\d+)/)?.[1] ?? null;
}

/** innerText에서 해시태그 추출: "#김치 #광주김치 ..." → ['김치', '광주김치', ...] */
function parseHashtags(text: string): string[] {
  const tags: string[] = [];
  // 해시태그 패턴: #으로 시작하는 한글/영문/숫자 토큰
  const matches = text.matchAll(/#([가-힣a-zA-Z0-9]+)/g);
  for (const m of matches) {
    const tag = m[1].trim();
    if (tag.length >= 2 && tag.length <= 20) tags.push(tag);
  }
  return [...new Set(tags)];
}

/** innerText에서 소개글 추출 */
function parseDescription(text: string, title: string): string | null {
  const titleIdx = text.indexOf(title);
  if (titleIdx === -1) return null;
  const afterTitle = text.slice(titleIdx + title.length);

  // 조회수 줄 이후부터 재료 섹션 전까지 텍스트
  const ingIdx = afterTitle.search(/\n재료\n|\n만드는\s*방법\n/);
  const section = ingIdx !== -1 ? afterTitle.slice(0, ingIdx) : afterTitle.slice(0, 500);

  const lines = section.split('\n')
    .map(l => l.trim())
    .filter(l =>
      l.length > 10 &&
      !l.startsWith('#') &&           // 해시태그 줄 제외
      !/^(조회수|다운로드|등록일|수정일)/.test(l) &&
      !/^\d+$/.test(l)
    );

  if (lines.length === 0) return null;
  return lines.join(' ').slice(0, 400);
}

async function fetchCatalog(): Promise<OdcloudItem[]> {
  const all: OdcloudItem[] = [];
  let page = 1;
  while (true) {
    const url = `${ODCLOUD_URL}?page=${page}&perPage=100&serviceKey=${ODCLOUD_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    const items: OdcloudItem[] = json.data ?? [];
    all.push(...items);
    if (all.length >= json.totalCount || items.length < 100) break;
    page++;
  }
  return all;
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. 카탈로그 수집 (ai_seq → 링크 맵)
  console.log('📡 카탈로그 수집 중...');
  const catalog = await fetchCatalog();
  const seqToLink = new Map<string, string>();
  const seqToKeywords = new Map<string, string[]>();
  for (const item of catalog) {
    const seq = extractAiSeq(item.링크);
    if (!seq) continue;
    seqToLink.set(seq, item.링크.trim());
    if (item.키워드) {
      const kws = item.키워드.split(/[,;/·# ]+/).map(k => k.trim()).filter(k => k.length >= 2 && k.length <= 20);
      seqToKeywords.set(seq, kws);
    }
  }
  console.log(`✅ 카탈로그 ${catalog.length}개, 링크 매핑 ${seqToLink.size}개\n`);

  // 2. 전체 wikim 레시피 조회
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, title, thumbnail_url')
    .ilike('thumbnail_url', '%wikim%');
  if (!recipes) { console.error('레시피 조회 실패'); process.exit(1); }
  console.log(`대상 레시피: ${recipes.length}개\n`);

  // 3. 기존 태그 전부 삭제 후 재삽입
  console.log('🗑️  기존 태그 삭제 중...');
  const { error: delErr } = await supabase
    .from('recipe_tags')
    .delete()
    .in('recipe_id', recipes.map(r => r.id));
  if (delErr) console.log('삭제 오류:', delErr.message);
  else console.log('✅ 기존 태그 삭제 완료\n');

  // 4. Playwright 시작
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  });
  const pw = await context.newPage();

  const BASE_TAGS = ['한식', '김치', 'Kimchi', 'KoreanFood', '발효음식', '세계김치연구소'];

  let ok = 0;
  let noPage = 0;

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const aiSeq = extractAiSeq(recipe.thumbnail_url ?? '');
    const link = aiSeq ? seqToLink.get(aiSeq) : null;
    const catalogKws = aiSeq ? (seqToKeywords.get(aiSeq) ?? []) : [];

    process.stdout.write(`[${i + 1}/${recipes.length}] ${recipe.title} ... `);

    let pageHashtags: string[] = [];
    let pageDesc: string | null = null;

    if (link) {
      try {
        await pw.goto(link, { waitUntil: 'networkidle', timeout: 25000 });
        const text = await pw.evaluate(() => document.body.innerText);

        pageHashtags = parseHashtags(text);
        pageDesc = parseDescription(text, recipe.title);
      } catch {
        // 페이지 로드 실패 → 카탈로그 키워드만 사용
      }
    } else {
      noPage++;
    }

    // 태그 조합: 페이지 해시태그 + 카탈로그 키워드 + 기본 태그
    const tagsSet = new Set<string>([...BASE_TAGS, ...pageHashtags, ...catalogKws]);

    // 제목 자체도 짧으면 태그로
    if (recipe.title.length <= 12) tagsSet.add(recipe.title);

    const tagRows = [...tagsSet].slice(0, 15).map(tag_name => ({
      recipe_id: recipe.id,
      tag_name,
    }));

    await supabase.from('recipe_tags').insert(tagRows);

    // 소개글: 페이지에서 추출했으면 업데이트
    if (pageDesc && pageDesc.length > 20) {
      await supabase.from('recipes').update({ description: pageDesc }).eq('id', recipe.id);
      console.log(`✅ 태그 ${tagsSet.size}개, 소개글 업데이트`);
    } else {
      console.log(`✅ 태그 ${tagsSet.size}개${link ? '' : ' (페이지 없음)'}`);
    }

    ok++;
    await sleep(500);
  }

  await browser.close();

  console.log('\n──────────────────────────────────');
  console.log(`✅ 처리 완료: ${ok}개`);
  console.log(`⚠️  페이지 없음: ${noPage}개`);
  console.log('──────────────────────────────────\n');

  // 최종 확인
  const { data: check } = await supabase
    .from('recipe_tags')
    .select('recipe_id')
    .in('recipe_id', recipes.map(r => r.id));
  const uniq = new Set(check?.map(r => r.recipe_id));
  console.log(`📊 태그 있는 레시피: ${uniq.size} / ${recipes.length}개`);
}

main();

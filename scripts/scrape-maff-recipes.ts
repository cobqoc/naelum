/**
 * 일본 農林水産省 「うちの郷土料理」 스크래퍼
 *
 * 대상: https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/
 * 라이선스: PDL1.0 (일본 정부 공공데이터 이용규약 1.0) — 상업 이용 가능, 출처 표시 필요
 * 출력: data/maff-recipes-raw.json (일본어 원본, 번역 전)
 *
 * 실행: npx tsx scripts/scrape-maff-recipes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri';
const SEARCH_URL = `${BASE_URL}/search_menu/`;
const CHECKPOINT_FILE = path.join(process.cwd(), 'data/maff-recipes-checkpoint.json');
const OUTPUT_FILE = path.join(process.cwd(), 'data/maff-recipes-raw.json');
const DELAY_MS = 600;

const HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': SEARCH_URL,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en;q=0.5',
};

export interface MaffRawRecipe {
  url: string;
  slug: string;
  prefecture: string;        // 北海道
  name: string;              // 三平汁（さんぺいじる）
  nameKanji: string;         // 三平汁 (괄호 제거)
  images: string[];          // 절대 URL
  transmissionArea: string;  // 주な伝承地域
  mainIngredients: string;   // 주な使用食材
  history: string;           // 歴史・由来・関連行事
  occasion: string;          // 食習の機会や時季
  eatingMethod: string;      // 飲食方法
  preservation: string;      // 保存・継承の取組
  servings: string;          // 材料 헤딩에서 추출 (예: "4人分")
  ingredients: Array<{ name: string; amount: string }>;
  instructions: string[];
  scrapedAt: string;
}

function cleanText(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&middot;/g, '·')
    .replace(/&times;/g, '×')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/ /g, ' ')
    .trim();
}

function extractSection(html: string, sectionName: string): string {
  // <span class="pref">歴史・由来・関連行事</span></h3> 다음 <p> 내용
  const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<span[^>]*>${escapedName}[^<]*</span></h3>\\s*<p>([\\s\\S]*?)</p>`,
  );
  const match = html.match(pattern);
  return match ? cleanText(match[1]) : '';
}

function extractMeta(html: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<span[^>]*>${escapedLabel}</span></h3>\\s*<p[^>]*>([^<]*)</p>`,
  );
  const match = html.match(pattern);
  return match ? cleanText(match[1]) : '';
}

function parseIngredients(html: string): Array<{ name: string; amount: string }> {
  const sectionMatch = html.match(/<ul class="menu_material[^"]*">([\s\S]*?)<\/ul>\s*<\/div>/);
  if (!sectionMatch) return [];

  const section = sectionMatch[1];
  const results: Array<{ name: string; amount: string }> = [];

  // 각 재료 항목: <li>\n<ul class="list">\n<li>이름</li>\n<li>양</li>
  const itemPattern = /<ul class="list">\s*<li>([^<]*)<\/li>\s*<li>([^<]*)<\/li>/g;
  let match;
  while ((match = itemPattern.exec(section)) !== null) {
    const name = cleanText(match[1]);
    const amount = cleanText(match[2]);
    if (name) results.push({ name, amount });
  }
  return results;
}

function parseInstructions(html: string): string[] {
  const sectionMatch = html.match(/<ul class="recipe[^"]*">([\s\S]*?)<\/ul>/);
  if (!sectionMatch) return [];

  const steps: string[] = [];
  const stepPattern = /<div class="txt">([\s\S]*?)<\/div>/g;
  let match;
  while ((match = stepPattern.exec(sectionMatch[1])) !== null) {
    const step = cleanText(match[1]);
    if (step) steps.push(step);
  }
  return steps;
}

function parseRecipePage(html: string, url: string): MaffRawRecipe {
  const slug = url.split('/').pop()?.replace('.html', '') ?? '';

  // 도도부현 — h2 또는 h3, 항상 span.name 바로 앞에 위치
  const prefMatch = html.match(/<span class="pref">([^<]+)<\/span><\/h[23]>\s*<h[23] class="tit06"><span class="name">/);
  const prefecture = prefMatch ? cleanText(prefMatch[1]) : '';

  // 요리명 (후리가나 포함)
  const nameMatch = html.match(/<h[23] class="tit06"><span class="name">([^<]+)<\/span><\/h[23]>/);
  const name = nameMatch ? cleanText(nameMatch[1]) : '';
  // 괄호 안 후리가나 제거
  const nameKanji = name.replace(/（[^）]*）/g, '').trim();

  // 대표 이미지
  const imgPattern = /<div class="menu_main[^"]*">[\s\S]*?<img[^>]+src="([^"]+)"/;
  const imgMatch = html.match(imgPattern);
  const mainImg = imgMatch
    ? imgMatch[1].startsWith('http')
      ? imgMatch[1]
      : `${BASE_URL}/${imgMatch[1].replace(/^\.\.\/\.\.\//, '')}`
    : '';

  // 추가 이미지
  const allImgPattern = /<div class="dl_img"><img[^>]+src="([^"]+)"/g;
  const images: string[] = [];
  let imgM;
  while ((imgM = allImgPattern.exec(html)) !== null) {
    const src = imgM[1].startsWith('http')
      ? imgM[1]
      : `${BASE_URL}/${imgM[1].replace(/^\.\.\/\.\.\//, '')}`;
    if (!images.includes(src)) images.push(src);
  }
  if (mainImg && !images.includes(mainImg)) images.unshift(mainImg);

  // 재료 헤딩에서 인분 수 추출
  const servingsMatch = html.match(/<h2 class="tit05">材料（([^）)]+)）<\/h2>/);
  const servings = servingsMatch ? servingsMatch[1] : '';

  return {
    url,
    slug,
    prefecture,
    name,
    nameKanji,
    images,
    transmissionArea: extractMeta(html, '主な伝承地域'),
    mainIngredients: extractMeta(html, '主な使用食材'),
    history: extractSection(html, '歴史・由来・関連行事'),
    occasion: extractSection(html, '食習の機会や時季'),
    eatingMethod: extractSection(html, '飲食方法'),
    preservation: extractSection(html, '保存・継承の取組'),
    servings,
    ingredients: parseIngredients(html),
    instructions: parseInstructions(html),
    scrapedAt: new Date().toISOString(),
  };
}

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
  throw new Error('unreachable');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAllUrls(): Promise<string[]> {
  console.log('search_menu.js에서 URL 목록 수집 중...');
  const jsUrl = `${BASE_URL}/shared/js/search_menu.js`;
  const js = await fetchWithRetry(jsUrl);
  // "href" : "menu/xxx.html" 패턴 추출
  const matches = [...js.matchAll(/"href"\s*:\s*"(menu\/[^"]+\.html)"/g)];
  const urls = [...new Set(matches.map(m => `${SEARCH_URL}${m[1]}`))];
  console.log(`총 ${urls.length}개 URL 발견`);
  return urls;
}

async function main() {
  // 체크포인트 로드
  let done: Record<string, MaffRawRecipe> = {};
  if (fs.existsSync(CHECKPOINT_FILE)) {
    done = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
    console.log(`체크포인트 로드: ${Object.keys(done).length}개 완료`);
  }

  const urls = await getAllUrls();
  const remaining = urls.filter(u => !done[u]);
  console.log(`남은 레시피: ${remaining.length}개`);

  for (let i = 0; i < remaining.length; i++) {
    const url = remaining[i];
    try {
      const html = await fetchWithRetry(url);
      const recipe = parseRecipePage(html, url);
      done[url] = recipe;

      const progress = `[${i + 1}/${remaining.length}]`;
      console.log(`${progress} ${recipe.prefecture} - ${recipe.nameKanji}`);

      // 50개마다 체크포인트 저장
      if ((i + 1) % 50 === 0) {
        fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(done, null, 2));
        console.log(`  → 체크포인트 저장 (${Object.keys(done).length}개 완료)`);
      }
    } catch (e) {
      console.error(`  ✗ 실패: ${url}`, e);
    }

    await sleep(DELAY_MS);
  }

  // 최종 저장
  const recipes = Object.values(done);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(recipes, null, 2));
  console.log(`\n완료! ${recipes.length}개 저장 → ${OUTPUT_FILE}`);

  // 체크포인트 삭제
  if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE);
}

main().catch(console.error);

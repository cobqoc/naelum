#!/usr/bin/env node
/**
 * 최종 변형:
 *   1) 손잡이 모두 제거
 *   2) ref-exact 색상 적용
 *   3) 냉장(top) 내부 ↔ 냉동(bot) 내부 색상 SWAP
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');
const OUT_DIR = path.join(ROOT, '.fridge-backups');

const reactToSvg = (s) => s
  .replace(/strokeWidth=/g, 'stroke-width=').replace(/strokeLinejoin=/g, 'stroke-linejoin=')
  .replace(/strokeLinecap=/g, 'stroke-linecap=').replace(/strokeDasharray=/g, 'stroke-dasharray=')
  .replace(/stopColor=/g, 'stop-color=').replace(/stopOpacity=/g, 'stop-opacity=')
  .replace(/textAnchor=/g, 'text-anchor=').replace(/fontSize=/g, 'font-size=')
  .replace(/fontWeight=/g, 'font-weight=').replace(/fontFamily=/g, 'font-family=')
  .replace(/letterSpacing=/g, 'letter-spacing=').replace(/clipPath=/g, 'clip-path=')
  .replace(/fillOpacity=/g, 'fill-opacity=').replace(/className=/g, 'class=');
const stripJsxComments = (s) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const extractSvg = (src) => {
  const start = src.indexOf('<svg');
  const end = src.lastIndexOf('</svg>');
  return reactToSvg(stripJsxComments(src.slice(start, end + '</svg>'.length)));
};

const replaceGradient = (svg, id, c1, c2) => {
  const re = new RegExp(`(<linearGradient id="${id}"[^>]*>)([\\s\\S]*?)(</linearGradient>)`);
  return svg.replace(re, `$1<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>$3`);
};

let baseSrc = await readFile(SOURCE, 'utf8');

// ─── 1) 손잡이 제거 — 손잡이 주석부터 그 직후 12개 rect까지 ───
// 마운트(rect 8개) + 막대(rect 4개) = 총 12개. 안전하게 정규식으로 블록 단위로 삭제.
baseSrc = baseSrc.replace(
  /\s*\{\/\* 손잡이 4개[\s\S]*?(?=\s*<rect x="168" y="624")/,
  '\n      '
);

let svg = extractSvg(baseSrc);

// ─── 2) ref-exact 색상 ───
const ref = {
  body:['#e85a3a','#c93820'], dark:['#8a1a10','#6a1008'], light:['#f07050','#d84a30'],
  shelfFront:['#f4c030','#c08820'], shelfTop:['#fadc60','#e8b840'],
  rail:['#f4c030','#c08820'],
};
svg = replaceGradient(svg, 'bodyG', ref.body[0], ref.body[1]);
svg = replaceGradient(svg, 'bodyDark', ref.dark[0], ref.dark[1]);
svg = replaceGradient(svg, 'bodyLight', ref.light[0], ref.light[1]);
svg = replaceGradient(svg, 'creamFrontG', ref.shelfFront[0], ref.shelfFront[1]);
svg = replaceGradient(svg, 'creamTopG', ref.shelfTop[0], ref.shelfTop[1]);
svg = replaceGradient(svg, 'railFrontG', ref.rail[0], ref.rail[1]);
svg = replaceGradient(svg, 'railSideG', ref.rail[1], ref.rail[1]);
svg = replaceGradient(svg, 'railTopG', ref.shelfTop[0], ref.shelfTop[1]);

// ─── 3) 냉장 ↔ 냉동 인테리어 색상 SWAP ───
// 두 색상을 서로 다르게 정의하고 교차 적용.
const fridgeShade = ['#f8f0d8','#e8d8b0']; // 따뜻한 크림 (원래 냉동의 톤)
const freezerShade = ['#e8eef4','#d0dce8']; // 차가운 블루-화이트 (원래 냉장의 톤)
// SWAP: 냉장(interiorG) ← freezerShade의 따뜻한 톤?
// 사용자: "냉장 본체 색상을 -> 냉동 본체 색상으로 / 냉동 본체 색상을 -> 냉장 본체 색상으로"
// = 두 색을 정의해놓고 위치만 바꾸기
svg = replaceGradient(svg, 'interiorG', freezerShade[0], freezerShade[1]);  // 냉장(top)에 차가운 블루
svg = replaceGradient(svg, 'freezerG', fridgeShade[0], fridgeShade[1]);     // 냉동(bot)에 따뜻한 크림

// ─── 렌더 ───
const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f8f4ee; }
  .wrap { width:min(85vw,640px); aspect-ratio:660/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body>
  <div class="wrap">${svg}</div>
</body></html>`;
const htmlPath = path.join(OUT_DIR, '_final-swap.html');
await writeFile(htmlPath, html);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT_DIR, 'final-swap.png'), fullPage: true });
console.log('  → final-swap.png');
await browser.close();

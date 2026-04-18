#!/usr/bin/env node
/**
 * 최종 v2:
 *   1) 냉장 인테리어 살짝 더 연하게 + 냉동 = 냉장 동일
 *   2) 도어 노란 세로바(railFrontG) 그대로 유지
 *   3) 그 옆 도어 외측 프레임(검은 외곽선) 2배 굵기
 *   4) 본체 상단 3번째 선반 제거
 *   5) 손잡이 없음 (이전 단계에서 제거됨)
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

let baseSrc = await readFile(SOURCE, 'utf8');

// 1) 손잡이 제거
baseSrc = baseSrc.replace(
  /\s*\{\/\* 손잡이 4개[\s\S]*?(?=\s*<rect x="168" y="624")/,
  '\n      '
);

// 2) 본체 상단 3번째 선반 제거 (creamTopG + creamFrontG + 라인들 = 라인 277-283)
//    패턴: M 178,304 ~ M 178,324 까지 7개 path
baseSrc = baseSrc.replace(
  /\s*<path d="M 178,304[\s\S]*?M 178,324 L 422,324"[^/]*\/>/,
  ''
);

const extractSvg = (src) => {
  const start = src.indexOf('<svg');
  const end = src.lastIndexOf('</svg>');
  return reactToSvg(stripJsxComments(src.slice(start, end + '</svg>'.length)));
};

let svg = extractSvg(baseSrc);

const replaceGradient = (svg, id, c1, c2) => {
  const re = new RegExp(`(<linearGradient id="${id}"[^>]*>)([\\s\\S]*?)(</linearGradient>)`);
  return svg.replace(re, `$1<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>$3`);
};

// 3) ref-exact 본체/도어 색상 (이전과 동일)
svg = replaceGradient(svg, 'bodyG', '#e85a3a', '#c93820');
svg = replaceGradient(svg, 'bodyDark', '#8a1a10', '#6a1008');
svg = replaceGradient(svg, 'bodyLight', '#f07050', '#d84a30');
svg = replaceGradient(svg, 'creamFrontG', '#f4c030', '#c08820');
svg = replaceGradient(svg, 'creamTopG', '#fadc60', '#e8b840');
svg = replaceGradient(svg, 'railFrontG', '#f4c030', '#c08820');
svg = replaceGradient(svg, 'railSideG', '#c08820', '#c08820');
svg = replaceGradient(svg, 'railTopG', '#fadc60', '#e8b840');

// 4) 인테리어: 냉장 살짝 더 연한 차가운 흰색, 냉동도 동일
const lightInterior = ['#f4f8fc', '#e8eff5'];
svg = replaceGradient(svg, 'interiorG', lightInterior[0], lightInterior[1]);
svg = replaceGradient(svg, 'freezerG', lightInterior[0], lightInterior[1]);

// 5) 도어 외측 프레임 (검은 외곽선) 2배 굵기 — 도어 본체 path들의 stroke-width를 4→8로
//    도어 그룹 안에 있는 fill="url(#bodyG)"|"url(#bodyDark)"|"url(#bodyLight)" 의 외곽선 강화
svg = svg.replace(/fill="url\(#bodyG\)" stroke="#000" stroke-width="4"/g, 'fill="url(#bodyG)" stroke="#000" stroke-width="8"');
// 외곽선 path (rgba(40,40,40,0.3))도 굵게
svg = svg.replace(/fill="none" stroke="rgba\(40,40,40,0\.3\)" stroke-width="3"/g, 'fill="none" stroke="rgba(40,40,40,0.5)" stroke-width="6"');

// 렌더
const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f8f4ee; }
  .wrap { width:min(85vw,640px); aspect-ratio:660/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body>
  <div class="wrap">${svg}</div>
</body></html>`;
const htmlPath = path.join(OUT_DIR, '_final-v2.html');
await writeFile(htmlPath, html);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT_DIR, 'final-v2.png'), fullPage: true });
console.log('  → final-v2.png');
await browser.close();

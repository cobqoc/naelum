#!/usr/bin/env node
/**
 * final-v3: final-swap 구조로 되돌리되
 *   - 병/음식/손잡이 전부 제거
 *   - 냉동 인테리어 = 냉장 인테리어 (통일)
 *   - 냉장 인테리어 색상: final-swap 대비 살짝 더 연한 차가운 흰색
 *   - castShadow 등 내부 그림자 효과 제거
 * 원본(FridgeSVG.tsx)을 직접 수정 + PNG 렌더.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');
const OUT_DIR = path.join(ROOT, '.fridge-backups');

let src = await readFile(SOURCE, 'utf8');

// ── 1) 그라디언트 치환 (final-swap 기반) ─────────────────
const setGrad = (s, id, c1, c2) => {
  const re = new RegExp(
    `(<linearGradient id="${id}"[^>]*>)([\\s\\S]*?)(</linearGradient>)`
  );
  return s.replace(
    re,
    `$1\n          <stop offset="0%" stopColor="${c1}" />\n          <stop offset="100%" stopColor="${c2}" />\n        $3`
  );
};
src = setGrad(src, 'bodyG', '#e85a3a', '#c93820');
src = setGrad(src, 'bodyDark', '#8a1a10', '#6a1008');
src = setGrad(src, 'bodyLight', '#f07050', '#d84a30');
src = setGrad(src, 'creamFrontG', '#f4c030', '#c08820');
src = setGrad(src, 'creamTopG', '#fadc60', '#e8b840');
src = setGrad(src, 'railFrontG', '#f4c030', '#c08820');
src = setGrad(src, 'railTopG', '#fadc60', '#e8b840');
src = setGrad(src, 'railSideG', '#c08820', '#c08820');
// 냉장·냉동 동일, final-swap(`#e8eef4 → #d0dce8`)보다 살짝 더 연하게
src = setGrad(src, 'interiorG', '#f0f4f8', '#d8e4ec');
src = setGrad(src, 'freezerG', '#f0f4f8', '#d8e4ec');

// ── 2) 모든 병/음식 <g>…</g> 블록 제거 ────────────────────
// 도어 선반 내부 병 그룹: 빈 <g></g> 로 대체
src = src.replace(
  /<g>\s*\n(\s*<g transform="translate\([^)]*\)">[\s\S]*?<\/g>\s*\n)+\s*<\/g>/g,
  '<g></g>'
);

// 본체 상단: "추가 상단 아이템들" 블록 제거
src = src.replace(
  /\s*\{\/\* 추가 상단 아이템들 \*\/\}\s*\n\s*<g transform="translate\(186,40\)">[\s\S]*?<\/g>\s*\n/,
  '\n'
);

// 본체 상단 음식 (밀도 높게) 블록 + 3개 선반 위 음식들
src = src.replace(
  /\s*\{\/\* === 본체 상단: 음식 \(밀도 높게\) === \*\/\}[\s\S]*?(?=\s*\{\/\* === 본체 하단)/,
  '\n\n      '
);

// 본체 하단(냉동) 음식 블록
src = src.replace(
  /\s*\{\/\* === 본체 하단\(냉동\): 음식 — 중앙 배치 === \*\/\}[\s\S]*?(?=\s*\{\/\* 본체 하단 가로 선반)/,
  '\n\n      '
);

// ── 3) 손잡이 4개 제거 ──────────────────────────────────
src = src.replace(
  /\s*\{\/\* 큰 손잡이 4개 \*\/\}\s*\n(\s*<rect[^\/]*\/>\s*\n){4}/,
  '\n      '
);

// ── 4) 내부 그림자 효과 제거 ────────────────────────────
// 4-1) castShadow 4개 ellipse
src = src.replace(
  /\s*\{\/\* 3D basic: cast shadow on body interior near hinges \*\/\}\s*\n(\s*<ellipse[^\/]*fill="url\(#castShadow\)"[^\/]*\/>\s*\n){4}/,
  '\n    '
);
// 4-2) lightG radial 광원 (본체 상단 밝음)도 제거 (사용자: 그림자 효과 전부 제거 — 광원도 리셋)
// → 엄밀히는 그림자가 아니라 하이라이트이므로 유지. 주석 처리 안 함.

// ── 5) 선반 뒤쪽 다크 밴드 (shelf-back shadow) 제거 ─────
// 도어 선반: rgba(50,30,10,0.35) 및 rgba(50,30,10,0.3) 라인
src = src.replace(
  /\s*<path d="M [^"]*" fill="rgba\(50,30,10,0\.3[05]?\)"[^\/]*\/>\s*\n/g,
  ''
);
// 도어 선반 앞 립 아래 큰 그림자 rgba(0,0,0,0.22) stroke-width=4
src = src.replace(
  /\s*<path d="M [^"]*" fill="none" stroke="rgba\(0,0,0,0\.22\)"[^\/]*\/>\s*\n/g,
  ''
);
// 본체 선반 아래 큰 그림자 rgba(0,0,0,0.2) stroke-width=3
src = src.replace(
  /\s*<path d="M [^"]*" fill="none" stroke="rgba\(0,0,0,0\.2\)"[^\/]*\/>\s*\n/g,
  ''
);

await writeFile(SOURCE, src);
console.log('  → source updated');

// ── 6) PNG 렌더 ────────────────────────────────────────
const reactToSvg = (s) => s
  .replace(/strokeWidth=/g, 'stroke-width=').replace(/strokeLinejoin=/g, 'stroke-linejoin=')
  .replace(/strokeLinecap=/g, 'stroke-linecap=').replace(/strokeDasharray=/g, 'stroke-dasharray=')
  .replace(/stopColor=/g, 'stop-color=').replace(/stopOpacity=/g, 'stop-opacity=')
  .replace(/textAnchor=/g, 'text-anchor=').replace(/fontSize=/g, 'font-size=')
  .replace(/fontWeight=/g, 'font-weight=').replace(/fontFamily=/g, 'font-family=')
  .replace(/letterSpacing=/g, 'letter-spacing=').replace(/clipPath=/g, 'clip-path=')
  .replace(/fillOpacity=/g, 'fill-opacity=').replace(/className=/g, 'class=');
const stripJsx = (s) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const s0 = src.indexOf('<svg'), s1 = src.lastIndexOf('</svg>');
const svg = reactToSvg(stripJsx(src.slice(s0, s1 + '</svg>'.length)));
const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f8f4ee; }
  .wrap { width:min(85vw,640px); aspect-ratio:660/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body><div class="wrap">${svg}</div></body></html>`;
const htmlPath = path.join(OUT_DIR, '_final-v3.html');
await writeFile(htmlPath, html);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT_DIR, 'final-v3.png'), fullPage: true });
console.log('  → final-v3.png');
await browser.close();

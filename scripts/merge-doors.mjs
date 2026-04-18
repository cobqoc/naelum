#!/usr/bin/env node
/**
 * 냉장 + 냉동 도어를 한 문으로 합치기 (좌/우 양쪽).
 *  - 메인 바디 path: 냉장 상단 ~ 냉동 하단 하나로
 *  - 확장 힌지 path: 동일하게 하나로
 *  - 중간 (기존 fridge 하단 + freezer 상단) stroke 및 bodyLight 제거
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');
const OUT_DIR = path.join(ROOT, '.fridge-backups');

let s = await readFile(SOURCE, 'utf8');

// ── 좌 도어 ──
// 냉장 메인 바디: 냉동 바닥까지 확장
s = s.replace(
  '<path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="url(#bodyG)" />',
  '<path d="M 170,24 L 14,2 L 28,624 L 170,622 Z" fill="url(#bodyG)" />'
);
// 냉장 힌지: 냉동 바닥까지 확장
s = s.replace(
  '<path d="M 14,2 L -10,10 L -4,396 L 16,392 Z" fill="url(#bodyG)" />',
  '<path d="M 14,2 L -10,10 L 8,620 L 28,624 Z" fill="url(#bodyG)" />'
);
// 냉장 하단 stroke 제거 (이제 중간에 위치)
s = s.replace(
  '<path d="M -4,396 L 16,392 L 170,390" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />\n      ',
  ''
);
// 냉동 메인 + 힌지 + 상단 stroke 제거 (중복)
s = s.replace(
  '<path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="url(#bodyG)" />\n      ',
  ''
);
s = s.replace(
  '<path d="M 26,406 L 6,410 L 8,620 L 28,624 Z" fill="url(#bodyG)" />\n      ',
  ''
);
s = s.replace(
  '<path d="M 170,402 L 26,406 L 6,410" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />\n      ',
  ''
);
// 냉동 bodyLight (중간 peek) 제거
s = s.replace(
  '<path d="M 26,406 L 16,410 L 158,406 L 170,402 Z" fill="url(#bodyLight)" />\n      ',
  ''
);

// ── 우 도어 ──
// 냉장 메인 바디
s = s.replace(
  '<path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="url(#bodyG)" />',
  '<path d="M 430,24 L 586,2 L 572,624 L 430,622 Z" fill="url(#bodyG)" />'
);
// 냉장 힌지
s = s.replace(
  '<path d="M 586,2 L 610,10 L 604,396 L 584,392 Z" fill="url(#bodyG)" />',
  '<path d="M 586,2 L 610,10 L 592,620 L 572,624 Z" fill="url(#bodyG)" />'
);
// 냉장 하단 stroke 제거
s = s.replace(
  '<path d="M 604,396 L 584,392 L 430,390" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />\n      ',
  ''
);
// 냉동 메인 + 힌지 + 상단 stroke 제거
s = s.replace(
  '<path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="url(#bodyG)" />\n      ',
  ''
);
s = s.replace(
  '<path d="M 574,406 L 594,410 L 592,620 L 572,624 Z" fill="url(#bodyG)" />\n      ',
  ''
);
s = s.replace(
  '<path d="M 430,402 L 574,406 L 594,410" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />\n      ',
  ''
);
// 냉동 bodyLight
s = s.replace(
  '<path d="M 430,402 L 442,406 L 574,406 L 584,410 Z" fill="url(#bodyLight)" />\n      ',
  ''
);

await writeFile(SOURCE, s);
console.log('source updated (merged doors)');

// render
const r2s = (x) => x
  .replace(/strokeWidth=/g,'stroke-width=').replace(/strokeLinejoin=/g,'stroke-linejoin=')
  .replace(/strokeLinecap=/g,'stroke-linecap=').replace(/strokeDasharray=/g,'stroke-dasharray=')
  .replace(/stopColor=/g,'stop-color=').replace(/stopOpacity=/g,'stop-opacity=')
  .replace(/textAnchor=/g,'text-anchor=').replace(/fontSize=/g,'font-size=')
  .replace(/fontWeight=/g,'font-weight=').replace(/fontFamily=/g,'font-family=')
  .replace(/letterSpacing=/g,'letter-spacing=').replace(/clipPath=/g,'clip-path=')
  .replace(/fillOpacity=/g,'fill-opacity=').replace(/className=/g,'class=');
const strip = (x) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g,'');
const s0 = s.indexOf('<svg'), s1 = s.lastIndexOf('</svg>');
const svg = r2s(strip(s.slice(s0, s1 + '</svg>'.length)));
const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f8f4ee; }
  .wrap { width:min(85vw,640px); aspect-ratio:660/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body><div class="wrap">${svg}</div></body></html>`;
const htmlPath = path.join(OUT_DIR, '_final-v19.html');
await writeFile(htmlPath, html);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT_DIR, 'final-v19.png'), fullPage: true });
console.log('  → final-v19.png');
await browser.close();

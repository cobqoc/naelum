#!/usr/bin/env node
/**
 * 본체/도어 모두 평평하게 맞추기 + 3D peek 제거.
 *  - 본체 top y=14 → y=2 (도어와 맞춤), 3D peek 2장 제거
 *  - 도어 상/하단 flat (y=2, y=624)
 *  - 도어 interior top/bottom flat (y=40/376 fridge, y=416/598 freezer)
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

// ── 본체 top y=14 → y=2 + 3D peek 제거 ──
s = s.replace(
  '<path d="M 434,14 L 448,6 L 448,618 L 434,624 Z" fill="url(#bodyDark)" />\n      ',
  ''
);
s = s.replace(
  '<path d="M 166,14 L 180,6 L 448,6 L 434,14 Z" fill="url(#bodyLight)" />\n      ',
  ''
);
s = s.replace(
  '<rect x="166" y="14" width="268" height="610" rx="6" fill="url(#bodyG)" />',
  '<rect x="166" y="2" width="268" height="622" rx="6" fill="url(#bodyG)" />'
);
s = s.replace(
  '<rect x="166" y="14" width="268" height="3" fill="#000" />',
  '<rect x="166" y="2" width="268" height="3" fill="#000" />'
);
s = s.replace(
  '<rect x="170" y="16" width="260" height="3" rx="1" fill="url(#chromeG)" />',
  '<rect x="170" y="4" width="260" height="3" rx="1" fill="url(#chromeG)" />'
);

// ── 좌 도어 ──
// 메인 path: 상단/하단 flat
s = s.replace(
  '<path d="M 170,24 L 14,2 L 28,624 L 170,622 Z" fill="url(#bodyG)" />',
  '<path d="M 170,2 L 14,2 L 28,624 L 170,624 Z" fill="url(#bodyG)" />'
);
// 힌지: flat
s = s.replace(
  '<path d="M 14,2 L -10,10 L 8,620 L 28,624 Z" fill="url(#bodyG)" />',
  '<path d="M 14,2 L -10,2 L 8,624 L 28,624 Z" fill="url(#bodyG)" />'
);
// 상단 stroke: 직선
s = s.replace(
  '<path d="M 170,24 L 14,2 L -10,10" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M -10,2 L 170,2" fill="none" stroke="#000" strokeWidth="4" />'
);
// 하단 stroke: 직선
s = s.replace(
  '<path d="M 8,620 L 28,624 L 170,622" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 8,624 L 170,624" fill="none" stroke="#000" strokeWidth="4" />'
);
// bodyLight 상단 peek 제거
s = s.replace(
  '<path d="M 14,2 L 2,10 L 158,28 L 170,24 Z" fill="url(#bodyLight)" />\n      ',
  ''
);
// 인테리어 flat
s = s.replace(
  '<path d="M 28,32 L 170,48 L 170,376 L 30,376 Z" fill="url(#interiorG)" />',
  '<path d="M 28,40 L 170,40 L 170,376 L 28,376 Z" fill="url(#interiorG)" />'
);
s = s.replace(
  '<path d="M 44,420 L 170,415 L 170,598 L 46,598 Z" fill="url(#freezerG)" />',
  '<path d="M 44,416 L 170,416 L 170,598 L 44,598 Z" fill="url(#freezerG)" />'
);

// ── 우 도어 ──
s = s.replace(
  '<path d="M 430,24 L 586,2 L 572,624 L 430,622 Z" fill="url(#bodyG)" />',
  '<path d="M 430,2 L 586,2 L 572,624 L 430,624 Z" fill="url(#bodyG)" />'
);
s = s.replace(
  '<path d="M 586,2 L 610,10 L 592,620 L 572,624 Z" fill="url(#bodyG)" />',
  '<path d="M 586,2 L 610,2 L 592,624 L 572,624 Z" fill="url(#bodyG)" />'
);
s = s.replace(
  '<path d="M 430,24 L 586,2 L 610,10" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 430,2 L 610,2" fill="none" stroke="#000" strokeWidth="4" />'
);
s = s.replace(
  '<path d="M 592,620 L 572,624 L 430,622" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 430,624 L 592,624" fill="none" stroke="#000" strokeWidth="4" />'
);
s = s.replace(
  '<path d="M 430,24 L 442,28 L 586,2 L 598,10 Z" fill="url(#bodyLight)" />\n      ',
  ''
);
s = s.replace(
  '<path d="M 430,49 L 572,32 L 570,376 L 430,376 Z" fill="url(#interiorG)" />',
  '<path d="M 430,40 L 572,40 L 570,376 L 430,376 Z" fill="url(#interiorG)" />'
);
s = s.replace(
  '<path d="M 430,415 L 556,422 L 554,598 L 430,593 Z" fill="url(#freezerG)" />',
  '<path d="M 430,416 L 556,416 L 554,598 L 430,598 Z" fill="url(#freezerG)" />'
);

await writeFile(SOURCE, s);
console.log('source updated (fully flat frames)');

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
const htmlPath = path.join(OUT_DIR, '_final-v20.html');
await writeFile(htmlPath, html);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT_DIR, 'final-v20.png'), fullPage: true });
console.log('  → final-v20.png');
await browser.close();

#!/usr/bin/env node
/**
 * 도어 상·하단을 평평하게 펴서 본체 프레임과 일치시키고,
 * 냉장·냉동 도어 사이 Y=390~402 gap을 제거해 경계선에서 색 불연속 없애기.
 *
 * 결과 Y 경계:
 *   - 본체/도어 top = y=2
 *   - 냉장 인테리어 하단 = y=376 (기존)
 *   - 냉장↔냉동 도어 경계 = y=402 (gap 제거, 기존 y=390/402 병합)
 *   - 냉동 인테리어 상단 = y=416 (기존)
 *   - 본체/도어 bottom = y=624
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

// ========== 좌 냉장 도어 ==========
// 메인 패널: 상단 slant 제거 + 하단을 y=402까지 확장
s = s.replace(
  '<path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="url(#bodyG)" />',
  '<path d="M 170,2 L 14,2 L 16,402 L 170,402 Z" fill="url(#bodyG)" />'
);
// 확장 힌지 패널: 평평
s = s.replace(
  '<path d="M 14,2 L -10,10 L -4,396 L 16,392 Z" fill="url(#bodyG)" />',
  '<path d="M 14,2 L -10,2 L -4,402 L 16,402 Z" fill="url(#bodyG)" />'
);
// bodyLight 상단 peek 제거
s = s.replace(
  '<path d="M 14,2 L 2,10 L 158,28 L 170,24 Z" fill="url(#bodyLight)" />',
  ''
);
// 상/하 수평선
s = s.replace(
  '<path d="M 170,24 L 14,2 L -10,10" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 170,2 L -10,2" fill="none" stroke="#000" strokeWidth="4" />'
);
s = s.replace(
  '<path d="M -4,396 L 16,392 L 170,390" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M -4,402 L 170,402" fill="none" stroke="#000" strokeWidth="4" />'
);

// ========== 좌 냉동 도어 ==========
s = s.replace(
  '<path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="url(#bodyG)" />',
  '<path d="M 170,402 L 26,402 L 28,624 L 170,624 Z" fill="url(#bodyG)" />'
);
s = s.replace(
  '<path d="M 26,406 L 6,410 L 8,620 L 28,624 Z" fill="url(#bodyG)" />',
  '<path d="M 26,402 L 6,402 L 8,624 L 28,624 Z" fill="url(#bodyG)" />'
);
s = s.replace(
  '<path d="M 26,406 L 16,410 L 158,406 L 170,402 Z" fill="url(#bodyLight)" />',
  ''
);
s = s.replace(
  '<path d="M 170,402 L 26,406 L 6,410" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 170,402 L 6,402" fill="none" stroke="#000" strokeWidth="4" />'
);
s = s.replace(
  '<path d="M 8,620 L 28,624 L 170,622" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 8,624 L 170,624" fill="none" stroke="#000" strokeWidth="4" />'
);

// ========== 우 냉장 도어 ==========
s = s.replace(
  '<path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="url(#bodyG)" />',
  '<path d="M 430,2 L 586,2 L 584,402 L 430,402 Z" fill="url(#bodyG)" />'
);
s = s.replace(
  '<path d="M 586,2 L 610,10 L 604,396 L 584,392 Z" fill="url(#bodyG)" />',
  '<path d="M 586,2 L 610,2 L 604,402 L 584,402 Z" fill="url(#bodyG)" />'
);
s = s.replace(
  '<path d="M 430,24 L 442,28 L 586,2 L 598,10 Z" fill="url(#bodyLight)" />',
  ''
);
s = s.replace(
  '<path d="M 430,24 L 586,2 L 610,10" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 430,2 L 610,2" fill="none" stroke="#000" strokeWidth="4" />'
);
s = s.replace(
  '<path d="M 604,396 L 584,392 L 430,390" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 604,402 L 430,402" fill="none" stroke="#000" strokeWidth="4" />'
);

// ========== 우 냉동 도어 ==========
s = s.replace(
  '<path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="url(#bodyG)" />',
  '<path d="M 430,402 L 574,402 L 572,624 L 430,624 Z" fill="url(#bodyG)" />'
);
s = s.replace(
  '<path d="M 574,406 L 594,410 L 592,620 L 572,624 Z" fill="url(#bodyG)" />',
  '<path d="M 574,402 L 594,402 L 592,624 L 572,624 Z" fill="url(#bodyG)" />'
);
s = s.replace(
  '<path d="M 430,402 L 442,406 L 574,406 L 584,410 Z" fill="url(#bodyLight)" />',
  ''
);
s = s.replace(
  '<path d="M 430,402 L 574,406 L 594,410" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 430,402 L 594,402" fill="none" stroke="#000" strokeWidth="4" />'
);
s = s.replace(
  '<path d="M 592,620 L 572,624 L 430,622" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 592,624 L 430,624" fill="none" stroke="#000" strokeWidth="4" />'
);

// 본체 인테리어 outline의 세로선 제거 — rect (사면 stroke) → 상/하단 수평선만
s = s.replace(
  '<rect x="166" y="20" width="268" height="358" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />',
  '<path d="M 166,20 L 434,20" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />\n      <path d="M 166,378 L 434,378" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />'
);
s = s.replace(
  '<rect x="166" y="409" width="268" height="196" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />',
  '<path d="M 166,409 L 434,409" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />\n      <path d="M 166,605 L 434,605" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />'
);

await writeFile(SOURCE, s);
console.log('source updated (flatten doors + remove faint verticals)');

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
  .wrap { width:min(85vw,640px); aspect-ratio:660/675; }
  svg { width:100%; height:100%; display:block; }
</style></head><body><div class="wrap">${svg}</div></body></html>`;
const htmlPath = path.join(OUT_DIR, '_final-v15.html');
await writeFile(htmlPath, html);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT_DIR, 'final-v15.png'), fullPage: true });
console.log('  → final-v15.png');
await browser.close();

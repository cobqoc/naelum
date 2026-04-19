#!/usr/bin/env node
/**
 * 단차 제거: 본체 프레임 Y 경계를 문 프레임 Y 경계에 맞춤.
 *  - 도어 fridge 내부 바닥 y=376  (body fridge 내부 바닥 y=371 → 376)
 *  - 도어 freezer 내부 상단 y=416 (body freezer 내부 상단 y=411 → 416)
 *  - 도어 freezer 내부 바닥 y=608 (body freezer 내부 바닥 y=603 → 608)
 *  - 도어 바닥 y=624 (body 바닥 y=629 → 624, 다리/그림자 위로 5px 이동)
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

// ── 냉장 내부 하단을 y=376로 연장 ──
s = s.replace(
  '<rect x="166" y="38" width="268" height="335" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />',
  '<rect x="166" y="38" width="268" height="340" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />'
);
s = s.replace(
  '<rect x="166" y="40" width="268" height="331" fill="url(#interiorG)" />',
  '<rect x="166" y="40" width="268" height="336" fill="url(#interiorG)" />'
);

// ── 중앙 separator: y=376-416 (40px, 도어 fridge 바닥~freezer 상단과 정렬) ──
s = s.replace(
  '<rect x="168" y="372" width="264" height="24" rx="1" fill="url(#bodyG)" stroke="#000" strokeWidth="1" />',
  '<rect x="168" y="376" width="264" height="40" rx="1" fill="url(#bodyG)" stroke="#000" strokeWidth="1" />'
);
// 중앙 chrome 바 2개 제거 (새 separator 안쪽에 묻혀 애매해짐)
s = s.replace(
  '<rect x="170" y="371" width="260" height="2" rx="0.5" fill="url(#chromeG)" />\n      ',
  ''
);
s = s.replace(
  '<rect x="170" y="398" width="260" height="2" rx="0.5" fill="url(#chromeG)" />\n      ',
  ''
);

// ── 냉동 내부 상/하단 정렬 (y=416-608) ──
s = s.replace(
  '<rect x="166" y="409" width="268" height="196" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />',
  '<rect x="166" y="414" width="268" height="196" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />'
);
s = s.replace(
  '<rect x="166" y="411" width="268" height="192" fill="url(#freezerG)" />',
  '<rect x="166" y="416" width="268" height="192" fill="url(#freezerG)" />'
);

// ── 본체 바닥 y=629 → y=624 (문 외곽 바닥과 정렬, 본체 전체 5px 짧아짐) ──
s = s.replace(
  '<rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" />',
  '<rect x="166" y="14" width="268" height="610" rx="6" fill="url(#bodyG)" />'
);
s = s.replace(
  '<path d="M 434,14 L 448,6 L 448,623 L 434,629 Z" fill="url(#bodyDark)" />',
  '<path d="M 434,14 L 448,6 L 448,618 L 434,624 Z" fill="url(#bodyDark)" />'
);
s = s.replace(
  '<rect x="166" y="14" width="3" height="615" fill="#000" />',
  '<rect x="166" y="14" width="3" height="610" fill="#000" />'
);
s = s.replace(
  '<rect x="431" y="14" width="3" height="615" fill="#000" />',
  '<rect x="431" y="14" width="3" height="610" fill="#000" />'
);
s = s.replace(
  '<rect x="166" y="626" width="268" height="3" fill="#000" />',
  '<rect x="166" y="621" width="268" height="3" fill="#000" />'
);
s = s.replace('<text x="300" y="622"', '<text x="300" y="617"');
s = s.replace(
  '<rect x="168" y="624" width="264" height="10" rx="2" fill="url(#bodyDark)" stroke="#000" strokeWidth="0.5" />',
  '<rect x="168" y="619" width="264" height="10" rx="2" fill="url(#bodyDark)" stroke="#000" strokeWidth="0.5" />'
);
// 다리: y 값 -5
s = s.replace('d="M 185,629 L 185,641 L 203,641 L 203,629 Z" fill="#7a2818"',
              'd="M 185,624 L 185,636 L 203,636 L 203,624 Z" fill="#7a2818"');
s = s.replace('d="M 185,629 L 190,626 L 208,626 L 203,629 Z" fill="#a04030"',
              'd="M 185,624 L 190,621 L 208,621 L 203,624 Z" fill="#a04030"');
s = s.replace('d="M 203,629 L 208,626 L 208,638 L 203,641 Z" fill="#602018"',
              'd="M 203,624 L 208,621 L 208,633 L 203,636 Z" fill="#602018"');
s = s.replace('d="M 397,629 L 397,641 L 415,641 L 415,629 Z" fill="#7a2818"',
              'd="M 397,624 L 397,636 L 415,636 L 415,624 Z" fill="#7a2818"');
s = s.replace('d="M 397,629 L 402,626 L 420,626 L 415,629 Z" fill="#a04030"',
              'd="M 397,624 L 402,621 L 420,621 L 415,624 Z" fill="#a04030"');
s = s.replace('d="M 415,629 L 420,626 L 420,638 L 415,641 Z" fill="#602018"',
              'd="M 415,624 L 420,621 L 420,633 L 415,636 Z" fill="#602018"');

// 그림자
s = s.replace('<ellipse cx="300" cy="648"', '<ellipse cx="300" cy="643"');

// ── 세로선 제거 ──
// (a) 본체 좌/우 검은 3px 수직 엣지 제거
s = s.replace('<rect x="166" y="14" width="3" height="610" fill="#000" />\n      ', '');
s = s.replace('<rect x="431" y="14" width="3" height="610" fill="#000" />\n      ', '');

// (b) 4개 도어의 메인 바디 + 확장 힌지 + 얇은 40,40,40 아웃라인의 stroke 제거 → 상/하 수평선만 별도 path로 추가

// 좌 냉장 문
s = s.replace(
  '<path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />\n      <path d="M 14,2 L -10,10 L -4,396 L 16,392 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="url(#bodyG)" />\n      <path d="M 14,2 L -10,10 L -4,396 L 16,392 Z" fill="url(#bodyG)" />\n      <path d="M 170,24 L 14,2 L -10,10" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />\n      <path d="M -4,396 L 16,392 L 170,390" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />'
);
s = s.replace(
  '<path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />',
  ''
);

// 좌 냉동 문
s = s.replace(
  '<path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />\n      <path d="M 26,406 L 6,410 L 8,620 L 28,624 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="url(#bodyG)" />\n      <path d="M 26,406 L 6,410 L 8,620 L 28,624 Z" fill="url(#bodyG)" />\n      <path d="M 170,402 L 26,406 L 6,410" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />\n      <path d="M 8,620 L 28,624 L 170,622" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />'
);
s = s.replace(
  '<path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />',
  ''
);

// 우 냉장 문
s = s.replace(
  '<path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />\n      <path d="M 586,2 L 610,10 L 604,396 L 584,392 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="url(#bodyG)" />\n      <path d="M 586,2 L 610,10 L 604,396 L 584,392 Z" fill="url(#bodyG)" />\n      <path d="M 430,24 L 586,2 L 610,10" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />\n      <path d="M 604,396 L 584,392 L 430,390" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />'
);
s = s.replace(
  '<path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />',
  ''
);

// 우 냉동 문
s = s.replace(
  '<path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />\n      <path d="M 574,406 L 594,410 L 592,620 L 572,624 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />',
  '<path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="url(#bodyG)" />\n      <path d="M 574,406 L 594,410 L 592,620 L 572,624 Z" fill="url(#bodyG)" />\n      <path d="M 430,402 L 574,406 L 594,410" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />\n      <path d="M 592,620 L 572,624 L 430,622" fill="none" stroke="#000" strokeWidth="4" strokeLinejoin="round" />'
);
s = s.replace(
  '<path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />',
  ''
);

await writeFile(SOURCE, s);
console.log('source updated (frame alignment)');

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
const htmlPath = path.join(OUT_DIR, '_final-v13.html');
await writeFile(htmlPath, html);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT_DIR, 'final-v13.png'), fullPage: true });
console.log('  → final-v13.png');
await browser.close();

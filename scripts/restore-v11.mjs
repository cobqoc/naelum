#!/usr/bin/env node
/**
 * v11 상태로 복구: _final-v13.html 에서 시작해 align-frames 변경들을 역 적용.
 * v11 = frame 2x 두꺼움 + 본체 일반 (세로 프레임, 3D peek, stroke 있음) + 도어 3D slant
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');
const HTML = path.join(ROOT, '.fridge-backups/_final-v13.html');

let svg = await readFile(HTML, 'utf8');
const start = svg.indexOf('<svg');
const end = svg.lastIndexOf('</svg>') + '</svg>'.length;
svg = svg.slice(start, end);

// ── align-frames 역적용 ──

// 냉장 outline/fill 높이 복구
svg = svg.replace(
  '<rect x="166" y="38" width="268" height="340" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="4" />',
  '<rect x="166" y="38" width="248" height="335" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="4" stroke-linejoin="round" />\n      '
);
svg = svg.replace(
  /<rect x="166" y="38" width="268" height="340"[^/]*\/>\s*/,
  ''
);
svg = svg.replace(
  '<rect x="166" y="40" width="268" height="336" fill="url(#interiorG)" />',
  '<rect x="188" y="40" width="224" height="331" rx="4" fill="url(#interiorG)" />'
);

// 중앙 separator 복구
svg = svg.replace(
  '<rect x="168" y="376" width="264" height="40" rx="1" fill="url(#bodyG)" stroke="#000" stroke-width="1" />',
  '<rect x="168" y="372" width="264" height="12" rx="1" fill="url(#bodyG)" stroke="#000" stroke-width="1" />'
);

// 중앙 chrome 바 복구
svg = svg.replace(
  '<rect x="170" y="398" width="260" height="2" rx="0.5" fill="url(#chromeG)" />',
  '<rect x="170" y="383" width="260" height="2" rx="0.5" fill="url(#chromeG)" />\n      <rect x="170" y="398" width="260" height="2" rx="0.5" fill="url(#chromeG)" />'
);

// 냉동 outline/fill 복구
svg = svg.replace(
  '<rect x="166" y="414" width="268" height="196" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="4" />',
  '<rect x="188" y="409" width="224" height="196" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="4" stroke-linejoin="round" />'
);
svg = svg.replace(
  '<rect x="166" y="416" width="268" height="192" fill="url(#freezerG)" />',
  '<rect x="190" y="411" width="220" height="192" rx="4" fill="url(#freezerG)" />'
);

// 본체 바닥 복구 (y=624 → y=629)
svg = svg.replace(
  '<rect x="166" y="14" width="268" height="610" rx="6" fill="url(#bodyG)" />',
  '<rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" />'
);
svg = svg.replace(
  '<path d="M 434,14 L 448,6 L 448,618 L 434,624 Z" fill="url(#bodyDark)" />',
  '<path d="M 434,14 L 448,6 L 448,623 L 434,629 Z" fill="url(#bodyDark)" />'
);
svg = svg.replace(
  '<rect x="166" y="621" width="268" height="3" fill="#000" />',
  '<rect x="166" y="626" width="268" height="3" fill="#000" />'
);
svg = svg.replace('y="617"', 'y="622"');
svg = svg.replace(
  '<rect x="168" y="619" width="264" height="10"',
  '<rect x="168" y="624" width="264" height="10"'
);
// 다리 y -5 → 복구
svg = svg.replace('d="M 185,624 L 185,636 L 203,636 L 203,624 Z"', 'd="M 185,629 L 185,641 L 203,641 L 203,629 Z"');
svg = svg.replace('d="M 185,624 L 190,621 L 208,621 L 203,624 Z"', 'd="M 185,629 L 190,626 L 208,626 L 203,629 Z"');
svg = svg.replace('d="M 203,624 L 208,621 L 208,633 L 203,636 Z"', 'd="M 203,629 L 208,626 L 208,638 L 203,641 Z"');
svg = svg.replace('d="M 397,624 L 397,636 L 415,636 L 415,624 Z"', 'd="M 397,629 L 397,641 L 415,641 L 415,629 Z"');
svg = svg.replace('d="M 397,624 L 402,621 L 420,621 L 415,624 Z"', 'd="M 397,629 L 402,626 L 420,626 L 415,629 Z"');
svg = svg.replace('d="M 415,624 L 420,621 L 420,633 L 415,636 Z"', 'd="M 415,629 L 420,626 L 420,638 L 415,641 Z"');

// 그림자 cy 복구
svg = svg.replace('<ellipse cx="300" cy="643"', '<ellipse cx="300" cy="648"');

// body 좌/우 검은 3px 수직 엣지 복구
svg = svg.replace(
  '<rect x="166" y="14" width="268" height="3" fill="#000" />',
  '<rect x="166" y="14" width="268" height="3" fill="#000" />\n      <rect x="166" y="14" width="3" height="615" fill="#000" />\n      <rect x="431" y="14" width="3" height="615" fill="#000" />'
);

// 도어 stroke 복구 (수평선 제거 + 메인/힌지 stroke 추가)
// 좌 냉장
svg = svg.replace(
  '<path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="url(#bodyG)" />',
  '<path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="url(#bodyG)" stroke="#000" stroke-width="4" stroke-linejoin="round" />'
);
svg = svg.replace(
  '<path d="M 14,2 L -10,10 L -4,396 L 16,392 Z" fill="url(#bodyG)" />',
  '<path d="M 14,2 L -10,10 L -4,396 L 16,392 Z" fill="url(#bodyG)" stroke="#000" stroke-width="4" stroke-linejoin="round" />'
);
svg = svg.replace(
  '<path d="M 170,24 L 14,2 L -10,10" fill="none" stroke="#000" stroke-width="4" stroke-linejoin="round" />\n      <path d="M -4,396 L 16,392 L 170,390" fill="none" stroke="#000" stroke-width="4" stroke-linejoin="round" />\n      ',
  ''
);
// + 40,40,40 outline 복원 (좌 냉장)
svg = svg.replace(
  '<path d="M 28,22 L 170,38 L 170,376 L 30,376 Z" fill="url(#interiorG)" />',
  '<path d="M 28,22 L 152,36 L 152,376 L 30,376 Z" fill="url(#interiorG)" />'
);

// 좌 냉동
svg = svg.replace(
  '<path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="url(#bodyG)" />',
  '<path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="url(#bodyG)" stroke="#000" stroke-width="4" stroke-linejoin="round" />'
);
svg = svg.replace(
  '<path d="M 26,406 L 6,410 L 8,620 L 28,624 Z" fill="url(#bodyG)" />',
  '<path d="M 26,406 L 6,410 L 8,620 L 28,624 Z" fill="url(#bodyG)" stroke="#000" stroke-width="4" stroke-linejoin="round" />'
);
svg = svg.replace(
  '<path d="M 170,402 L 26,406 L 6,410" fill="none" stroke="#000" stroke-width="4" stroke-linejoin="round" />\n      <path d="M 8,620 L 28,624 L 170,622" fill="none" stroke="#000" stroke-width="4" stroke-linejoin="round" />\n      ',
  ''
);
svg = svg.replace(
  '<path d="M 44,420 L 170,415 L 170,608 L 46,608 Z" fill="url(#freezerG)" />',
  '<path d="M 44,420 L 152,416 L 152,608 L 46,608 Z" fill="url(#freezerG)" />'
);

// 우 냉장
svg = svg.replace(
  '<path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="url(#bodyG)" />',
  '<path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="url(#bodyG)" stroke="#000" stroke-width="4" stroke-linejoin="round" />'
);
svg = svg.replace(
  '<path d="M 586,2 L 610,10 L 604,396 L 584,392 Z" fill="url(#bodyG)" />',
  '<path d="M 586,2 L 610,10 L 604,396 L 584,392 Z" fill="url(#bodyG)" stroke="#000" stroke-width="4" stroke-linejoin="round" />'
);
svg = svg.replace(
  '<path d="M 430,24 L 586,2 L 610,10" fill="none" stroke="#000" stroke-width="4" stroke-linejoin="round" />\n      <path d="M 604,396 L 584,392 L 430,390" fill="none" stroke="#000" stroke-width="4" stroke-linejoin="round" />\n      ',
  ''
);
svg = svg.replace(
  '<path d="M 430,39 L 572,22 L 570,376 L 430,376 Z" fill="url(#interiorG)" />',
  '<path d="M 448,37 L 572,22 L 570,376 L 448,376 Z" fill="url(#interiorG)" />'
);

// 우 냉동
svg = svg.replace(
  '<path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="url(#bodyG)" />',
  '<path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="url(#bodyG)" stroke="#000" stroke-width="4" stroke-linejoin="round" />'
);
svg = svg.replace(
  '<path d="M 574,406 L 594,410 L 592,620 L 572,624 Z" fill="url(#bodyG)" />',
  '<path d="M 574,406 L 594,410 L 592,620 L 572,624 Z" fill="url(#bodyG)" stroke="#000" stroke-width="4" stroke-linejoin="round" />'
);
svg = svg.replace(
  '<path d="M 430,402 L 574,406 L 594,410" fill="none" stroke="#000" stroke-width="4" stroke-linejoin="round" />\n      <path d="M 592,620 L 572,624 L 430,622" fill="none" stroke="#000" stroke-width="4" stroke-linejoin="round" />\n      ',
  ''
);
svg = svg.replace(
  '<path d="M 430,415 L 556,422 L 554,608 L 430,603 Z" fill="url(#freezerG)" />',
  '<path d="M 448,416 L 556,422 L 554,608 L 448,604 Z" fill="url(#freezerG)" />'
);

// SVG → JSX 속성 변환
const map = [
  ['stroke-width=', 'strokeWidth='],
  ['stroke-linejoin=', 'strokeLinejoin='],
  ['stroke-linecap=', 'strokeLinecap='],
  ['stroke-dasharray=', 'strokeDasharray='],
  ['stop-color=', 'stopColor='],
  ['stop-opacity=', 'stopOpacity='],
  ['text-anchor=', 'textAnchor='],
  ['font-size=', 'fontSize='],
  ['font-weight=', 'fontWeight='],
  ['font-family=', 'fontFamily='],
  ['letter-spacing=', 'letterSpacing='],
  ['clip-path=', 'clipPath='],
  ['fill-opacity=', 'fillOpacity='],
  ['class=', 'className='],
];
for (const [from, to] of map) svg = svg.replaceAll(from, to);

const tsx = `'use client';\n\n// v11 복구본\nexport default function FridgeSVG() {\n  return (\n    ${svg}\n  );\n}\n`;
await writeFile(SOURCE, tsx);
console.log('restored → v11');

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
const OUT_DIR = path.join(ROOT, '.fridge-backups');
const rerendered = r2s(strip(svg));
const html2 = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f8f4ee; }
  .wrap { width:min(85vw,640px); aspect-ratio:660/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body><div class="wrap">${rerendered}</div></body></html>`;
const htmlPath = path.join(OUT_DIR, '_restored-v11.html');
await writeFile(htmlPath, html2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT_DIR, 'restored-v11.png'), fullPage: true });
console.log('  → restored-v11.png');
await browser.close();

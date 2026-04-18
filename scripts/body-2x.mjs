#!/usr/bin/env node
/**
 * 본체(냉장고 프레임) 가로 폭 2배 확대.
 *   - 문 크기 유지 (좌측 그룹 그대로, 우측 그룹 translate만 +268)
 *   - viewBox 넓힘
 * 전략: 본체 좌표 x=166 기준으로 "확장 영역(268px)" 만큼 우측 요소들 x 값을 +268 shift.
 *   본체 폭 지정하는 width/length 자체는 2배 혹은 +268 방식으로 늘림.
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

// viewBox: -30 -5 660 670 → -30 -5 928 670
src = src.replace(
  /viewBox="-30 -5 660 670"/,
  'viewBox="-30 -5 928 670"'
);

const DX = 268; // 본체 폭 증가량

// ── 본체 (lines approx 130-166) ────────────────────────────
// bodyDark right edge path: M 434,14 L 448,6 L 448,623 L 434,629 → shift x by +268
src = src.replace(
  '<path d="M 434,14 L 448,6 L 448,623 L 434,629 Z" fill="url(#bodyDark)" />',
  '<path d="M 702,14 L 716,6 L 716,623 L 702,629 Z" fill="url(#bodyDark)" />'
);
// bodyLight top edge: M 166,14 L 180,6 L 448,6 L 434,14
src = src.replace(
  '<path d="M 166,14 L 180,6 L 448,6 L 434,14 Z" fill="url(#bodyLight)" />',
  '<path d="M 166,14 L 180,6 L 716,6 L 702,14 Z" fill="url(#bodyLight)" />'
);
// body main rect: width 268 → 536
src = src.replace(
  '<rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" />',
  '<rect x="166" y="14" width="536" height="615" rx="6" fill="url(#bodyG)" />'
);
// black left edge: x=166 w=3 → keep
// black right edge: x=431 → 699
src = src.replace(
  '<rect x="431" y="14" width="3" height="615" fill="#000" />',
  '<rect x="699" y="14" width="3" height="615" fill="#000" />'
);
// top black line: width 268→536
src = src.replace(
  '<rect x="166" y="14" width="268" height="3" fill="#000" />',
  '<rect x="166" y="14" width="536" height="3" fill="#000" />'
);
// bottom black line
src = src.replace(
  '<rect x="166" y="626" width="268" height="3" fill="#000" />',
  '<rect x="166" y="626" width="536" height="3" fill="#000" />'
);
// chrome top bar: width 260→528
src = src.replace(
  '<rect x="170" y="16" width="260" height="3" rx="1" fill="url(#chromeG)" />',
  '<rect x="170" y="16" width="528" height="3" rx="1" fill="url(#chromeG)" />'
);
// chrome mid bars
src = src.replace(
  '<rect x="170" y="383" width="260" height="2" rx="0.5" fill="url(#chromeG)" />',
  '<rect x="170" y="383" width="528" height="2" rx="0.5" fill="url(#chromeG)" />'
);
src = src.replace(
  '<rect x="170" y="398" width="260" height="2" rx="0.5" fill="url(#chromeG)" />',
  '<rect x="170" y="398" width="528" height="2" rx="0.5" fill="url(#chromeG)" />'
);
// NAELUM text: x=300 → 434 (center of new body)
src = src.replace(
  '<text x="300" y="622"',
  '<text x="434" y="622"'
);
// fridge interior outline: x=176 w=248 → w=516
src = src.replace(
  '<rect x="176" y="26" width="248" height="359" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />',
  '<rect x="176" y="26" width="516" height="359" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />'
);
// fridge interior fill: x=178 w=244 → w=512
src = src.replace(
  '<rect x="178" y="28" width="244" height="355" rx="4" fill="url(#interiorG)" />',
  '<rect x="178" y="28" width="512" height="355" rx="4" fill="url(#interiorG)" />'
);
// separator bar at y=384: x=168 w=264 → w=532
src = src.replace(
  '<rect x="168" y="384" width="264" height="12" rx="1" fill="url(#bodyG)" stroke="#000" strokeWidth="1" />',
  '<rect x="168" y="384" width="532" height="12" rx="1" fill="url(#bodyG)" stroke="#000" strokeWidth="1" />'
);
// freezer interior outline: x=176 w=248 → w=516
src = src.replace(
  '<rect x="176" y="397" width="248" height="220" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />',
  '<rect x="176" y="397" width="516" height="220" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />'
);
// freezer interior fill: x=178 w=244 → w=512
src = src.replace(
  '<rect x="178" y="399" width="244" height="216" rx="4" fill="url(#freezerG)" />',
  '<rect x="178" y="399" width="512" height="216" rx="4" fill="url(#freezerG)" />'
);
// bottom feet bar: x=168 w=264 → w=532
src = src.replace(
  '<rect x="168" y="624" width="264" height="10" rx="2" fill="url(#bodyDark)" stroke="#000" strokeWidth="0.5" />',
  '<rect x="168" y="624" width="532" height="10" rx="2" fill="url(#bodyDark)" stroke="#000" strokeWidth="0.5" />'
);

// right foot (x=397-420 shift by +268 = 665-688)
src = src.replace('d="M 397,629 L 397,641 L 415,641 L 415,629 Z"', 'd="M 665,629 L 665,641 L 683,641 L 683,629 Z"');
src = src.replace('d="M 397,629 L 402,626 L 420,626 L 415,629 Z"', 'd="M 665,629 L 670,626 L 688,626 L 683,629 Z"');
src = src.replace('d="M 415,629 L 420,626 L 420,638 L 415,641 Z"', 'd="M 683,629 L 688,626 L 688,638 L 683,641 Z"');

// 우측 문 그룹 translate: matrix(0.69,0,0,1,133.3,0) → matrix(0.69,0,0,1,401.3,0) (2 occurrences)
src = src.replaceAll(
  'transform="matrix(0.69,0,0,1,133.3,0)"',
  'transform="matrix(0.69,0,0,1,401.3,0)"'
);

// shadow ellipse cx
src = src.replace(
  '<ellipse cx="300" cy="648" rx="260" ry="18"',
  '<ellipse cx="434" cy="648" rx="400" ry="18"'
);

await writeFile(SOURCE, src);
console.log('source updated (body 2x)');

// render
const reactToSvg = (s) => s
  .replace(/strokeWidth=/g,'stroke-width=').replace(/strokeLinejoin=/g,'stroke-linejoin=')
  .replace(/strokeLinecap=/g,'stroke-linecap=').replace(/strokeDasharray=/g,'stroke-dasharray=')
  .replace(/stopColor=/g,'stop-color=').replace(/stopOpacity=/g,'stop-opacity=')
  .replace(/textAnchor=/g,'text-anchor=').replace(/fontSize=/g,'font-size=')
  .replace(/fontWeight=/g,'font-weight=').replace(/fontFamily=/g,'font-family=')
  .replace(/letterSpacing=/g,'letter-spacing=').replace(/clipPath=/g,'clip-path=')
  .replace(/fillOpacity=/g,'fill-opacity=').replace(/className=/g,'class=');
const strip = (s) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g,'');
const s0 = src.indexOf('<svg'), s1 = src.lastIndexOf('</svg>');
const svg = reactToSvg(strip(src.slice(s0, s1 + '</svg>'.length)));
const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f8f4ee; }
  .wrap { width:min(95vw,900px); aspect-ratio:928/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body><div class="wrap">${svg}</div></body></html>`;
const htmlPath = path.join(OUT_DIR, '_final-v7.html');
await writeFile(htmlPath, html);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT_DIR, 'final-v7.png'), fullPage: true });
console.log('  → final-v7.png');
await browser.close();

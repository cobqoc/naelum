#!/usr/bin/env node
/**
 * 1) body-2x(가로 폭 2배)를 되돌림 (원래 본체 폭 복귀)
 * 2) 프레임 두께만 2배 (인테리어 영역 축소 → 빨간 프레임 두껍게)
 * 문 크기는 건드리지 않음.
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

// ===== 1) body 2x 되돌리기 =====
s = s.replace('viewBox="-30 -5 928 670"', 'viewBox="-30 -5 660 670"');
s = s.replace('<path d="M 702,14 L 716,6 L 716,623 L 702,629 Z" fill="url(#bodyDark)" />',
              '<path d="M 434,14 L 448,6 L 448,623 L 434,629 Z" fill="url(#bodyDark)" />');
s = s.replace('<path d="M 166,14 L 180,6 L 716,6 L 702,14 Z" fill="url(#bodyLight)" />',
              '<path d="M 166,14 L 180,6 L 448,6 L 434,14 Z" fill="url(#bodyLight)" />');
s = s.replace('<rect x="166" y="14" width="536" height="615" rx="6" fill="url(#bodyG)" />',
              '<rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" />');
s = s.replace('<rect x="699" y="14" width="3" height="615" fill="#000" />',
              '<rect x="431" y="14" width="3" height="615" fill="#000" />');
s = s.replace('<rect x="166" y="14" width="536" height="3" fill="#000" />',
              '<rect x="166" y="14" width="268" height="3" fill="#000" />');
s = s.replace('<rect x="166" y="626" width="536" height="3" fill="#000" />',
              '<rect x="166" y="626" width="268" height="3" fill="#000" />');
s = s.replace('<rect x="170" y="16" width="528" height="3" rx="1" fill="url(#chromeG)" />',
              '<rect x="170" y="16" width="260" height="3" rx="1" fill="url(#chromeG)" />');
s = s.replace('<rect x="170" y="383" width="528" height="2" rx="0.5" fill="url(#chromeG)" />',
              '<rect x="170" y="383" width="260" height="2" rx="0.5" fill="url(#chromeG)" />');
s = s.replace('<rect x="170" y="398" width="528" height="2" rx="0.5" fill="url(#chromeG)" />',
              '<rect x="170" y="398" width="260" height="2" rx="0.5" fill="url(#chromeG)" />');
s = s.replace('<text x="434" y="622"', '<text x="300" y="622"');
s = s.replace('<rect x="168" y="384" width="532" height="12"',
              '<rect x="168" y="384" width="264" height="12"');
s = s.replace('<rect x="168" y="624" width="532"', '<rect x="168" y="624" width="264"');

// 우측 문 translate 원복
s = s.replaceAll('transform="matrix(0.69,0,0,1,401.3,0)"',
                 'transform="matrix(0.69,0,0,1,133.3,0)"');

// shadow ellipse 원복
s = s.replace('<ellipse cx="434" cy="648" rx="400" ry="18"',
              '<ellipse cx="300" cy="648" rx="260" ry="18"');

// 다리 색상 원래대로 (금색 → 다크 레드). NAELUM 텍스트(#ffd700)는 유지
s = s.replace(
  '<path d="M 185,629 L 185,641 L 203,641 L 203,629 Z" fill="#ffd700" />',
  '<path d="M 185,629 L 185,641 L 203,641 L 203,629 Z" fill="#7a2818" />'
);
s = s.replace(
  '<path d="M 185,629 L 190,626 L 208,626 L 203,629 Z" fill="#ffe870" />',
  '<path d="M 185,629 L 190,626 L 208,626 L 203,629 Z" fill="#a04030" />'
);
s = s.replace(
  '<path d="M 203,629 L 208,626 L 208,638 L 203,641 Z" fill="#c09800" />',
  '<path d="M 203,629 L 208,626 L 208,638 L 203,641 Z" fill="#602018" />'
);
s = s.replace(
  '<path d="M 665,629 L 665,641 L 683,641 L 683,629 Z" fill="#ffd700" />',
  '<path d="M 397,629 L 397,641 L 415,641 L 415,629 Z" fill="#7a2818" />'
);
s = s.replace(
  '<path d="M 665,629 L 670,626 L 688,626 L 683,629 Z" fill="#ffe870" />',
  '<path d="M 397,629 L 402,626 L 420,626 L 415,629 Z" fill="#a04030" />'
);
s = s.replace(
  '<path d="M 683,629 L 688,626 L 688,638 L 683,641 Z" fill="#c09800" />',
  '<path d="M 415,629 L 420,626 L 420,638 L 415,641 Z" fill="#602018" />'
);

// ===== 2) 프레임 두께 2배 — 인테리어 축소 =====
// 가로: 좌우 각 +12 shrink, 세로: 위/아래 각 +12 shrink (separator 주변 포함)

// 냉장 outline: x=176 w=248 y=26 h=359 → x=188 w=224 y=38 h=335
s = s.replace(
  '<rect x="176" y="26" width="248" height="359" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />',
  '<rect x="188" y="38" width="224" height="335" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />'
);
// 냉장 fill: x=178 w=244 y=28 h=355 → x=190 w=220 y=40 h=331
s = s.replace(
  '<rect x="178" y="28" width="244" height="355" rx="4" fill="url(#interiorG)" />',
  '<rect x="190" y="40" width="220" height="331" rx="4" fill="url(#interiorG)" />'
);

// 중앙 separator: x=168 w=264 y=384 h=12 → x=168 w=264 y=372 h=24 (2x 두께, 위로 이동)
s = s.replace(
  '<rect x="168" y="384" width="264" height="12" rx="1" fill="url(#bodyG)" stroke="#000" strokeWidth="1" />',
  '<rect x="168" y="372" width="264" height="24" rx="1" fill="url(#bodyG)" stroke="#000" strokeWidth="1" />'
);

// 중앙 chrome 얇은 줄들: y=383→y=371, y=398→y=398(유지)... separator 위아래라 여기는 조정
s = s.replace(
  '<rect x="170" y="383" width="260" height="2" rx="0.5" fill="url(#chromeG)" />',
  '<rect x="170" y="371" width="260" height="2" rx="0.5" fill="url(#chromeG)" />'
);

// 냉동 outline: x=176 w=248 y=397 h=220 → x=188 w=224 y=409 h=196 (위+12, 아래+12 shrink)
s = s.replace(
  '<rect x="176" y="397" width="248" height="220" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />',
  '<rect x="188" y="409" width="224" height="196" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />'
);
// 냉동 fill: x=178 w=244 y=399 h=216 → x=190 w=220 y=411 h=192
s = s.replace(
  '<rect x="178" y="399" width="244" height="216" rx="4" fill="url(#freezerG)" />',
  '<rect x="190" y="411" width="220" height="192" rx="4" fill="url(#freezerG)" />'
);

// ===== 3) 서랍 재배치 (body 2x 상태에서 넓었던 x=184-432/436-684 → 좁아진 interior x=190-410 기준 2개) =====
// 서랍 좌: x=192-298 (w=106), 우: x=302-408 (w=106)
// y: bottom=368, top=316 (h=52: top plate 10 + front 42)
s = s.replace(
  /<path d="M 184,328 L 432,328 L 432,338 L 184,338 Z" fill="url\(#creamTopG\)"[^/]*\/>\s*\n\s*<path d="M 184,338 L 432,338 L 432,380 L 184,380 Z" fill="url\(#creamFrontG\)"[^/]*\/>\s*\n\s*<path d="M 184,338 L 432,338"[^/]*\/>\s*\n\s*<rect x="280" y="354" width="56" height="8"[^/]*\/>\s*\n\s*\n\s*<path d="M 436,328 L 684,328 L 684,338 L 436,338 Z" fill="url\(#creamTopG\)"[^/]*\/>\s*\n\s*<path d="M 436,338 L 684,338 L 684,380 L 436,380 Z" fill="url\(#creamFrontG\)"[^/]*\/>\s*\n\s*<path d="M 436,338 L 684,338"[^/]*\/>\s*\n\s*<rect x="532" y="354" width="56" height="8"[^/]*\/>/,
  `<path d="M 192,316 L 298,316 L 298,326 L 192,326 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 192,326 L 298,326 L 298,368 L 192,368 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 192,326 L 298,326" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <rect x="228" y="342" width="34" height="7" rx="2" fill="#8a5020" stroke="#000" strokeWidth="1.2" />

      <path d="M 302,316 L 408,316 L 408,326 L 302,326 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 302,326 L 408,326 L 408,368 L 302,368 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 302,326 L 408,326" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <rect x="338" y="342" width="34" height="7" rx="2" fill="#8a5020" stroke="#000" strokeWidth="1.2" />`
);

await writeFile(SOURCE, s);
console.log('source updated (revert body-2x + frame 2x thickness)');

// render
const reactToSvg = (x) => x
  .replace(/strokeWidth=/g,'stroke-width=').replace(/strokeLinejoin=/g,'stroke-linejoin=')
  .replace(/strokeLinecap=/g,'stroke-linecap=').replace(/strokeDasharray=/g,'stroke-dasharray=')
  .replace(/stopColor=/g,'stop-color=').replace(/stopOpacity=/g,'stop-opacity=')
  .replace(/textAnchor=/g,'text-anchor=').replace(/fontSize=/g,'font-size=')
  .replace(/fontWeight=/g,'font-weight=').replace(/fontFamily=/g,'font-family=')
  .replace(/letterSpacing=/g,'letter-spacing=').replace(/clipPath=/g,'clip-path=')
  .replace(/fillOpacity=/g,'fill-opacity=').replace(/className=/g,'class=');
const strip = (x) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g,'');
const s0 = s.indexOf('<svg'), s1 = s.lastIndexOf('</svg>');
const svg = reactToSvg(strip(s.slice(s0, s1 + '</svg>'.length)));
const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f8f4ee; }
  .wrap { width:min(85vw,640px); aspect-ratio:660/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body><div class="wrap">${svg}</div></body></html>`;
const htmlPath = path.join(OUT_DIR, '_final-v10.html');
await writeFile(htmlPath, html);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT_DIR, 'final-v10.png'), fullPage: true });
console.log('  → final-v10.png');
await browser.close();

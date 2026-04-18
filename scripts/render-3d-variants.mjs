#!/usr/bin/env node
/**
 * 현재 디자인에 디테일·3D 입체감만 강화한 10가지 변형.
 * 새 요소(라벨, 디스펜서, 조명 등) 추가 X — 기존 도형의 그림자/하이라이트/엣지만 강화.
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
  .replace(/strokeWidth=/g, 'stroke-width=')
  .replace(/strokeLinejoin=/g, 'stroke-linejoin=')
  .replace(/strokeLinecap=/g, 'stroke-linecap=')
  .replace(/strokeDasharray=/g, 'stroke-dasharray=')
  .replace(/stopColor=/g, 'stop-color=')
  .replace(/stopOpacity=/g, 'stop-opacity=')
  .replace(/textAnchor=/g, 'text-anchor=')
  .replace(/fontSize=/g, 'font-size=')
  .replace(/fontWeight=/g, 'font-weight=')
  .replace(/fontFamily=/g, 'font-family=')
  .replace(/letterSpacing=/g, 'letter-spacing=')
  .replace(/clipPath=/g, 'clip-path=')
  .replace(/fillOpacity=/g, 'fill-opacity=')
  .replace(/className=/g, 'class=');
const stripJsxComments = (s) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const extractSvg = (src) => {
  const start = src.indexOf('<svg');
  const end = src.lastIndexOf('</svg>');
  return reactToSvg(stripJsxComments(src.slice(start, end + '</svg>'.length)));
};

const variants = [
  {
    name: 'thick-outline',
    label: '1. 외곽 입체 두께 강화',
    defs: `<linearGradient id="o1Side" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(0,0,0,0.6)"/><stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </linearGradient>`,
    overlay: `
      <!-- 본체 외곽 두꺼운 검은 테두리 + 우측 깊이 -->
      <rect x="166" y="14" width="268" height="615" rx="6" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="3"/>
      <rect x="430" y="14" width="18" height="615" fill="url(#o1Side)" pointer-events="none"/>
      <rect x="446" y="6" width="2" height="617" fill="#5a1810"/>`,
  },
  {
    name: 'shelf-depth',
    label: '2. 선반 두께·뒷턱 강화',
    defs: `<linearGradient id="shelfTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.55)"/><stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </linearGradient>`,
    overlay: `
      <!-- 본체 3선반 위 하이라이트 + 두꺼운 그림자 -->
      <rect x="178" y="111" width="244" height="3" fill="url(#shelfTop)"/>
      <rect x="178" y="133" width="244" height="6" fill="rgba(0,0,0,0.45)"/>
      <rect x="178" y="206" width="244" height="3" fill="url(#shelfTop)"/>
      <rect x="178" y="228" width="244" height="6" fill="rgba(0,0,0,0.45)"/>
      <rect x="178" y="301" width="244" height="3" fill="url(#shelfTop)"/>
      <rect x="178" y="323" width="244" height="6" fill="rgba(0,0,0,0.45)"/>
      <!-- 본체 뒷벽 약간 어둡게 (입체감) -->
      <rect x="178" y="28" width="244" height="355" fill="rgba(120,80,40,0.05)" pointer-events="none"/>`,
  },
  {
    name: 'body-3d-contrast',
    label: '3. 본체 측면 그라디언트 (3D 입체)',
    defs: `<linearGradient id="bodyVol" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
        <stop offset="50%" stop-color="rgba(255,255,255,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.35)"/>
      </linearGradient>`,
    overlay: `
      <rect x="166" y="14" width="268" height="615" fill="url(#bodyVol)" pointer-events="none"/>`,
  },
  {
    name: 'door-inner-depth',
    label: '4. 도어 안쪽 깊이감',
    defs: `<radialGradient id="doorDepth" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="80%" stop-color="rgba(0,0,0,0.06)"/>
        <stop offset="100%" stop-color="rgba(40,20,10,0.35)"/>
      </radialGradient>`,
    overlay: `
      <!-- 좌측 냉장 도어 안쪽 비네팅 -->
      <ellipse cx="100" cy="200" rx="55" ry="200" fill="url(#doorDepth)" pointer-events="none"/>
      <ellipse cx="500" cy="200" rx="55" ry="200" fill="url(#doorDepth)" pointer-events="none"/>
      <ellipse cx="100" cy="510" rx="50" ry="120" fill="url(#doorDepth)" pointer-events="none"/>
      <ellipse cx="500" cy="510" rx="50" ry="120" fill="url(#doorDepth)" pointer-events="none"/>`,
  },
  {
    name: 'rounded-bevel',
    label: '5. 모서리 라운딩 + 베벨 하이라이트',
    defs: '',
    overlay: `
      <!-- 본체 위·아래 반사 베벨 -->
      <path d="M 170,18 Q 300,10 430,18" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 170,627 Q 300,635 430,627" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="2"/>
      <!-- 좌·우 도어 모서리 라운드 하이라이트 -->
      <path d="M 67,28 L 75,22" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
      <path d="M 525,28 L 533,22" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>`,
  },
  {
    name: 'matte-finish',
    label: '6. 매트 페인트 재질감',
    defs: `<linearGradient id="matteVeil" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,240,220,0.12)"/>
        <stop offset="50%" stop-color="rgba(0,0,0,0.04)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.18)"/>
      </linearGradient>`,
    overlay: `
      <rect x="166" y="14" width="268" height="615" fill="url(#matteVeil)" pointer-events="none"/>
      <!-- 본체에 미세한 가로줄 (페인트 결) -->
      <line x1="178" y1="80" x2="422" y2="80" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>
      <line x1="178" y1="180" x2="422" y2="180" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>
      <line x1="178" y1="280" x2="422" y2="280" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>
      <line x1="178" y1="450" x2="422" y2="450" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>
      <line x1="178" y1="550" x2="422" y2="550" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>`,
  },
  {
    name: 'corner-shadow',
    label: '7. 네 모서리 앰비언트 섀도우',
    defs: `<radialGradient id="corner" cx="0%" cy="0%" r="50%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.4)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>`,
    overlay: `
      <rect x="166" y="14" width="80" height="80" fill="url(#corner)" pointer-events="none"/>
      <rect x="354" y="14" width="80" height="80" fill="url(#corner)" pointer-events="none" transform="scale(-1,1) translate(-788,0)"/>
      <rect x="166" y="549" width="80" height="80" fill="url(#corner)" pointer-events="none" transform="scale(1,-1) translate(0,-1198)"/>
      <rect x="354" y="549" width="80" height="80" fill="url(#corner)" pointer-events="none" transform="scale(-1,-1) translate(-788,-1198)"/>`,
  },
  {
    name: 'glossy-top-reflection',
    label: '8. 본체 상단 강한 광택',
    defs: `<linearGradient id="topShine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.7)"/>
        <stop offset="50%" stop-color="rgba(255,255,255,0.15)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>`,
    overlay: `
      <rect x="170" y="16" width="260" height="80" rx="3" fill="url(#topShine)" pointer-events="none"/>
      <rect x="190" y="20" width="220" height="2" fill="rgba(255,255,255,0.85)"/>
      <ellipse cx="250" cy="35" rx="60" ry="6" fill="rgba(255,255,255,0.4)"/>`,
  },
  {
    name: 'shelf-back-lip',
    label: '9. 선반 뒷턱 + 캐스트 섀도우',
    defs: `<linearGradient id="lipG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#9a7040"/>
        <stop offset="100%" stop-color="#5a3818"/>
      </linearGradient>`,
    overlay: `
      <!-- 본체 3선반 뒷턱 (얇은 갈색 라인) + 아래로 떨어지는 그림자 -->
      <rect x="180" y="106" width="240" height="6" fill="url(#lipG)" stroke="#000" stroke-width="0.6"/>
      <rect x="180" y="138" width="240" height="14" fill="rgba(0,0,0,0.18)"/>
      <rect x="180" y="201" width="240" height="6" fill="url(#lipG)" stroke="#000" stroke-width="0.6"/>
      <rect x="180" y="233" width="240" height="14" fill="rgba(0,0,0,0.18)"/>
      <rect x="180" y="296" width="240" height="6" fill="url(#lipG)" stroke="#000" stroke-width="0.6"/>
      <rect x="180" y="328" width="240" height="14" fill="rgba(0,0,0,0.18)"/>`,
  },
  {
    name: 'full-3d',
    label: '10. 풀 3D (전체 합성)',
    defs: `<linearGradient id="fullVol" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(255,255,255,0.16)"/>
        <stop offset="60%" stop-color="rgba(255,255,255,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.32)"/>
      </linearGradient>
      <linearGradient id="fullTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.55)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>
      <radialGradient id="fullDoor" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(40,20,10,0.3)"/>
      </radialGradient>
      <linearGradient id="fullLip" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#9a7040"/><stop offset="100%" stop-color="#5a3818"/>
      </linearGradient>`,
    overlay: `
      <!-- 본체 좌→우 입체 그라디언트 -->
      <rect x="166" y="14" width="268" height="615" fill="url(#fullVol)" pointer-events="none"/>
      <!-- 본체 상단 광택 -->
      <rect x="170" y="16" width="260" height="80" rx="3" fill="url(#fullTop)" pointer-events="none"/>
      <rect x="190" y="20" width="220" height="2" fill="rgba(255,255,255,0.85)"/>
      <!-- 도어 안쪽 비네팅 -->
      <ellipse cx="100" cy="200" rx="55" ry="200" fill="url(#fullDoor)" pointer-events="none"/>
      <ellipse cx="500" cy="200" rx="55" ry="200" fill="url(#fullDoor)" pointer-events="none"/>
      <ellipse cx="100" cy="510" rx="50" ry="120" fill="url(#fullDoor)" pointer-events="none"/>
      <ellipse cx="500" cy="510" rx="50" ry="120" fill="url(#fullDoor)" pointer-events="none"/>
      <!-- 본체 3선반 뒷턱 + 아래 그림자 -->
      <rect x="180" y="106" width="240" height="5" fill="url(#fullLip)" stroke="#000" stroke-width="0.6"/>
      <rect x="180" y="138" width="240" height="10" fill="rgba(0,0,0,0.16)"/>
      <rect x="180" y="201" width="240" height="5" fill="url(#fullLip)" stroke="#000" stroke-width="0.6"/>
      <rect x="180" y="233" width="240" height="10" fill="rgba(0,0,0,0.16)"/>
      <rect x="180" y="296" width="240" height="5" fill="url(#fullLip)" stroke="#000" stroke-width="0.6"/>
      <rect x="180" y="328" width="240" height="10" fill="rgba(0,0,0,0.16)"/>
      <!-- 본체 외곽 진한 라인 + 우측 측면 그림자 -->
      <rect x="166" y="14" width="268" height="615" rx="6" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="2.5"/>
      <rect x="430" y="14" width="14" height="615" fill="rgba(0,0,0,0.18)" pointer-events="none"/>
      <!-- 바닥 그림자 -->
      <ellipse cx="320" cy="660" rx="280" ry="12" fill="rgba(0,0,0,0.4)"/>`,
  },
];

const baseSrc = await readFile(SOURCE, 'utf8');
const baseSvg = extractSvg(baseSrc);

const buildVariantSvg = (v) => {
  let svg = baseSvg;
  if (v.defs.trim()) svg = svg.replace('</defs>', `${v.defs}\n      </defs>`);
  svg = svg.replace('</svg>', `${v.overlay}\n    </svg>`);
  return svg;
};

const wrapHtml = (svg, label) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#1a1a1a; font-family:-apple-system,sans-serif; color:#e8e8e8; }
  .label { font-size:18px; font-weight:bold; margin-bottom:12px; color:#ff9966; }
  .wrap { width:min(85vw,640px); aspect-ratio:660/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body>
  <div class="label">${label}</div>
  <div class="wrap">${svg}</div>
</body></html>`;

const browser = await chromium.launch();

for (let i = 0; i < variants.length; i++) {
  const v = variants[i];
  const svg = buildVariantSvg(v);
  const htmlPath = path.join(OUT_DIR, `_3d-${v.name}.html`);
  await writeFile(htmlPath, wrapHtml(svg, v.label));
  const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT_DIR, `3d-${String(i + 1).padStart(2, '0')}-${v.name}.png`), fullPage: true });
  console.log('  → 3d-' + String(i + 1).padStart(2, '0') + '-' + v.name + '.png');
  await ctx.close();
}

const gridHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; padding:20px; background:#1a1a1a; font-family:-apple-system,sans-serif; color:#e8e8e8; }
  h1 { text-align:center; color:#ff9966; margin:0 0 24px; }
  .grid { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; }
  .cell { background:#2a2a2a; border-radius:8px; padding:12px; }
  .cell .label { font-size:12px; font-weight:bold; color:#ff9966; margin-bottom:8px; text-align:center; }
  .cell .svg-wrap { aspect-ratio:660/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body>
  <h1>현재 디자인 + 3D 디테일 10가지</h1>
  <div class="grid">
    ${variants.map(v => `<div class="cell"><div class="label">${v.label}</div><div class="svg-wrap">${buildVariantSvg(v)}</div></div>`).join('')}
  </div>
</body></html>`;
await writeFile(path.join(OUT_DIR, '_3d-grid.html'), gridHtml);
const ctx = await browser.newContext({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + path.join(OUT_DIR, '_3d-grid.html'), { waitUntil: 'load' });
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(OUT_DIR, '3d-grid.png'), fullPage: true });
console.log('  → 3d-grid.png');
await browser.close();
console.log('\nDone.');

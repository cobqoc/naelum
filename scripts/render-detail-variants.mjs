#!/usr/bin/env node
/**
 * 현재 냉장고 디자인을 베이스로, 디테일/사실감만 다른 10가지 변형 생성.
 * 각 변형은 베이스 SVG + 추가 레이어(그림자·하이라이트·힌지·라벨 등) 조합.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');
const OUT_DIR = path.join(ROOT, '.fridge-backups');

// React → SVG 속성 변환
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

// ─── 디테일 레이어 ─────────────────────────────────────────────────────
// 각 변형은 다음을 베이스 SVG에 주입:
//   defs: 추가 gradients/filters
//   overlay: </svg> 직전에 추가 paths
//   inserts: 특정 위치에 삽입할 패치(없으면 생략)

const variants = [
  {
    name: 'soft-shadow',
    label: '1. 소프트 드롭섀도우',
    defs: `
      <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.45)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>`,
    overlay: `
      <ellipse cx="320" cy="660" rx="280" ry="14" fill="url(#floorShadow)"/>
      <ellipse cx="320" cy="665" rx="220" ry="6" fill="rgba(0,0,0,0.35)"/>`,
  },
  {
    name: 'glossy-highlight',
    label: '2. 광택 + 상단 반사',
    defs: `
      <linearGradient id="glossOver" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.55)"/>
        <stop offset="40%" stop-color="rgba(255,255,255,0.1)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>
      <linearGradient id="sideShine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(255,255,255,0)"/>
        <stop offset="10%" stop-color="rgba(255,255,255,0.35)"/>
        <stop offset="20%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>`,
    overlay: `
      <rect x="166" y="14" width="268" height="100" fill="url(#glossOver)" pointer-events="none"/>
      <rect x="80" y="20" width="50" height="600" fill="url(#sideShine)" pointer-events="none"/>
      <rect x="430" y="20" width="50" height="600" fill="url(#sideShine)" pointer-events="none"/>`,
  },
  {
    name: 'visible-hinges',
    label: '3. 상하 힌지 노출',
    defs: `
      <radialGradient id="hingeG" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#7a7a7a"/>
        <stop offset="100%" stop-color="#2a2a2a"/>
      </radialGradient>`,
    overlay: `
      <!-- 좌상 힌지 3개 (냉장 상/중/하) -->
      <rect x="160" y="30" width="14" height="10" rx="2" fill="url(#hingeG)" stroke="#000" stroke-width="1"/>
      <rect x="160" y="200" width="14" height="10" rx="2" fill="url(#hingeG)" stroke="#000" stroke-width="1"/>
      <rect x="160" y="370" width="14" height="10" rx="2" fill="url(#hingeG)" stroke="#000" stroke-width="1"/>
      <!-- 좌하 힌지 (냉동) -->
      <rect x="160" y="412" width="14" height="10" rx="2" fill="url(#hingeG)" stroke="#000" stroke-width="1"/>
      <rect x="160" y="500" width="14" height="10" rx="2" fill="url(#hingeG)" stroke="#000" stroke-width="1"/>
      <rect x="160" y="600" width="14" height="10" rx="2" fill="url(#hingeG)" stroke="#000" stroke-width="1"/>
      <!-- 우상 힌지 -->
      <rect x="426" y="30" width="14" height="10" rx="2" fill="url(#hingeG)" stroke="#000" stroke-width="1"/>
      <rect x="426" y="200" width="14" height="10" rx="2" fill="url(#hingeG)" stroke="#000" stroke-width="1"/>
      <rect x="426" y="370" width="14" height="10" rx="2" fill="url(#hingeG)" stroke="#000" stroke-width="1"/>
      <rect x="426" y="412" width="14" height="10" rx="2" fill="url(#hingeG)" stroke="#000" stroke-width="1"/>
      <rect x="426" y="500" width="14" height="10" rx="2" fill="url(#hingeG)" stroke="#000" stroke-width="1"/>
      <rect x="426" y="600" width="14" height="10" rx="2" fill="url(#hingeG)" stroke="#000" stroke-width="1"/>`,
  },
  {
    name: 'inner-light',
    label: '4. 내부 따뜻한 조명',
    defs: `
      <radialGradient id="warmGlow" cx="50%" cy="20%" r="60%">
        <stop offset="0%" stop-color="rgba(255,230,170,0.55)"/>
        <stop offset="60%" stop-color="rgba(255,200,120,0.15)"/>
        <stop offset="100%" stop-color="rgba(255,200,120,0)"/>
      </radialGradient>`,
    overlay: `
      <ellipse cx="300" cy="60" rx="160" ry="80" fill="url(#warmGlow)" pointer-events="none"/>
      <ellipse cx="300" cy="430" rx="160" ry="50" fill="url(#warmGlow)" pointer-events="none"/>
      <rect x="200" y="20" width="200" height="3" fill="#fff5dc" opacity="0.9"/>
      <rect x="220" y="400" width="160" height="2" fill="#fff5dc" opacity="0.7"/>`,
  },
  {
    name: 'door-seal',
    label: '5. 문 가스켓/씰 라인',
    defs: '',
    overlay: `
      <!-- 좌상 문 안쪽 회색 가스켓 -->
      <rect x="167" y="20" width="3" height="370" fill="#3a3a3a" stroke="#000" stroke-width="0.5"/>
      <rect x="167" y="400" width="3" height="225" fill="#3a3a3a" stroke="#000" stroke-width="0.5"/>
      <rect x="430" y="20" width="3" height="370" fill="#3a3a3a" stroke="#000" stroke-width="0.5"/>
      <rect x="430" y="400" width="3" height="225" fill="#3a3a3a" stroke="#000" stroke-width="0.5"/>
      <!-- 가로 씰 -->
      <rect x="166" y="395" width="268" height="3" fill="#3a3a3a" stroke="#000" stroke-width="0.5"/>`,
  },
  {
    name: 'badges',
    label: '6. 에너지 등급 + 모델 라벨',
    defs: '',
    overlay: `
      <!-- 에너지 등급 라벨 -->
      <g transform="translate(190,30)">
        <rect width="56" height="78" rx="3" fill="#fff" stroke="#000" stroke-width="1.5"/>
        <rect width="56" height="14" fill="#1a8a3a" stroke="#000" stroke-width="1"/>
        <text x="28" y="11" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold">에너지</text>
        <text x="28" y="35" text-anchor="middle" fill="#1a8a3a" font-size="22" font-weight="bold">1</text>
        <text x="28" y="50" text-anchor="middle" fill="#000" font-size="7">등급</text>
        <text x="28" y="68" text-anchor="middle" fill="#5a5a5a" font-size="6">25 kWh/월</text>
      </g>
      <!-- 브랜드 배지 -->
      <g transform="translate(285,360)">
        <rect width="60" height="18" rx="3" fill="#3a3a3a" stroke="#000" stroke-width="1"/>
        <text x="30" y="13" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold" letter-spacing="2">NAELUM</text>
      </g>
      <!-- 모델 번호 -->
      <text x="320" y="616" text-anchor="middle" fill="rgba(0,0,0,0.4)" font-size="7" font-family="monospace">MODEL: NL-4D-690</text>`,
  },
  {
    name: 'shelf-3d',
    label: '7. 선반 3D 입체감',
    defs: `
      <linearGradient id="shelf3d" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.7)"/>
        <stop offset="40%" stop-color="rgba(220,200,160,0.3)"/>
        <stop offset="100%" stop-color="rgba(80,50,20,0.6)"/>
      </linearGradient>`,
    overlay: `
      <!-- 본체 3선반 위에 입체 강조 -->
      <rect x="178" y="113" width="244" height="6" fill="url(#shelf3d)" pointer-events="none"/>
      <rect x="178" y="132" width="244" height="3" fill="rgba(0,0,0,0.4)"/>
      <rect x="178" y="208" width="244" height="6" fill="url(#shelf3d)" pointer-events="none"/>
      <rect x="178" y="227" width="244" height="3" fill="rgba(0,0,0,0.4)"/>
      <rect x="178" y="303" width="244" height="6" fill="url(#shelf3d)" pointer-events="none"/>
      <rect x="178" y="322" width="244" height="3" fill="rgba(0,0,0,0.4)"/>`,
  },
  {
    name: 'wall-shadow',
    label: '8. 벽 그림자 (좌측 광원)',
    defs: `
      <linearGradient id="wallShadow" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="40%" stop-color="rgba(0,0,0,0.05)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.4)"/>
      </linearGradient>`,
    overlay: `
      <rect x="166" y="14" width="268" height="615" fill="url(#wallShadow)" pointer-events="none"/>
      <ellipse cx="600" cy="330" rx="60" ry="280" fill="rgba(0,0,0,0.3)" opacity="0.6"/>`,
  },
  {
    name: 'water-dispenser',
    label: '9. 물·얼음 디스펜서 패널',
    defs: `
      <linearGradient id="dispG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1a1f25"/>
        <stop offset="100%" stop-color="#0a0d12"/>
      </linearGradient>`,
    overlay: `
      <rect x="240" y="50" width="120" height="160" rx="6" fill="url(#dispG)" stroke="#000" stroke-width="2"/>
      <rect x="248" y="58" width="104" height="40" rx="3" fill="#3a4858" stroke="#1a1f25" stroke-width="1"/>
      <text x="300" y="84" text-anchor="middle" fill="#5dd5c8" font-family="monospace" font-size="14" font-weight="bold">ICE / H₂O</text>
      <circle cx="280" cy="130" r="14" fill="#2a3038" stroke="#5a6068" stroke-width="1.5"/>
      <text x="280" y="135" text-anchor="middle" fill="#a8c8e8" font-size="10">💧</text>
      <circle cx="320" cy="130" r="14" fill="#2a3038" stroke="#5a6068" stroke-width="1.5"/>
      <text x="320" y="135" text-anchor="middle" fill="#a8c8e8" font-size="10">❄</text>
      <rect x="258" y="160" width="84" height="40" rx="2" fill="#0a0d12"/>
      <rect x="276" y="170" width="48" height="22" fill="#1a2030" stroke="#3a4048" stroke-width="1"/>`,
  },
  {
    name: 'full-realism',
    label: '10. 풀 디테일 (전부 합성)',
    defs: `
      <radialGradient id="floor2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.45)"/><stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
      <linearGradient id="gloss2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.45)"/>
        <stop offset="50%" stop-color="rgba(255,255,255,0.05)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>
      <radialGradient id="warm2" cx="50%" cy="20%" r="60%">
        <stop offset="0%" stop-color="rgba(255,230,170,0.4)"/>
        <stop offset="100%" stop-color="rgba(255,200,120,0)"/>
      </radialGradient>
      <radialGradient id="hinge2" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#7a7a7a"/><stop offset="100%" stop-color="#2a2a2a"/>
      </radialGradient>`,
    overlay: `
      <!-- 바닥 그림자 -->
      <ellipse cx="320" cy="660" rx="280" ry="14" fill="url(#floor2)"/>
      <!-- 본체 광택 -->
      <rect x="166" y="14" width="268" height="100" fill="url(#gloss2)" pointer-events="none"/>
      <!-- 내부 따뜻한 조명 -->
      <ellipse cx="300" cy="60" rx="160" ry="80" fill="url(#warm2)" pointer-events="none"/>
      <ellipse cx="300" cy="430" rx="160" ry="50" fill="url(#warm2)" pointer-events="none"/>
      <rect x="200" y="20" width="200" height="3" fill="#fff5dc" opacity="0.9"/>
      <!-- 힌지 -->
      <rect x="160" y="30" width="12" height="9" rx="1.5" fill="url(#hinge2)" stroke="#000" stroke-width="0.8"/>
      <rect x="160" y="370" width="12" height="9" rx="1.5" fill="url(#hinge2)" stroke="#000" stroke-width="0.8"/>
      <rect x="160" y="412" width="12" height="9" rx="1.5" fill="url(#hinge2)" stroke="#000" stroke-width="0.8"/>
      <rect x="160" y="600" width="12" height="9" rx="1.5" fill="url(#hinge2)" stroke="#000" stroke-width="0.8"/>
      <rect x="428" y="30" width="12" height="9" rx="1.5" fill="url(#hinge2)" stroke="#000" stroke-width="0.8"/>
      <rect x="428" y="370" width="12" height="9" rx="1.5" fill="url(#hinge2)" stroke="#000" stroke-width="0.8"/>
      <rect x="428" y="412" width="12" height="9" rx="1.5" fill="url(#hinge2)" stroke="#000" stroke-width="0.8"/>
      <rect x="428" y="600" width="12" height="9" rx="1.5" fill="url(#hinge2)" stroke="#000" stroke-width="0.8"/>
      <!-- 가스켓 -->
      <rect x="167" y="20" width="2.5" height="370" fill="#3a3a3a"/>
      <rect x="430" y="20" width="2.5" height="370" fill="#3a3a3a"/>
      <rect x="167" y="400" width="2.5" height="225" fill="#3a3a3a"/>
      <rect x="430" y="400" width="2.5" height="225" fill="#3a3a3a"/>
      <!-- 모델 번호 -->
      <text x="320" y="618" text-anchor="middle" fill="rgba(0,0,0,0.45)" font-size="7" font-family="monospace">MODEL: NL-4D-690</text>`,
  },
];

// ─── 처리 ──────────────────────────────────────────────────────────────
const baseSrc = await readFile(SOURCE, 'utf8');
const baseSvg = extractSvg(baseSrc);

// 베이스 SVG에 defs, overlay 주입
const buildVariantSvg = (variant) => {
  let svg = baseSvg;
  // </defs> 직전에 추가 defs 삽입
  if (variant.defs.trim()) {
    svg = svg.replace('</defs>', `${variant.defs}\n      </defs>`);
  }
  // </svg> 직전에 overlay 삽입
  svg = svg.replace('</svg>', `${variant.overlay}\n    </svg>`);
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
  const html = wrapHtml(svg, v.label);
  const htmlPath = path.join(OUT_DIR, `_detail-${v.name}.html`);
  await writeFile(htmlPath, html);

  const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const out = path.join(OUT_DIR, `detail-${String(i + 1).padStart(2, '0')}-${v.name}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log('  →', path.basename(out));
  await ctx.close();
}

// 합성 그리드 (5x2)
const gridHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; padding:20px; background:#1a1a1a; font-family:-apple-system,sans-serif; color:#e8e8e8; }
  h1 { text-align:center; color:#ff9966; margin:0 0 24px; }
  .grid { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; }
  .cell { background:#2a2a2a; border-radius:8px; padding:12px; }
  .cell .label { font-size:12px; font-weight:bold; color:#ff9966; margin-bottom:8px; text-align:center; }
  .cell .svg-wrap { aspect-ratio:660/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body>
  <h1>현재 디자인 + 디테일 10가지</h1>
  <div class="grid">
    ${variants.map(v => `<div class="cell"><div class="label">${v.label}</div><div class="svg-wrap">${buildVariantSvg(v)}</div></div>`).join('')}
  </div>
</body></html>`;
const gridPath = path.join(OUT_DIR, '_details-grid.html');
await writeFile(gridPath, gridHtml);
const ctx = await browser.newContext({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + gridPath, { waitUntil: 'load' });
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(OUT_DIR, 'details-grid.png'), fullPage: true });
console.log('  → details-grid.png');
await browser.close();
console.log('\nDone. 10 detail variants + grid saved.');

#!/usr/bin/env node
/**
 * 레퍼런스 (빨간 오렌지 본체 + 노랑 선반) 색상 10가지 변형.
 * 본체·선반 색상만 바꾸고 구조/디테일은 유지.
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
  .replace(/strokeWidth=/g, 'stroke-width=').replace(/strokeLinejoin=/g, 'stroke-linejoin=')
  .replace(/strokeLinecap=/g, 'stroke-linecap=').replace(/strokeDasharray=/g, 'stroke-dasharray=')
  .replace(/stopColor=/g, 'stop-color=').replace(/stopOpacity=/g, 'stop-opacity=')
  .replace(/textAnchor=/g, 'text-anchor=').replace(/fontSize=/g, 'font-size=')
  .replace(/fontWeight=/g, 'font-weight=').replace(/fontFamily=/g, 'font-family=')
  .replace(/letterSpacing=/g, 'letter-spacing=').replace(/clipPath=/g, 'clip-path=')
  .replace(/fillOpacity=/g, 'fill-opacity=').replace(/className=/g, 'class=');
const stripJsxComments = (s) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const extractSvg = (src) => {
  const start = src.indexOf('<svg');
  const end = src.lastIndexOf('</svg>');
  return reactToSvg(stripJsxComments(src.slice(start, end + '</svg>'.length)));
};

// 각 변형: 본체 (top/bot), 본체 어두움 (top/bot), 본체 밝음 (top/bot), 인테리어 (top/bot), 선반 정면 (top/bot), 선반 윗면 (top/bot), 레일 정면 (top/bot)
const variants = [
  { name: 'ref-exact',     label: '1. 레퍼런스 정확',
    body:['#e85a3a','#c93820'], dark:['#8a1a10','#6a1008'], light:['#f07050','#d84a30'],
    interior:['#f0f4f8','#dde6ee'], shelfFront:['#f4c030','#c08820'], shelfTop:['#fadc60','#e8b840'],
    rail:['#f4c030','#c08820'] },
  { name: 'orange-warm',   label: '2. 따뜻한 오렌지',
    body:['#ff7548','#d8431e'], dark:['#9a2810','#702008'], light:['#ff8c64','#e25a38'],
    interior:['#f4f0e8','#e8e0d0'], shelfFront:['#ffc848','#d89018'], shelfTop:['#ffd870','#f0b840'],
    rail:['#ffc848','#d89018'] },
  { name: 'deep-red',      label: '3. 진한 빨강 + 호박색',
    body:['#d8402a','#a82010'], dark:['#681010','#480808'], light:['#e8584a','#c0301c'],
    interior:['#f8f4ec','#ece2cc'], shelfFront:['#e8a020','#a06010'], shelfTop:['#f4bc40','#d49020'],
    rail:['#e8a020','#a06010'] },
  { name: 'tomato-lemon',  label: '4. 토마토 + 레몬',
    body:['#f04830','#c02010'], dark:['#801010','#580808'], light:['#ff6048','#e03020'],
    interior:['#f4f8fa','#dde8ee'], shelfFront:['#ffd848','#d8a818'], shelfTop:['#ffe870','#f0c840'],
    rail:['#ffd848','#d8a818'] },
  { name: 'coral-mustard', label: '5. 코랄 + 머스타드',
    body:['#f87060','#d04438'], dark:['#882018','#601010'], light:['#ff8a78','#e85d4c'],
    interior:['#f8f4ec','#ece2cc'], shelfFront:['#d8a838','#a07820'], shelfTop:['#e8c468','#c89838'],
    rail:['#d8a838','#a07820'] },
  { name: 'brick-golden',  label: '6. 벽돌 빨강 + 황금',
    body:['#c04830','#902a18'], dark:['#601810','#400a08'], light:['#d05c44','#a83020'],
    interior:['#f0ece0','#dcd0b0'], shelfFront:['#e8b030','#a87020'], shelfTop:['#f4cc58','#d49830'],
    rail:['#e8b030','#a87020'] },
  { name: 'vermilion-honey', label: '7. 버밀리언 + 허니',
    body:['#e85428','#b82810'], dark:['#781808','#501010'], light:['#f86c40','#c83820'],
    interior:['#f8f4e8','#ece0c8'], shelfFront:['#f0a818','#b87808'], shelfTop:['#facc48','#d89c20'],
    rail:['#f0a818','#b87808'] },
  { name: 'crimson-butter', label: '8. 크림슨 + 버터',
    body:['#d83020','#a01810'], dark:['#600808','#400408'], light:['#e84838','#b82018'],
    interior:['#fdf8e8','#f4e8c8'], shelfFront:['#fcd860','#d8a830'], shelfTop:['#ffe888','#f0c860'],
    rail:['#fcd860','#d8a830'] },
  { name: 'rust-ocher',    label: '9. 러스트 + 오커',
    body:['#b8442a','#882010'], dark:['#581010','#380808'], light:['#c8584a','#a02818'],
    interior:['#ece4d0','#d4c8a8'], shelfFront:['#c8902a','#8a5810'], shelfTop:['#dab048','#a87830'],
    rail:['#c8902a','#8a5810'] },
  { name: 'reference-bold', label: '10. 레퍼런스 + 진한 외곽선',
    body:['#e85a3a','#c93820'], dark:['#7a1808','#580808'], light:['#f8704c','#d8482c'],
    interior:['#e8eef0','#d0dce4'], shelfFront:['#f4b820','#a87010'], shelfTop:['#fad858','#dca830'],
    rail:['#f4b820','#a87010'],
    // 추가로 모든 stroke-width 더 굵게 (overlay에서 처리)
    extraOverlay: `<rect x="166" y="14" width="268" height="615" rx="6" fill="none" stroke="#000" stroke-width="3.5"/>` },
];

const baseSrc = await readFile(SOURCE, 'utf8');
const baseSvg = extractSvg(baseSrc);

const replaceGradient = (svg, id, c1, c2) => {
  const re = new RegExp(`(<linearGradient id="${id}"[^>]*>)([\\s\\S]*?)(</linearGradient>)`);
  return svg.replace(re, `$1<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>$3`);
};

const buildVariant = (v) => {
  let svg = baseSvg;
  svg = replaceGradient(svg, 'bodyG', v.body[0], v.body[1]);
  svg = replaceGradient(svg, 'bodyDark', v.dark[0], v.dark[1]);
  svg = replaceGradient(svg, 'bodyLight', v.light[0], v.light[1]);
  svg = replaceGradient(svg, 'interiorG', v.interior[0], v.interior[1]);
  svg = replaceGradient(svg, 'freezerG', v.interior[0], v.interior[1]);
  svg = replaceGradient(svg, 'creamFrontG', v.shelfFront[0], v.shelfFront[1]);
  svg = replaceGradient(svg, 'creamTopG', v.shelfTop[0], v.shelfTop[1]);
  svg = replaceGradient(svg, 'railFrontG', v.rail[0], v.rail[1]);
  svg = replaceGradient(svg, 'railSideG', v.rail[1], v.rail[1]);
  svg = replaceGradient(svg, 'railTopG', v.shelfTop[0], v.shelfTop[1]);
  if (v.extraOverlay) svg = svg.replace('</svg>', `${v.extraOverlay}\n    </svg>`);
  return svg;
};

const wrapHtml = (svg, label) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f8f4ee; font-family:-apple-system,sans-serif; color:#3a2818; }
  .label { font-size:18px; font-weight:bold; margin-bottom:12px; color:#c04020; }
  .wrap { width:min(85vw,640px); aspect-ratio:660/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body>
  <div class="label">${label}</div>
  <div class="wrap">${svg}</div>
</body></html>`;

const browser = await chromium.launch();

for (let i = 0; i < variants.length; i++) {
  const v = variants[i];
  const svg = buildVariant(v);
  const htmlPath = path.join(OUT_DIR, `_color-${v.name}.html`);
  await writeFile(htmlPath, wrapHtml(svg, v.label));
  const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT_DIR, `color-${String(i + 1).padStart(2, '0')}-${v.name}.png`), fullPage: true });
  console.log('  → color-' + String(i + 1).padStart(2, '0') + '-' + v.name + '.png');
  await ctx.close();
}

const gridHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; padding:20px; background:#1a1a1a; font-family:-apple-system,sans-serif; color:#e8e8e8; }
  h1 { text-align:center; color:#ff9966; margin:0 0 24px; }
  .grid { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; }
  .cell { background:#f8f4ee; border-radius:8px; padding:12px; }
  .cell .label { font-size:12px; font-weight:bold; color:#c04020; margin-bottom:8px; text-align:center; }
  .cell .svg-wrap { aspect-ratio:660/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body>
  <h1>레퍼런스 색상 변형 10가지</h1>
  <div class="grid">
    ${variants.map(v => `<div class="cell"><div class="label">${v.label}</div><div class="svg-wrap">${buildVariant(v)}</div></div>`).join('')}
  </div>
</body></html>`;
await writeFile(path.join(OUT_DIR, '_color-grid.html'), gridHtml);
const ctx = await browser.newContext({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + path.join(OUT_DIR, '_color-grid.html'), { waitUntil: 'load' });
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(OUT_DIR, 'color-grid.png'), fullPage: true });
console.log('  → color-grid.png');
await browser.close();
console.log('\nDone.');

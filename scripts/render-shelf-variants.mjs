#!/usr/bin/env node
/**
 * 냉장고 프레임/내부는 유지, 선반·서랍·세로바 색상만 10가지 variant로 생성.
 * 소스 수정 없이 .fridge-backups/variant-XX-{name}.html 로 저장.
 * 인덱스 파일(variants-index.html)도 생성해서 한 눈에 비교 가능.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const stripJsx = (s) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

// 각 variant: [name, frontLight, frontDark, topLight, topDark, sideColor, bodyShelfColor]
// - front*: creamFrontG / railFrontG (그라디언트 top→bottom)
// - top*:   creamTopG / railTopG
// - side:   railSideG
// - bodyShelf: 본체 유리 선반 fill (현재 #ffffff)
const variants = [
  ['01-classic-white',   '#ffffff', '#d8d8d8', '#ffffff', '#e8e8e8', '#c8c8c8', '#ffffff'],
  ['02-cream-warm',      '#faf3dc', '#d4c490', '#fef8e8', '#e8d8a0', '#c8b680', '#faf3dc'],
  ['03-soft-yellow',     '#fff0a0', '#e8c850', '#fff8d0', '#f4d868', '#d8b840', '#fff8d0'],
  ['04-pastel-pink',     '#ffdce5', '#f09cb5', '#ffeef0', '#f8b8c8', '#e090a8', '#ffeef0'],
  ['05-pastel-blue',     '#d4e4f4', '#98b8d8', '#eaf2fa', '#b8cce4', '#80a8c8', '#eaf2fa'],
  ['06-sage-green',      '#dae8d0', '#9cb894', '#ecf2e4', '#b4c8a8', '#88a488', '#ecf2e4'],
  ['07-peach',           '#ffdcc0', '#f0a070', '#ffece0', '#f8c09c', '#d89878', '#ffece0'],
  ['08-lavender',        '#e8dcf0', '#b498c8', '#f2e8f8', '#d0bce0', '#a080b8', '#f2e8f8'],
  ['09-mint-match',      '#d4ece4', '#88b8a8', '#e8f4ee', '#b0d4c8', '#78a898', '#e8f4ee'],
  ['10-beige-neutral',   '#f0e4cc', '#c8b088', '#f8efd8', '#dcc8a0', '#a89878', '#f8efd8'],
];

const src = await readFile(SOURCE, 'utf8');
const s0 = src.indexOf('<svg'), s1 = src.lastIndexOf('</svg>');
const origSvg = reactToSvg(stripJsx(src.slice(s0, s1 + '</svg>'.length)));

const makeSvg = (frontL, frontD, topL, topD, sideC, bodyShelf) => {
  let s = origSvg;
  // creamFrontG
  s = s.replace(
    /(<linearGradient id="creamFrontG"[^>]*>)[\s\S]*?(<\/linearGradient>)/,
    `$1<stop offset="0%" stop-color="${frontL}"/><stop offset="100%" stop-color="${frontD}"/>$2`
  );
  // creamTopG
  s = s.replace(
    /(<linearGradient id="creamTopG"[^>]*>)[\s\S]*?(<\/linearGradient>)/,
    `$1<stop offset="0%" stop-color="${topL}"/><stop offset="100%" stop-color="${topD}"/>$2`
  );
  // railFrontG
  s = s.replace(
    /(<linearGradient id="railFrontG"[^>]*>)[\s\S]*?(<\/linearGradient>)/,
    `$1<stop offset="0%" stop-color="${frontL}"/><stop offset="100%" stop-color="${frontD}"/>$2`
  );
  // railTopG
  s = s.replace(
    /(<linearGradient id="railTopG"[^>]*>)[\s\S]*?(<\/linearGradient>)/,
    `$1<stop offset="0%" stop-color="${topL}"/><stop offset="100%" stop-color="${topD}"/>$2`
  );
  // railSideG
  s = s.replace(
    /(<linearGradient id="railSideG"[^>]*>)[\s\S]*?(<\/linearGradient>)/,
    `$1<stop offset="0%" stop-color="${sideC}"/><stop offset="100%" stop-color="${sideC}"/>$2`
  );
  // 본체 유리 선반 fill="#ffffff" → bodyShelf (rx="2"가 있는 rect 2개만 — 선반)
  s = s.replace(
    /<rect x="186" y="(120|215)" width="228" height="10" rx="2" fill="#ffffff"/g,
    (m, y) => `<rect x="186" y="${y}" width="228" height="10" rx="2" fill="${bodyShelf}"`
  );
  return s;
};

const wrapHtml = (title, svg) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>
  body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f8f4ee;font-family:-apple-system,sans-serif}
  h1{font-size:16px;color:#555;margin:16px 0 8px}
  .wrap{width:min(85vw,520px);aspect-ratio:660/670}
  svg{width:100%;height:100%;display:block}
</style></head><body><h1>${title}</h1><div class="wrap">${svg}</div></body></html>`;

// 개별 variant 파일 생성
for (const [name, ...colors] of variants) {
  const svg = makeSvg(...colors);
  const filePath = path.join(OUT_DIR, `variant-${name}.html`);
  await writeFile(filePath, wrapHtml(`Variant ${name}`, svg));
  console.log(`→ .fridge-backups/variant-${name}.html`);
}

// 인덱스 페이지 — 10개 모두 그리드로
const indexBody = variants.map(([name, ...colors]) => {
  const svg = makeSvg(...colors);
  return `<div class="cell"><div class="label">${name}</div><div class="svg">${svg}</div></div>`;
}).join('\n');

const indexHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Shelf Color Variants</title><style>
  body{margin:0;background:#2a2a2a;color:#e8e8e8;font-family:-apple-system,sans-serif;padding:20px}
  h1{text-align:center;margin:0 0 24px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;max-width:1600px;margin:0 auto}
  .cell{background:#f8f4ee;border-radius:8px;padding:12px;display:flex;flex-direction:column;align-items:center}
  .label{font-size:13px;font-weight:600;color:#333;margin-bottom:8px;font-family:monospace}
  .svg{width:100%;aspect-ratio:660/670}
  .svg svg{width:100%;height:100%;display:block}
</style></head><body>
  <h1>선반·서랍·세로바 색상 variants (10개)</h1>
  <div class="grid">${indexBody}</div>
</body></html>`;

await writeFile(path.join(OUT_DIR, 'variants-index.html'), indexHtml);
console.log('→ .fridge-backups/variants-index.html (전체 비교)');

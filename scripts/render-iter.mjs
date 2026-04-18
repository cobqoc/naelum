#!/usr/bin/env node
// 반복 렌더 헬퍼 — 현재 FridgeSVG.tsx → .fridge-backups/iter-N.png
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');
const OUT_DIR = path.join(ROOT, '.fridge-backups');

const iter = process.argv[2] || '1';
const label = process.argv[3] || '';

const r2s = (x) => x
  .replace(/strokeWidth=/g,'stroke-width=').replace(/strokeLinejoin=/g,'stroke-linejoin=')
  .replace(/strokeLinecap=/g,'stroke-linecap=').replace(/strokeDasharray=/g,'stroke-dasharray=')
  .replace(/stopColor=/g,'stop-color=').replace(/stopOpacity=/g,'stop-opacity=')
  .replace(/textAnchor=/g,'text-anchor=').replace(/fontSize=/g,'font-size=')
  .replace(/fontWeight=/g,'font-weight=').replace(/fontFamily=/g,'font-family=')
  .replace(/letterSpacing=/g,'letter-spacing=').replace(/clipPath=/g,'clip-path=')
  .replace(/fillOpacity=/g,'fill-opacity=').replace(/className=/g,'class=')
  .replace(/dominantBaseline=/g,'dominant-baseline=');

const strip = (x) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g,'');
const s = await readFile(SOURCE, 'utf8');
const s0 = s.indexOf('<svg'), s1 = s.lastIndexOf('</svg>');
const svg = r2s(strip(s.slice(s0, s1 + '</svg>'.length)));
const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8f4ee}
  .wrap{width:min(85vw,640px);aspect-ratio:660/670}
  svg{width:100%;height:100%;display:block}
</style></head><body><div class="wrap">${svg}</div></body></html>`;
const htmlPath = path.join(OUT_DIR, `_iter-${iter}.html`);
await writeFile(htmlPath, html);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(300);
const out = path.join(OUT_DIR, `iter-${iter}.png`);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`→ iter-${iter}.png ${label}`);

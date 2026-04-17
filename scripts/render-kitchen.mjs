#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/KitchenSVG.tsx');
const OUT_DIR = path.join(ROOT, '.fridge-backups');

const r2s = (x) => x
  .replace(/strokeWidth=/g,'stroke-width=').replace(/strokeLinejoin=/g,'stroke-linejoin=')
  .replace(/strokeLinecap=/g,'stroke-linecap=').replace(/strokeDasharray=/g,'stroke-dasharray=')
  .replace(/stopColor=/g,'stop-color=').replace(/stopOpacity=/g,'stop-opacity=')
  .replace(/textAnchor=/g,'text-anchor=').replace(/fontSize=/g,'font-size=')
  .replace(/fontWeight=/g,'font-weight=').replace(/fontFamily=/g,'font-family=')
  .replace(/letterSpacing=/g,'letter-spacing=').replace(/clipPath=/g,'clip-path=')
  .replace(/fillOpacity=/g,'fill-opacity=').replace(/className=/g,'class=');

const s = await readFile(SOURCE, 'utf8');
const s0 = s.indexOf('<svg'), s1 = s.lastIndexOf('</svg>');
const svg = r2s(s.slice(s0, s1 + '</svg>'.length));
const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8f4ee}
  .wrap{width:min(85vw,700px);aspect-ratio:660/170}
  svg{width:100%;height:100%;display:block}
</style></head><body><div class="wrap">${svg}</div></body></html>`;
const htmlPath = path.join(OUT_DIR, `_kitchen.html`);
await writeFile(htmlPath, html);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 350 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(300);
const out = path.join(OUT_DIR, `kitchen-v1.png`);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`→ kitchen-v1.png`);

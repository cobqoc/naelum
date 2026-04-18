#!/usr/bin/env node
/**
 * 현재 FridgeSVG.tsx를 HTML로 렌더 (소스 수정 없음).
 * 수정 작업 중 배포 없이 브라우저에서 확인하는 용도.
 * 출력: .fridge-backups/current.html
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

const src = await readFile(SOURCE, 'utf8');
const s0 = src.indexOf('<svg'), s1 = src.lastIndexOf('</svg>');
const svg = reactToSvg(stripJsx(src.slice(s0, s1 + '</svg>'.length)));
const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>FridgeSVG preview</title><style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8f4ee}
  .wrap{width:min(85vw,640px);aspect-ratio:660/670}
  svg{width:100%;height:100%;display:block}
</style></head><body><div class="wrap">${svg}</div></body></html>`;
const htmlPath = path.join(OUT_DIR, 'current.html');
await writeFile(htmlPath, html);
console.log('→ ' + path.relative(ROOT, htmlPath));

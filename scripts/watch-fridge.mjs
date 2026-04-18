#!/usr/bin/env node
import { readFile, writeFile, watch } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');
const OUTPUT = path.join(ROOT, 'fridge-preview.html');

const reactToSvgAttr = (s) =>
  s
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

const extractSvg = (source) => {
  const start = source.indexOf('<svg');
  const end = source.lastIndexOf('</svg>');
  if (start < 0 || end < 0) throw new Error('SVG block not found in source');
  return reactToSvgAttr(stripJsxComments(source.slice(start, end + '</svg>'.length)));
};

const buildHtml = (svg) => `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>Fridge Live Preview</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
      font-family: -apple-system, sans-serif;
    }
    .wrap {
      width: min(90vw, 700px);
      aspect-ratio: 660 / 670;
    }
    svg { width: 100%; height: 100%; display: block; }
    .meta {
      position: fixed; top: 12px; left: 12px;
      color: #888; font-size: 12px;
    }
    .badge {
      position: fixed; top: 12px; right: 12px;
      color: #4caf50; font-size: 11px;
      padding: 4px 10px; border: 1px solid #4caf50; border-radius: 999px;
    }
  </style>
</head>
<body>
  <div class="meta">FridgeSVG · auto-reload every 1s · last build ${new Date().toLocaleTimeString('ko-KR')}</div>
  <div class="badge">● live</div>
  <div class="wrap">${svg}</div>
  <script>
    setInterval(async () => {
      try {
        const res = await fetch(location.href, { cache: 'no-store' });
        const text = await res.text();
        const m = text.match(/last build ([^<]+)/);
        const cur = document.querySelector('.meta').textContent.match(/last build (.+)/)[1];
        if (m && m[1] !== cur) location.reload();
      } catch {}
    }, 1000);
  </script>
</body>
</html>
`;

const rebuild = async () => {
  const src = await readFile(SOURCE, 'utf8');
  const svg = extractSvg(src);
  await writeFile(OUTPUT, buildHtml(svg));
  console.log(`[${new Date().toLocaleTimeString('ko-KR')}] rebuilt → ${path.relative(ROOT, OUTPUT)}`);
};

if (!existsSync(SOURCE)) {
  console.error('Source not found:', SOURCE);
  process.exit(1);
}

await rebuild();
console.log('Watching', path.relative(ROOT, SOURCE), '— Ctrl+C to stop');
console.log('Open file://' + OUTPUT);

const watcher = watch(SOURCE);
for await (const _ of watcher) {
  try { await rebuild(); } catch (e) { console.error('Rebuild failed:', e.message); }
}

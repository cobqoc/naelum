#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');

const designs = [
  { n: 1, label: 'orange',     top: '#ff8855', bot: '#e85530' },
  { n: 2, label: 'red',        top: '#e85040', bot: '#b8202a' },
  { n: 3, label: 'warmorange', top: '#ffaa55', bot: '#ee7722' },
  { n: 4, label: 'pink',       top: '#ff5588', bot: '#cc2266' },
  { n: 5, label: 'mint',       top: '#5dd5c8', bot: '#2a9aa0' },
  { n: 6, label: 'blue',       top: '#5588dd', bot: '#2244aa' },
  { n: 7, label: 'lavender',   top: '#b888dd', bot: '#7755aa' },
  { n: 8, label: 'green',      top: '#88cc66', bot: '#558833' },
  { n: 9, label: 'darkgray',   top: '#666666', bot: '#2a2a2a' },
  { n: 10, label: 'cream',     top: '#f4d8a8', bot: '#c89870' },
];

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const screenshot = (out) => new Promise((resolve, reject) => {
  const p = spawn('node', [path.join(ROOT, 'scripts/screenshot-fridge.mjs'), out], { stdio: 'inherit' });
  p.on('close', code => code === 0 ? resolve() : reject(new Error('screenshot failed: ' + code)));
});

let src = await readFile(SOURCE, 'utf8');
const bodyGRe = /(<linearGradient id="bodyG"[\s\S]*?<\/linearGradient>)/;

for (const d of designs) {
  const newGrad = `<linearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="${d.top}" />
          <stop offset="100%" stopColor="${d.bot}" />
        </linearGradient>`;
  const updated = src.replace(bodyGRe, newGrad);
  await writeFile(SOURCE, updated);
  src = updated;
  // also save .tsx snapshot of this design's state
  await writeFile(path.join(ROOT, `.fridge-backups/FridgeSVG.design-${d.n}.tsx`), updated);
  await wait(1500);
  await screenshot(path.join(ROOT, `.fridge-backups/design-${d.n}.png`));
  console.log(`  → design-${d.n} (${d.label}) done`);
}

console.log('\nAll 10 designs rendered.');

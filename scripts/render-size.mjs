#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');
const BASE = path.join(ROOT, '.fridge-backups/FridgeSVG.thick-1.tsx');

// 5 sizes: 1.0x, 1.25x, 1.5x, 1.75x, 2.0x of current top scale (0.55)
// top and bot SAME scale (matched)
const sizes = [
  { n: 1, label: '1.0x',  scale: 0.55 },
  { n: 2, label: '1.25x', scale: 0.69 },
  { n: 3, label: '1.5x',  scale: 0.83 },
  { n: 4, label: '1.75x', scale: 0.96 },
  { n: 5, label: '2.0x',  scale: 1.10 },
];

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const screenshot = (out) => new Promise((resolve, reject) => {
  const p = spawn('node', [path.join(ROOT, 'scripts/screenshot-fridge.mjs'), out], { stdio: 'inherit' });
  p.on('close', code => code === 0 ? resolve() : reject(new Error('screenshot failed: ' + code)));
});

const baseSrc = await readFile(BASE, 'utf8');

const mat = (s, hinge) => {
  const tx = hinge * (1 - s);
  return `matrix(${s},0,0,1,${tx},0)`;
};

for (const v of sizes) {
  let src = baseSrc;
  // Replace any `<g transform="matrix(...,0,0,1,...,0)">` — match any number for scale and tx
  // Determine hinge from tx: if tx around left side (50-150) = hinge 170, else (180-310) = hinge 430
  src = src.replace(/<g transform="matrix\(([\d.]+),0,0,1,([\d.]+),0\)">/g, (m, s, tx) => {
    const hinge = parseFloat(tx) < 170 ? 170 : 430;
    return `<g transform="${mat(v.scale, hinge)}">`;
  });

  await writeFile(SOURCE, src);
  await writeFile(path.join(ROOT, `.fridge-backups/FridgeSVG.size-${v.n}.tsx`), src);
  await wait(1500);
  await screenshot(path.join(ROOT, `.fridge-backups/size-${v.n}.png`));
  console.log(`  → size-${v.n} (${v.label}, scale=${v.scale}) done`);
}

console.log('\nAll 5 size variants rendered.');

#!/usr/bin/env node
/**
 * .fridge-backups/variant-warm-baskets.html의 SVG를 JSX로 변환해
 * app/fridge-home/FridgeSVG.tsx에 적용.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, '.fridge-backups/variant-warm-baskets.html');
const TARGET = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');

const html = await readFile(SOURCE, 'utf8');
const s0 = html.indexOf('<svg');
const s1 = html.lastIndexOf('</svg>');
if (s0 < 0 || s1 < 0) throw new Error('SVG not found');
let svg = html.slice(s0, s1 + '</svg>'.length);

svg = svg.replace(/\sclass="([^"]*)"/g, ' className="$1"');

const replacements = [
  ['stroke-width', 'strokeWidth'],
  ['stroke-linejoin', 'strokeLinejoin'],
  ['stroke-linecap', 'strokeLinecap'],
  ['stroke-dasharray', 'strokeDasharray'],
  ['stroke-opacity', 'strokeOpacity'],
  ['stop-color', 'stopColor'],
  ['stop-opacity', 'stopOpacity'],
  ['text-anchor', 'textAnchor'],
  ['font-size', 'fontSize'],
  ['font-weight', 'fontWeight'],
  ['font-family', 'fontFamily'],
  ['letter-spacing', 'letterSpacing'],
  ['clip-path', 'clipPath'],
  ['fill-opacity', 'fillOpacity'],
  ['fill-rule', 'fillRule'],
  ['shape-rendering', 'shapeRendering'],
];
for (const [from, to] of replacements) {
  const re = new RegExp(`\\s${from}=`, 'g');
  svg = svg.replace(re, ` ${to}=`);
}
svg = svg.replace(/<!--([\s\S]*?)-->/g, (_, c) => `{/*${c}*/}`);

const tsx = `'use client';

// v9 — 웜 골드 + 바구니 타입별 디테일 (병 슬롯/메쉬/라벨/아이스 그리드)
// (variant-warm-baskets.html 기반)
export default function FridgeSVG() {
  return (
    ${svg}
  );
}
`;

await writeFile(TARGET, tsx);
console.log('→ ' + path.relative(ROOT, TARGET));

#!/usr/bin/env node
/**
 * v12 상태로 소스 복구 (_final-v12.html 기반)
 * SVG 속성을 JSX 속성으로 되돌려서 FridgeSVG.tsx 에 씀.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');
const HTML = path.join(ROOT, '.fridge-backups/_final-v13.html');

const html = await readFile(HTML, 'utf8');
const start = html.indexOf('<svg');
const end = html.lastIndexOf('</svg>') + '</svg>'.length;
let svg = html.slice(start, end);

// svg → jsx attribute conversions
const map = [
  ['stroke-width=', 'strokeWidth='],
  ['stroke-linejoin=', 'strokeLinejoin='],
  ['stroke-linecap=', 'strokeLinecap='],
  ['stroke-dasharray=', 'strokeDasharray='],
  ['stop-color=', 'stopColor='],
  ['stop-opacity=', 'stopOpacity='],
  ['text-anchor=', 'textAnchor='],
  ['font-size=', 'fontSize='],
  ['font-weight=', 'fontWeight='],
  ['font-family=', 'fontFamily='],
  ['letter-spacing=', 'letterSpacing='],
  ['clip-path=', 'clipPath='],
  ['fill-opacity=', 'fillOpacity='],
  ['class=', 'className='],
];
for (const [from, to] of map) {
  svg = svg.replaceAll(from, to);
}

const tsx = `'use client';

// v12 복구본
export default function FridgeSVG() {
  return (
    ${svg}
  );
}
`;
await writeFile(SOURCE, tsx);
console.log('restored → FridgeSVG.tsx (v12 state)');

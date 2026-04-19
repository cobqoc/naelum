#!/usr/bin/env node
/**
 * .fridge-backups/variant-warm-items.html의 SVG를 React JSX로 변환해
 * app/fridge-home/FridgeSVG.tsx에 적용.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, '.fridge-backups/variant-warm-items.html');
const TARGET = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');

const html = await readFile(SOURCE, 'utf8');
const s0 = html.indexOf('<svg');
const s1 = html.lastIndexOf('</svg>');
if (s0 < 0 || s1 < 0) throw new Error('SVG not found');
let svg = html.slice(s0, s1 + '</svg>'.length);

// 기존 class="w-full h-full" → className="w-full h-full"
svg = svg.replace(/\sclass="([^"]*)"/g, ' className="$1"');

// SVG snake-case → JSX camelCase 속성 변환
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

// HTML주석 <!-- ... --> → JSX 주석 {/* ... */}
svg = svg.replace(/<!--([\s\S]*?)-->/g, (_, c) => `{/*${c}*/}`);

// 중괄호 이스케이프 필요 (text content에 {} 같은 게 있을 경우) — 현재 내용엔 없음

const tsx = `'use client';

// v8 — 웜 골드 + 원근감 + 도어 바구니 아이템 + LED 조명 + 도어 캐스트 섀도우
// (variant-warm-items.html 기반)
export default function FridgeSVG() {
  return (
    ${svg}
  );
}
`;

await writeFile(TARGET, tsx);
console.log('→ ' + path.relative(ROOT, TARGET));

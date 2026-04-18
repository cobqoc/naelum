#!/usr/bin/env node
/**
 * _iter-no-drawer.html의 웜 골드/원근감 스타일 그대로 살리고
 * 본체 중앙에 선반 2개 + 냉장실 하단 서랍 2개(좌우) + 냉동실 하단 서랍 2개(좌우) 추가.
 * 출력: .fridge-backups/variant-warm-with-body.html
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, '.fridge-backups/_iter-no-drawer.html');
const OUT = path.join(ROOT, '.fridge-backups/variant-warm-with-body.html');

let html = await readFile(SOURCE, 'utf8');

// 본체 냉장실 freezer 내부 rect 뒤에 선반/서랍 블록 삽입
// 기존: <rect x="184" y="406" width="232" height="202" rx="4" fill="url(#freezerG)" />
// 그 뒤에 삽입
const ADDITIONS = `
      <!-- ====== 본체 선반 (냉장실) — 웜 골드, 원근감 디테일 ====== -->
      <rect x="186" y="120" width="228" height="10" fill="url(#creamFrontG)" stroke="#000" stroke-width="2.5" stroke-linejoin="round" />
      <rect x="186" y="120" width="228" height="3.5" fill="url(#creamTopG)" />
      <line x1="188" y1="121.5" x2="412" y2="121.5" stroke="#FFF4D8" stroke-width="1.3" />
      <line x1="188" y1="130" x2="412" y2="130" stroke="#2A1408" stroke-width="1" />
      <rect x="188" y="131" width="224" height="3" fill="rgba(40,20,5,0.12)" />

      <rect x="186" y="215" width="228" height="10" fill="url(#creamFrontG)" stroke="#000" stroke-width="2.5" stroke-linejoin="round" />
      <rect x="186" y="215" width="228" height="3.5" fill="url(#creamTopG)" />
      <line x1="188" y1="216.5" x2="412" y2="216.5" stroke="#FFF4D8" stroke-width="1.3" />
      <line x1="188" y1="225" x2="412" y2="225" stroke="#2A1408" stroke-width="1" />
      <rect x="188" y="226" width="224" height="3" fill="rgba(40,20,5,0.12)" />

      <!-- ====== 본체 냉장실 서랍장 2개 (좌우 나란히) ====== -->
      <rect x="188" y="320" width="110" height="54" rx="3" fill="url(#creamFrontG)" stroke="#000" stroke-width="2.5" stroke-linejoin="round" />
      <rect x="188" y="320" width="110" height="4" rx="2" fill="url(#creamTopG)" />
      <line x1="192" y1="324" x2="296" y2="324" stroke="#FFF4D8" stroke-width="1" />
      <rect x="218" y="344" width="50" height="5" rx="2.5" fill="#2A1408" opacity="0.55" />
      <line x1="188" y1="374" x2="298" y2="374" stroke="#2A1408" stroke-width="1" />

      <rect x="302" y="320" width="110" height="54" rx="3" fill="url(#creamFrontG)" stroke="#000" stroke-width="2.5" stroke-linejoin="round" />
      <rect x="302" y="320" width="110" height="4" rx="2" fill="url(#creamTopG)" />
      <line x1="306" y1="324" x2="410" y2="324" stroke="#FFF4D8" stroke-width="1" />
      <rect x="332" y="344" width="50" height="5" rx="2.5" fill="#2A1408" opacity="0.55" />
      <line x1="302" y1="374" x2="412" y2="374" stroke="#2A1408" stroke-width="1" />

      <!-- ====== 본체 냉동실 서랍장 2개 (좌우 나란히) ====== -->
      <rect x="188" y="526" width="110" height="78" rx="3" fill="url(#creamFrontG)" stroke="#000" stroke-width="2.5" stroke-linejoin="round" />
      <rect x="188" y="526" width="110" height="4" rx="2" fill="url(#creamTopG)" />
      <line x1="192" y1="530" x2="296" y2="530" stroke="#FFF4D8" stroke-width="1" />
      <rect x="218" y="562" width="50" height="5" rx="2.5" fill="#2A1408" opacity="0.55" />
      <line x1="188" y1="604" x2="298" y2="604" stroke="#2A1408" stroke-width="1" />

      <rect x="302" y="526" width="110" height="78" rx="3" fill="url(#creamFrontG)" stroke="#000" stroke-width="2.5" stroke-linejoin="round" />
      <rect x="302" y="526" width="110" height="4" rx="2" fill="url(#creamTopG)" />
      <line x1="306" y1="530" x2="410" y2="530" stroke="#FFF4D8" stroke-width="1" />
      <rect x="332" y="562" width="50" height="5" rx="2.5" fill="#2A1408" opacity="0.55" />
      <line x1="302" y1="604" x2="412" y2="604" stroke="#2A1408" stroke-width="1" />
`;

html = html.replace(
  /(<rect x="184" y="406" width="232" height="202" rx="4" fill="url\(#freezerG\)" \/>)/,
  `$1\n${ADDITIONS}`
);

// 타이틀 업데이트
html = html.replace('<meta charset="UTF-8">', '<meta charset="UTF-8"><title>Warm Gold + Body Shelves/Drawers</title>');

await writeFile(OUT, html);
console.log('→ .fridge-backups/variant-warm-with-body.html');

#!/usr/bin/env node
/**
 * variant-warm-detailed.html 개선판:
 * 1. 온도 디스플레이 제거
 * 2. 도어 바구니 4가지 타입으로 다양화 + 내부 깊이감(opening shadow) 추가
 *    - Row 1 (최상단 냉장): 병 슬롯 바구니 (세로 디바이더)
 *    - Row 2 (중간 냉장): 메쉬/위브 바구니 (가로 + 세로 격자)
 *    - Row 3 (하단 냉장): 라벨 플레이트 달린 솔리드 빈
 *    - Freezer: 아이스 그리드 바구니 (십자 해치 + 프로스트)
 * 출력: .fridge-backups/variant-warm-baskets.html
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, '.fridge-backups/variant-warm-detailed.html');
const OUT = path.join(ROOT, '.fridge-backups/variant-warm-baskets.html');

let html = await readFile(SOURCE, 'utf8');

// ── 1) 온도 디스플레이 제거 ──────────────────────────
html = html.replace(/\n\s*<!-- 온도 디스플레이 -->[\s\S]*?letter-spacing="1">-18°C<\/text>\n/, '\n');

// ── 2) 각 도어 바구니에 추가할 디테일 정의 ─────────────
// 좌측 도어 (x=29~150 좌표 공간, 0.69x 스케일 안)
// 우측 도어 (x=450~571 좌표 공간)

// ── 좌측 냉장 Row 1 (병 슬롯) ─────
const L_ROW1_DETAIL = `
      <!-- Row1 내부 opening shadow -->
      <path d="M 29,118 L 150,128 L 150,132 L 29,122 Z" fill="rgba(30,12,4,0.45)"/>
      <!-- 병 슬롯 디바이더 3개 -->
      <line x1="58.5" y1="123" x2="60" y2="146" stroke="rgba(30,12,4,0.5)" stroke-width="1.3"/>
      <line x1="60" y1="123" x2="61.5" y2="146" stroke="rgba(255,240,200,0.3)" stroke-width="0.6"/>
      <line x1="89" y1="124" x2="90.5" y2="146" stroke="rgba(30,12,4,0.5)" stroke-width="1.3"/>
      <line x1="90.5" y1="124" x2="92" y2="146" stroke="rgba(255,240,200,0.3)" stroke-width="0.6"/>
      <line x1="119.5" y1="125" x2="121" y2="146" stroke="rgba(30,12,4,0.5)" stroke-width="1.3"/>
      <line x1="121" y1="125" x2="122.5" y2="146" stroke="rgba(255,240,200,0.3)" stroke-width="0.6"/>
      <!-- 병 캡 힌트 (top face 위 작은 원들) -->
      <ellipse cx="45" cy="114" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>
      <ellipse cx="74" cy="116" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>
      <ellipse cx="104" cy="118" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>
      <ellipse cx="135" cy="120" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>`;

// ── 좌측 냉장 Row 2 (메쉬 위브) ─────
const L_ROW2_DETAIL = `
      <!-- Row2 내부 opening shadow -->
      <path d="M 29,205 L 150,212 L 150,216 L 29,209 Z" fill="rgba(30,12,4,0.45)"/>
      <!-- 메쉬 가로선 추가 -->
      <path d="M 29,216 L 150,223" fill="none" stroke="rgba(40,20,5,0.4)" stroke-width="0.9"/>
      <path d="M 29,222 L 150,229" fill="none" stroke="rgba(40,20,5,0.4)" stroke-width="0.9"/>
      <path d="M 29,228 L 150,235" fill="none" stroke="rgba(40,20,5,0.4)" stroke-width="0.9"/>
      <!-- 메쉬 세로선 (미세한 격자) -->
      <line x1="55" y1="212" x2="56" y2="237" stroke="rgba(30,12,4,0.25)" stroke-width="0.6"/>
      <line x1="80" y1="213" x2="81" y2="237" stroke="rgba(30,12,4,0.25)" stroke-width="0.6"/>
      <line x1="105" y1="214" x2="106" y2="237" stroke="rgba(30,12,4,0.25)" stroke-width="0.6"/>
      <line x1="130" y1="215" x2="131" y2="237" stroke="rgba(30,12,4,0.25)" stroke-width="0.6"/>`;

// ── 좌측 냉장 Row 3 (라벨 플레이트) ─────
const L_ROW3_DETAIL = `
      <!-- Row3 내부 opening shadow -->
      <path d="M 30,351 L 150,353 L 150,357 L 30,355 Z" fill="rgba(30,12,4,0.45)"/>
      <!-- 중앙 라벨 플레이트 -->
      <rect x="58" y="360" width="94" height="10" rx="1.5" fill="url(#creamTopG)" stroke="#2A1408" stroke-width="0.9"/>
      <rect x="62" y="363" width="86" height="4" fill="rgba(40,20,5,0.2)"/>
      <line x1="62" y1="367" x2="148" y2="367" stroke="rgba(255,240,200,0.45)" stroke-width="0.5"/>`;

// ── 좌측 냉동 (아이스 그리드) ─────
const L_FREEZER_DETAIL = `
      <!-- Freezer 내부 opening shadow -->
      <path d="M 45,581 L 150,578 L 150,582 L 45,585 Z" fill="rgba(30,12,4,0.5)"/>
      <!-- 아이스 그리드 (십자 해치) -->
      <line x1="70" y1="581" x2="70" y2="608" stroke="rgba(30,12,4,0.4)" stroke-width="0.8"/>
      <line x1="95" y1="580" x2="95" y2="608" stroke="rgba(30,12,4,0.4)" stroke-width="0.8"/>
      <line x1="120" y1="579" x2="120" y2="608" stroke="rgba(30,12,4,0.4)" stroke-width="0.8"/>
      <line x1="45" y1="594" x2="150" y2="592" stroke="rgba(30,12,4,0.35)" stroke-width="0.8"/>
      <!-- 프로스트 하이라이트 (차가운 톤) -->
      <ellipse cx="85" cy="585" rx="30" ry="1.5" fill="rgba(200,230,255,0.35)"/>
      <ellipse cx="125" cy="588" rx="18" ry="1" fill="rgba(200,230,255,0.3)"/>`;

// ── 우측 대칭 (x 좌표 변환: +421) ─────
// 좌측 29~150 → 우측 450~571 (diff=421)
const R_ROW1_DETAIL = `
      <!-- Row1 내부 opening shadow -->
      <path d="M 450,129 L 571,118 L 571,122 L 450,133 Z" fill="rgba(30,12,4,0.45)"/>
      <!-- 병 슬롯 디바이더 -->
      <line x1="480" y1="131" x2="478.5" y2="147" stroke="rgba(30,12,4,0.5)" stroke-width="1.3"/>
      <line x1="481.5" y1="131" x2="480" y2="147" stroke="rgba(255,240,200,0.3)" stroke-width="0.6"/>
      <line x1="510" y1="128" x2="508.5" y2="147" stroke="rgba(30,12,4,0.5)" stroke-width="1.3"/>
      <line x1="511.5" y1="128" x2="510" y2="147" stroke="rgba(255,240,200,0.3)" stroke-width="0.6"/>
      <line x1="540" y1="126" x2="538.5" y2="147" stroke="rgba(30,12,4,0.5)" stroke-width="1.3"/>
      <line x1="541.5" y1="126" x2="540" y2="147" stroke="rgba(255,240,200,0.3)" stroke-width="0.6"/>
      <!-- 병 캡 -->
      <ellipse cx="465" cy="120" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>
      <ellipse cx="495" cy="117" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>
      <ellipse cx="525" cy="114" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>
      <ellipse cx="555" cy="112" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>`;

const R_ROW2_DETAIL = `
      <!-- Row2 내부 opening shadow -->
      <path d="M 450,213 L 571,205 L 571,209 L 450,217 Z" fill="rgba(30,12,4,0.45)"/>
      <!-- 메쉬 추가 -->
      <path d="M 450,224 L 571,216" fill="none" stroke="rgba(40,20,5,0.4)" stroke-width="0.9"/>
      <path d="M 450,230 L 571,222" fill="none" stroke="rgba(40,20,5,0.4)" stroke-width="0.9"/>
      <line x1="476" y1="237" x2="477" y2="213" stroke="rgba(30,12,4,0.25)" stroke-width="0.6"/>
      <line x1="501" y1="237" x2="502" y2="211" stroke="rgba(30,12,4,0.25)" stroke-width="0.6"/>
      <line x1="526" y1="237" x2="527" y2="209" stroke="rgba(30,12,4,0.25)" stroke-width="0.6"/>
      <line x1="551" y1="237" x2="552" y2="207" stroke="rgba(30,12,4,0.25)" stroke-width="0.6"/>`;

const R_ROW3_DETAIL = `
      <!-- Row3 내부 opening shadow -->
      <path d="M 450,353 L 570,351 L 570,355 L 450,357 Z" fill="rgba(30,12,4,0.45)"/>
      <!-- 라벨 플레이트 -->
      <rect x="478" y="360" width="94" height="10" rx="1.5" fill="url(#creamTopG)" stroke="#2A1408" stroke-width="0.9"/>
      <rect x="482" y="363" width="86" height="4" fill="rgba(40,20,5,0.2)"/>
      <line x1="482" y1="367" x2="568" y2="367" stroke="rgba(255,240,200,0.45)" stroke-width="0.5"/>`;

const R_FREEZER_DETAIL = `
      <!-- Freezer 내부 opening shadow -->
      <path d="M 450,578 L 555,581 L 555,585 L 450,582 Z" fill="rgba(30,12,4,0.5)"/>
      <!-- 아이스 그리드 -->
      <line x1="480" y1="580" x2="480" y2="608" stroke="rgba(30,12,4,0.4)" stroke-width="0.8"/>
      <line x1="505" y1="581" x2="505" y2="608" stroke="rgba(30,12,4,0.4)" stroke-width="0.8"/>
      <line x1="530" y1="582" x2="530" y2="608" stroke="rgba(30,12,4,0.4)" stroke-width="0.8"/>
      <line x1="450" y1="592" x2="555" y2="594" stroke="rgba(30,12,4,0.35)" stroke-width="0.8"/>
      <!-- 프로스트 -->
      <ellipse cx="490" cy="587" rx="28" ry="1.5" fill="rgba(200,230,255,0.35)"/>
      <ellipse cx="530" cy="585" rx="18" ry="1" fill="rgba(200,230,255,0.3)"/>`;

// ── 좌측 도어 각 바구니 뒤에 디테일 삽입 ─────
// Shelf 1 마지막 shadow line "M 29,136 L 150,146" 뒤
html = html.replace(
  /(<path d="M 29,136 L 150,146" fill="none" stroke="#2A1408" stroke-width="2"\s*\/>)/,
  `$1${L_ROW1_DETAIL}`
);
// Shelf 2 마지막 "M 29,230 L 150,237" 뒤
html = html.replace(
  /(<path d="M 29,230 L 150,237" fill="none" stroke="#2A1408" stroke-width="2"\s*\/>)/,
  `$1${L_ROW2_DETAIL}`
);
// Shelf 3 마지막 "M 30,376 L 150,376" 뒤
html = html.replace(
  /(<path d="M 30,376 L 150,376" fill="none" stroke="#2A1408" stroke-width="2"\s*\/>)/,
  `$1${L_ROW3_DETAIL}`
);
// Left Freezer "M 46,578 L 150,578" stroke-width=1.8 뒤
html = html.replace(
  /(<path d="M 46,578 L 150,578" fill="none" stroke="#2A1408" stroke-width="1\.8"\s*\/>)/,
  `$1${L_FREEZER_DETAIL}`
);

// ── 우측 도어 각 바구니 ─────
// Row1 "M 450,147 L 571,136" 뒤
html = html.replace(
  /(<path d="M 450,147 L 571,136" fill="none" stroke="#2A1408" stroke-width="2"\s*\/>)/,
  `$1${R_ROW1_DETAIL}`
);
// Row2 "M 450,238 L 571,230" 뒤
html = html.replace(
  /(<path d="M 450,238 L 571,230" fill="none" stroke="#2A1408" stroke-width="2"\s*\/>)/,
  `$1${R_ROW2_DETAIL}`
);
// Row3 "M 448,376 L 570,376" 뒤
html = html.replace(
  /(<path d="M 448,376 L 570,376" fill="none" stroke="#2A1408" stroke-width="2"\s*\/>)/,
  `$1${R_ROW3_DETAIL}`
);
// Right Freezer "M 450,578 L 554,578" stroke-width=1.8 뒤
html = html.replace(
  /(<path d="M 450,578 L 554,578" fill="none" stroke="#2A1408" stroke-width="1\.8"\s*\/>)/,
  `$1${R_FREEZER_DETAIL}`
);

// 타이틀
html = html.replace(/<title>[^<]*<\/title>/, '<title>Warm Gold — Basket Variety</title>');

await writeFile(OUT, html);
console.log('→ .fridge-backups/variant-warm-baskets.html');

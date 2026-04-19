#!/usr/bin/env node
/**
 * variant-warm-detailed.html 기반 대폭 업그레이드:
 *  - 온도 디스플레이 제거
 *  - 각 도어 바구니에 실제 아이템(우유/주스/잼/아이스큐브 등) 배치
 *    → front wall이 아이템 하단을 가려 "바구니 안에 담긴" 효과
 *  - Opening shadow로 바구니 안쪽 깊이감
 *  - 도어가 던지는 그림자 (본체 내부 좌/우 경계)
 *  - LED 조명의 빛 글로우 강화
 *  - 본체 선반·서랍 하단 드롭 섀도우
 *  - 각 바구니 row마다 다른 아이템/라벨 — 각각 다른 디자인
 * 출력: .fridge-backups/variant-warm-items.html
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, '.fridge-backups/variant-warm-detailed.html');
const OUT = path.join(ROOT, '.fridge-backups/variant-warm-items.html');

let html = await readFile(SOURCE, 'utf8');

// ── 1) 온도 디스플레이 제거 ────────────────────────
html = html.replace(/\n\s*<!-- 온도 디스플레이 -->[\s\S]*?-18°C<\/text>\n/, '\n');

// ── 2) 추가 그라디언트 (도어 그림자, 내부 어둠) ──────
const EXTRA_DEFS = `
        <linearGradient id="doorCastL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="rgba(30,10,4,0.32)"/>
          <stop offset="100%" stop-color="rgba(30,10,4,0)"/>
        </linearGradient>
        <linearGradient id="doorCastR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stop-color="rgba(30,10,4,0.32)"/>
          <stop offset="100%" stop-color="rgba(30,10,4,0)"/>
        </linearGradient>
        <linearGradient id="interiorDarken" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.18)"/>
        </linearGradient>
        <radialGradient id="ledWarmGlow" cx="50%" cy="0%" r="75%">
          <stop offset="0%" stop-color="rgba(255,240,180,0.55)"/>
          <stop offset="60%" stop-color="rgba(255,240,180,0.15)"/>
          <stop offset="100%" stop-color="rgba(255,240,180,0)"/>
        </radialGradient>
        <radialGradient id="ledCoolGlow" cx="50%" cy="0%" r="75%">
          <stop offset="0%" stop-color="rgba(200,225,255,0.45)"/>
          <stop offset="100%" stop-color="rgba(200,225,255,0)"/>
        </radialGradient>
        <linearGradient id="shelfDrop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(30,10,4,0.3)"/>
          <stop offset="100%" stop-color="rgba(30,10,4,0)"/>
        </linearGradient>`;

html = html.replace('</defs>', `${EXTRA_DEFS}\n      </defs>`);

// ── 3) 기존 LED 글로우 업그레이드 (ledGlow → ledWarmGlow) ────
html = html.replace(
  /<ellipse cx="300" cy="44" rx="135" ry="10" fill="url\(#ledGlow\)"\/>/,
  `<ellipse cx="300" cy="50" rx="160" ry="22" fill="url(#ledWarmGlow)"/>`
);
html = html.replace(
  /<ellipse cx="300" cy="416" rx="135" ry="8" fill="url\(#ledGlow\)" opacity="0\.7"\/>/,
  `<ellipse cx="300" cy="420" rx="160" ry="16" fill="url(#ledCoolGlow)"/>`
);

// ── 4) 본체 내부 하단 darken (아래쪽 살짝 어두워지는 ambient) ──
const INTERIOR_DARKEN = `
      <!-- 냉장실 하단 ambient darken -->
      <rect x="184" y="35" width="232" height="341" rx="4" fill="url(#interiorDarken)"/>
      <!-- 냉동실 하단 ambient darken -->
      <rect x="184" y="406" width="232" height="202" rx="4" fill="url(#interiorDarken)"/>`;

// LED fridge 뒤에 interior darken 삽입
html = html.replace(
  /(<ellipse cx="300" cy="50" rx="160" ry="22" fill="url\(#ledWarmGlow\)"\/>)/,
  `$1\n      <rect x="184" y="35" width="232" height="341" rx="4" fill="url(#interiorDarken)"/>`
);
html = html.replace(
  /(<ellipse cx="300" cy="420" rx="160" ry="16" fill="url\(#ledCoolGlow\)"\/>)/,
  `$1\n      <rect x="184" y="406" width="232" height="202" rx="4" fill="url(#interiorDarken)"/>`
);

// ── 5) 본체 내부 도어 캐스트 섀도우 (좌/우 가장자리) ─────
const BODY_DOOR_CAST = `
      <!-- 냉장실 좌측 도어 그림자 -->
      <rect x="184" y="35" width="30" height="341" fill="url(#doorCastL)"/>
      <!-- 냉장실 우측 도어 그림자 -->
      <rect x="386" y="35" width="30" height="341" fill="url(#doorCastR)"/>
      <!-- 냉동실 좌측 도어 그림자 -->
      <rect x="184" y="406" width="28" height="202" fill="url(#doorCastL)"/>
      <!-- 냉동실 우측 도어 그림자 -->
      <rect x="388" y="406" width="28" height="202" fill="url(#doorCastR)"/>`;

// 본체 선반 바로 전에 삽입 (LED 뒤, 선반 앞)
html = html.replace(
  /(<!-- ====== 본체 선반 \(냉장실\) — 입체감 강화 ====== -->)/,
  `${BODY_DOOR_CAST}\n      $1`
);

// ── 6) 도어 바구니 아이템들 ──
// 각 row마다 다른 디자인
const L_R1_ITEMS = `
      <!-- L-Row1: 우유/주스/요거트 -->
      <path d="M 29,118 L 150,128 L 150,124 L 29,114 Z" fill="rgba(25,10,4,0.38)"/>
      <!-- 우유 팩 -->
      <polygon points="41,96 58,96 49.5,88" fill="#f2f2f2" stroke="#000" stroke-width="1.3"/>
      <rect x="41" y="96" width="17" height="38" fill="#fafafa" stroke="#000" stroke-width="1.3"/>
      <rect x="43" y="104" width="13" height="5" fill="#e85040"/>
      <line x1="43" y1="113" x2="56" y2="113" stroke="#c03828" stroke-width="0.7"/>
      <!-- 주스 병 -->
      <rect x="67" y="84" width="6" height="8" rx="1" fill="#5a2810" stroke="#000" stroke-width="1"/>
      <path d="M 63,92 L 63,134 L 77,134 L 77,92 Z" fill="#f08838" stroke="#000" stroke-width="1.3"/>
      <rect x="64" y="107" width="12" height="10" fill="#fff4b8" stroke="#000" stroke-width="0.7"/>
      <text x="70" y="114" fill="#a04020" font-size="4" font-weight="bold" font-family="sans-serif" text-anchor="middle">OJ</text>
      <!-- 요거트 -->
      <ellipse cx="96" cy="103" rx="7.5" ry="2.2" fill="#d88098" stroke="#000" stroke-width="1"/>
      <rect x="88.5" y="103" width="15" height="32" fill="#f8b8d0" stroke="#000" stroke-width="1.3"/>
      <!-- 청량 캔 -->
      <ellipse cx="122" cy="100" rx="7" ry="2" fill="#80a8e0" stroke="#000" stroke-width="1"/>
      <rect x="115" y="100" width="14" height="34" fill="#5088d8" stroke="#000" stroke-width="1.3"/>
      <rect x="116" y="113" width="12" height="3" fill="#fff"/>`;

const L_R2_ITEMS = `
      <!-- L-Row2: 잼/버터/꿀 -->
      <path d="M 29,205 L 150,212 L 150,210 L 29,201 Z" fill="rgba(25,10,4,0.38)"/>
      <!-- 잼 병 -->
      <rect x="44" y="184" width="16" height="5" rx="1" fill="#404040" stroke="#000" stroke-width="1"/>
      <rect x="45" y="189" width="14" height="33" fill="#c03844" stroke="#000" stroke-width="1.3"/>
      <rect x="46" y="202" width="12" height="10" fill="#fff4b8" stroke="#000" stroke-width="0.7"/>
      <text x="52" y="208.5" fill="#602018" font-size="3.5" font-weight="bold" font-family="sans-serif" text-anchor="middle">JAM</text>
      <!-- 버터 -->
      <rect x="67" y="196" width="24" height="16" fill="#fade60" stroke="#000" stroke-width="1.3"/>
      <path d="M 67,196 L 67,192 L 91,192 L 91,196 Z" fill="#f8d040" stroke="#000" stroke-width="1.2"/>
      <!-- 꿀 병 (꿀벌 모양) -->
      <rect x="97" y="188" width="13" height="4" rx="1" fill="#5a2810" stroke="#000" stroke-width="1"/>
      <path d="M 95,192 Q 95,188 103.5,188 Q 112,188 112,192 L 112,222 Q 112,224 103.5,224 Q 95,224 95,222 Z" fill="#f4a830" stroke="#000" stroke-width="1.3"/>
      <ellipse cx="103.5" cy="205" rx="6" ry="5" fill="#fff4d0" stroke="#000" stroke-width="0.7"/>
      <!-- 피클 병 -->
      <rect x="119" y="184" width="14" height="6" rx="1" fill="#808080" stroke="#000" stroke-width="1"/>
      <rect x="118" y="190" width="16" height="32" fill="#88b048" stroke="#000" stroke-width="1.3"/>
      <line x1="120" y1="198" x2="132" y2="198" stroke="#5a7830" stroke-width="0.6"/>
      <line x1="120" y1="204" x2="132" y2="204" stroke="#5a7830" stroke-width="0.6"/>`;

const L_R3_LABEL = `
      <!-- L-Row3: 라벨 플레이트 빈 (주료 — 치즈/샐러리 칸) -->
      <path d="M 30,351 L 150,353 L 150,356 L 30,354 Z" fill="rgba(25,10,4,0.38)"/>
      <rect x="45" y="358" width="105" height="14" rx="2" fill="url(#creamTopG)" stroke="#2A1408" stroke-width="1.1"/>
      <rect x="48" y="361" width="99" height="4" fill="rgba(40,20,5,0.25)"/>
      <text x="97.5" y="369.5" fill="#2A1408" font-size="5.5" font-weight="bold" font-family="sans-serif" text-anchor="middle" letter-spacing="1">DAIRY</text>`;

const L_FREEZER_ITEMS = `
      <!-- L-Freezer: 아이스 큐브 트레이 + 아이스크림 -->
      <path d="M 45,581 L 150,578 L 150,580 L 45,583 Z" fill="rgba(25,10,4,0.42)"/>
      <!-- 아이스큐브 트레이 -->
      <rect x="50" y="563" width="45" height="18" rx="2" fill="#c8e4f8" stroke="#000" stroke-width="1.2"/>
      <line x1="59" y1="563" x2="59" y2="581" stroke="#000" stroke-width="0.8"/>
      <line x1="68" y1="563" x2="68" y2="581" stroke="#000" stroke-width="0.8"/>
      <line x1="77" y1="563" x2="77" y2="581" stroke="#000" stroke-width="0.8"/>
      <line x1="86" y1="563" x2="86" y2="581" stroke="#000" stroke-width="0.8"/>
      <line x1="50" y1="572" x2="95" y2="572" stroke="#000" stroke-width="0.8"/>
      <rect x="52" y="565" width="5" height="5" fill="#f0faff" opacity="0.8"/>
      <rect x="70" y="574" width="5" height="5" fill="#f0faff" opacity="0.8"/>
      <!-- 아이스크림 통 -->
      <ellipse cx="120" cy="568" rx="16" ry="3" fill="#d4a8b8" stroke="#000" stroke-width="1.2"/>
      <rect x="104" y="568" width="32" height="36" fill="#f8c8d4" stroke="#000" stroke-width="1.2"/>
      <text x="120" y="583" fill="#902848" font-size="6" font-weight="bold" font-family="sans-serif" text-anchor="middle">ICE</text>`;

const R_R1_ITEMS = `
      <!-- R-Row1: 생수/우유/소스 -->
      <path d="M 450,129 L 571,118 L 571,114 L 450,125 Z" fill="rgba(25,10,4,0.38)"/>
      <!-- 생수병 -->
      <rect x="458" y="82" width="5" height="8" rx="1" fill="#4488d8" stroke="#000" stroke-width="1"/>
      <rect x="455" y="90" width="11" height="5" fill="#a0c8e8" stroke="#000" stroke-width="0.7"/>
      <path d="M 454,95 L 454,134 L 467,134 L 467,95 Z" fill="rgba(200,230,255,0.85)" stroke="#000" stroke-width="1.3"/>
      <rect x="456" y="108" width="9" height="10" fill="#3078c8" stroke="#000" stroke-width="0.7"/>
      <!-- 작은 우유 -->
      <polygon points="475,98 490,98 482.5,90" fill="#e8e8e8" stroke="#000" stroke-width="1.3"/>
      <rect x="475" y="98" width="15" height="36" fill="#fafafa" stroke="#000" stroke-width="1.3"/>
      <rect x="476.5" y="106" width="12" height="4" fill="#4488d8"/>
      <!-- 소스 병 (케첩) -->
      <rect x="501" y="90" width="7" height="6" rx="1" fill="#404040" stroke="#000" stroke-width="1"/>
      <path d="M 498,96 L 498,134 L 511,134 L 511,96 Z" fill="#d03828" stroke="#000" stroke-width="1.3"/>
      <rect x="499" y="108" width="11" height="12" fill="#fff4b8" stroke="#000" stroke-width="0.7"/>
      <!-- 맥주 병 -->
      <rect x="519" y="84" width="4" height="8" fill="#3a2010" stroke="#000" stroke-width="1"/>
      <path d="M 516,92 L 516,132 L 526,132 L 526,92 Z" fill="#80502a" stroke="#000" stroke-width="1.3"/>
      <rect x="517" y="112" width="8" height="10" fill="#f4d080" stroke="#000" stroke-width="0.7"/>
      <!-- 계란판 (작은 언덕) -->
      <rect x="540" y="110" width="26" height="22" rx="2" fill="#d4c098" stroke="#000" stroke-width="1.2"/>
      <ellipse cx="546" cy="112" rx="3.5" ry="2" fill="#fff" stroke="#000" stroke-width="0.8"/>
      <ellipse cx="553" cy="111" rx="3.5" ry="2" fill="#fff" stroke="#000" stroke-width="0.8"/>
      <ellipse cx="560" cy="110" rx="3.5" ry="2" fill="#fff" stroke="#000" stroke-width="0.8"/>`;

const R_R2_ITEMS = `
      <!-- R-Row2: 머스타드/마요/스프라이트 -->
      <path d="M 450,213 L 571,205 L 571,203 L 450,211 Z" fill="rgba(25,10,4,0.38)"/>
      <!-- 머스타드 -->
      <rect x="458" y="186" width="7" height="5" rx="1" fill="#ddbb22" stroke="#000" stroke-width="1"/>
      <path d="M 455,191 L 455,222 L 468,222 L 468,191 Z" fill="#ffd830" stroke="#000" stroke-width="1.3"/>
      <rect x="456" y="202" width="11" height="10" fill="#fff" stroke="#000" stroke-width="0.7"/>
      <!-- 마요네즈 -->
      <rect x="475" y="180" width="15" height="5" rx="1" fill="#4060a0" stroke="#000" stroke-width="1"/>
      <rect x="474" y="185" width="17" height="37" rx="1" fill="#fdfaf0" stroke="#000" stroke-width="1.3"/>
      <rect x="475" y="200" width="15" height="11" fill="#4060a0"/>
      <text x="482.5" y="207.5" fill="#fff" font-size="5" font-weight="bold" font-family="sans-serif" text-anchor="middle">MAYO</text>
      <!-- 스프라이트/탄산 캔 -->
      <ellipse cx="505" cy="196" rx="7.5" ry="2.2" fill="#b8e8c8" stroke="#000" stroke-width="1"/>
      <rect x="497.5" y="196" width="15" height="30" fill="#60c080" stroke="#000" stroke-width="1.3"/>
      <rect x="498.5" y="208" width="13" height="3" fill="#fff"/>
      <!-- 작은 반찬통 (파란) -->
      <rect x="523" y="193" width="22" height="5" rx="1" fill="#3080c8" stroke="#000" stroke-width="1"/>
      <rect x="522" y="198" width="24" height="24" fill="#70b8e0" stroke="#000" stroke-width="1.3" opacity="0.85"/>
      <!-- 작은 병 여러개 (양념) -->
      <rect x="552" y="196" width="6" height="4" rx="0.8" fill="#5a2810" stroke="#000" stroke-width="0.8"/>
      <rect x="551" y="200" width="8" height="22" fill="#a03818" stroke="#000" stroke-width="1"/>
      <rect x="562" y="198" width="6" height="4" rx="0.8" fill="#5a2810" stroke="#000" stroke-width="0.8"/>
      <rect x="561" y="202" width="8" height="20" fill="#d4a830" stroke="#000" stroke-width="1"/>`;

const R_R3_LABEL = `
      <!-- R-Row3: 라벨 플레이트 빈 -->
      <path d="M 450,353 L 570,351 L 570,354 L 450,356 Z" fill="rgba(25,10,4,0.38)"/>
      <rect x="450" y="358" width="105" height="14" rx="2" fill="url(#creamTopG)" stroke="#2A1408" stroke-width="1.1"/>
      <rect x="453" y="361" width="99" height="4" fill="rgba(40,20,5,0.25)"/>
      <text x="502.5" y="369.5" fill="#2A1408" font-size="5.5" font-weight="bold" font-family="sans-serif" text-anchor="middle" letter-spacing="1">SAUCES</text>`;

const R_FREEZER_ITEMS = `
      <!-- R-Freezer: 냉동피자/냉동만두 박스 -->
      <path d="M 450,578 L 555,581 L 555,583 L 450,580 Z" fill="rgba(25,10,4,0.42)"/>
      <!-- 냉동피자 박스 -->
      <rect x="458" y="561" width="42" height="42" fill="#e85040" stroke="#000" stroke-width="1.3"/>
      <rect x="460" y="563" width="38" height="16" fill="#fff4b8"/>
      <ellipse cx="479" cy="571" rx="14" ry="5" fill="#f8c898" stroke="#000" stroke-width="0.8"/>
      <circle cx="473" cy="571" r="1.5" fill="#c04030"/>
      <circle cx="478" cy="570" r="1.5" fill="#c04030"/>
      <circle cx="484" cy="572" r="1.5" fill="#c04030"/>
      <text x="479" y="590" fill="#fff" font-size="5" font-weight="bold" font-family="sans-serif" text-anchor="middle">PIZZA</text>
      <!-- 냉동 아이스팝 (막대) -->
      <rect x="510" y="575" width="6" height="20" fill="#c89860" stroke="#000" stroke-width="1"/>
      <rect x="505" y="558" width="16" height="20" rx="3" fill="#f080a0" stroke="#000" stroke-width="1.3"/>
      <rect x="523" y="575" width="6" height="20" fill="#c89860" stroke="#000" stroke-width="1"/>
      <rect x="518" y="562" width="16" height="16" rx="3" fill="#60c0c0" stroke="#000" stroke-width="1.3"/>
      <!-- 프로스트 하이라이트 -->
      <ellipse cx="480" cy="586" rx="18" ry="1.2" fill="rgba(220,240,255,0.45)"/>`;

// ── 7) 각 바구니 top face 뒤에 아이템 삽입 ────────────
html = html.replace(
  /(<path d="M 29,110 L 152,120 L 150,128 L 29,118 Z" fill="url\(#creamTopG\)"[^/]*\/>)/,
  `$1${L_R1_ITEMS}`
);
html = html.replace(
  /(<path d="M 29,193 L 152,200 L 150,212 L 29,205 Z" fill="url\(#creamTopG\)"[^/]*\/>)/,
  `$1${L_R2_ITEMS}`
);
html = html.replace(
  /(<path d="M 30,339 L 152,341 L 150,353 L 30,351 Z" fill="url\(#creamTopG\)"[^/]*\/>)/,
  `$1${L_R3_LABEL}`
);
html = html.replace(
  /(<path d="M 50,560 L 147,557 L 150,578 L 45,581 Z" fill="url\(#creamTopG\)"[^/]*\/>)/,
  `$1${L_FREEZER_ITEMS}`
);
html = html.replace(
  /(<path d="M 448,121 L 571,110 L 571,118 L 450,129 Z" fill="url\(#creamTopG\)"[^/]*\/>)/,
  `$1${R_R1_ITEMS}`
);
html = html.replace(
  /(<path d="M 448,201 L 571,193 L 571,205 L 450,213 Z" fill="url\(#creamTopG\)"[^/]*\/>)/,
  `$1${R_R2_ITEMS}`
);
html = html.replace(
  /(<path d="M 448,341 L 570,339 L 570,351 L 450,353 Z" fill="url\(#creamTopG\)"[^/]*\/>)/,
  `$1${R_R3_LABEL}`
);
html = html.replace(
  /(<path d="M 453,557 L 550,560 L 555,581 L 450,578 Z" fill="url\(#creamTopG\)"[^/]*\/>)/,
  `$1${R_FREEZER_ITEMS}`
);

// ── 8) 본체 선반/서랍 드롭 섀도우 ────────────────────
const BODY_DROPS = `
      <!-- 선반 1 드롭 섀도우 -->
      <rect x="186" y="133" width="228" height="5" fill="url(#shelfDrop)"/>
      <!-- 선반 2 드롭 섀도우 -->
      <rect x="186" y="228" width="228" height="5" fill="url(#shelfDrop)"/>
      <!-- 서랍 측 드롭 -->
      <rect x="188" y="374" width="224" height="4" fill="url(#shelfDrop)" opacity="0.6"/>
      <!-- 냉동 서랍 상단 그림자 -->
      <rect x="188" y="522" width="224" height="5" fill="url(#shelfDrop)"/>
      <!-- 냉동 서랍 하단 -->
      <rect x="188" y="604" width="224" height="4" fill="url(#shelfDrop)" opacity="0.5"/>`;

// 본체 선반 블록 끝나고 냉동 서랍 오기 전 위치에 삽입
// 가장 안전한 위치: 냉장실 서랍장 섹션 주석 앞
html = html.replace(
  /(<!-- ====== 본체 냉장실 서랍장 2개)/,
  `${BODY_DROPS}\n      $1`
);

// 타이틀
html = html.replace(/<title>[^<]*<\/title>/, '<title>Warm Gold — Items + Depth</title>');

await writeFile(OUT, html);
console.log('→ .fridge-backups/variant-warm-items.html');

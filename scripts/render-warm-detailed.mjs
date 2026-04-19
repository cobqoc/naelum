#!/usr/bin/env node
/**
 * variant-warm-with-body.html 기반 + 전체 디테일 강화
 * - 상단 벤트 그릴, LED 조명바 + 글로우
 * - 도어 힌지, 도어 개스킷 라인
 * - 본체 선반 입체감 강화, 전면 유지 립
 * - 서랍 풀 핸들, 측면 레일 암시
 * - 크롬 조절 다리, 하단 그림자
 * - 상단 온도 디스플레이
 * 출력: .fridge-backups/variant-warm-detailed.html
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, '.fridge-backups/variant-warm-with-body.html');
const OUT = path.join(ROOT, '.fridge-backups/variant-warm-detailed.html');

let html = await readFile(SOURCE, 'utf8');

// ── 1) 추가 그라디언트: LED 글로우, 벤트 그림자 ─────────────
const EXTRA_DEFS = `
        <radialGradient id="ledGlow" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stop-color="rgba(255,248,200,0.55)"/>
          <stop offset="100%" stop-color="rgba(255,248,200,0)"/>
        </radialGradient>
        <linearGradient id="ventShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3a0a04"/>
          <stop offset="100%" stop-color="#6a1008"/>
        </linearGradient>
        <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(0,0,0,0.35)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>`;

html = html.replace('</defs>', `${EXTRA_DEFS}\n      </defs>`);

// ── 2) 상단 벤트 그릴 (본체 최상단) ─────────────────────
// 본체 rect 시작 직전에 삽입 — path d="M 434,14..."bodyDark frame 앞
const TOP_VENT = `
      <!-- 상단 벤트 그릴 -->
      <rect x="178" y="4" width="244" height="6" rx="2" fill="url(#ventShadow)" stroke="#000" stroke-width="1.2"/>
      ${Array.from({length: 18}, (_, i) => `<rect x="${190 + i*13}" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>`).join('\n      ')}
`;

// ── 3) 온도 디스플레이 (상단 중앙) ────────────────────
const DISPLAY = `
      <!-- 온도 디스플레이 -->
      <rect x="260" y="18" width="80" height="16" rx="2.5" fill="#1a0a06" stroke="#000" stroke-width="1.3"/>
      <rect x="263" y="21" width="74" height="10" rx="1.5" fill="#0a2a14"/>
      <text x="278" y="29" fill="#5aff9a" font-size="8" font-weight="bold" font-family="monospace" letter-spacing="1">3°C</text>
      <text x="308" y="29" fill="#8ad0ff" font-size="8" font-weight="bold" font-family="monospace" letter-spacing="1">-18°C</text>
`;

// NAELUM 텍스트 위치 위 body 프레임 영역에 벤트 + 디스플레이 삽입
// "<rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" />" 뒤에 삽입
html = html.replace(
  /(<rect x="166" y="14" width="268" height="615" rx="6" fill="url\(#bodyG\)" \/>)/,
  `${TOP_VENT}\n$1\n${DISPLAY}`
);

// ── 4) 내부 LED 조명바 + 글로우 (냉장실) ──────────────
const LED_FRIDGE = `
      <!-- 냉장실 LED 조명바 -->
      <rect x="192" y="37" width="216" height="3.5" rx="1.2" fill="url(#chromeG)" stroke="#2A1408" stroke-width="0.8"/>
      <rect x="198" y="38.3" width="204" height="1.3" fill="#fff4b8" opacity="0.95"/>
      <ellipse cx="300" cy="44" rx="135" ry="10" fill="url(#ledGlow)"/>
`;

// 냉장실 내부 rect 뒤에 LED 삽입
html = html.replace(
  /(<rect x="184" y="35" width="232" height="341" rx="4" fill="url\(#interiorG\)" \/>)/,
  `$1\n${LED_FRIDGE}`
);

// ── 5) 냉동실 LED ────────────────────────────────────
const LED_FREEZER = `
      <!-- 냉동실 LED 조명바 -->
      <rect x="192" y="409" width="216" height="3.5" rx="1.2" fill="url(#chromeG)" stroke="#2A1408" stroke-width="0.8"/>
      <rect x="198" y="410.3" width="204" height="1.3" fill="#c0e8ff" opacity="0.95"/>
      <ellipse cx="300" cy="416" rx="135" ry="8" fill="url(#ledGlow)" opacity="0.7"/>
`;

html = html.replace(
  /(<rect x="184" y="406" width="232" height="202" rx="4" fill="url\(#freezerG\)" \/>)/,
  `$1\n${LED_FREEZER}`
);

// ── 6) 본체 선반 업그레이드 — 더 두껍고 입체적 ────────
// 기존 선반 y=120, y=215 두 개를 더 디테일하게 교체
const NEW_BODY_SHELVES = `      <!-- ====== 본체 선반 (냉장실) — 입체감 강화 ====== -->
      <rect x="184" y="119" width="232" height="2.5" fill="url(#creamTopG)"/>
      <rect x="186" y="121" width="228" height="11" fill="url(#creamFrontG)" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/>
      <line x1="188" y1="122.5" x2="412" y2="122.5" stroke="#FFF4D8" stroke-width="1.5"/>
      <line x1="188" y1="128" x2="412" y2="128" stroke="rgba(60,35,10,0.4)" stroke-width="0.8"/>
      <line x1="188" y1="131.5" x2="412" y2="131.5" stroke="#2A1408" stroke-width="1.2"/>
      <rect x="188" y="133" width="224" height="5" fill="rgba(40,20,5,0.18)"/>

      <rect x="184" y="214" width="232" height="2.5" fill="url(#creamTopG)"/>
      <rect x="186" y="216" width="228" height="11" fill="url(#creamFrontG)" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/>
      <line x1="188" y1="217.5" x2="412" y2="217.5" stroke="#FFF4D8" stroke-width="1.5"/>
      <line x1="188" y1="223" x2="412" y2="223" stroke="rgba(60,35,10,0.4)" stroke-width="0.8"/>
      <line x1="188" y1="226.5" x2="412" y2="226.5" stroke="#2A1408" stroke-width="1.2"/>
      <rect x="188" y="228" width="224" height="5" fill="rgba(40,20,5,0.18)"/>
`;

html = html.replace(
  /<!-- ====== 본체 선반 \(냉장실\) — 웜 골드, 원근감 디테일 ====== -->[\s\S]*?<rect x="188" y="226" width="224" height="3" fill="rgba\(40,20,5,0\.12\)" \/>\n\n/,
  NEW_BODY_SHELVES
);

// ── 7) 서랍 풀 핸들 업그레이드 + 측면 레일 ─────────────
// 4개 서랍 핸들을 모두 교체 (rect 218 344, 332 344, 218 562, 332 562)
const upgradeDrawerHandle = (orig, x1, y1, x2, y2, side) => {
  // 핸들을 풀-타입으로: 크롬 바 + 손가락 홈
  return orig.replace(
    new RegExp(`<rect x="${x1}" y="${y1}" width="50" height="5" rx="2\\.5" fill="#2A1408" opacity="0\\.55" />`),
    `<rect x="${x1 - 2}" y="${y1 - 2}" width="54" height="9" rx="4.5" fill="url(#creamTopG)" stroke="#000" stroke-width="1.3" stroke-linejoin="round"/>\n      <rect x="${x1 + 2}" y="${y1 + 0.5}" width="46" height="4" rx="2" fill="#2A1408" opacity="0.55"/>\n      <line x1="${x1 + 4}" y1="${y1 + 1.5}" x2="${x1 + 46}" y2="${y1 + 1.5}" stroke="#FFF4D8" stroke-width="0.6" opacity="0.7"/>`
  );
};

html = upgradeDrawerHandle(html, 218, 344);
html = upgradeDrawerHandle(html, 332, 344);
html = upgradeDrawerHandle(html, 218, 562);
html = upgradeDrawerHandle(html, 332, 562);

// ── 8) 서랍 측면 레일 힌트 (세로 thin line 양쪽) ──────
const DRAWER_RAILS = `
      <!-- 서랍 측면 레일 (냉장실) -->
      <line x1="192" y1="325" x2="192" y2="372" stroke="#2A1408" stroke-width="0.8" opacity="0.5"/>
      <line x1="294" y1="325" x2="294" y2="372" stroke="#2A1408" stroke-width="0.8" opacity="0.5"/>
      <line x1="306" y1="325" x2="306" y2="372" stroke="#2A1408" stroke-width="0.8" opacity="0.5"/>
      <line x1="408" y1="325" x2="408" y2="372" stroke="#2A1408" stroke-width="0.8" opacity="0.5"/>
      <!-- 서랍 측면 레일 (냉동실) -->
      <line x1="192" y1="530" x2="192" y2="602" stroke="#2A1408" stroke-width="0.8" opacity="0.5"/>
      <line x1="294" y1="530" x2="294" y2="602" stroke="#2A1408" stroke-width="0.8" opacity="0.5"/>
      <line x1="306" y1="530" x2="306" y2="602" stroke="#2A1408" stroke-width="0.8" opacity="0.5"/>
      <line x1="408" y1="530" x2="408" y2="602" stroke="#2A1408" stroke-width="0.8" opacity="0.5"/>
`;

// 마지막 냉동 서랍 뒤에 레일 삽입
html = html.replace(
  /(<line x1="302" y1="604" x2="412" y2="604" stroke="#2A1408" stroke-width="1" \/>\s*\n)/,
  `$1${DRAWER_RAILS}`
);

// ── 9) 크롬 조절 다리 (기존 레드 블록 다리 교체) ────────
const OLD_LEGS_REGEX = /<rect x="168" y="624" width="264" height="10"[\s\S]*?<path d="M 415,629 L 420,626 L 420,638 L 415,641 Z" fill="#602018" \/>/;
const NEW_LEGS = `<!-- 하단 베이스 + 그림자 -->
      <ellipse cx="300" cy="652" rx="170" ry="8" fill="url(#floorShadow)"/>
      <rect x="168" y="624" width="264" height="10" rx="2" fill="url(#bodyDark)" stroke="#000" stroke-width="0.6"/>
      <!-- 좌측 크롬 조절 다리 -->
      <rect x="186" y="634" width="26" height="8" rx="2" fill="url(#chromeG)" stroke="#000" stroke-width="1.2"/>
      <rect x="190" y="640" width="18" height="6" rx="1" fill="#888" stroke="#000" stroke-width="1"/>
      <line x1="194" y1="643" x2="204" y2="643" stroke="#000" stroke-width="0.5" opacity="0.6"/>
      <!-- 우측 크롬 조절 다리 -->
      <rect x="388" y="634" width="26" height="8" rx="2" fill="url(#chromeG)" stroke="#000" stroke-width="1.2"/>
      <rect x="392" y="640" width="18" height="6" rx="1" fill="#888" stroke="#000" stroke-width="1"/>
      <line x1="396" y1="643" x2="406" y2="643" stroke="#000" stroke-width="0.5" opacity="0.6"/>`;

html = html.replace(OLD_LEGS_REGEX, NEW_LEGS);

// ── 10) 도어 개스킷 (문 열린 안쪽 가장자리 검은 고무 seal) ──
// 각 냉장 도어 안쪽에 얇은 검은 seal
// 좌측 냉장 도어: x=14~28, y=22~376 — 이미 railFrontG 있음, 그 안쪽에 seal 추가
// 좌측 냉장실 Interior 내부 프레임에 가까운 모서리에 얇은 dark line
// (복잡하니 body frame에 도어 개스킷 라인 추가 — 내부 개구부 테두리)
const GASKET = `
      <!-- 냉장실 개구부 개스킷 -->
      <rect x="181" y="32" width="238" height="347" rx="7" fill="none" stroke="#1a0604" stroke-width="1.2" opacity="0.6"/>
      <!-- 냉동실 개구부 개스킷 -->
      <rect x="181" y="403" width="238" height="208" rx="7" fill="none" stroke="#1a0604" stroke-width="1.2" opacity="0.6"/>
`;

html = html.replace(
  /(<rect x="182" y="33" width="236" height="345" rx="6" fill="none" stroke="rgba\(0,0,0,0\.2\)" stroke-width="4" stroke-linejoin="round"\/>)/,
  `${GASKET}\n      $1`
);

// 타이틀 업데이트
html = html.replace(/<title>[^<]*<\/title>/, '<title>Warm Gold — Fully Detailed</title>');

await writeFile(OUT, html);
console.log('→ .fridge-backups/variant-warm-detailed.html');

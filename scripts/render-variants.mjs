#!/usr/bin/env node
/**
 * 10가지 확연히 다른 냉장고 디자인 변형 생성.
 * 각 변형을 독립 PNG로 저장 + 한 장 합성 그리드도 생성.
 */
import { writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, '.fridge-backups');

// ─── 헬퍼 ────────────────────────────────────────────────────────────────
const wrapHtml = (svg, label) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#1a1a1a; font-family:-apple-system,sans-serif; color:#e8e8e8; }
  .label { font-size:18px; font-weight:bold; margin-bottom:12px; color:#ff9966; }
  .wrap { width:min(85vw,640px); aspect-ratio:660/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body>
  <div class="label">${label}</div>
  <div class="wrap">${svg}</div>
</body></html>`;

// ─── 10가지 디자인 ──────────────────────────────────────────────────────────
// 각각 viewBox는 유사하지만 색·형태·문 상태·장식이 모두 다름

const variants = [];

// V1: 모던 스테인리스 (실버 + 닫힌 문 + 디지털 패널)
variants.push({
  name: 'modern-stainless',
  label: '1. 모던 스테인리스',
  svg: `<svg viewBox="0 0 660 670" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d8dde2"/><stop offset="50%" stop-color="#a8b0b8"/><stop offset="100%" stop-color="#7a838c"/>
      </linearGradient>
      <linearGradient id="steelLight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.5"/><stop offset="40%" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="60" y="20" width="540" height="630" rx="12" fill="url(#steel)" stroke="#2a3038" stroke-width="3"/>
    <rect x="60" y="20" width="540" height="630" rx="12" fill="url(#steelLight)"/>
    <line x1="330" y1="20" x2="330" y2="450" stroke="#3a4048" stroke-width="2"/>
    <line x1="60" y1="450" x2="600" y2="450" stroke="#3a4048" stroke-width="2"/>
    <rect x="80" y="50" width="180" height="38" rx="4" fill="#0a1218" stroke="#2a3038" stroke-width="1"/>
    <text x="170" y="76" text-anchor="middle" fill="#5dd5c8" font-family="monospace" font-size="20" font-weight="bold">-2°C</text>
    <rect x="305" y="225" width="20" height="100" rx="3" fill="#1a1f25"/>
    <rect x="335" y="225" width="20" height="100" rx="3" fill="#1a1f25"/>
    <rect x="305" y="500" width="20" height="80" rx="3" fill="#1a1f25"/>
    <rect x="335" y="500" width="20" height="80" rx="3" fill="#1a1f25"/>
    <text x="330" y="640" text-anchor="middle" fill="#5a6068" font-size="11" font-weight="bold" letter-spacing="3">NAELUM PRO</text>
  </svg>`,
});

// V2: 빈티지 크림 레트로 (둥근 모서리 + 황동 손잡이)
variants.push({
  name: 'vintage-cream',
  label: '2. 빈티지 크림 레트로',
  svg: `<svg viewBox="0 0 660 670" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f9ebd0"/><stop offset="100%" stop-color="#dcc99c"/>
      </linearGradient>
      <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f4d068"/><stop offset="100%" stop-color="#a07820"/>
      </linearGradient>
    </defs>
    <rect x="60" y="40" width="540" height="600" rx="60" fill="url(#cream)" stroke="#5a4020" stroke-width="4"/>
    <rect x="80" y="60" width="500" height="320" rx="40" fill="#fff5e0" stroke="#5a4020" stroke-width="3"/>
    <rect x="80" y="400" width="500" height="220" rx="40" fill="#fff5e0" stroke="#5a4020" stroke-width="3"/>
    <ellipse cx="180" cy="220" rx="22" ry="50" fill="url(#brass)" stroke="#5a4020" stroke-width="2.5"/>
    <ellipse cx="480" cy="220" rx="22" ry="50" fill="url(#brass)" stroke="#5a4020" stroke-width="2.5"/>
    <ellipse cx="180" cy="510" rx="22" ry="40" fill="url(#brass)" stroke="#5a4020" stroke-width="2.5"/>
    <ellipse cx="480" cy="510" rx="22" ry="40" fill="url(#brass)" stroke="#5a4020" stroke-width="2.5"/>
    <circle cx="330" cy="400" r="22" fill="url(#brass)" stroke="#5a4020" stroke-width="2.5"/>
    <text x="330" y="408" text-anchor="middle" fill="#5a4020" font-size="14" font-weight="bold">N</text>
    <text x="330" y="660" text-anchor="middle" fill="#5a4020" font-size="20" font-style="italic" font-family="serif">Nælum</text>
  </svg>`,
});

// V3: 인더스트리얼 블랙 (각진 + 굵은 가로 손잡이)
variants.push({
  name: 'industrial-black',
  label: '3. 인더스트리얼 블랙',
  svg: `<svg viewBox="0 0 660 670" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="black" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3a3a3e"/><stop offset="100%" stop-color="#0a0a0d"/>
      </linearGradient>
    </defs>
    <rect x="40" y="30" width="580" height="610" fill="url(#black)" stroke="#000" stroke-width="6"/>
    <rect x="40" y="30" width="580" height="6" fill="#5a5a5e"/>
    <line x1="330" y1="30" x2="330" y2="430" stroke="#000" stroke-width="4"/>
    <line x1="40" y1="430" x2="620" y2="430" stroke="#000" stroke-width="4"/>
    <rect x="100" y="120" width="160" height="14" rx="2" fill="#c0c0c8" stroke="#000" stroke-width="2"/>
    <rect x="400" y="120" width="160" height="14" rx="2" fill="#c0c0c8" stroke="#000" stroke-width="2"/>
    <rect x="100" y="500" width="160" height="14" rx="2" fill="#c0c0c8" stroke="#000" stroke-width="2"/>
    <rect x="400" y="500" width="160" height="14" rx="2" fill="#c0c0c8" stroke="#000" stroke-width="2"/>
    <rect x="265" y="46" width="130" height="22" rx="2" fill="#0a0a0d" stroke="#5a5a5e" stroke-width="1"/>
    <text x="330" y="63" text-anchor="middle" fill="#5dd5c8" font-family="monospace" font-size="14" font-weight="bold">●NAELUM</text>
    <rect x="50" y="595" width="20" height="30" fill="#5a5a5e"/>
    <rect x="590" y="595" width="20" height="30" fill="#5a5a5e"/>
  </svg>`,
});

// V4: 4도어 닫힌 정면 뷰 (오렌지 + 닫힌 패널)
variants.push({
  name: 'closed-front',
  label: '4. 닫힌 4도어 정면',
  svg: `<svg viewBox="0 0 660 670" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="o4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ff8855"/><stop offset="100%" stop-color="#e85530"/>
      </linearGradient>
      <linearGradient id="o4d" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#a03828"/><stop offset="100%" stop-color="#802018"/>
      </linearGradient>
    </defs>
    <rect x="80" y="30" width="500" height="610" rx="10" fill="url(#o4)" stroke="#000" stroke-width="4"/>
    <rect x="90" y="40" width="240" height="380" rx="6" fill="url(#o4)" stroke="#000" stroke-width="3"/>
    <rect x="330" y="40" width="240" height="380" rx="6" fill="url(#o4)" stroke="#000" stroke-width="3"/>
    <rect x="90" y="430" width="240" height="200" rx="6" fill="url(#o4)" stroke="#000" stroke-width="3"/>
    <rect x="330" y="430" width="240" height="200" rx="6" fill="url(#o4)" stroke="#000" stroke-width="3"/>
    <rect x="305" y="200" width="22" height="60" rx="4" fill="url(#o4d)" stroke="#000" stroke-width="2"/>
    <rect x="333" y="200" width="22" height="60" rx="4" fill="url(#o4d)" stroke="#000" stroke-width="2"/>
    <rect x="305" y="490" width="22" height="50" rx="4" fill="url(#o4d)" stroke="#000" stroke-width="2"/>
    <rect x="333" y="490" width="22" height="50" rx="4" fill="url(#o4d)" stroke="#000" stroke-width="2"/>
    <rect x="100" y="60" width="140" height="40" rx="4" fill="rgba(255,255,255,0.15)"/>
    <text x="330" y="660" text-anchor="middle" fill="#a03828" font-size="14" font-weight="bold">NAELUM</text>
  </svg>`,
});

// V5: 유리문 디스플레이 쿨러 (투명 + 음료수 진열)
variants.push({
  name: 'glass-display',
  label: '5. 유리문 디스플레이',
  svg: `<svg viewBox="0 0 660 670" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(180,220,250,0.4)"/>
        <stop offset="50%" stop-color="rgba(140,180,210,0.3)"/>
        <stop offset="100%" stop-color="rgba(100,140,180,0.4)"/>
      </linearGradient>
    </defs>
    <rect x="60" y="20" width="540" height="630" rx="6" fill="#1a1a22" stroke="#3a3a44" stroke-width="3"/>
    <rect x="80" y="40" width="500" height="590" rx="3" fill="url(#glassG)" stroke="#5a6a7a" stroke-width="2"/>
    <rect x="120" y="100" width="20" height="80" fill="#d24040" stroke="#000" stroke-width="1.5"/>
    <rect x="150" y="95" width="20" height="85" fill="#3068c0" stroke="#000" stroke-width="1.5"/>
    <rect x="180" y="100" width="20" height="80" fill="#5db84a" stroke="#000" stroke-width="1.5"/>
    <rect x="220" y="100" width="20" height="80" fill="#e8a020" stroke="#000" stroke-width="1.5"/>
    <rect x="250" y="100" width="20" height="80" fill="#a040c0" stroke="#000" stroke-width="1.5"/>
    <rect x="120" y="220" width="60" height="100" fill="#fff" stroke="#000" stroke-width="1.5" rx="4"/>
    <rect x="190" y="225" width="60" height="95" fill="#f0e0a0" stroke="#000" stroke-width="1.5" rx="4"/>
    <rect x="260" y="220" width="60" height="100" fill="#c0c0e0" stroke="#000" stroke-width="1.5" rx="4"/>
    <rect x="380" y="100" width="20" height="80" fill="#3068c0" stroke="#000" stroke-width="1.5"/>
    <rect x="410" y="95" width="20" height="85" fill="#d24040" stroke="#000" stroke-width="1.5"/>
    <rect x="440" y="100" width="20" height="80" fill="#e8a020" stroke="#000" stroke-width="1.5"/>
    <rect x="470" y="100" width="20" height="80" fill="#5db84a" stroke="#000" stroke-width="1.5"/>
    <rect x="380" y="220" width="80" height="100" fill="#fff" stroke="#000" stroke-width="1.5" rx="4"/>
    <rect x="470" y="220" width="80" height="100" fill="#a060c0" stroke="#000" stroke-width="1.5" rx="4"/>
    <line x1="80" y1="200" x2="580" y2="200" stroke="#3a3a44" stroke-width="3"/>
    <line x1="80" y1="340" x2="580" y2="340" stroke="#3a3a44" stroke-width="3"/>
    <line x1="80" y1="480" x2="580" y2="480" stroke="#3a3a44" stroke-width="3"/>
    <text x="330" y="660" text-anchor="middle" fill="#9aa8b8" font-size="14" font-weight="bold" letter-spacing="2">NAELUM COLD</text>
  </svg>`,
});

// V6: 스마트 냉장고 (대형 디스플레이)
variants.push({
  name: 'smart-screen',
  label: '6. 스마트 디스플레이',
  svg: `<svg viewBox="0 0 660 670" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="smartG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e0e0e8"/><stop offset="100%" stop-color="#a8b0c0"/>
      </linearGradient>
      <linearGradient id="screenG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1a3060"/><stop offset="100%" stop-color="#0a1840"/>
      </linearGradient>
    </defs>
    <rect x="60" y="20" width="540" height="630" rx="14" fill="url(#smartG)" stroke="#5a6070" stroke-width="3"/>
    <rect x="80" y="50" width="500" height="280" rx="6" fill="url(#screenG)" stroke="#000" stroke-width="2"/>
    <text x="330" y="120" text-anchor="middle" fill="#fff" font-size="26" font-weight="bold">8:42 AM</text>
    <text x="330" y="155" text-anchor="middle" fill="#a8c8e8" font-size="14">2026년 4월 18일 토요일</text>
    <rect x="120" y="180" width="120" height="60" rx="6" fill="rgba(255,153,102,0.2)" stroke="#ff9966" stroke-width="1"/>
    <text x="180" y="208" text-anchor="middle" fill="#ff9966" font-size="11">남은 재료</text>
    <text x="180" y="228" text-anchor="middle" fill="#fff" font-size="20" font-weight="bold">12</text>
    <rect x="270" y="180" width="120" height="60" rx="6" fill="rgba(93,213,200,0.2)" stroke="#5dd5c8" stroke-width="1"/>
    <text x="330" y="208" text-anchor="middle" fill="#5dd5c8" font-size="11">추천 레시피</text>
    <text x="330" y="228" text-anchor="middle" fill="#fff" font-size="20" font-weight="bold">8</text>
    <rect x="420" y="180" width="120" height="60" rx="6" fill="rgba(232,80,120,0.2)" stroke="#e85078" stroke-width="1"/>
    <text x="480" y="208" text-anchor="middle" fill="#e85078" font-size="11">임박</text>
    <text x="480" y="228" text-anchor="middle" fill="#fff" font-size="20" font-weight="bold">3</text>
    <text x="330" y="290" text-anchor="middle" fill="#a8c8e8" font-size="13">"오늘 저녁은 김치찌개 어떠세요?"</text>
    <line x1="60" y1="350" x2="600" y2="350" stroke="#5a6070" stroke-width="3"/>
    <rect x="80" y="380" width="500" height="240" rx="6" fill="#f0f0f4" stroke="#5a6070" stroke-width="2"/>
    <rect x="305" y="490" width="6" height="36" rx="2" fill="#3a3a44"/>
    <rect x="349" y="490" width="6" height="36" rx="2" fill="#3a3a44"/>
    <text x="330" y="660" text-anchor="middle" fill="#3a3a44" font-size="13" font-weight="bold">NAELUM AI</text>
  </svg>`,
});

// V7: 어린이 핑크 캐릭터 (귀여운 + 얼굴)
variants.push({
  name: 'kids-pink',
  label: '7. 어린이 핑크 캐릭터',
  svg: `<svg viewBox="0 0 660 670" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pinkG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ff80b8"/><stop offset="100%" stop-color="#d04088"/>
      </linearGradient>
    </defs>
    <rect x="50" y="30" width="560" height="610" rx="80" fill="url(#pinkG)" stroke="#80205a" stroke-width="5"/>
    <ellipse cx="200" cy="180" rx="22" ry="28" fill="#fff"/>
    <circle cx="205" cy="185" r="14" fill="#000"/>
    <circle cx="208" cy="180" r="5" fill="#fff"/>
    <ellipse cx="460" cy="180" rx="22" ry="28" fill="#fff"/>
    <circle cx="465" cy="185" r="14" fill="#000"/>
    <circle cx="468" cy="180" r="5" fill="#fff"/>
    <circle cx="170" cy="250" r="22" fill="#ff80b8" opacity="0.7"/>
    <circle cx="490" cy="250" r="22" fill="#ff80b8" opacity="0.7"/>
    <path d="M 250,260 Q 330,330 410,260" fill="none" stroke="#80205a" stroke-width="6" stroke-linecap="round"/>
    <circle cx="290" cy="280" r="3" fill="#80205a"/>
    <circle cx="370" cy="280" r="3" fill="#80205a"/>
    <text x="120" y="120" font-size="32">🌸</text>
    <text x="500" y="120" font-size="32">🌟</text>
    <text x="100" y="450" font-size="36">🍎</text>
    <text x="510" y="450" font-size="36">🍓</text>
    <text x="280" y="500" font-size="40">🦄</text>
    <line x1="50" y1="380" x2="610" y2="380" stroke="#80205a" stroke-width="3" stroke-dasharray="6 4"/>
    <text x="330" y="640" text-anchor="middle" fill="#80205a" font-size="22" font-weight="bold" font-family="cursive">Naelum 키즈 ♡</text>
  </svg>`,
});

// V8: 우드 캐비넷 스타일 (원목 패널)
variants.push({
  name: 'wood-cabinet',
  label: '8. 우드 캐비넷',
  svg: `<svg viewBox="0 0 660 670" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="walnut" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8a5a30"/><stop offset="50%" stop-color="#6a4020"/><stop offset="100%" stop-color="#3a2010"/>
      </linearGradient>
      <linearGradient id="walnutLight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#a87040"/><stop offset="100%" stop-color="#7a4818"/>
      </linearGradient>
    </defs>
    <rect x="60" y="30" width="540" height="610" fill="url(#walnut)" stroke="#1a0a05" stroke-width="4"/>
    <rect x="80" y="50" width="240" height="380" fill="url(#walnutLight)" stroke="#1a0a05" stroke-width="2"/>
    <rect x="340" y="50" width="240" height="380" fill="url(#walnutLight)" stroke="#1a0a05" stroke-width="2"/>
    <rect x="80" y="450" width="240" height="170" fill="url(#walnutLight)" stroke="#1a0a05" stroke-width="2"/>
    <rect x="340" y="450" width="240" height="170" fill="url(#walnutLight)" stroke="#1a0a05" stroke-width="2"/>
    <line x1="80" y1="80" x2="320" y2="80" stroke="#3a2010" stroke-width="1.5"/>
    <line x1="80" y1="120" x2="320" y2="120" stroke="#3a2010" stroke-width="1.5"/>
    <line x1="80" y1="200" x2="320" y2="200" stroke="#3a2010" stroke-width="1.5"/>
    <line x1="80" y1="280" x2="320" y2="280" stroke="#3a2010" stroke-width="1.5"/>
    <line x1="80" y1="380" x2="320" y2="380" stroke="#3a2010" stroke-width="1.5"/>
    <line x1="340" y1="80" x2="580" y2="80" stroke="#3a2010" stroke-width="1.5"/>
    <line x1="340" y1="160" x2="580" y2="160" stroke="#3a2010" stroke-width="1.5"/>
    <line x1="340" y1="250" x2="580" y2="250" stroke="#3a2010" stroke-width="1.5"/>
    <line x1="340" y1="340" x2="580" y2="340" stroke="#3a2010" stroke-width="1.5"/>
    <circle cx="305" cy="240" r="6" fill="#a08040" stroke="#3a2010" stroke-width="1.5"/>
    <circle cx="355" cy="240" r="6" fill="#a08040" stroke="#3a2010" stroke-width="1.5"/>
    <circle cx="305" cy="535" r="6" fill="#a08040" stroke="#3a2010" stroke-width="1.5"/>
    <circle cx="355" cy="535" r="6" fill="#a08040" stroke="#3a2010" stroke-width="1.5"/>
    <text x="330" y="660" text-anchor="middle" fill="#a08040" font-size="14" font-style="italic" font-family="serif">Nælum Cabinet</text>
  </svg>`,
});

// V9: 미니 컴팩트 (작은 단문)
variants.push({
  name: 'mini-compact',
  label: '9. 미니 컴팩트',
  svg: `<svg viewBox="0 0 660 670" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mintG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7adcc8"/><stop offset="100%" stop-color="#3a9098"/>
      </linearGradient>
    </defs>
    <rect x="200" y="100" width="260" height="500" rx="20" fill="url(#mintG)" stroke="#1a4048" stroke-width="4"/>
    <line x1="200" y1="380" x2="460" y2="380" stroke="#1a4048" stroke-width="3"/>
    <rect x="220" y="120" width="220" height="240" rx="8" fill="rgba(255,255,255,0.15)" stroke="#1a4048" stroke-width="1"/>
    <rect x="220" y="400" width="220" height="180" rx="8" fill="rgba(255,255,255,0.15)" stroke="#1a4048" stroke-width="1"/>
    <rect x="425" y="220" width="22" height="60" rx="3" fill="#1a4048"/>
    <rect x="425" y="450" width="22" height="50" rx="3" fill="#1a4048"/>
    <circle cx="440" cy="370" r="4" fill="#fff"/>
    <text x="330" y="640" text-anchor="middle" fill="#1a4048" font-size="14" font-weight="bold" letter-spacing="2">NAELUM MINI</text>
    <ellipse cx="330" cy="630" rx="170" ry="15" fill="rgba(0,0,0,0.25)"/>
  </svg>`,
});

// V10: 파스텔 라벤더 (둥근 + 부드러운)
variants.push({
  name: 'pastel-lavender',
  label: '10. 파스텔 라벤더',
  svg: `<svg viewBox="0 0 660 670" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lav" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d8c8f0"/><stop offset="100%" stop-color="#a888d8"/>
      </linearGradient>
      <linearGradient id="lavL" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.4"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="80" y="40" width="500" height="600" rx="50" fill="url(#lav)" stroke="#6a4898" stroke-width="4"/>
    <rect x="80" y="40" width="500" height="160" rx="50" fill="url(#lavL)"/>
    <ellipse cx="330" cy="50" rx="180" ry="14" fill="#fff" opacity="0.5"/>
    <line x1="80" y1="380" x2="580" y2="380" stroke="#6a4898" stroke-width="3"/>
    <rect x="100" y="80" width="460" height="280" rx="30" fill="rgba(255,255,255,0.5)" stroke="#6a4898" stroke-width="2"/>
    <rect x="100" y="400" width="460" height="220" rx="30" fill="rgba(255,255,255,0.4)" stroke="#6a4898" stroke-width="2"/>
    <circle cx="540" cy="220" r="20" fill="#fff" stroke="#6a4898" stroke-width="2.5"/>
    <circle cx="540" cy="500" r="20" fill="#fff" stroke="#6a4898" stroke-width="2.5"/>
    <text x="160" y="240" font-size="32">🌸</text>
    <text x="240" y="240" font-size="32">🌷</text>
    <text x="330" y="240" font-size="32">🌿</text>
    <text x="410" y="240" font-size="32">🍇</text>
    <text x="180" y="510" font-size="36">🧁</text>
    <text x="280" y="510" font-size="36">🍰</text>
    <text x="380" y="510" font-size="36">🍮</text>
    <text x="330" y="660" text-anchor="middle" fill="#6a4898" font-size="16" font-style="italic">Nælum Lavender 💜</text>
  </svg>`,
});

// ─── 렌더 ───────────────────────────────────────────────────────────────
const browser = await chromium.launch();

for (const v of variants) {
  const html = wrapHtml(v.svg, v.label);
  const htmlPath = path.join(OUT_DIR, `_variant-${v.name}.html`);
  await writeFile(htmlPath, html);

  const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const out = path.join(OUT_DIR, `variant-${String(variants.indexOf(v) + 1).padStart(2, '0')}-${v.name}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log('  →', path.basename(out));
  await ctx.close();
}

// ─── 합성 그리드 (2x5) ───────────────────────────────────────────────────
const gridHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { margin:0; padding:20px; background:#1a1a1a; font-family:-apple-system,sans-serif; color:#e8e8e8; }
  h1 { text-align:center; color:#ff9966; margin:0 0 24px; }
  .grid { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; }
  .cell { background:#2a2a2a; border-radius:8px; padding:12px; }
  .cell .label { font-size:13px; font-weight:bold; color:#ff9966; margin-bottom:8px; text-align:center; }
  .cell .svg-wrap { aspect-ratio:660/670; }
  svg { width:100%; height:100%; display:block; }
</style></head><body>
  <h1>10가지 냉장고 디자인 변형</h1>
  <div class="grid">
    ${variants.map(v => `<div class="cell"><div class="label">${v.label}</div><div class="svg-wrap">${v.svg}</div></div>`).join('')}
  </div>
</body></html>`;
const gridPath = path.join(OUT_DIR, '_variants-grid.html');
await writeFile(gridPath, gridHtml);
const ctx = await browser.newContext({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('file://' + gridPath, { waitUntil: 'load' });
await page.waitForTimeout(800);
const gridOut = path.join(OUT_DIR, 'variants-grid.png');
await page.screenshot({ path: gridOut, fullPage: true });
console.log('  → variants-grid.png');
await browser.close();
console.log('\nDone. 10 variants + 1 grid saved in .fridge-backups/');

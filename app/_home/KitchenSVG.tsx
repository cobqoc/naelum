'use client';

/**
 * 선반장 — 상온 재료 저장소.
 * 카툰 스타일 우드 캐비닛 프레임(크라운 몰딩 + 측면 패널 + 베이스보드)
 * + 3단 오픈 선반 + 황동 브라켓 + 우드 그레인/옹이/리벳 디테일.
 * 재료 자체는 외부 chip overlay가 얹힘 → 구조물만 디테일하게.
 */
export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 660 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* 내부 뒷벽 — 따뜻한 테라코타 */}
        <linearGradient id="kitWallG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4d9b4" />
          <stop offset="100%" stopColor="#d69c6e" />
        </linearGradient>
        {/* 선반 상단 — 밝은 오크 */}
        <linearGradient id="kitShelfTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbecd0" />
          <stop offset="100%" stopColor="#dcb988" />
        </linearGradient>
        {/* 선반 전면 — 중간 오크 (두께) */}
        <linearGradient id="kitShelfFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a072" />
          <stop offset="100%" stopColor="#8a6238" />
        </linearGradient>
        {/* 프레임 — 진한 월넛 */}
        <linearGradient id="kitFrameG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a87848" />
          <stop offset="100%" stopColor="#5a3818" />
        </linearGradient>
        {/* 측면 패널 — 안쪽으로 들어간 그림자면 */}
        <linearGradient id="kitSideL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6a4624" />
          <stop offset="100%" stopColor="#3a2410" />
        </linearGradient>
        <linearGradient id="kitSideR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#6a4624" />
          <stop offset="100%" stopColor="#3a2410" />
        </linearGradient>
        {/* 크라운 몰딩 (상단 장식) */}
        <linearGradient id="kitCrown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a878" />
          <stop offset="100%" stopColor="#7a4e24" />
        </linearGradient>
        {/* 선반 아래 드리운 그림자 */}
        <linearGradient id="kitShelfShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(20,10,2,0.4)" />
          <stop offset="100%" stopColor="rgba(20,10,2,0)" />
        </linearGradient>
        {/* 황동 브라켓 */}
        <linearGradient id="kitBrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5d67a" />
          <stop offset="50%" stopColor="#c49838" />
          <stop offset="100%" stopColor="#7a5018" />
        </linearGradient>
        {/* 바닥 그림자 */}
        <radialGradient id="kitGroundShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        {/* 벽지 패턴 — 아주 옅은 점무늬 */}
        <pattern id="kitWallDot" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="0.7" fill="rgba(110,60,20,0.18)" />
        </pattern>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse cx="330" cy="216" rx="310" ry="5" fill="url(#kitGroundShadow)" />

      {/* === 크라운 몰딩 (최상단, 좌우로 살짝 튀어나옴) === */}
      <path d="M 0,2 L 660,2 L 650,12 L 10,12 Z" fill="url(#kitCrown)" stroke="#2a1808" strokeWidth="3.5" strokeLinejoin="round" />
      <line x1="4" y1="4" x2="656" y2="4" stroke="rgba(255,248,220,0.6)" strokeWidth="1.2" />
      <line x1="14" y1="7" x2="646" y2="7" stroke="rgba(80,40,10,0.4)" strokeWidth="0.7" />

      {/* === 외곽 캐비닛 프레임 === */}
      <rect x="4" y="12" width="652" height="196" rx="6" fill="url(#kitFrameG)" stroke="#2a1808" strokeWidth="3.5" strokeLinejoin="round" />

      {/* === 내부 뒷벽 === */}
      <rect x="28" y="18" width="604" height="184" rx="3" fill="url(#kitWallG)" stroke="#2a1808" strokeWidth="2" strokeLinejoin="round" />
      <rect x="28" y="18" width="604" height="184" rx="3" fill="url(#kitWallDot)" />

      {/* === 좌측 사이드 패널 (두께감) === */}
      <path d="M 4,12 L 28,18 L 28,202 L 4,208 Z" fill="url(#kitSideL)" stroke="#2a1808" strokeWidth="3" strokeLinejoin="round" />
      {/* 좌측 세로 그레인 */}
      <line x1="14" y1="20" x2="14" y2="200" stroke="rgba(255,240,200,0.25)" strokeWidth="0.7" />
      <line x1="20" y1="20" x2="20" y2="200" stroke="rgba(40,20,5,0.3)" strokeWidth="0.6" />
      {/* 좌측 나사 (상하) */}
      <circle cx="16" cy="22" r="1.5" fill="url(#kitBrass)" stroke="#3a2410" strokeWidth="0.6" />
      <circle cx="16" cy="198" r="1.5" fill="url(#kitBrass)" stroke="#3a2410" strokeWidth="0.6" />

      {/* === 우측 사이드 패널 === */}
      <path d="M 656,12 L 632,18 L 632,202 L 656,208 Z" fill="url(#kitSideR)" stroke="#2a1808" strokeWidth="3" strokeLinejoin="round" />
      <line x1="646" y1="20" x2="646" y2="200" stroke="rgba(255,240,200,0.25)" strokeWidth="0.7" />
      <line x1="640" y1="20" x2="640" y2="200" stroke="rgba(40,20,5,0.3)" strokeWidth="0.6" />
      <circle cx="644" cy="22" r="1.5" fill="url(#kitBrass)" stroke="#3a2410" strokeWidth="0.6" />
      <circle cx="644" cy="198" r="1.5" fill="url(#kitBrass)" stroke="#3a2410" strokeWidth="0.6" />

      {/* === 내부 뒷벽 세로 우드판 그레인 (판자 구분선) === */}
      <line x1="180" y1="20" x2="180" y2="200" stroke="rgba(100,50,20,0.3)" strokeWidth="1.2" />
      <line x1="181.2" y1="20" x2="181.2" y2="200" stroke="rgba(255,240,200,0.35)" strokeWidth="0.6" />
      <line x1="330" y1="20" x2="330" y2="200" stroke="rgba(100,50,20,0.3)" strokeWidth="1.2" />
      <line x1="331.2" y1="20" x2="331.2" y2="200" stroke="rgba(255,240,200,0.35)" strokeWidth="0.6" />
      <line x1="480" y1="20" x2="480" y2="200" stroke="rgba(100,50,20,0.3)" strokeWidth="1.2" />
      <line x1="481.2" y1="20" x2="481.2" y2="200" stroke="rgba(255,240,200,0.35)" strokeWidth="0.6" />

      {/* =========== 상단 선반 (y=34-50) =========== */}
      <rect x="32" y="50" width="596" height="14" fill="url(#kitShelfShadow)" opacity="0.85" />
      {/* 전면(두꺼운 카툰 엣지) */}
      <rect x="28" y="42" width="604" height="11" rx="1.5" fill="url(#kitShelfFront)" stroke="#2a1808" strokeWidth="3" strokeLinejoin="round" />
      {/* 상단(윗면) */}
      <rect x="28" y="34" width="604" height="10" rx="1.5" fill="url(#kitShelfTop)" stroke="#2a1808" strokeWidth="3" strokeLinejoin="round" />
      <line x1="32" y1="37" x2="628" y2="37" stroke="rgba(255,252,235,0.85)" strokeWidth="1.2" />
      {/* 전면 우드 그레인 점 */}
      <line x1="120" y1="44" x2="120" y2="51" stroke="rgba(60,30,10,0.4)" strokeWidth="0.8" />
      <line x1="270" y1="43" x2="270" y2="51" stroke="rgba(60,30,10,0.4)" strokeWidth="0.8" />
      <line x1="420" y1="44" x2="420" y2="51" stroke="rgba(60,30,10,0.4)" strokeWidth="0.8" />
      <line x1="540" y1="43" x2="540" y2="51" stroke="rgba(60,30,10,0.4)" strokeWidth="0.8" />
      {/* 옹이(knot) */}
      <ellipse cx="340" cy="47" rx="2.5" ry="1.2" fill="rgba(50,25,8,0.55)" />
      <ellipse cx="340" cy="47" rx="1.3" ry="0.6" fill="rgba(30,15,5,0.7)" />
      {/* 좌측 황동 브라켓 */}
      <path d="M 36,43 L 36,60 L 56,60" fill="none" stroke="url(#kitBrass)" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="36" cy="46" r="1.4" fill="#5a3810" />
      <circle cx="53" cy="60" r="1.4" fill="#5a3810" />
      {/* 우측 황동 브라켓 */}
      <path d="M 624,43 L 624,60 L 604,60" fill="none" stroke="url(#kitBrass)" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="624" cy="46" r="1.4" fill="#5a3810" />
      <circle cx="607" cy="60" r="1.4" fill="#5a3810" />

      {/* =========== 중간 선반 (y=106-122) =========== */}
      <rect x="32" y="122" width="596" height="14" fill="url(#kitShelfShadow)" opacity="0.85" />
      <rect x="28" y="114" width="604" height="11" rx="1.5" fill="url(#kitShelfFront)" stroke="#2a1808" strokeWidth="3" strokeLinejoin="round" />
      <rect x="28" y="106" width="604" height="10" rx="1.5" fill="url(#kitShelfTop)" stroke="#2a1808" strokeWidth="3" strokeLinejoin="round" />
      <line x1="32" y1="109" x2="628" y2="109" stroke="rgba(255,252,235,0.85)" strokeWidth="1.2" />
      <line x1="120" y1="116" x2="120" y2="123" stroke="rgba(60,30,10,0.4)" strokeWidth="0.8" />
      <line x1="270" y1="115" x2="270" y2="123" stroke="rgba(60,30,10,0.4)" strokeWidth="0.8" />
      <line x1="420" y1="116" x2="420" y2="123" stroke="rgba(60,30,10,0.4)" strokeWidth="0.8" />
      <line x1="540" y1="115" x2="540" y2="123" stroke="rgba(60,30,10,0.4)" strokeWidth="0.8" />
      <ellipse cx="210" cy="119" rx="2.2" ry="1.1" fill="rgba(50,25,8,0.5)" />
      <ellipse cx="210" cy="119" rx="1.1" ry="0.5" fill="rgba(30,15,5,0.65)" />
      <path d="M 36,115 L 36,132 L 56,132" fill="none" stroke="url(#kitBrass)" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="36" cy="118" r="1.4" fill="#5a3810" />
      <circle cx="53" cy="132" r="1.4" fill="#5a3810" />
      <path d="M 624,115 L 624,132 L 604,132" fill="none" stroke="url(#kitBrass)" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="624" cy="118" r="1.4" fill="#5a3810" />
      <circle cx="607" cy="132" r="1.4" fill="#5a3810" />

      {/* =========== 하단 선반 (y=176-192) =========== */}
      <rect x="32" y="192" width="596" height="10" fill="url(#kitShelfShadow)" opacity="0.7" />
      <rect x="28" y="184" width="604" height="11" rx="1.5" fill="url(#kitShelfFront)" stroke="#2a1808" strokeWidth="3" strokeLinejoin="round" />
      <rect x="28" y="176" width="604" height="10" rx="1.5" fill="url(#kitShelfTop)" stroke="#2a1808" strokeWidth="3" strokeLinejoin="round" />
      <line x1="32" y1="179" x2="628" y2="179" stroke="rgba(255,252,235,0.85)" strokeWidth="1.2" />
      <line x1="120" y1="186" x2="120" y2="193" stroke="rgba(60,30,10,0.4)" strokeWidth="0.8" />
      <line x1="270" y1="185" x2="270" y2="193" stroke="rgba(60,30,10,0.4)" strokeWidth="0.8" />
      <line x1="420" y1="186" x2="420" y2="193" stroke="rgba(60,30,10,0.4)" strokeWidth="0.8" />
      <line x1="540" y1="185" x2="540" y2="193" stroke="rgba(60,30,10,0.4)" strokeWidth="0.8" />
      <ellipse cx="460" cy="189" rx="2.3" ry="1.1" fill="rgba(50,25,8,0.5)" />
      <ellipse cx="460" cy="189" rx="1.1" ry="0.5" fill="rgba(30,15,5,0.65)" />
      <path d="M 36,185 L 36,200 L 56,200" fill="none" stroke="url(#kitBrass)" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="36" cy="188" r="1.4" fill="#5a3810" />
      <circle cx="53" cy="200" r="1.4" fill="#5a3810" />
      <path d="M 624,185 L 624,200 L 604,200" fill="none" stroke="url(#kitBrass)" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="624" cy="188" r="1.4" fill="#5a3810" />
      <circle cx="607" cy="200" r="1.4" fill="#5a3810" />

      {/* === 하단 베이스보드 === */}
      <rect x="4" y="204" width="652" height="12" rx="2" fill="url(#kitCrown)" stroke="#2a1808" strokeWidth="3" strokeLinejoin="round" />
      <line x1="10" y1="207" x2="650" y2="207" stroke="rgba(255,248,220,0.6)" strokeWidth="1.2" />
      <line x1="10" y1="213" x2="650" y2="213" stroke="rgba(40,20,5,0.45)" strokeWidth="0.8" />
    </svg>
  );
}

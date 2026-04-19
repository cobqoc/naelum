'use client';

/**
 * 선반장 v10 — 상온 재료 저장소.
 * 3D 일러스트 느낌 우드 쿠킹 스테이션:
 *  - 좌/우 버팀 기둥 (wood post) + 상하 캡
 *  - 2단 플로팅 오크 선반 (상단 하이라이트 + 전면 두께 + 드리운 그림자)
 *  - 두툼한 버처블록 스타일 하단 카운터 (chip overlay가 얹힘)
 *  - 따뜻한 테라코타 벽 + subway tile 패턴 + 상단 조명 글로우
 *  - 황동 L자 브라켓 + 리벳, 옹이·우드그레인 디테일
 * chip overlay는 HomeClient에서 bottom-[6%]로 얹혀지므로 카운터 상판이 chip의 "받침" 역할.
 */
export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 660 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* 벽 — 웜 테라코타 그라데이션 */}
        <linearGradient id="kitWall2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6dcb6" />
          <stop offset="60%" stopColor="#e8b88a" />
          <stop offset="100%" stopColor="#cc956a" />
        </linearGradient>
        {/* 상단 조명 글로우 */}
        <radialGradient id="kitWallGlow" cx="50%" cy="0%" r="65%">
          <stop offset="0%" stopColor="rgba(255,240,200,0.45)" />
          <stop offset="100%" stopColor="rgba(255,240,200,0)" />
        </radialGradient>
        {/* 선반 상단 — 밝은 오크 */}
        <linearGradient id="kitShelfTop2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbeed1" />
          <stop offset="100%" stopColor="#dfbb8c" />
        </linearGradient>
        {/* 선반 전면 — 중간 오크 */}
        <linearGradient id="kitShelfFront2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a072" />
          <stop offset="60%" stopColor="#a67a46" />
          <stop offset="100%" stopColor="#6e4a22" />
        </linearGradient>
        {/* 기둥 사이드 — 짙은 월넛 (음영면) */}
        <linearGradient id="kitPost2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3a2410" />
          <stop offset="50%" stopColor="#6a4a24" />
          <stop offset="100%" stopColor="#3a2410" />
        </linearGradient>
        {/* 기둥 top cap */}
        <linearGradient id="kitPostTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbeed1" />
          <stop offset="100%" stopColor="#c9a072" />
        </linearGradient>
        {/* 카운터 상판 — 버처블록 */}
        <linearGradient id="kitCounterTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbeed1" />
          <stop offset="60%" stopColor="#e5c58e" />
          <stop offset="100%" stopColor="#b68a54" />
        </linearGradient>
        {/* 카운터 앞면 */}
        <linearGradient id="kitCounterFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a67a46" />
          <stop offset="100%" stopColor="#5a3c18" />
        </linearGradient>
        {/* 선반 아래 드리운 그림자 */}
        <linearGradient id="kitShelfShadow2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(20,10,2,0.55)" />
          <stop offset="100%" stopColor="rgba(20,10,2,0)" />
        </linearGradient>
        {/* 황동 브라켓 */}
        <linearGradient id="kitBrass2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="50%" stopColor="#c8962c" />
          <stop offset="100%" stopColor="#6e4810" />
        </linearGradient>
        {/* 바닥 그림자 */}
        <radialGradient id="kitFloorShadow2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.38)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        {/* 벽 타일 패턴 (subway tile 느낌) */}
        <pattern id="kitTile" x="0" y="0" width="44" height="22" patternUnits="userSpaceOnUse">
          <rect width="44" height="22" fill="none" />
          <rect x="0.5" y="0.5" width="43" height="21" fill="rgba(255,230,195,0.08)" rx="1.2" />
          <line x1="0" y1="22" x2="44" y2="22" stroke="rgba(90,50,20,0.12)" strokeWidth="0.5" />
          <line x1="44" y1="0" x2="44" y2="22" stroke="rgba(90,50,20,0.12)" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* 1. 바닥 그림자 */}
      <ellipse cx="330" cy="216" rx="315" ry="5" fill="url(#kitFloorShadow2)" />

      {/* 2. 뒷벽 — 테라코타 그라데이션 + subway tile + 상단 조명 */}
      <rect x="0" y="0" width="660" height="220" fill="url(#kitWall2)" />
      <rect x="0" y="0" width="660" height="164" fill="url(#kitTile)" opacity="0.85" />
      <rect x="0" y="0" width="660" height="180" fill="url(#kitWallGlow)" />

      {/* 3. 좌측 우드 기둥 (두꺼운 버팀목, 3D 두께감) */}
      {/* 측면 음영면 (원기둥처럼 중앙이 밝은 그라디언트) */}
      <rect x="18" y="18" width="28" height="186" fill="url(#kitPost2)" stroke="#1a0d04" strokeWidth="2.8" strokeLinejoin="round" />
      {/* 상단 캡 (밝은 오크 평평한 윗면) */}
      <rect x="15" y="12" width="34" height="10" rx="1.5" fill="url(#kitPostTop)" stroke="#1a0d04" strokeWidth="2.8" strokeLinejoin="round" />
      {/* 세로 그레인 */}
      <line x1="26" y1="23" x2="26" y2="202" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <line x1="32" y1="23" x2="32" y2="202" stroke="rgba(40,20,5,0.35)" strokeWidth="0.7" />
      <line x1="38" y1="23" x2="38" y2="202" stroke="rgba(255,240,200,0.25)" strokeWidth="0.7" />
      {/* 옹이 */}
      <ellipse cx="32" cy="85" rx="2.5" ry="1.3" fill="rgba(30,15,3,0.7)" />
      <ellipse cx="32" cy="85" rx="1.2" ry="0.6" fill="rgba(15,8,2,0.8)" />
      {/* 상하 황동 나사 */}
      <circle cx="32" cy="26" r="1.8" fill="url(#kitBrass2)" stroke="#3a2410" strokeWidth="0.7" />
      <circle cx="32" cy="196" r="1.8" fill="url(#kitBrass2)" stroke="#3a2410" strokeWidth="0.7" />

      {/* 4. 우측 우드 기둥 (대칭) */}
      <rect x="614" y="18" width="28" height="186" fill="url(#kitPost2)" stroke="#1a0d04" strokeWidth="2.8" strokeLinejoin="round" />
      <rect x="611" y="12" width="34" height="10" rx="1.5" fill="url(#kitPostTop)" stroke="#1a0d04" strokeWidth="2.8" strokeLinejoin="round" />
      <line x1="622" y1="23" x2="622" y2="202" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <line x1="628" y1="23" x2="628" y2="202" stroke="rgba(40,20,5,0.35)" strokeWidth="0.7" />
      <line x1="634" y1="23" x2="634" y2="202" stroke="rgba(255,240,200,0.25)" strokeWidth="0.7" />
      <ellipse cx="628" cy="132" rx="2.5" ry="1.3" fill="rgba(30,15,3,0.7)" />
      <ellipse cx="628" cy="132" rx="1.2" ry="0.6" fill="rgba(15,8,2,0.8)" />
      <circle cx="628" cy="26" r="1.8" fill="url(#kitBrass2)" stroke="#3a2410" strokeWidth="0.7" />
      <circle cx="628" cy="196" r="1.8" fill="url(#kitBrass2)" stroke="#3a2410" strokeWidth="0.7" />

      {/* 5. 상단 선반 (y≈30~55, 두께감 강화) */}
      {/* 선반 아래 드리운 그림자 */}
      <rect x="46" y="55" width="568" height="16" fill="url(#kitShelfShadow2)" opacity="0.9" />
      {/* 전면 */}
      <rect x="40" y="44" width="580" height="13" rx="1.5" fill="url(#kitShelfFront2)" stroke="#1a0d04" strokeWidth="2.8" strokeLinejoin="round" />
      {/* 상단 (윗면, 더 밝음) */}
      <rect x="40" y="32" width="580" height="14" rx="1.5" fill="url(#kitShelfTop2)" stroke="#1a0d04" strokeWidth="2.8" strokeLinejoin="round" />
      {/* 상단 하이라이트 (반짝) */}
      <line x1="48" y1="35" x2="612" y2="35" stroke="rgba(255,252,235,0.95)" strokeWidth="1.6" />
      <line x1="48" y1="39" x2="612" y2="39" stroke="rgba(255,250,220,0.4)" strokeWidth="0.7" />
      {/* 전면 우드 그레인 세로 점 */}
      <line x1="130" y1="46" x2="130" y2="55" stroke="rgba(50,25,8,0.55)" strokeWidth="0.9" />
      <line x1="260" y1="45" x2="260" y2="55" stroke="rgba(50,25,8,0.55)" strokeWidth="0.9" />
      <line x1="390" y1="46" x2="390" y2="55" stroke="rgba(50,25,8,0.55)" strokeWidth="0.9" />
      <line x1="520" y1="45" x2="520" y2="55" stroke="rgba(50,25,8,0.55)" strokeWidth="0.9" />
      {/* 옹이 (상단면 + 전면) */}
      <ellipse cx="330" cy="39" rx="3.5" ry="1.4" fill="rgba(60,30,10,0.35)" />
      <ellipse cx="330" cy="39" rx="1.5" ry="0.7" fill="rgba(25,12,3,0.55)" />
      <ellipse cx="200" cy="50" rx="2.8" ry="1.2" fill="rgba(30,15,4,0.6)" />
      <ellipse cx="200" cy="50" rx="1.2" ry="0.6" fill="rgba(15,8,2,0.8)" />
      {/* 황동 L자 브라켓 좌 */}
      <path d="M 60,43 L 60,68 L 80,68" fill="none" stroke="url(#kitBrass2)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="60" cy="48" r="1.8" fill="#3a2410" />
      <circle cx="76" cy="68" r="1.8" fill="#3a2410" />
      {/* 브라켓 광택 하이라이트 */}
      <path d="M 58.5,45 L 58.5,66" stroke="rgba(255,240,180,0.6)" strokeWidth="1" strokeLinecap="round" />
      {/* 우측 브라켓 */}
      <path d="M 600,43 L 600,68 L 580,68" fill="none" stroke="url(#kitBrass2)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="600" cy="48" r="1.8" fill="#3a2410" />
      <circle cx="584" cy="68" r="1.8" fill="#3a2410" />
      <path d="M 601.5,45 L 601.5,66" stroke="rgba(255,240,180,0.6)" strokeWidth="1" strokeLinecap="round" />

      {/* 6. 중단 선반 (y≈95~120) */}
      <rect x="46" y="120" width="568" height="14" fill="url(#kitShelfShadow2)" opacity="0.9" />
      <rect x="40" y="109" width="580" height="13" rx="1.5" fill="url(#kitShelfFront2)" stroke="#1a0d04" strokeWidth="2.8" strokeLinejoin="round" />
      <rect x="40" y="97" width="580" height="14" rx="1.5" fill="url(#kitShelfTop2)" stroke="#1a0d04" strokeWidth="2.8" strokeLinejoin="round" />
      <line x1="48" y1="100" x2="612" y2="100" stroke="rgba(255,252,235,0.95)" strokeWidth="1.6" />
      <line x1="48" y1="104" x2="612" y2="104" stroke="rgba(255,250,220,0.4)" strokeWidth="0.7" />
      <line x1="130" y1="111" x2="130" y2="120" stroke="rgba(50,25,8,0.55)" strokeWidth="0.9" />
      <line x1="260" y1="110" x2="260" y2="120" stroke="rgba(50,25,8,0.55)" strokeWidth="0.9" />
      <line x1="390" y1="111" x2="390" y2="120" stroke="rgba(50,25,8,0.55)" strokeWidth="0.9" />
      <line x1="520" y1="110" x2="520" y2="120" stroke="rgba(50,25,8,0.55)" strokeWidth="0.9" />
      <ellipse cx="450" cy="104" rx="3.5" ry="1.4" fill="rgba(60,30,10,0.35)" />
      <ellipse cx="450" cy="104" rx="1.5" ry="0.7" fill="rgba(25,12,3,0.55)" />
      <ellipse cx="290" cy="115" rx="2.8" ry="1.2" fill="rgba(30,15,4,0.6)" />
      <ellipse cx="290" cy="115" rx="1.2" ry="0.6" fill="rgba(15,8,2,0.8)" />
      {/* 브라켓 */}
      <path d="M 60,108 L 60,133 L 80,133" fill="none" stroke="url(#kitBrass2)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="60" cy="113" r="1.8" fill="#3a2410" />
      <circle cx="76" cy="133" r="1.8" fill="#3a2410" />
      <path d="M 58.5,110 L 58.5,131" stroke="rgba(255,240,180,0.6)" strokeWidth="1" strokeLinecap="round" />
      <path d="M 600,108 L 600,133 L 580,133" fill="none" stroke="url(#kitBrass2)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="600" cy="113" r="1.8" fill="#3a2410" />
      <circle cx="584" cy="133" r="1.8" fill="#3a2410" />
      <path d="M 601.5,110 L 601.5,131" stroke="rgba(255,240,180,0.6)" strokeWidth="1" strokeLinecap="round" />

      {/* 7. 하단 카운터 — 두꺼운 버처블록 (chip이 여기 얹힘) */}
      {/* 카운터 아래 그림자 */}
      <rect x="20" y="202" width="620" height="8" fill="url(#kitShelfShadow2)" opacity="0.8" />
      {/* 전면 (두꺼움) */}
      <rect x="10" y="178" width="640" height="24" rx="2.5" fill="url(#kitCounterFront)" stroke="#1a0d04" strokeWidth="3" strokeLinejoin="round" />
      {/* 상판 (두꺼움, 버처블록 스타일) */}
      <rect x="10" y="160" width="640" height="20" rx="2.5" fill="url(#kitCounterTop)" stroke="#1a0d04" strokeWidth="3" strokeLinejoin="round" />
      {/* 상판 하이라이트 */}
      <line x1="20" y1="163" x2="640" y2="163" stroke="rgba(255,252,235,1)" strokeWidth="1.8" />
      <line x1="20" y1="168" x2="640" y2="168" stroke="rgba(255,248,225,0.5)" strokeWidth="0.9" />
      {/* 상판 우드 그레인 — 가로 결 (버처블록 특유) */}
      <line x1="20" y1="172" x2="640" y2="173" stroke="rgba(110,80,40,0.35)" strokeWidth="0.8" />
      <line x1="20" y1="176" x2="640" y2="177" stroke="rgba(110,80,40,0.3)" strokeWidth="0.7" />
      {/* 세로 블록 분할선 (버처블록 특유의 stave) */}
      <line x1="140" y1="160" x2="140" y2="180" stroke="rgba(60,35,10,0.45)" strokeWidth="0.8" />
      <line x1="280" y1="160" x2="280" y2="180" stroke="rgba(60,35,10,0.45)" strokeWidth="0.8" />
      <line x1="420" y1="160" x2="420" y2="180" stroke="rgba(60,35,10,0.45)" strokeWidth="0.8" />
      <line x1="540" y1="160" x2="540" y2="180" stroke="rgba(60,35,10,0.45)" strokeWidth="0.8" />
      {/* 전면 그레인 */}
      <line x1="100" y1="180" x2="100" y2="200" stroke="rgba(60,30,10,0.5)" strokeWidth="0.9" />
      <line x1="230" y1="179" x2="230" y2="200" stroke="rgba(60,30,10,0.5)" strokeWidth="0.9" />
      <line x1="360" y1="180" x2="360" y2="200" stroke="rgba(60,30,10,0.5)" strokeWidth="0.9" />
      <line x1="490" y1="179" x2="490" y2="200" stroke="rgba(60,30,10,0.5)" strokeWidth="0.9" />
      <line x1="580" y1="180" x2="580" y2="200" stroke="rgba(60,30,10,0.5)" strokeWidth="0.9" />
      {/* 전면 옹이 */}
      <ellipse cx="180" cy="188" rx="3" ry="1.3" fill="rgba(30,15,4,0.65)" />
      <ellipse cx="180" cy="188" rx="1.3" ry="0.6" fill="rgba(15,8,2,0.85)" />
      <ellipse cx="470" cy="192" rx="3.5" ry="1.4" fill="rgba(30,15,4,0.65)" />
      <ellipse cx="470" cy="192" rx="1.5" ry="0.7" fill="rgba(15,8,2,0.85)" />
      {/* 상판 옹이 */}
      <ellipse cx="330" cy="170" rx="4" ry="1.5" fill="rgba(60,30,10,0.4)" />
      <ellipse cx="330" cy="170" rx="1.8" ry="0.8" fill="rgba(30,15,3,0.6)" />
    </svg>
  );
}

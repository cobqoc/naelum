'use client';

// v9 — 웜 골드 + 바구니 타입별 디테일 (병 슬롯/메쉬/라벨/아이스 그리드)
// (variant-warm-baskets.html 기반)
export default function FridgeSVG() {
  return (
    <svg viewBox="30 -5 540 670" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e85a3a" />
          <stop offset="100%" stopColor="#c93820" />
        </linearGradient>
        <linearGradient id="bodyDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a1a10" />
          <stop offset="100%" stopColor="#6a1008" />
        </linearGradient>
        <linearGradient id="bodyLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f07050" />
          <stop offset="100%" stopColor="#d84a30" />
        </linearGradient>
        <linearGradient id="interiorG" x1="0" y1="0" x2="0" y2="1">
          {/* 냉장실 + 냉동실: 동일한 밝고 시원한 하늘색 (구분 없이 통일) */}
          <stop offset="0%" stopColor="#e8f7ff" />
          <stop offset="100%" stopColor="#9ed3ee" />
        </linearGradient>
        <linearGradient id="freezerG" x1="0" y1="0" x2="0" y2="1">
          {/* 냉동실: 냉장실보다 한 단계 차갑고 뿌연 톤. 얼음 같은 icy-mint 색감 */}
          <stop offset="0%" stopColor="#d0edf7" />
          <stop offset="100%" stopColor="#7aa8c2" />
        </linearGradient>
        <linearGradient id="chromeG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0d0d0" />
          <stop offset="30%" stopColor="#f0f0f0" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e8e8e8" />
          <stop offset="100%" stopColor="#b0b0b0" />
        </linearGradient>
        <linearGradient id="creamFrontG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4c030" />
          <stop offset="100%" stopColor="#c08820" />
        </linearGradient>
        <linearGradient id="creamTopG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fadc60" />
          <stop offset="100%" stopColor="#e8b840" />
        </linearGradient>
        <linearGradient id="railFrontG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4c030" />
          <stop offset="100%" stopColor="#c08820" />
        </linearGradient>
        <linearGradient id="railTopG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fadc60" />
          <stop offset="100%" stopColor="#e8b840" />
        </linearGradient>
        <linearGradient id="railSideG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c08820" />
          <stop offset="100%" stopColor="#c08820" />
        </linearGradient>
        <linearGradient id="bottleRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e85040" /><stop offset="100%" stopColor="#a82020" />
        </linearGradient>
        <linearGradient id="bottleGreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60b050" /><stop offset="100%" stopColor="#1f4a18" />
        </linearGradient>
        <linearGradient id="bottleBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5088d8" /><stop offset="100%" stopColor="#1a3e70" />
        </linearGradient>
        <linearGradient id="bottleAmber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e09848" /><stop offset="100%" stopColor="#7a3c10" />
        </linearGradient>
        <linearGradient id="bottlePurple" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b060c8" /><stop offset="100%" stopColor="#4a1860" />
        </linearGradient>
        <linearGradient id="bottleClear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(220,240,255,0.95)" /><stop offset="100%" stopColor="rgba(160,195,220,0.8)" />
        </linearGradient>
        <linearGradient id="bottlePink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f088b0" /><stop offset="100%" stopColor="#a04070" />
        </linearGradient>
        <radialGradient id="lightG" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="rgba(255,250,220,0.4)" /><stop offset="100%" stopColor="rgba(255,250,220,0)" />
        </radialGradient>
        <radialGradient id="shadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.3)" /><stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <linearGradient id="reflectG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(180,80,50,0.1)" /><stop offset="100%" stopColor="rgba(180,80,50,0)" />
        </linearGradient>
              <linearGradient id="doorShadow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="80%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
        </linearGradient>
        <linearGradient id="doorShadowR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="80%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
        </linearGradient>
        <radialGradient id="castShadow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.18)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      
        <radialGradient id="ledGlow" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="rgba(255,248,200,0.55)"/>
          <stop offset="100%" stopColor="rgba(255,248,200,0)"/>
        </radialGradient>
        <linearGradient id="ventShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a0a04"/>
          <stop offset="100%" stopColor="#6a1008"/>
        </linearGradient>
        <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.35)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>
        {/* ── 은은한 그림자 바리에이션 (각자 다른 효과) ── */}
        <linearGradient id="shT" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(20,15,35,0.22)"/>
          <stop offset="55%" stopColor="rgba(20,15,35,0)"/>
        </linearGradient>
        <linearGradient id="shB" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(20,15,35,0.2)"/>
          <stop offset="55%" stopColor="rgba(20,15,35,0)"/>
        </linearGradient>
        <linearGradient id="shL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(20,15,35,0.2)"/>
          <stop offset="55%" stopColor="rgba(20,15,35,0)"/>
        </linearGradient>
        <linearGradient id="shR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(20,15,35,0.2)"/>
          <stop offset="55%" stopColor="rgba(20,15,35,0)"/>
        </linearGradient>
        <radialGradient id="shRadBot" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor="rgba(20,15,35,0.25)"/>
          <stop offset="100%" stopColor="rgba(20,15,35,0)"/>
        </radialGradient>
        <radialGradient id="shRadTop" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="rgba(20,15,35,0.22)"/>
          <stop offset="100%" stopColor="rgba(20,15,35,0)"/>
        </radialGradient>
        <radialGradient id="shRadCornerBR" cx="100%" cy="100%" r="90%">
          <stop offset="0%" stopColor="rgba(20,15,35,0.2)"/>
          <stop offset="100%" stopColor="rgba(20,15,35,0)"/>
        </radialGradient>
        <radialGradient id="shRadCornerTL" cx="0%" cy="0%" r="90%">
          <stop offset="0%" stopColor="rgba(20,15,35,0.18)"/>
          <stop offset="100%" stopColor="rgba(20,15,35,0)"/>
        </radialGradient>
        {/* ── 현실감 디테일 그라디언트 ── */}
        {/* 본체 좌측 specular (빛 들어오는 쪽) */}
        <linearGradient id="bodySpecL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,235,195,0.55)"/>
          <stop offset="100%" stopColor="rgba(255,235,195,0)"/>
        </linearGradient>
        {/* 본체 우측 shading (반대쪽 둥근 느낌) */}
        <linearGradient id="bodyShadeR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0.35)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </linearGradient>
        {/* 본체 상단 specular (둥근 top curve 하이라이트) */}
        <linearGradient id="bodySpecTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,235,195,0.4)"/>
          <stop offset="100%" stopColor="rgba(255,235,195,0)"/>
        </linearGradient>
        {/* 내부 vignette (4면 다크닝) */}
        <radialGradient id="interiorVign" cx="50%" cy="50%" r="70%">
          <stop offset="55%" stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(15,35,55,0.3)"/>
        </radialGradient>
        {/* 냉장실 상단 LED glow */}
        <radialGradient id="fridgeLedGlow" cx="50%" cy="0%" r="55%">
          <stop offset="0%" stopColor="rgba(255,250,220,0.5)"/>
          <stop offset="100%" stopColor="rgba(255,250,220,0)"/>
        </radialGradient>
        {/* ── 문 패널 원근감 그라데이션 ── */}
        {/* 좌측 문: 경첩(왼쪽) 어둡고 개구부(오른쪽) 밝음 */}
        <linearGradient id="doorInnerGradL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0.45)"/>
          <stop offset="35%" stopColor="rgba(0,0,0,0.15)"/>
          <stop offset="75%" stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(255,250,230,0.25)"/>
        </linearGradient>
        {/* 우측 문: 경첩(오른쪽) 어둡고 개구부(왼쪽) 밝음 */}
        <linearGradient id="doorInnerGradR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0.45)"/>
          <stop offset="35%" stopColor="rgba(0,0,0,0.15)"/>
          <stop offset="75%" stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(255,250,230,0.25)"/>
        </linearGradient>
        {/* 문 빨간 패널 specular (좌측 문용) */}
        <linearGradient id="doorRedSpecL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0.35)"/>
          <stop offset="60%" stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(255,220,180,0.3)"/>
        </linearGradient>
        <linearGradient id="doorRedSpecR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0.35)"/>
          <stop offset="60%" stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(255,220,180,0.3)"/>
        </linearGradient>
        {/* 문 상단 curvature 하이라이트 */}
        <linearGradient id="doorTopCurve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,230,200,0.35)"/>
          <stop offset="100%" stopColor="rgba(255,230,200,0)"/>
        </linearGradient>
        {/* ── Row1 3D 박스 선반 ── */}
        {/* 측면 (depth) — 가까운 쪽 밝고 먼 쪽 어두움 */}
        <linearGradient id="shelfSideL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9a6418"/>
          <stop offset="100%" stopColor="#3a1f08"/>
        </linearGradient>
        <linearGradient id="shelfSideR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#9a6418"/>
          <stop offset="100%" stopColor="#3a1f08"/>
        </linearGradient>
        {/* 도어 안벽 cast shadow */}
        <linearGradient id="shelf3dCast" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.45)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </linearGradient>
        {/* Row1 강화 — 상판 brighter (front 쪽 밝게, 뒤 약간 어둡게) */}
        <linearGradient id="shelfTopBright" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fff0a0"/>
          <stop offset="55%" stopColor="#fadc60"/>
          <stop offset="100%" stopColor="#d8a830"/>
        </linearGradient>
        {/* Row1 강화 — 전면 deeper gradient (위 진한 골드, 아래 그늘) */}
        <linearGradient id="shelfFrontDeep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8a820"/>
          <stop offset="40%" stopColor="#d49018"/>
          <stop offset="100%" stopColor="#8e5d10"/>
        </linearGradient>
        {/* Row1 전면 ambient occlusion (상판 그림자 — 상판 바로 아래 어둡게) */}
        <linearGradient id="shelfFrontAO" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.5)"/>
          <stop offset="30%" stopColor="rgba(0,0,0,0.1)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </linearGradient>
      </defs>

      <rect x="80" y="630" width="440" height="25" rx="6" fill="url(#reflectG)" />
      <ellipse cx="300" cy="648" rx="260" ry="18" fill="url(#shadowG)" />

      
      <g transform="matrix(0.69,0,0,1,52.70000000000001,0)">
      <path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      {/* 도어 패널 specular·top curve highlight 제거 */}
      <path d="M 14,2 L 2,10 L 6,396 L 16,392 Z" fill="url(#bodyDark)" />
      <path d="M 14,2 L 2,10 L 158,28 L 170,24 Z" fill="url(#bodyLight)" />
      <path d="M 28,22 L 152,36 L 152,376 L 30,376 Z" fill="url(#interiorG)" />
      {/* 도어 내부 perspective shadow 제거 */}
      {/* 경첩 쪽 깊은 섀도우 */}
      <rect x="29" y="30" width="5" height="340" fill="rgba(0,0,0,0.35)" pointerEvents="none"/>
      {/* 개구부 쪽 edge highlight (문 안쪽 모서리) */}
      <rect x="149" y="38" width="2.5" height="335" fill="rgba(255,250,230,0.4)" pointerEvents="none"/>
      {/* 문 수직 브러시 라인 제거됨 */}


      <path d="M 14,22 L 15,19 L 29,19 L 28,22 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 28,22 L 29,19 L 31,373 L 30,376 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M -10,10 L 14,2 L 16,392 L -6,398 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 14,22 L 28,22 L 30,376 L 16,376 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 14,22 L 28,22" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 20,27 L 22,371" fill="none" stroke="rgba(50,30,8,0.55)" strokeWidth="1.3" />
      <path d="M 21.2,27 L 23.2,371" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.7" />
      {/* cream rail 가로선 3줄 제거됨 */}
      <path d="M 16,376 L 30,376" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      {/* ===== Row1 (좌측) — top slant/corner slivers/하얀 highlight 제거, front face만 ===== */}

      {/* ===== Row1 items (좌측) ← Row3 컨테이너 swap (translate -229) ===== */}
      <g transform="translate(0, -229)">
        {/* 1. 우유팩 */}
        <g>
          <path d="M 32,322 L 36,318 L 40,318 L 44,322 L 44,328 L 32,328 Z" fill="#f8f5ec" stroke="#000" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M 36,318 L 40,322 L 44,322" fill="none" stroke="#000" strokeWidth="0.5" />
          <path d="M 38,318 L 38,326" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.4" />
          <path d="M 31,328 L 45,328 L 45,365 L 31,365 Z" fill="#fafaf2" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <rect x="31.5" y="335" width="13" height="8" fill="#3a8ec5" stroke="#000" strokeWidth="0.6" />
          <path d="M 33,339 L 43,339" fill="none" stroke="#fff" strokeWidth="0.5" />
          <path d="M 33,341 L 41,341" fill="none" stroke="#fff" strokeWidth="0.4" />
          <path d="M 32.5,329 L 32.5,365" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
        </g>
        {/* 2. 주스 박스 */}
        <g>
          <rect x="55" y="318" width="1.5" height="10" fill="#fff" stroke="#000" strokeWidth="0.5" />
          <rect x="54.5" y="318" width="2.5" height="2" fill="#d83a2c" stroke="#000" strokeWidth="0.5" />
          <path d="M 49,322 L 62,322 L 62,365 L 49,365 Z" fill="#e87830" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <rect x="49.5" y="328" width="12" height="10" fill="#fff5d8" stroke="#000" strokeWidth="0.6" />
          <circle cx="55.5" cy="333" r="2" fill="#e87830" />
          <path d="M 50,336 L 61,336" fill="none" stroke="#b85820" strokeWidth="0.4" />
          <path d="M 50.5,323 L 50.5,365" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
        </g>
        {/* 3. 버터 */}
        <g>
          <path d="M 66,328 L 82,328 L 81,331 L 67,331 Z" fill="#f8f5ec" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
          <path d="M 66,331 L 82,331 L 82,365 L 66,365 Z" fill="#f4c530" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <rect x="66.5" y="336" width="15" height="9" fill="#fff5d8" stroke="#000" strokeWidth="0.6" />
          <path d="M 68,339 L 80,339" fill="none" stroke="#c83020" strokeWidth="0.5" />
          <path d="M 68,341.5 L 80,341.5" fill="none" stroke="#c83020" strokeWidth="0.4" />
          <path d="M 68,343.5 L 78,343.5" fill="none" stroke="#c83020" strokeWidth="0.4" />
          <path d="M 67,332 L 67,365" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
        </g>
        {/* 4. 계란 */}
        <g>
          <ellipse cx="91.5" cy="338" rx="6" ry="8" fill="#fafaf2" stroke="#000" strokeWidth="1" />
          <ellipse cx="89" cy="335" rx="1.8" ry="2.8" fill="rgba(255,255,255,0.7)" />
          <circle cx="93" cy="337" r="0.5" fill="rgba(160,120,80,0.6)" />
          <circle cx="91" cy="341" r="0.4" fill="rgba(160,120,80,0.6)" />
        </g>
        {/* 5. 요거트 컵 */}
        <g>
          <ellipse cx="107" cy="322" rx="5" ry="1.2" fill="#c0c0c0" stroke="#000" strokeWidth="0.6" />
          <rect x="102" y="322" width="10" height="1.5" fill="#a8a8a8" />
          <path d="M 102,323.5 L 112,323.5 L 113,365 L 101,365 Z" fill="#fafaf2" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <rect x="102" y="332" width="11" height="10" fill="#f06090" stroke="#000" strokeWidth="0.6" />
          <circle cx="107.5" cy="337" r="2.2" fill="#d83a2c" />
          <path d="M 103,340 L 112,340" fill="none" stroke="#fff" strokeWidth="0.4" />
          <path d="M 103,324 L 103,365" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
        </g>
        {/* 6. 치즈 wedge */}
        <g>
          <path d="M 119,332 L 137,328 L 137,358 L 119,365 Z" fill="#f4c530" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <path d="M 119,332 L 137,328 L 135.5,330 L 120.5,333.5 Z" fill="#e0b020" stroke="#000" strokeWidth="0.6" />
          <circle cx="125" cy="342" r="1.4" fill="#d8a820" stroke="#000" strokeWidth="0.4" />
          <circle cx="131" cy="345" r="1.6" fill="#d8a820" stroke="#000" strokeWidth="0.4" />
          <circle cx="127" cy="350" r="1.2" fill="#d8a820" stroke="#000" strokeWidth="0.4" />
          <path d="M 120,333 L 120.5,365" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
        </g>
      </g>

      {/* 전면 — 깔끔한 단색 rim */}
      <path d="M 28,118 L 152,118 L 152,146 L 28,146 Z" fill="url(#creamFrontG)" stroke="#1a0c04" strokeWidth="2" strokeLinejoin="round" />
      {/* LEFT Row1 lip — 롤-방지 턱, 안쪽(오른쪽) 두껍 */}
      <path d="M 28,116 L 152,113 L 152,118 L 28,118 Z" fill="url(#creamFrontG)" stroke="#1a0c04" strokeWidth="1.4" strokeLinejoin="round" />
      {/* LEFT Row1 그림자 — HARD/CRISP: lip이 rim 위에 떨어뜨리는 선명한 cast shadow + sharp drop shadow */}
      {/* lip → rim 위 cast shadow (sun from above-right) */}
      <path d="M 29,118.5 L 151,118.5 L 151,121 L 29,121 Z" fill="rgba(20,12,4,0.42)" />
      <path d="M 29,118.5 L 151,118.5" stroke="rgba(10,5,2,0.55)" strokeWidth="0.5" />
      {/* rim → door 아래로 떨어지는 sharp drop shadow (trapezoid, 살짝 우측 길게) */}
      <path d="M 28,146 L 152,146 L 154,152 L 26,152 Z" fill="rgba(15,8,3,0.45)" />
      {/* 하단 dark edge */}
      <path d="M 28,146 L 152,146" fill="none" stroke="#1a0c04" strokeWidth="1.6" />

      
      {/* ===== Row2 새 디자인 (좌측) — 이모지가 rim 안에 꽂힌 모습 ===== */}

      {/* ===== Row2 items — 각자 다른 모양/크기 5개 (통조림캔/김치통/시리얼박스/두부팩/잼미니병) ===== */}

      {/* 1. 통조림 캔 (토마토 수프) — 짧고 뚱뚱, 풀탭 (x=31-49, y=185-232) */}
      <g>
        {/* 풀탭 ring */}
        <ellipse cx="40" cy="183.5" rx="7" ry="1.8" fill="#9a9a9a" stroke="#000" strokeWidth="0.5" />
        <path d="M 36,183 L 44,183 L 43,185 L 37,185 Z" fill="#3a3a3a" stroke="#000" strokeWidth="0.3" />
        {/* 금속 림 */}
        <rect x="31" y="185" width="18" height="3" fill="#8a8a8a" stroke="#000" strokeWidth="0.6" />
        <rect x="31" y="185" width="18" height="1" fill="rgba(255,255,255,0.4)" />
        {/* 본체 */}
        <path d="M 31,188 L 49,188 L 49,232 L 31,232 Z" fill="#d83a2c" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="32.2" y="189" width="1" height="43" fill="rgba(255,255,255,0.45)" />
        <rect x="46.8" y="189" width="1" height="43" fill="rgba(0,0,0,0.3)" />
        {/* 라벨 */}
        <rect x="31.5" y="200" width="17" height="18" fill="#fff5d8" stroke="#000" strokeWidth="0.5" />
        {/* 토마토 그림 */}
        <circle cx="40" cy="207" r="3.2" fill="#e84a3a" stroke="#000" strokeWidth="0.4" />
        <path d="M 38,204.5 L 40,205.5 L 42,204.5" fill="none" stroke="#2e7d32" strokeWidth="0.7" />
        <path d="M 40,205.5 L 40,204" stroke="#2e7d32" strokeWidth="0.6" fill="none" />
        <path d="M 33.5,213 L 46.5,213" stroke="#8b1a1a" strokeWidth="0.7" />
        <path d="M 33.5,216 L 46.5,216" stroke="#8b1a1a" strokeWidth="0.5" />
      </g>

      {/* 2. 김치통 (red lid tupperware) — 정사각형 wide, 빨간 뚜껑 (x=54-78, y=185-232) */}
      <g>
        {/* 빨간 뚜껑 (3D rim) */}
        <path d="M 53,184 L 79,184 L 79,187 L 53,187 Z" fill="#c83020" stroke="#000" strokeWidth="0.7" />
        <path d="M 53,184 L 79,184 L 79,185 L 53,185 Z" fill="rgba(255,255,255,0.4)" />
        <path d="M 53.5,187 L 78.5,187 L 77.5,192 L 54.5,192 Z" fill="#a82515" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
        {/* 본체 (반투명 크림색, 김치 내용물 비침) */}
        <path d="M 54.5,192 L 77.5,192 L 76.5,232 L 55.5,232 Z" fill="#f8e8d0" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        {/* 김치 빨간 내용물 (top portion) */}
        <path d="M 55,193.5 L 77,193.5 L 76.5,202 L 55.5,202 Z" fill="rgba(216,58,44,0.55)" />
        <circle cx="60" cy="197" r="1" fill="#c83020" opacity="0.7" />
        <circle cx="68" cy="199" r="1.2" fill="#c83020" opacity="0.7" />
        <circle cx="72" cy="196" r="0.9" fill="#c83020" opacity="0.7" />
        <rect x="55.5" y="193" width="1.2" height="39" fill="rgba(255,255,255,0.6)" />
        <rect x="75.5" y="193" width="1.2" height="39" fill="rgba(0,0,0,0.2)" />
        {/* "김치" 라벨 */}
        <rect x="56" y="208" width="20" height="12" fill="rgba(255,255,255,0.85)" stroke="#000" strokeWidth="0.4" />
        <path d="M 58,213 L 74,213" stroke="#c83020" strokeWidth="0.9" fill="none" />
        <path d="M 58,217 L 72,217" stroke="#c83020" strokeWidth="0.6" fill="none" />
      </g>

      {/* 3. 시리얼 박스 — 가장 키 큰 슬림 직사각형 cardboard (x=83-95, y=160-232) */}
      <g>
        {/* 개봉된 박스 top flap */}
        <path d="M 82.5,162 L 95.5,162 L 95,165 L 83,165 Z" fill="#6b3410" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
        <path d="M 83,162 L 87,160.5 L 91,160.5 L 95,162" fill="none" stroke="#000" strokeWidth="0.5" />
        <path d="M 83,162 L 95,162" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
        {/* 박스 본체 (오렌지/노랑) */}
        <path d="M 83,165 L 95,165 L 95,232 L 83,232 Z" fill="#f4a020" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="84" y="166" width="1" height="66" fill="rgba(255,255,255,0.5)" />
        <rect x="93" y="166" width="1" height="66" fill="rgba(0,0,0,0.25)" />
        {/* 캐릭터 동그라미 */}
        <circle cx="89" cy="174" r="3.8" fill="#fff5d8" stroke="#000" strokeWidth="0.5" />
        <circle cx="87.5" cy="173" r="0.7" fill="#000" />
        <circle cx="90.5" cy="173" r="0.7" fill="#000" />
        <path d="M 87.5,175 Q 89,176.5 90.5,175" fill="none" stroke="#000" strokeWidth="0.5" />
        {/* 박스 라벨 */}
        <rect x="83.5" y="184" width="11" height="22" fill="#fff5d8" stroke="#000" strokeWidth="0.4" />
        <path d="M 85,190 L 93,190" stroke="#8b4513" strokeWidth="0.8" fill="none" />
        <path d="M 85,194 L 93,194" stroke="#8b4513" strokeWidth="0.5" fill="none" />
        <path d="M 85,198 L 91,198" stroke="#8b4513" strokeWidth="0.5" fill="none" />
        <path d="M 85,202 L 92,202" stroke="#8b4513" strokeWidth="0.5" fill="none" />
        {/* 영양정보 마크 */}
        <rect x="84.5" y="210" width="9" height="6" fill="#fff" stroke="#000" strokeWidth="0.3" />
        <path d="M 86,213 L 92,213" stroke="#000" strokeWidth="0.4" fill="none" />
      </g>

      {/* 4. 두부팩 (flat wide) — 가장 짧고 가장 wide, foil 뚜껑 (x=100-122, y=200-232) */}
      <g>
        {/* foil 뚜껑 */}
        <path d="M 99,200 L 123,200 L 122,204 L 100,204 Z" fill="#c8c8c8" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
        <path d="M 99,200 L 123,200 L 122.5,201.2 L 99.5,201.2 Z" fill="rgba(255,255,255,0.55)" />
        <path d="M 100,203 L 122,203 L 121.8,204 L 100.2,204 Z" fill="rgba(0,0,0,0.3)" />
        {/* 본체 (살짝 연두색 빛) */}
        <path d="M 100,204 L 122,204 L 121.2,232 L 100.8,232 Z" fill="#f5fbe8" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="101" y="205" width="1" height="27" fill="rgba(255,255,255,0.7)" />
        <rect x="120.5" y="205" width="1" height="27" fill="rgba(0,0,0,0.2)" />
        {/* "두부" 라벨 (연두 배경) */}
        <rect x="100.5" y="212" width="21" height="14" fill="#e0f0d0" stroke="#000" strokeWidth="0.5" />
        <path d="M 102,217 L 120,217" stroke="#2e7d32" strokeWidth="0.9" fill="none" />
        <path d="M 102,221 L 120,221" stroke="#2e7d32" strokeWidth="0.6" fill="none" />
        <circle cx="106" cy="224" r="0.7" fill="#2e7d32" />
        <circle cx="111" cy="224" r="0.7" fill="#2e7d32" />
        <circle cx="116" cy="224" r="0.7" fill="#2e7d32" />
      </g>

      {/* 5. 잼 미니병 (체크무늬 천 뚜껑) — 둥근 모서리, 베리 색 (x=127-149, y=175-232) */}
      <g>
        {/* 체크무늬 천 뚜껑 */}
        <ellipse cx="138" cy="175" rx="11.5" ry="2" fill="#c83020" stroke="#000" strokeWidth="0.5" />
        <path d="M 126.5,175 L 149.5,175 L 148.5,180 Q 138,182 127.5,180 Z" fill="#c83020" stroke="#000" strokeWidth="0.7" strokeLinejoin="round" />
        {/* 체크 패턴 (세로) */}
        <path d="M 130,175.5 L 130,180.5" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
        <path d="M 134,175.5 L 134,181" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <path d="M 142,175.5 L 142,181" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <path d="M 146,175.5 L 146,180.5" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
        <path d="M 128,178 L 148,178" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
        {/* 끈 묶음 */}
        <path d="M 138,180 L 138,183.5" stroke="#8b4513" strokeWidth="0.6" />
        {/* 금속 캡 */}
        <rect x="129" y="181" width="18" height="3" fill="#5a5a5a" stroke="#000" strokeWidth="0.4" />
        {/* 잼병 본체 (둥근 모서리) */}
        <path d="M 128,184 Q 128,184 130,184 L 146,184 Q 148,184 148,186 L 148,232 L 128,232 Z" fill="#7d2855" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="129" y="185" width="1.2" height="47" fill="rgba(255,255,255,0.35)" />
        <rect x="146" y="185" width="1.2" height="47" fill="rgba(0,0,0,0.3)" />
        {/* 라벨 (둥근) */}
        <rect x="128.5" y="197" width="19" height="14" fill="#fff5d8" stroke="#000" strokeWidth="0.5" />
        <path d="M 130,202 L 146,202" stroke="#7d2855" strokeWidth="0.9" fill="none" />
        <circle cx="134" cy="206.5" r="1.3" fill="#7d2855" />
        <circle cx="138" cy="207" r="1.3" fill="#7d2855" />
        <circle cx="142" cy="206.5" r="1.3" fill="#7d2855" />
      </g>

      {/* Front face — 깔끔한 단색 rim */}
      <path d="M 28,215 L 152,215 L 152,235 L 28,235 Z" fill="url(#shelfFrontDeep)" stroke="#1a0c04" strokeWidth="2" strokeLinejoin="round" />
      {/* LEFT Row2 그림자 — DIRECTIONAL: 좌상 광원, 우측으로 기울어진 그림자 (방향성) */}
      {/* 상단 AO — 우측이 더 진함 (좌→우 점진적 darken) */}
      <path d="M 28,215 L 90,215 L 90,217 L 28,217 Z" fill="rgba(20,12,4,0.15)" />
      <path d="M 90,215 L 152,215 L 152,217.5 L 90,217.5 Z" fill="rgba(20,12,4,0.32)" />
      {/* 가로 홈/groove (sunken/recessed) */}
      <rect x="32" y="222.5" width="116" height="3" fill="rgba(20,12,4,0.55)" />
      <path d="M 32,222.5 L 148,222.5" stroke="rgba(10,5,2,0.75)" strokeWidth="0.7" />
      <path d="M 32,225.5 L 148,225.5" stroke="rgba(255,250,220,0.45)" strokeWidth="0.5" />
      {/* groove 내부 inner highlights — 광원 측(좌측)이 더 밝음 */}
      <path d="M 40,224 L 52,224" stroke="rgba(255,250,220,0.7)" strokeWidth="0.5" />
      <path d="M 104,224 L 110,224" stroke="rgba(255,250,220,0.35)" strokeWidth="0.4" />
      {/* drop shadow — 우측으로 길게 늘어지는 asymmetric trapezoid (방향성 광원) */}
      <path d="M 28,235.5 L 152,235.5 L 158,239.5 L 30,238 Z" fill="rgba(20,12,4,0.32)" />
      <path d="M 30,238 L 158,239.5 L 156,241 L 38,239.5 Z" fill="rgba(20,12,4,0.16)" />
      {/* 하단 dark edge */}
      <path d="M 28,235 L 152,235" fill="none" stroke="#1a0c04" strokeWidth="2" />

      {/* ===== Row3 (좌측 도어) — Row3 우측 디자인 + 다른 재료 이모지 (채소/과일) ===== */}

      {/* ===== Row3 items (좌측) ← Row1 와인병/꿀병/짤병/요거트/파스타/생수 swap (translate +229) ===== */}
      <g transform="translate(0, 229)">
        {/* 1. 와인병 */}
        <g>
          <rect x="35.5" y="68" width="5" height="5" fill="#1a1a1a" stroke="#000" strokeWidth="0.5" />
          <rect x="35.5" y="73" width="5" height="1" fill="#5a4a3a" />
          <rect x="36" y="74" width="4" height="20" fill="#1a4d2e" stroke="#000" strokeWidth="0.8" />
          <path d="M 36,94 L 40,94 L 43,100 L 33,100 Z" fill="#1a4d2e" stroke="#000" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M 33,100 L 43,100 L 43,140 L 33,140 Z" fill="#1a4d2e" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <rect x="34.2" y="75" width="0.8" height="65" fill="rgba(255,255,255,0.45)" />
          <rect x="41.5" y="101" width="0.8" height="39" fill="rgba(0,0,0,0.3)" />
          <rect x="33.5" y="115" width="9" height="14" fill="#f5e5c0" stroke="#000" strokeWidth="0.4" />
          <path d="M 35,121 L 41,121" stroke="#8b1a1a" strokeWidth="0.8" fill="none" />
          <path d="M 35,124.5 L 40,124.5" stroke="#8b1a1a" strokeWidth="0.5" fill="none" />
        </g>
        {/* 2. 꿀병 */}
        <g>
          <path d="M 47.5,100 L 66.5,100 L 65.5,105 L 48.5,105 Z" fill="#6b3410" stroke="#000" strokeWidth="0.7" strokeLinejoin="round" />
          <rect x="49" y="100.8" width="3" height="1.5" fill="rgba(255,255,255,0.45)" />
          <rect x="48.5" y="104" width="17" height="0.8" fill="rgba(0,0,0,0.4)" />
          <path d="M 48,105 L 66,105 L 66,140 L 48,140 Z" fill="#e8a317" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <rect x="49.5" y="106" width="1.2" height="34" fill="rgba(255,255,255,0.5)" />
          <rect x="63.5" y="106" width="1.2" height="34" fill="rgba(0,0,0,0.25)" />
          <path d="M 49.5,114 L 64.5,114 L 65,118 L 64.5,128 L 49.5,128 L 49,118 Z" fill="#fff5d8" stroke="#000" strokeWidth="0.5" />
          <path d="M 53,121 L 61,121" stroke="#8b4513" strokeWidth="0.8" fill="none" />
          <circle cx="57" cy="124" r="1" fill="#8b4513" opacity="0.6" />
        </g>
        {/* 3. 짤병 */}
        <g>
          <rect x="76.5" y="78" width="5" height="4" fill="#1a0c04" stroke="#000" strokeWidth="0.5" />
          <rect x="76.5" y="82" width="5" height="1" fill="rgba(255,255,255,0.3)" />
          <path d="M 76,83 L 82,83 L 86,96 L 72,96 Z" fill="#d63a2c" stroke="#000" strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M 72,96 L 86,96 L 86,140 L 72,140 Z" fill="#d63a2c" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <rect x="73" y="84" width="1" height="56" fill="rgba(255,255,255,0.4)" />
          <rect x="84.5" y="84" width="1" height="56" fill="rgba(0,0,0,0.3)" />
          <rect x="72" y="110" width="14" height="15" fill="#fff5d8" stroke="#000" strokeWidth="0.5" />
          <path d="M 74,116 L 84,116" stroke="#c14820" strokeWidth="0.9" fill="none" />
          <path d="M 74,119.5 L 82,119.5" stroke="#c14820" strokeWidth="0.6" fill="none" />
          <circle cx="76" cy="122.5" r="0.8" fill="#c14820" />
          <circle cx="79" cy="122.5" r="0.8" fill="#c14820" />
        </g>
        {/* 4. 요거트컵 */}
        <g>
          <ellipse cx="100" cy="110.5" rx="11" ry="1.8" fill="#c8c8c8" stroke="#000" strokeWidth="0.5" />
          <path d="M 91,109.5 L 109,109.5 L 110,111 L 90,111 Z" fill="rgba(255,255,255,0.4)" />
          <path d="M 89.5,111 L 110.5,111 L 108.5,140 L 91.5,140 Z" fill="#fce4ec" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <path d="M 91,112 L 92,112 L 93.5,138 L 92.5,138 Z" fill="rgba(255,255,255,0.65)" />
          <path d="M 108,112 L 109,112 L 107.5,138 L 106.5,138 Z" fill="rgba(0,0,0,0.18)" />
          <path d="M 92,121 L 108,121 L 107.2,131 L 92.8,131 Z" fill="#f48fb1" stroke="#000" strokeWidth="0.4" />
          <circle cx="96" cy="126" r="1.5" fill="#c2185b" />
          <circle cx="100" cy="125" r="1.7" fill="#c2185b" />
          <circle cx="104" cy="126" r="1.5" fill="#c2185b" />
          <path d="M 96,124.5 L 96.5,123.5" stroke="#2e7d32" strokeWidth="0.5" fill="none" />
          <path d="M 100,123 L 100.5,122" stroke="#2e7d32" strokeWidth="0.5" fill="none" />
        </g>
        {/* 5. 파스타 소스병 */}
        <g>
          <path d="M 116,92 L 130,92 L 130,98 L 116,98 Z" fill="#5a5a5a" stroke="#000" strokeWidth="0.7" />
          <path d="M 116,92 L 130,92 L 130,93 L 116,93 Z" fill="rgba(255,255,255,0.45)" />
          <path d="M 116,96 L 130,96 L 130,98 L 116,98 Z" fill="rgba(0,0,0,0.35)" />
          <path d="M 116,98 L 130,98 L 131,103 L 115,103 Z" fill="#8b1a1a" stroke="#000" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M 115,103 L 131,103 L 131,140 L 115,140 Z" fill="#8b1a1a" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <rect x="116.5" y="104" width="1" height="36" fill="rgba(255,255,255,0.4)" />
          <rect x="129.5" y="104" width="1" height="36" fill="rgba(0,0,0,0.3)" />
          <rect x="115.5" y="113" width="15" height="14" fill="#fff5d8" stroke="#000" strokeWidth="0.5" />
          <rect x="115.5" y="113" width="3" height="14" fill="#2e7d32" />
          <rect x="127.5" y="113" width="3" height="14" fill="#d83a2c" />
          <path d="M 119.5,118 L 127.5,118" stroke="#3e2511" strokeWidth="0.7" fill="none" />
          <path d="M 119.5,122 L 126.5,122" stroke="#3e2511" strokeWidth="0.5" fill="none" />
        </g>
        {/* 6. 생수병 */}
        <g>
          <rect x="138.5" y="66" width="6" height="4" fill="#1976d2" stroke="#000" strokeWidth="0.5" />
          <rect x="138.5" y="69" width="6" height="1" fill="rgba(0,0,0,0.3)" />
          <rect x="138.5" y="70" width="6" height="6" fill="rgba(180,220,250,0.85)" stroke="#000" strokeWidth="0.6" />
          <path d="M 138.5,76 L 144.5,76 L 147,82 L 136,82 Z" fill="rgba(180,220,250,0.85)" stroke="#000" strokeWidth="0.7" strokeLinejoin="round" />
          <path d="M 136,82 L 147,82 L 147,140 L 136,140 Z" fill="rgba(180,220,250,0.85)" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <path d="M 137.5,90 L 145.5,90" stroke="rgba(100,140,180,0.3)" strokeWidth="0.4" fill="none" />
          <path d="M 137.5,135 L 145.5,135" stroke="rgba(100,140,180,0.3)" strokeWidth="0.4" fill="none" />
          <rect x="137" y="83" width="1" height="57" fill="rgba(255,255,255,0.6)" />
          <rect x="145.5" y="83" width="1" height="57" fill="rgba(100,140,180,0.4)" />
          <rect x="136.5" y="105" width="10" height="15" fill="#fff" stroke="#000" strokeWidth="0.4" />
          <path d="M 138,110 L 145,110" stroke="#1976d2" strokeWidth="0.8" fill="none" />
          <path d="M 138,113.5 L 145,113.5" stroke="#1976d2" strokeWidth="0.5" fill="none" />
          <path d="M 138,117 L 143,117" stroke="#1976d2" strokeWidth="0.5" fill="none" />
        </g>
      </g>

      {/* Front face — 깔끔한 단색 rim */}
      <path d="M 28,347 L 152,347 L 152,375 L 28,375 Z" fill="url(#shelfFrontDeep)" stroke="#1a0c04" strokeWidth="2" strokeLinejoin="round" />
      {/* LEFT Row3 lip — 롤-방지 턱, 안쪽(오른쪽) 두껍 */}
      <path d="M 28,345 L 152,342 L 152,347 L 28,347 Z" fill="url(#shelfFrontDeep)" stroke="#1a0c04" strokeWidth="1.4" strokeLinejoin="round" />
      {/* LEFT Row3 미세 디테일 — 상단 가까이 얇은 음영 라인 (subtle seam) */}
      <path d="M 32,354 L 148,354" stroke="rgba(20,12,4,0.28)" strokeWidth="0.5" />
      {/* 하단 dark edge */}
      <path d="M 28,375 L 152,375" fill="none" stroke="#1a0c04" strokeWidth="2" />

      <path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      </g>

      
      <g transform="matrix(0.69,0,0,1,52.70000000000001,0)">
      <path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      {/* 도어 패널 specular·top curve highlight 제거 */}
      <path d="M 26,406 L 16,410 L 18,620 L 28,624 Z" fill="url(#bodyDark)" />
      <path d="M 26,406 L 16,410 L 158,406 L 170,402 Z" fill="url(#bodyLight)" />
      <path d="M 44,420 L 152,416 L 152,608 L 46,608 Z" fill="url(#freezerG)" />
      {/* 도어 내부 perspective shadow 제거 */}

      
      <path d="M 30,421 L 31,418 L 45,417 L 44,420 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 44,420 L 45,417 L 47,605 L 46,608 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 6,410 L 30,406 L 32,623 L 8,628 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 30,421 L 44,420 L 46,608 L 32,609 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 30,421 L 44,420" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <path d="M 36,425 L 38,603" fill="none" stroke="rgba(50,30,8,0.55)" strokeWidth="1.3" />
      <path d="M 37,425 L 39,603" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.7" />
      <path d="M 32,609 L 46,608" fill="none" stroke="#2A1408" strokeWidth="1.5" />


      <path d="M 50,560 L 147,557 L 150,578 L 45,581 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 45,581 L 150,578 L 150,608 L 46,608 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 45,581 L 150,578 L 150,608 L 46,608 Z" fill="url(#shRadBot)" pointerEvents="none" />
      <path d="M 45,581 L 150,578" fill="none" stroke="#FFF4D8" strokeWidth="3.5" />
      <path d="M 46,608 L 150,608" fill="none" stroke="#2A1408" strokeWidth="2.2" />
      <path d="M 45,565 L 150,563" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1.2" />
      <path d="M 45,570 L 150,568" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 46,578 L 150,578" fill="none" stroke="#2A1408" strokeWidth="1.8" />
      {/* Freezer 내부 opening shadow */}
      <path d="M 45,581 L 150,578 L 150,582 L 45,585 Z" fill="rgba(30,12,4,0.5)"/>
      {/* 아이스 그리드 (십자 해치) */}
      <line x1="70" y1="581" x2="70" y2="608" stroke="rgba(30,12,4,0.4)" strokeWidth="0.8"/>
      <line x1="95" y1="580" x2="95" y2="608" stroke="rgba(30,12,4,0.4)" strokeWidth="0.8"/>
      <line x1="120" y1="579" x2="120" y2="608" stroke="rgba(30,12,4,0.4)" strokeWidth="0.8"/>
      <line x1="45" y1="594" x2="150" y2="592" stroke="rgba(30,12,4,0.35)" strokeWidth="0.8"/>
      {/* 프로스트 하이라이트 (차가운 톤) */}
      <ellipse cx="85" cy="585" rx="30" ry="1.5" fill="rgba(200,230,255,0.35)"/>
      <ellipse cx="125" cy="588" rx="18" ry="1" fill="rgba(200,230,255,0.3)"/>

      <path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      </g>

      
      <path d="M 434,14 L 448,6 L 448,623 L 434,629 Z" fill="url(#bodyDark)" />
      <path d="M 166,14 L 180,6 L 448,6 L 434,14 Z" fill="url(#bodyLight)" />
      
      {/* 상단 벤트 그릴 제거 (심플한 실루엣 우선) */}

<rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" />
      {/* 본체 프런트 specular/shading 오버레이 제거 */}
      {/* 수직 브러시 스트릭 제거됨 */}

      <rect x="166" y="14" width="2.5" height="615" fill="#000" />
      <rect x="431.5" y="14" width="2.5" height="615" fill="#000" />
      <rect x="166" y="14" width="268" height="2.5" fill="#000" />
      <rect x="166" y="626.5" width="268" height="2.5" fill="#000" />
      {/* 본체 프레임 베벨 highlight·shadow 제거 */}
      <rect x="170" y="16" width="260" height="3" rx="1" fill="url(#chromeG)" />
      <rect x="170" y="383" width="260" height="2" rx="0.5" fill="url(#chromeG)" />
      <rect x="170" y="398" width="260" height="2" rx="0.5" fill="url(#chromeG)" />

      <text x="300" y="622" textAnchor="middle" fill="#ffd700" fontSize="11" fontWeight="bold" letterSpacing="4" fontFamily="sans-serif" opacity="0.8">NAELUM</text>

      <rect x="182" y="33" width="236" height="345" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="184" y="35" width="232" height="341" rx="4" fill="url(#interiorG)" />
      {/* 냉장실 receding wall · vignette · LED glow 제거 */}
      {/* 고무 도어 패킹 (개구부 테두리) */}
      <rect x="185" y="36" width="230" height="339" rx="3" fill="none" stroke="rgba(10,5,2,0.7)" strokeWidth="1.8"/>
      <rect x="186" y="37" width="228" height="2" fill="rgba(0,0,0,0.45)"/>
      <rect x="186" y="373" width="228" height="2" fill="rgba(0,0,0,0.4)"/>

      <rect x="168" y="384" width="264" height="12" rx="1" fill="url(#bodyG)" stroke="#000" strokeWidth="1" />

      <rect x="182" y="404" width="236" height="206" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="184" y="406" width="232" height="202" rx="4" fill="url(#freezerG)" />
      {/* 냉동 뒷벽 ice sheet·얼음 알갱이 제거됨 */}
      {/* 냉동실 vignette 제거 */}
      <rect x="185" y="407" width="230" height="200" rx="3" fill="none" stroke="rgba(10,5,2,0.7)" strokeWidth="1.8"/>
      <rect x="186" y="408" width="228" height="2" fill="rgba(0,0,0,0.45)"/>
      <rect x="186" y="605" width="228" height="2" fill="rgba(0,0,0,0.4)"/>
      {/* 냉동실 그림자 오버레이 제거 */}

      {/* 냉동실 LED 조명바 제거 */}

      {/* 냉동 백월 서리·눈꽃·바닥 서리 모두 제거됨 */}


            {/* ====== 본체 선반 (냉장실) — 입체감 강화 ====== */}
      <rect x="184" y="119" width="232" height="2.5" fill="url(#creamTopG)"/>
      <rect x="186" y="121" width="228" height="11" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 선반 양끝 쐐기 섀도우 제거됨 */}
      <line x1="188" y1="122.5" x2="412" y2="122.5" stroke="#FFF4D8" strokeWidth="1.5"/>
      <line x1="188" y1="128" x2="412" y2="128" stroke="rgba(60,35,10,0.4)" strokeWidth="0.8"/>
      <line x1="188" y1="131.5" x2="412" y2="131.5" stroke="#2A1408" strokeWidth="1.2"/>
      <rect x="188" y="133" width="224" height="5" fill="rgba(40,20,5,0.18)"/>

      <rect x="184" y="214" width="232" height="2.5" fill="url(#creamTopG)"/>
      <rect x="186" y="216" width="228" height="11" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 벽 레일 쐐기 제거됨 */}
      <line x1="188" y1="217.5" x2="412" y2="217.5" stroke="#FFF4D8" strokeWidth="1.5"/>
      <line x1="188" y1="223" x2="412" y2="223" stroke="rgba(60,35,10,0.4)" strokeWidth="0.8"/>
      <line x1="188" y1="226.5" x2="412" y2="226.5" stroke="#2A1408" strokeWidth="1.2"/>
      <rect x="188" y="228" width="224" height="5" fill="rgba(40,20,5,0.18)"/>
      {/* ====== 본체 냉장실 서랍장 2개 (좌우 나란히) ====== */}
      <rect x="188" y="320" width="110" height="54" rx="3" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="188" y="320" width="110" height="4" rx="2" fill="url(#creamTopG)" />
      <line x1="192" y1="324" x2="296" y2="324" stroke="#FFF4D8" strokeWidth="1" />
      <rect x="216" y="342" width="54" height="9" rx="4.5" fill="url(#creamTopG)" stroke="#000" strokeWidth="1.3" strokeLinejoin="round"/>
      <rect x="220" y="344.5" width="46" height="4" rx="2" fill="#2A1408" opacity="0.55"/>
      <line x1="222" y1="345.5" x2="264" y2="345.5" stroke="#FFF4D8" strokeWidth="0.6" opacity="0.7"/>
      <line x1="188" y1="374" x2="298" y2="374" stroke="#2A1408" strokeWidth="1" />

      <rect x="302" y="320" width="110" height="54" rx="3" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="302" y="320" width="110" height="4" rx="2" fill="url(#creamTopG)" />
      <line x1="306" y1="324" x2="410" y2="324" stroke="#FFF4D8" strokeWidth="1" />
      <rect x="330" y="342" width="54" height="9" rx="4.5" fill="url(#creamTopG)" stroke="#000" strokeWidth="1.3" strokeLinejoin="round"/>
      <rect x="334" y="344.5" width="46" height="4" rx="2" fill="#2A1408" opacity="0.55"/>
      <line x1="336" y1="345.5" x2="378" y2="345.5" stroke="#FFF4D8" strokeWidth="0.6" opacity="0.7"/>
      <line x1="302" y1="374" x2="412" y2="374" stroke="#2A1408" strokeWidth="1" />

      {/* ====== 본체 냉동실 서랍장 2개 (좌우 나란히) ====== */}
      <rect x="188" y="526" width="110" height="78" rx="3" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="188" y="526" width="110" height="4" rx="2" fill="url(#creamTopG)" />
      <line x1="192" y1="530" x2="296" y2="530" stroke="#FFF4D8" strokeWidth="1" />
      <rect x="216" y="560" width="54" height="9" rx="4.5" fill="url(#creamTopG)" stroke="#000" strokeWidth="1.3" strokeLinejoin="round"/>
      <rect x="220" y="562.5" width="46" height="4" rx="2" fill="#2A1408" opacity="0.55"/>
      <line x1="222" y1="563.5" x2="264" y2="563.5" stroke="#FFF4D8" strokeWidth="0.6" opacity="0.7"/>
      <line x1="188" y1="604" x2="298" y2="604" stroke="#2A1408" strokeWidth="1" />

      <rect x="302" y="526" width="110" height="78" rx="3" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="302" y="526" width="110" height="4" rx="2" fill="url(#creamTopG)" />
      <line x1="306" y1="530" x2="410" y2="530" stroke="#FFF4D8" strokeWidth="1" />
      <rect x="330" y="560" width="54" height="9" rx="4.5" fill="url(#creamTopG)" stroke="#000" strokeWidth="1.3" strokeLinejoin="round"/>
      <rect x="334" y="562.5" width="46" height="4" rx="2" fill="#2A1408" opacity="0.55"/>
      <line x1="336" y1="563.5" x2="378" y2="563.5" stroke="#FFF4D8" strokeWidth="0.6" opacity="0.7"/>
      <line x1="302" y1="604" x2="412" y2="604" stroke="#2A1408" strokeWidth="1" />

      {/* 테이프 메모 제거됨 */}


      


      

      {/* 서랍 측면 레일 (냉장실) */}
      <line x1="192" y1="325" x2="192" y2="372" stroke="#2A1408" strokeWidth="0.8" opacity="0.5"/>
      <line x1="294" y1="325" x2="294" y2="372" stroke="#2A1408" strokeWidth="0.8" opacity="0.5"/>
      <line x1="306" y1="325" x2="306" y2="372" stroke="#2A1408" strokeWidth="0.8" opacity="0.5"/>
      <line x1="408" y1="325" x2="408" y2="372" stroke="#2A1408" strokeWidth="0.8" opacity="0.5"/>
      {/* 서랍 측면 레일 (냉동실) */}
      <line x1="192" y1="530" x2="192" y2="602" stroke="#2A1408" strokeWidth="0.8" opacity="0.5"/>
      <line x1="294" y1="530" x2="294" y2="602" stroke="#2A1408" strokeWidth="0.8" opacity="0.5"/>
      <line x1="306" y1="530" x2="306" y2="602" stroke="#2A1408" strokeWidth="0.8" opacity="0.5"/>
      <line x1="408" y1="530" x2="408" y2="602" stroke="#2A1408" strokeWidth="0.8" opacity="0.5"/>

      {/* ══ 서랍 리벳 (4 서랍 × 4 코너) — 브러시 메탈 마감 ══ */}
      {/* 냉장 좌 (x=188-298, y=320-374) */}
      <g>
        <circle cx="194" cy="326" r="1.1" fill="#2A1408"/><circle cx="194" cy="326" r="0.5" fill="rgba(255,245,220,0.6)"/>
        <circle cx="292" cy="326" r="1.1" fill="#2A1408"/><circle cx="292" cy="326" r="0.5" fill="rgba(255,245,220,0.6)"/>
        <circle cx="194" cy="368" r="1.1" fill="#2A1408"/><circle cx="194" cy="368" r="0.5" fill="rgba(255,245,220,0.6)"/>
        <circle cx="292" cy="368" r="1.1" fill="#2A1408"/><circle cx="292" cy="368" r="0.5" fill="rgba(255,245,220,0.6)"/>
      </g>
      {/* 냉장 우 (x=302-412, y=320-374) */}
      <g>
        <circle cx="308" cy="326" r="1.1" fill="#2A1408"/><circle cx="308" cy="326" r="0.5" fill="rgba(255,245,220,0.6)"/>
        <circle cx="406" cy="326" r="1.1" fill="#2A1408"/><circle cx="406" cy="326" r="0.5" fill="rgba(255,245,220,0.6)"/>
        <circle cx="308" cy="368" r="1.1" fill="#2A1408"/><circle cx="308" cy="368" r="0.5" fill="rgba(255,245,220,0.6)"/>
        <circle cx="406" cy="368" r="1.1" fill="#2A1408"/><circle cx="406" cy="368" r="0.5" fill="rgba(255,245,220,0.6)"/>
      </g>
      {/* 냉동 좌 (x=188-298, y=526-604) */}
      <g>
        <circle cx="194" cy="532" r="1.1" fill="#2A1408"/><circle cx="194" cy="532" r="0.5" fill="rgba(255,245,220,0.6)"/>
        <circle cx="292" cy="532" r="1.1" fill="#2A1408"/><circle cx="292" cy="532" r="0.5" fill="rgba(255,245,220,0.6)"/>
        <circle cx="194" cy="598" r="1.1" fill="#2A1408"/><circle cx="194" cy="598" r="0.5" fill="rgba(255,245,220,0.6)"/>
        <circle cx="292" cy="598" r="1.1" fill="#2A1408"/><circle cx="292" cy="598" r="0.5" fill="rgba(255,245,220,0.6)"/>
      </g>
      {/* 냉동 우 (x=302-412, y=526-604) */}
      <g>
        <circle cx="308" cy="532" r="1.1" fill="#2A1408"/><circle cx="308" cy="532" r="0.5" fill="rgba(255,245,220,0.6)"/>
        <circle cx="406" cy="532" r="1.1" fill="#2A1408"/><circle cx="406" cy="532" r="0.5" fill="rgba(255,245,220,0.6)"/>
        <circle cx="308" cy="598" r="1.1" fill="#2A1408"/><circle cx="308" cy="598" r="0.5" fill="rgba(255,245,220,0.6)"/>
        <circle cx="406" cy="598" r="1.1" fill="#2A1408"/><circle cx="406" cy="598" r="0.5" fill="rgba(255,245,220,0.6)"/>
      </g>

      {/* ══ 핸들 드롭 섀도우 (손잡이 아래 미세 그림자) ══ */}
      <ellipse cx="243" cy="353.5" rx="28" ry="1.3" fill="rgba(0,0,0,0.25)" pointerEvents="none"/>
      <ellipse cx="357" cy="353.5" rx="28" ry="1.3" fill="rgba(0,0,0,0.25)" pointerEvents="none"/>
      <ellipse cx="243" cy="571.5" rx="28" ry="1.3" fill="rgba(0,0,0,0.25)" pointerEvents="none"/>
      <ellipse cx="357" cy="571.5" rx="28" ry="1.3" fill="rgba(0,0,0,0.25)" pointerEvents="none"/>

      <g transform="matrix(0.69,0,0,1,133.3,0)">
      <path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      {/* 도어 패널 specular·top curve highlight 제거 */}
      <path d="M 586,2 L 598,10 L 594,396 L 584,392 Z" fill="url(#bodyDark)" />
      <path d="M 430,24 L 442,28 L 586,2 L 598,10 Z" fill="url(#bodyLight)" />
      <path d="M 448,37 L 572,22 L 570,376 L 448,376 Z" fill="url(#interiorG)" />
      {/* 도어 내부 perspective shadow 제거 */}
      {/* 경첩 쪽 (우) 깊은 섀도우 */}
      <rect x="566" y="30" width="5" height="340" fill="rgba(0,0,0,0.35)" pointerEvents="none"/>
      {/* 개구부 쪽 (좌) edge highlight */}
      <rect x="448" y="38" width="2.5" height="335" fill="rgba(255,250,230,0.4)" pointerEvents="none"/>
      {/* 문 수직 브러시 라인 제거됨 */}


      <path d="M 572,22 L 571,19 L 585,19 L 586,22 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 572,22 L 571,19 L 569,373 L 570,376 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 586,2 L 610,10 L 606,398 L 584,392 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 572,22 L 586,22 L 584,376 L 570,376 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 572,22 L 586,22" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 578,27 L 576,371" fill="none" stroke="rgba(50,30,8,0.55)" strokeWidth="1.3" />
      <path d="M 579.2,27 L 577.2,371" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.7" />
      <path d="M 570,376 L 584,376" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      {/* ===== Row1 (우측) ← LEFT Row1과 동일 (creamFrontG + shT, stroke 1.6) ===== */}

      {/* ===== Row1 items (우측) — 각자 다른 모양/크기 6개 (참치캔/소다캔/양념그라인더/피클병/라면봉지/김봉지) ===== */}

      {/* 1. 참치캔 (tuna can) — 짧고 wide, 풀탭 + blue 라벨 (x=452-472, y=105-140) */}
      <g>
        <ellipse cx="462" cy="104" rx="7.5" ry="1.7" fill="#9a9a9a" stroke="#000" strokeWidth="0.5" />
        <path d="M 458,103.5 L 466,103.5 L 465,105 L 459,105 Z" fill="#3a3a3a" stroke="#000" strokeWidth="0.3" />
        <rect x="452" y="105" width="20" height="3" fill="#8a8a8a" stroke="#000" strokeWidth="0.5" />
        <rect x="452" y="105" width="20" height="1" fill="rgba(255,255,255,0.45)" />
        <path d="M 452,108 L 472,108 L 472,140 L 452,140 Z" fill="#1976d2" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="453" y="109" width="1.2" height="31" fill="rgba(255,255,255,0.45)" />
        <rect x="469.8" y="109" width="1.2" height="31" fill="rgba(0,0,0,0.3)" />
        {/* 라벨 */}
        <rect x="452.5" y="115" width="19" height="13" fill="#fff5d8" stroke="#000" strokeWidth="0.4" />
        {/* 물고기 그림 */}
        <path d="M 456,121 Q 462,119 467,121 Q 462,123 456,121 Z" fill="#1976d2" stroke="#0d47a1" strokeWidth="0.4" />
        <path d="M 467,121 L 470,119 L 470,123 Z" fill="#1976d2" stroke="#0d47a1" strokeWidth="0.4" />
        <circle cx="458" cy="120.7" r="0.4" fill="#fff" />
      </g>

      {/* 2. 소다캔 (cola) — 길고 thin cylindrical, 빨강 (x=476-490, y=82-140) */}
      <g>
        <ellipse cx="483" cy="82.5" rx="6.5" ry="1.8" fill="#9a9a9a" stroke="#000" strokeWidth="0.5" />
        <path d="M 480,82 L 486,82 L 485,83.6 L 481,83.6 Z" fill="#3a3a3a" stroke="#000" strokeWidth="0.3" />
        <rect x="476.5" y="83.5" width="13" height="3" fill="#2a1408" stroke="#000" strokeWidth="0.5" />
        <path d="M 476.5,86.5 L 489.5,86.5 L 489.5,140 L 476.5,140 Z" fill="#d83a2c" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="478" y="87.5" width="1" height="52" fill="rgba(255,255,255,0.4)" />
        <rect x="488" y="87.5" width="1" height="52" fill="rgba(0,0,0,0.28)" />
        <rect x="476.5" y="100" width="13" height="12" fill="#fff5d8" stroke="#000" strokeWidth="0.5" />
        <path d="M 478,106 L 488,106" stroke="#d83a2c" strokeWidth="0.9" fill="none" />
        <path d="M 478,109 L 487,109" stroke="#d83a2c" strokeWidth="0.5" fill="none" />
      </g>

      {/* 3. 양념 그라인더 — 가장 얇고 키 큼, 메탈 그라인더 캡 + 투명 글래스 (x=494-502, y=72-140) */}
      <g>
        {/* 메탈 그라인더 캡 */}
        <rect x="493.5" y="72" width="9" height="6" fill="#3a3a3a" stroke="#000" strokeWidth="0.5" />
        <rect x="493.5" y="72" width="9" height="1.5" fill="rgba(255,255,255,0.35)" />
        <rect x="494.5" y="74" width="7" height="0.6" fill="rgba(255,255,255,0.4)" />
        <rect x="494.5" y="75.5" width="7" height="0.6" fill="rgba(255,255,255,0.3)" />
        {/* 본체 (투명 유리) */}
        <path d="M 494,78 L 502,78 L 502,140 L 494,140 Z" fill="rgba(245,235,200,0.5)" stroke="#000" strokeWidth="0.9" strokeLinejoin="round" />
        <rect x="494.5" y="79" width="0.8" height="61" fill="rgba(255,255,255,0.6)" />
        <rect x="500.7" y="79" width="0.8" height="61" fill="rgba(100,80,40,0.3)" />
        {/* 후추 알갱이 */}
        <circle cx="497" cy="118" r="0.6" fill="#3a2511" />
        <circle cx="499" cy="121" r="0.6" fill="#3a2511" />
        <circle cx="498" cy="124" r="0.55" fill="#3a2511" />
        <circle cx="500" cy="127" r="0.5" fill="#3a2511" />
        <circle cx="496.5" cy="130" r="0.55" fill="#3a2511" />
        <circle cx="499.5" cy="133" r="0.6" fill="#3a2511" />
        <circle cx="497.5" cy="136" r="0.5" fill="#3a2511" />
      </g>

      {/* 4. 피클 유리병 — medium 둥근, 노란 액체 + 피클 슬라이스 (x=507-525, y=95-140) */}
      <g>
        {/* 금속 뚜껑 */}
        <rect x="507.5" y="95" width="17" height="5" fill="#4a4a4a" stroke="#000" strokeWidth="0.6" />
        <rect x="507.5" y="95" width="17" height="1" fill="rgba(255,255,255,0.4)" />
        <rect x="507.5" y="99" width="17" height="1" fill="rgba(0,0,0,0.4)" />
        {/* 유리병 본체 */}
        <path d="M 507,100 L 525,100 L 525,140 L 507,140 Z" fill="rgba(248,220,80,0.75)" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="508" y="101" width="1.2" height="39" fill="rgba(255,255,255,0.6)" />
        <rect x="523" y="101" width="1.2" height="39" fill="rgba(0,0,0,0.2)" />
        {/* 피클 슬라이스 */}
        <ellipse cx="513" cy="113" rx="2.8" ry="1.5" fill="#7ca830" stroke="#2e5e1c" strokeWidth="0.4" />
        <circle cx="513" cy="113" r="0.4" fill="#a5c660" />
        <ellipse cx="519" cy="117" rx="2.8" ry="1.5" fill="#7ca830" stroke="#2e5e1c" strokeWidth="0.4" />
        <circle cx="519" cy="117" r="0.4" fill="#a5c660" />
        <ellipse cx="514" cy="121" rx="2.8" ry="1.5" fill="#7ca830" stroke="#2e5e1c" strokeWidth="0.4" />
        <circle cx="514" cy="121" r="0.4" fill="#a5c660" />
        {/* 라벨 */}
        <rect x="507.5" y="126" width="17" height="10" fill="#fff5d8" stroke="#000" strokeWidth="0.4" />
        <path d="M 509,131 L 523,131" stroke="#2e7d32" strokeWidth="0.9" fill="none" />
      </g>

      {/* 5. 라면 봉지 — 가장 wide flat 직사각형, 빨강 + 면 그림 (x=528-550, y=88-140) */}
      <g>
        {/* top crimped edge */}
        <path d="M 528,88 L 550,88 L 549,91 L 529,91 Z" fill="#8b1a1a" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
        <circle cx="531" cy="89.5" r="0.35" fill="#fff" />
        <circle cx="534" cy="89.5" r="0.35" fill="#fff" />
        <circle cx="537" cy="89.5" r="0.35" fill="#fff" />
        <circle cx="540" cy="89.5" r="0.35" fill="#fff" />
        <circle cx="543" cy="89.5" r="0.35" fill="#fff" />
        <circle cx="546" cy="89.5" r="0.35" fill="#fff" />
        {/* body */}
        <path d="M 528,91 L 550,91 L 550,140 L 528,140 Z" fill="#d83a2c" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="529" y="92" width="1" height="48" fill="rgba(255,255,255,0.45)" />
        <rect x="548.5" y="92" width="1" height="48" fill="rgba(0,0,0,0.3)" />
        {/* 큰 라벨 영역 */}
        <rect x="528.5" y="98" width="21" height="24" fill="#fff5d8" stroke="#000" strokeWidth="0.5" />
        {/* 면 그림 (꼬불꼬불) */}
        <path d="M 531,106 Q 533,103.5 535,106 Q 537,108.5 539,106 Q 541,103.5 543,106 Q 545,108.5 547,106" fill="none" stroke="#c89a3a" strokeWidth="0.9" />
        <path d="M 531,110 Q 533,107.5 535,110 Q 537,112.5 539,110 Q 541,107.5 543,110 Q 545,112.5 547,110" fill="none" stroke="#c89a3a" strokeWidth="0.8" />
        <path d="M 531,114 Q 533,111.5 535,114 Q 537,116.5 539,114 Q 541,111.5 543,114" fill="none" stroke="#c89a3a" strokeWidth="0.7" />
        {/* 라벨 라인 */}
        <path d="M 531,118 L 547,118" stroke="#8b1a1a" strokeWidth="1" fill="none" />
        {/* hot/매운맛 표시 */}
        <path d="M 535,127 L 537,130 L 535,131 L 537,133" fill="none" stroke="#ffcc00" strokeWidth="0.8" />
        <path d="M 541,127 L 543,130 L 541,131 L 543,133" fill="none" stroke="#ffcc00" strokeWidth="0.8" />
      </g>

      {/* 6. 김 봉지 (seaweed/nori) — 길고 thin 세로 봉지, 다크그린 (x=554-568, y=78-140) */}
      <g>
        {/* top zipper */}
        <rect x="553.5" y="78" width="15" height="3" fill="#1a3320" stroke="#000" strokeWidth="0.5" />
        <path d="M 554,79 L 568,79" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
        <path d="M 554,80 L 568,80" stroke="rgba(0,0,0,0.3)" strokeWidth="0.3" />
        {/* body */}
        <path d="M 554,81 L 568,81 L 568,140 L 554,140 Z" fill="#1a4d2e" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="555" y="82" width="1" height="58" fill="rgba(255,255,255,0.3)" />
        <rect x="566.5" y="82" width="1" height="58" fill="rgba(0,0,0,0.35)" />
        {/* 라벨 (검정 박스) */}
        <rect x="554.5" y="92" width="13" height="24" fill="#0a1a10" stroke="#000" strokeWidth="0.5" />
        {/* 김 waves */}
        <path d="M 556,99 Q 558,97 560,99 Q 562,101 564,99 Q 566,97 567,99" fill="none" stroke="#7ca830" strokeWidth="0.8" />
        <path d="M 556,103 Q 558,101 560,103 Q 562,105 564,103 Q 566,101 567,103" fill="none" stroke="#7ca830" strokeWidth="0.7" />
        <path d="M 556,107 Q 558,105 560,107 Q 562,109 564,107 Q 566,105 567,107" fill="none" stroke="#7ca830" strokeWidth="0.6" />
        {/* 텍스트 라인 (흰 글자 느낌) */}
        <path d="M 556,113 L 566,113" stroke="#fff" strokeWidth="0.7" fill="none" />
        {/* 작은 김 조각 패턴 */}
        <circle cx="558" cy="122" r="0.6" fill="rgba(124,168,48,0.6)" />
        <circle cx="562" cy="125" r="0.6" fill="rgba(124,168,48,0.6)" />
        <circle cx="560" cy="128" r="0.6" fill="rgba(124,168,48,0.6)" />
        <circle cx="564" cy="131" r="0.5" fill="rgba(124,168,48,0.6)" />
      </g>

      {/* 전면 — 깔끔한 단색 rim */}
      <path d="M 448,118 L 572,118 L 572,146 L 448,146 Z" fill="url(#creamFrontG)" stroke="#1a0c04" strokeWidth="2" strokeLinejoin="round" />
      {/* RIGHT Row1 lip — 롤-방지 턱, 안쪽(왼쪽) 두껍 (LEFT mirror) */}
      <path d="M 448,113 L 572,116 L 572,118 L 448,118 Z" fill="url(#creamFrontG)" stroke="#1a0c04" strokeWidth="1.4" strokeLinejoin="round" />
      {/* RIGHT Row1 그림자 — SOFT/GRADIENT: 점진적으로 옅어지는 다중 band 페이드 (LEFT의 HARD/CRISP 와 대비) */}
      {/* lip → rim 위 cast shadow (2단 페이드, 부드럽고 옅은 그라데이션 느낌) */}
      <path d="M 449,118.5 L 571,118.5 L 571,120 L 449,120 Z" fill="rgba(20,12,4,0.30)" />
      <path d="M 449,120 L 571,120 L 571,122 L 449,122 Z" fill="rgba(20,12,4,0.15)" />
      {/* rim → door 아래로 부드럽게 페이드아웃하는 drop shadow (3단, 좌우 대칭) */}
      <path d="M 448,146.5 L 572,146.5 L 572,148.5 L 448,148.5 Z" fill="rgba(20,12,4,0.35)" />
      <path d="M 450,148.5 L 570,148.5 L 570,150.5 L 450,150.5 Z" fill="rgba(20,12,4,0.20)" />
      <path d="M 454,150.5 L 566,150.5 L 566,152 L 454,152 Z" fill="rgba(20,12,4,0.10)" />
      {/* 하단 dark edge */}
      <path d="M 448,146 L 572,146" fill="none" stroke="#1a0c04" strokeWidth="1.6" />

      
      {/* ===== Row2 (우측) ← LEFT Row2와 동일 (단순 rectangle, shelfFrontDeep + AO) ===== */}

      {/* ===== Row2 items (우측) — 각자 다른 모양/크기 5개 (카레봉지/올리브오일/계란판/콩나물봉지/버섯컨테이너) ===== */}

      {/* 1. 카레 레토르트 봉지 — 짧고 단단한 직사각형, 황금색 (x=452-470, y=190-232) */}
      <g>
        {/* top crimped edge */}
        <path d="M 452,190 L 470,190 L 469,193 L 453,193 Z" fill="#5d3a1f" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
        <circle cx="455" cy="191.5" r="0.4" fill="#fff" />
        <circle cx="458" cy="191.5" r="0.4" fill="#fff" />
        <circle cx="461" cy="191.5" r="0.4" fill="#fff" />
        <circle cx="464" cy="191.5" r="0.4" fill="#fff" />
        <circle cx="467" cy="191.5" r="0.4" fill="#fff" />
        {/* body */}
        <path d="M 452,193 L 470,193 L 470,232 L 452,232 Z" fill="#c89a3a" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="453" y="194" width="1" height="38" fill="rgba(255,255,255,0.45)" />
        <rect x="468" y="194" width="1" height="38" fill="rgba(0,0,0,0.3)" />
        {/* 라벨 */}
        <rect x="452.5" y="200" width="17" height="18" fill="#fff5d8" stroke="#000" strokeWidth="0.5" />
        {/* 카레 그림 (둥근 그릇) */}
        <ellipse cx="461" cy="207" rx="5" ry="2" fill="#c89a3a" stroke="#8b6914" strokeWidth="0.4" />
        <circle cx="459" cy="206.5" r="0.6" fill="#e87830" />
        <circle cx="462.5" cy="207" r="0.5" fill="#e87830" />
        <circle cx="460" cy="207.5" r="0.4" fill="#e87830" />
        <path d="M 454,213 L 468,213" stroke="#8b1a1a" strokeWidth="0.8" fill="none" />
        <path d="M 454,216 L 466,216" stroke="#8b1a1a" strokeWidth="0.5" fill="none" />
      </g>

      {/* 2. 올리브 오일 병 — 가장 키 큰 슬림, cork + 다크그린 (x=474-484, y=160-232) */}
      <g>
        {/* cork */}
        <rect x="477" y="160" width="4" height="4" fill="#8b6914" stroke="#000" strokeWidth="0.4" />
        <rect x="477" y="160" width="4" height="1" fill="rgba(255,255,255,0.4)" />
        {/* neck */}
        <rect x="477.5" y="164" width="3" height="14" fill="#3a6b30" stroke="#000" strokeWidth="0.6" />
        {/* shoulder */}
        <path d="M 477.5,178 L 480.5,178 L 484,184 L 474,184 Z" fill="#3a6b30" stroke="#000" strokeWidth="0.7" strokeLinejoin="round" />
        {/* body */}
        <path d="M 474,184 L 484,184 L 484,232 L 474,232 Z" fill="#3a6b30" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="475" y="185" width="0.8" height="47" fill="rgba(255,255,255,0.4)" />
        <rect x="482.5" y="185" width="0.8" height="47" fill="rgba(0,0,0,0.3)" />
        {/* 라벨 */}
        <rect x="474.5" y="195" width="9" height="16" fill="#f5e5c0" stroke="#000" strokeWidth="0.4" />
        {/* 올리브 그림 */}
        <ellipse cx="477" cy="200" rx="1.2" ry="1.5" fill="#2e5e1c" stroke="#1a3320" strokeWidth="0.3" />
        <ellipse cx="481" cy="201.5" rx="1.2" ry="1.5" fill="#2e5e1c" stroke="#1a3320" strokeWidth="0.3" />
        <path d="M 477,198.5 L 477.5,197.5" stroke="#2e7d32" strokeWidth="0.4" />
        <path d="M 475.5,205 L 482.5,205" stroke="#2e7d32" strokeWidth="0.6" fill="none" />
        <path d="M 475.5,208 L 481.5,208" stroke="#2e7d32" strokeWidth="0.4" fill="none" />
      </g>

      {/* 3. 계란판 (egg carton) — 짧고 wide, 6개 계란 보임 (x=488-510, y=200-232) */}
      <g>
        {/* tray body */}
        <path d="M 488,200 L 510,200 L 510,232 L 488,232 Z" fill="#c8c0a8" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="489" y="201" width="1" height="31" fill="rgba(255,255,255,0.5)" />
        <rect x="508" y="201" width="1" height="31" fill="rgba(0,0,0,0.2)" />
        {/* 계란판 dimples (eggs in cups) */}
        <ellipse cx="492" cy="206" rx="2.2" ry="2.5" fill="#fafaf2" stroke="#000" strokeWidth="0.5" />
        <ellipse cx="491" cy="205" rx="0.6" ry="0.9" fill="rgba(255,255,255,0.75)" />
        <ellipse cx="499" cy="206" rx="2.2" ry="2.5" fill="#fafaf2" stroke="#000" strokeWidth="0.5" />
        <ellipse cx="498" cy="205" rx="0.6" ry="0.9" fill="rgba(255,255,255,0.75)" />
        <ellipse cx="506" cy="206" rx="2.2" ry="2.5" fill="#fafaf2" stroke="#000" strokeWidth="0.5" />
        <ellipse cx="505" cy="205" rx="0.6" ry="0.9" fill="rgba(255,255,255,0.75)" />
        {/* second row */}
        <ellipse cx="495" cy="214" rx="2" ry="2.3" fill="#fafaf2" stroke="#000" strokeWidth="0.5" />
        <ellipse cx="502" cy="214" rx="2" ry="2.3" fill="#fafaf2" stroke="#000" strokeWidth="0.5" />
        <circle cx="494" cy="213.5" r="0.4" fill="rgba(255,255,255,0.7)" />
        <circle cx="501" cy="213.5" r="0.4" fill="rgba(255,255,255,0.7)" />
        {/* "달걀" label */}
        <rect x="488.5" y="222" width="21" height="9" fill="#fff5d8" stroke="#000" strokeWidth="0.4" />
        <path d="M 490,226 L 508,226" stroke="#8b4513" strokeWidth="0.8" fill="none" />
        <path d="M 490,228.5 L 506,228.5" stroke="#8b4513" strokeWidth="0.5" fill="none" />
      </g>

      {/* 4. 콩나물 봉지 — medium tall, 투명 봉지 + 노란 콩나물 (x=514-534, y=170-232) */}
      <g>
        {/* knot at top */}
        <ellipse cx="524" cy="171" rx="4" ry="2" fill="rgba(220,220,200,0.85)" stroke="#000" strokeWidth="0.5" />
        <path d="M 521,170 L 522,168 L 524,167 L 526,168 L 527,170" fill="none" stroke="#000" strokeWidth="0.4" />
        {/* bag body (translucent) */}
        <path d="M 514,173 L 534,173 L 534,232 L 514,232 Z" fill="rgba(240,240,220,0.7)" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="515" y="174" width="1" height="58" fill="rgba(255,255,255,0.6)" />
        <rect x="532" y="174" width="1" height="58" fill="rgba(0,0,0,0.15)" />
        {/* bean sprouts (curly stems with yellow heads) */}
        <path d="M 517,180 L 519,183 L 518,186 L 520,189" fill="none" stroke="#f0d878" strokeWidth="0.7" />
        <circle cx="517" cy="180" r="0.55" fill="#e8c84c" />
        <path d="M 521,178 L 523,181 L 522,184 L 524,187" fill="none" stroke="#f0d878" strokeWidth="0.7" />
        <circle cx="521" cy="178" r="0.55" fill="#e8c84c" />
        <path d="M 525,180 L 527,183 L 526,186 L 528,189" fill="none" stroke="#f0d878" strokeWidth="0.7" />
        <circle cx="525" cy="180" r="0.55" fill="#e8c84c" />
        <path d="M 529,178 L 531,181 L 530,184 L 532,187" fill="none" stroke="#f0d878" strokeWidth="0.7" />
        <circle cx="529" cy="178" r="0.55" fill="#e8c84c" />
        <path d="M 518,193 L 520,196 L 519,199" fill="none" stroke="#f0d878" strokeWidth="0.6" />
        <circle cx="518" cy="193" r="0.45" fill="#e8c84c" />
        <path d="M 523,195 L 525,198 L 524,201" fill="none" stroke="#f0d878" strokeWidth="0.6" />
        <circle cx="523" cy="195" r="0.45" fill="#e8c84c" />
        <path d="M 528,193 L 530,196 L 529,199" fill="none" stroke="#f0d878" strokeWidth="0.6" />
        <circle cx="528" cy="193" r="0.45" fill="#e8c84c" />
        {/* 빨간 스티커 라벨 */}
        <rect x="516" y="208" width="16" height="10" fill="#d83a2c" stroke="#000" strokeWidth="0.4" />
        <path d="M 517,212 L 531,212" stroke="#fff" strokeWidth="0.8" fill="none" />
        <path d="M 517,215 L 529,215" stroke="#fff" strokeWidth="0.5" fill="none" />
      </g>

      {/* 5. 버섯 컨테이너 (clamshell) — 가장 wide, 투명 clamshell + 버섯들 (x=538-568, y=185-232) */}
      <g>
        {/* clamshell top (clear, slim) */}
        <path d="M 538,185 L 568,185 L 568,192 L 538,192 Z" fill="rgba(240,250,255,0.55)" stroke="#000" strokeWidth="0.7" strokeLinejoin="round" />
        <path d="M 538,185 L 568,185" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
        {/* hinge dashed line */}
        <path d="M 538,189 L 568,189" stroke="rgba(0,0,0,0.4)" strokeWidth="0.6" strokeDasharray="2,1" />
        {/* bottom container */}
        <path d="M 538,192 L 568,192 L 568,232 L 538,232 Z" fill="rgba(245,245,240,0.85)" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="539" y="193" width="1" height="39" fill="rgba(255,255,255,0.6)" />
        <rect x="566" y="193" width="1" height="39" fill="rgba(0,0,0,0.2)" />
        {/* mushrooms (cap + stem) */}
        <ellipse cx="546" cy="201" rx="3.5" ry="2.5" fill="#f5ebd8" stroke="#8b6914" strokeWidth="0.4" />
        <rect x="544.5" y="202" width="3" height="3" fill="#e8d8bc" stroke="#8b6914" strokeWidth="0.4" />
        <ellipse cx="553" cy="199" rx="3" ry="2.2" fill="#f5ebd8" stroke="#8b6914" strokeWidth="0.4" />
        <rect x="551.5" y="200" width="3" height="3" fill="#e8d8bc" stroke="#8b6914" strokeWidth="0.4" />
        <ellipse cx="560" cy="202" rx="3.5" ry="2.5" fill="#f5ebd8" stroke="#8b6914" strokeWidth="0.4" />
        <rect x="558.5" y="203" width="3" height="3" fill="#e8d8bc" stroke="#8b6914" strokeWidth="0.4" />
        {/* second row */}
        <ellipse cx="549" cy="212" rx="3" ry="2.2" fill="#f5ebd8" stroke="#8b6914" strokeWidth="0.4" />
        <rect x="547.5" y="213" width="3" height="3" fill="#e8d8bc" stroke="#8b6914" strokeWidth="0.4" />
        <ellipse cx="557" cy="213" rx="3" ry="2.2" fill="#f5ebd8" stroke="#8b6914" strokeWidth="0.4" />
        <rect x="555.5" y="214" width="3" height="3" fill="#e8d8bc" stroke="#8b6914" strokeWidth="0.4" />
        {/* 라벨 sticker */}
        <rect x="538.5" y="222" width="29" height="9" fill="#fff5d8" stroke="#000" strokeWidth="0.4" />
        <path d="M 540,226 L 566,226" stroke="#8b4513" strokeWidth="0.8" fill="none" />
        <path d="M 540,228.5 L 564,228.5" stroke="#8b4513" strokeWidth="0.5" fill="none" />
      </g>

      {/* Front face — 깔끔한 단색 rim */}
      <path d="M 448,215 L 572,215 L 572,235 L 448,235 Z" fill="url(#shelfFrontDeep)" stroke="#1a0c04" strokeWidth="2" strokeLinejoin="round" />
      {/* RIGHT Row2 그림자 — VIGNETTE: 양 끝 진하고 가운데 밝음 (depth-of-field/edge-focused) */}
      {/* 상단 AO — 양 끝 진하고 중앙 옅음 */}
      <path d="M 448,215 L 480,215 L 480,217.5 L 448,217.5 Z" fill="rgba(20,12,4,0.32)" />
      <path d="M 480,215 L 540,215 L 540,217 L 480,217 Z" fill="rgba(20,12,4,0.12)" />
      <path d="M 540,215 L 572,215 L 572,217.5 L 540,217.5 Z" fill="rgba(20,12,4,0.32)" />
      {/* 가로 홈/groove (sunken/recessed) */}
      <rect x="452" y="222.5" width="116" height="3" fill="rgba(20,12,4,0.55)" />
      <path d="M 452,222.5 L 568,222.5" stroke="rgba(10,5,2,0.75)" strokeWidth="0.7" />
      <path d="M 452,225.5 L 568,225.5" stroke="rgba(255,250,220,0.45)" strokeWidth="0.5" />
      {/* groove 내부 inner highlight — 가운데만 밝게 (vignette: 중앙 밝고 양 끝 어두움) */}
      <path d="M 498,224 L 522,224" stroke="rgba(255,250,220,0.7)" strokeWidth="0.5" />
      {/* drop shadow — 양 끝 두껍게, 가운데 옅게 (vignette corners) */}
      <path d="M 448,235.5 L 482,235.5 L 480,239 L 450,239 Z" fill="rgba(20,12,4,0.38)" />
      <path d="M 482,235.5 L 538,235.5 L 538,237.5 L 482,237.5 Z" fill="rgba(20,12,4,0.14)" />
      <path d="M 538,235.5 L 572,235.5 L 570,239 L 540,239 Z" fill="rgba(20,12,4,0.38)" />
      {/* 하단 dark edge */}
      <path d="M 448,235 L 572,235" fill="none" stroke="#1a0c04" strokeWidth="2" />

      {/* ===== Row3 (우측 도어) — Row1 디자인 + 이모지 꽂혀있는 모습 ===== */}

      {/* ===== Row3 items (우측) — 각자 다른 모양/크기 6개 (사과/간장큰병/메이플시럽/소세지팩/마요네즈/2L콜라페트) ===== */}

      {/* 1. 사과 — 작고 둥근, 빨강 (x=452-466, y=340-365) */}
      <g>
        {/* stem */}
        <rect x="458.5" y="340" width="1.5" height="3.5" fill="#5d3a1f" stroke="#000" strokeWidth="0.3" />
        {/* leaf */}
        <path d="M 460,341 Q 463,339 463,342.5 Q 461,343.5 460,341 Z" fill="#2e7d32" stroke="#1a4d2e" strokeWidth="0.4" />
        {/* apple body */}
        <ellipse cx="459" cy="354" rx="7" ry="10" fill="#d83a2c" stroke="#000" strokeWidth="1" />
        <ellipse cx="455" cy="350" rx="2.2" ry="3.5" fill="rgba(255,255,255,0.55)" />
        <path d="M 463,348 Q 465,354 463,361" fill="none" stroke="rgba(120,30,20,0.55)" strokeWidth="1.5" />
        {/* 작은 점/씨 표현 */}
        <circle cx="461" cy="357" r="0.3" fill="rgba(80,15,10,0.4)" />
      </g>

      {/* 2. 간장 큰 병 — tall slim, 다크브라운 + 빨간 캡 (x=469-482, y=315-365) */}
      <g>
        {/* cap */}
        <rect x="473" y="315" width="5" height="5" fill="#c83020" stroke="#000" strokeWidth="0.5" />
        <rect x="473" y="315" width="5" height="1.2" fill="rgba(255,255,255,0.4)" />
        <rect x="473" y="319" width="5" height="0.8" fill="rgba(0,0,0,0.35)" />
        {/* neck */}
        <rect x="474" y="320" width="3" height="6" fill="#1a0c04" stroke="#000" strokeWidth="0.5" />
        {/* shoulder */}
        <path d="M 474,326 L 477,326 L 482,331 L 469,331 Z" fill="#2a1408" stroke="#000" strokeWidth="0.7" strokeLinejoin="round" />
        {/* body (dark brown) */}
        <path d="M 469,331 L 482,331 L 482,365 L 469,365 Z" fill="#2a1408" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="470" y="332" width="1" height="33" fill="rgba(255,255,255,0.25)" />
        <rect x="480.5" y="332" width="1" height="33" fill="rgba(0,0,0,0.4)" />
        {/* 라벨 */}
        <rect x="469.5" y="340" width="12" height="14" fill="#fff5d8" stroke="#000" strokeWidth="0.4" />
        <path d="M 472,345 L 479,345" stroke="#8b1a1a" strokeWidth="0.9" fill="none" />
        <path d="M 472,348 L 479,348" stroke="#8b1a1a" strokeWidth="0.5" fill="none" />
        <path d="M 472,351 L 477,351" stroke="#8b1a1a" strokeWidth="0.5" fill="none" />
      </g>

      {/* 3. 메이플 시럽 병 — medium, 손잡이 있는 호박색 아크릴 (x=485-503, y=320-365) */}
      <g>
        {/* cap */}
        <rect x="491" y="320" width="6" height="4" fill="#5d3a1f" stroke="#000" strokeWidth="0.5" />
        <rect x="491" y="320" width="6" height="1" fill="rgba(255,255,255,0.4)" />
        {/* neck */}
        <rect x="491.5" y="324" width="5" height="3" fill="#d8a83a" stroke="#000" strokeWidth="0.5" />
        {/* shoulder */}
        <path d="M 491,327 L 497,327 L 500,332 L 488,332 Z" fill="#d8a83a" stroke="#000" strokeWidth="0.7" strokeLinejoin="round" />
        {/* body */}
        <path d="M 488,332 L 500,332 L 500,365 L 488,365 Z" fill="#d8a83a" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        {/* handle (oval) */}
        <path d="M 500,338 Q 503,338 503,344 Q 503,350 500,350" fill="rgba(216,168,58,0.6)" stroke="#000" strokeWidth="0.8" />
        <rect x="489" y="333" width="1" height="32" fill="rgba(255,255,255,0.5)" />
        <rect x="498.5" y="333" width="1" height="32" fill="rgba(0,0,0,0.3)" />
        {/* 라벨 */}
        <rect x="488.5" y="340" width="11" height="14" fill="#fff5d8" stroke="#000" strokeWidth="0.4" />
        {/* maple leaf */}
        <path d="M 494,343 L 495.5,345 L 497,343 L 496.5,346 L 497.5,347 L 495.5,347.5 L 493.5,347 L 494.5,346 L 494,343 Z" fill="#c83020" stroke="#8b1a1a" strokeWidth="0.3" />
        <path d="M 489,351 L 499,351" stroke="#8b4513" strokeWidth="0.6" fill="none" />
      </g>

      {/* 4. 소세지 팩 — 가장 wide flat, 빨강 + 윈도우로 소세지 보임 (x=506-530, y=335-365) */}
      <g>
        {/* top crimp */}
        <path d="M 506,335 L 530,335 L 529,338 L 507,338 Z" fill="#8b1a1a" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
        <circle cx="509" cy="336.5" r="0.4" fill="#fff" />
        <circle cx="513" cy="336.5" r="0.4" fill="#fff" />
        <circle cx="517" cy="336.5" r="0.4" fill="#fff" />
        <circle cx="521" cy="336.5" r="0.4" fill="#fff" />
        <circle cx="525" cy="336.5" r="0.4" fill="#fff" />
        <circle cx="529" cy="336.5" r="0.4" fill="#fff" />
        {/* body */}
        <path d="M 506,338 L 530,338 L 530,365 L 506,365 Z" fill="#e8654a" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="507" y="339" width="1" height="26" fill="rgba(255,255,255,0.45)" />
        <rect x="528.5" y="339" width="1" height="26" fill="rgba(0,0,0,0.3)" />
        {/* 윈도우 (소세지 보임) */}
        <rect x="507" y="343" width="22" height="17" fill="rgba(255,255,255,0.75)" stroke="#000" strokeWidth="0.4" />
        {/* 소세지 3줄 */}
        <rect x="508" y="345" width="20" height="4" fill="#c14820" stroke="#8b1a1a" strokeWidth="0.4" rx="1.8" />
        <rect x="508" y="350" width="20" height="4" fill="#c14820" stroke="#8b1a1a" strokeWidth="0.4" rx="1.8" />
        <rect x="508" y="355" width="20" height="4" fill="#c14820" stroke="#8b1a1a" strokeWidth="0.4" rx="1.8" />
        {/* 소세지 highlights */}
        <path d="M 509,346 L 527,346" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <path d="M 509,351 L 527,351" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      </g>

      {/* 5. 마요네즈 짤병 — cone 어깨, 흰 + 노란 라벨 (x=533-547, y=323-365) */}
      <g>
        {/* cap */}
        <rect x="538" y="323" width="4" height="3" fill="#1a0c04" stroke="#000" strokeWidth="0.4" />
        <rect x="538" y="323" width="4" height="0.8" fill="rgba(255,255,255,0.3)" />
        {/* neck cone */}
        <path d="M 538,326 L 542,326 L 546,332 L 534,332 Z" fill="#fafaf2" stroke="#000" strokeWidth="0.7" strokeLinejoin="round" />
        {/* body */}
        <path d="M 534,332 L 546,332 L 546,365 L 534,365 Z" fill="#fafaf2" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <rect x="535" y="333" width="1" height="32" fill="rgba(255,255,255,0.65)" />
        <rect x="544.5" y="333" width="1" height="32" fill="rgba(0,0,0,0.2)" />
        {/* 노란 라벨 */}
        <rect x="534.5" y="339" width="11" height="14" fill="#f4d030" stroke="#000" strokeWidth="0.5" />
        <path d="M 536,344 L 544,344" stroke="#8b6914" strokeWidth="0.8" fill="none" />
        <path d="M 536,347 L 544,347" stroke="#8b6914" strokeWidth="0.5" fill="none" />
        <path d="M 536,350 L 542,350" stroke="#8b6914" strokeWidth="0.5" fill="none" />
      </g>

      {/* 6. 2L 콜라 페트병 — 가장 키 큰, 다크 콜라색 + 빨간 라벨 (x=550-566, y=307-365) */}
      <g>
        {/* cap */}
        <rect x="554" y="307" width="8" height="4" fill="#d83a2c" stroke="#000" strokeWidth="0.5" />
        <rect x="554" y="307" width="8" height="1" fill="rgba(255,255,255,0.4)" />
        {/* tamper ring */}
        <rect x="554" y="311" width="8" height="1" fill="#8b1a1a" />
        {/* neck (transparent) */}
        <rect x="554.5" y="312" width="7" height="5" fill="rgba(220,180,160,0.55)" stroke="#000" strokeWidth="0.4" />
        {/* shoulder */}
        <path d="M 554.5,317 L 561.5,317 L 566,323 L 550,323 Z" fill="rgba(80,30,15,0.7)" stroke="#000" strokeWidth="0.7" strokeLinejoin="round" />
        {/* body (dark cola color) */}
        <path d="M 550,323 L 566,323 L 566,365 L 550,365 Z" fill="rgba(50,20,10,0.88)" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        {/* PET ribbing */}
        <path d="M 551,330 L 565,330" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
        <path d="M 551,358 L 565,358" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
        <rect x="551" y="324" width="1" height="41" fill="rgba(255,255,255,0.35)" />
        <rect x="564" y="324" width="1" height="41" fill="rgba(0,0,0,0.4)" />
        {/* 빨간 라벨 */}
        <rect x="550.5" y="340" width="15" height="14" fill="#d83a2c" stroke="#000" strokeWidth="0.5" />
        <path d="M 552,345 L 564,345" stroke="#fff" strokeWidth="1" fill="none" />
        <path d="M 552,348 L 563,348" stroke="#fff" strokeWidth="0.6" fill="none" />
        <path d="M 552,351 L 562,351" stroke="#fff" strokeWidth="0.5" fill="none" />
      </g>

      {/* === Rim — 깔끔한 단색 rim === */}
      <path d="M 448,347 L 572,347 L 572,375 L 448,375 Z" fill="url(#shelfFrontDeep)" stroke="#1a0c04" strokeWidth="2" strokeLinejoin="round" />
      {/* RIGHT Row3 lip — 롤-방지 턱, 안쪽(왼쪽) 두껍 (mirror) */}
      <path d="M 448,342 L 572,345 L 572,347 L 448,347 Z" fill="url(#shelfFrontDeep)" stroke="#1a0c04" strokeWidth="1.4" strokeLinejoin="round" />
      {/* RIGHT Row3 미세 디테일 — 하단 가까이 얇은 음영 라인 (LEFT와 vertical 위치 다름) */}
      <path d="M 452,368 L 568,368" stroke="rgba(20,12,4,0.28)" strokeWidth="0.5" />
      {/* 하단 dark edge */}
      <path d="M 448,375 L 572,375" fill="none" stroke="#1a0c04" strokeWidth="2" />

      <path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      </g>

      
      <g transform="matrix(0.69,0,0,1,133.3,0)">
      <path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      {/* 도어 패널 specular·top curve highlight 제거 */}
      <path d="M 574,406 L 584,410 L 582,620 L 572,624 Z" fill="url(#bodyDark)" />
      <path d="M 430,402 L 442,406 L 574,406 L 584,410 Z" fill="url(#bodyLight)" />
      <path d="M 448,416 L 556,422 L 554,608 L 448,604 Z" fill="url(#freezerG)" />
      {/* 도어 내부 perspective·모서리 shadow·highlight 제거 */}

      <path d="M 556,422 L 555,419 L 569,420 L 570,423 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 556,422 L 555,419 L 553,605 L 554,608 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 570,406 L 594,410 L 590,628 L 568,623 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 556,422 L 570,423 L 568,609 L 554,608 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 556,422 L 570,423" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <path d="M 562,426 L 560,603" fill="none" stroke="rgba(50,30,8,0.55)" strokeWidth="1.3" />
      <path d="M 563.2,426 L 561.2,603" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.7" />
      <path d="M 554,608 L 568,609" fill="none" stroke="#2A1408" strokeWidth="1.5" />

      <path d="M 453,557 L 550,560 L 555,581 L 450,578 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 450,578 L 555,581 L 554,608 L 450,608 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 450,578 L 555,581 L 554,608 L 450,608 Z" fill="url(#shRadTop)" pointerEvents="none" />
      <path d="M 450,578 L 555,581" fill="none" stroke="#FFF4D8" strokeWidth="3.5" />
      <path d="M 450,608 L 554,608" fill="none" stroke="#2A1408" strokeWidth="2.2" />
      <path d="M 450,564 L 555,565" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1.2" />
      <path d="M 450,570 L 555,571" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 450,578 L 554,578" fill="none" stroke="#2A1408" strokeWidth="1.8" />
      {/* Freezer 내부 opening shadow */}
      <path d="M 450,578 L 555,581 L 555,585 L 450,582 Z" fill="rgba(30,12,4,0.5)"/>
      {/* 아이스 그리드 */}
      <line x1="480" y1="580" x2="480" y2="608" stroke="rgba(30,12,4,0.4)" strokeWidth="0.8"/>
      <line x1="505" y1="581" x2="505" y2="608" stroke="rgba(30,12,4,0.4)" strokeWidth="0.8"/>
      <line x1="530" y1="582" x2="530" y2="608" stroke="rgba(30,12,4,0.4)" strokeWidth="0.8"/>
      <line x1="450" y1="592" x2="555" y2="594" stroke="rgba(30,12,4,0.35)" strokeWidth="0.8"/>
      {/* 프로스트 */}
      <ellipse cx="490" cy="587" rx="28" ry="1.5" fill="rgba(200,230,255,0.35)"/>
      <ellipse cx="530" cy="585" rx="18" ry="1" fill="rgba(200,230,255,0.3)"/>

      <path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      </g>
            {/* 하단 베이스 + 그림자 */}
      <ellipse cx="300" cy="652" rx="170" ry="8" fill="url(#floorShadow)"/>
      <rect x="168" y="624" width="264" height="10" rx="2" fill="url(#bodyDark)" stroke="#000" strokeWidth="0.6"/>
      {/* 하단 크롬 트림 스트립 — 메탈 마감 */}
      <rect x="170" y="625" width="260" height="1.8" rx="0.5" fill="url(#chromeG)"/>
      <rect x="170" y="632" width="260" height="1.2" rx="0.5" fill="url(#chromeG)" opacity="0.6"/>
      {/* 좌측 크롬 조절 다리 */}
      <rect x="186" y="634" width="26" height="8" rx="2" fill="url(#chromeG)" stroke="#000" strokeWidth="1.2"/>
      <rect x="190" y="640" width="18" height="6" rx="1" fill="#888" stroke="#000" strokeWidth="1"/>
      <line x1="194" y1="643" x2="204" y2="643" stroke="#000" strokeWidth="0.5" opacity="0.6"/>
      {/* 우측 크롬 조절 다리 */}
      <rect x="388" y="634" width="26" height="8" rx="2" fill="url(#chromeG)" stroke="#000" strokeWidth="1.2"/>
      <rect x="392" y="640" width="18" height="6" rx="1" fill="#888" stroke="#000" strokeWidth="1"/>
      <line x1="396" y1="643" x2="406" y2="643" stroke="#000" strokeWidth="0.5" opacity="0.6"/>
        </svg>
  );
}

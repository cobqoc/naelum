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
          {/* 시원한 아이스 블루 — 프레쉬한 냉장고 느낌 */}
          <stop offset="0%" stopColor="#e4f4fa" />
          <stop offset="100%" stopColor="#b8dbe8" />
        </linearGradient>
        <linearGradient id="freezerG" x1="0" y1="0" x2="0" y2="1">
          {/* 냉동실은 더 짙은 아이시 블루 — 차가운 느낌 강조 */}
          <stop offset="0%" stopColor="#d0ebf5" />
          <stop offset="100%" stopColor="#9cc9dc" />
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
      </defs>

      <rect x="80" y="630" width="440" height="25" rx="6" fill="url(#reflectG)" />
      <ellipse cx="300" cy="648" rx="260" ry="18" fill="url(#shadowG)" />

      
      <g transform="matrix(0.69,0,0,1,52.70000000000001,0)">
      <path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 14,2 L 2,10 L 6,396 L 16,392 Z" fill="url(#bodyDark)" />
      <path d="M 14,2 L 2,10 L 158,28 L 170,24 Z" fill="url(#bodyLight)" />
      <path d="M 28,22 L 152,36 L 152,376 L 30,376 Z" fill="url(#interiorG)" />

      
      <path d="M 14,22 L 15,19 L 29,19 L 28,22 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 28,22 L 29,19 L 31,373 L 30,376 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M -10,10 L 14,2 L 16,392 L -6,398 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 14,22 L 28,22 L 30,376 L 16,376 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 14,22 L 28,22" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 20,27 L 22,371" fill="none" stroke="rgba(50,30,8,0.55)" strokeWidth="1.3" />
      <path d="M 21.2,27 L 23.2,371" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.7" />
      <path d="M 14.6,122 L 28.6,122" fill="none" stroke="rgba(40,22,8,0.7)" strokeWidth="1.3" />
      <path d="M 14.7,124 L 28.7,124" fill="none" stroke="rgba(255,240,200,0.4)" strokeWidth="0.7" />
      <path d="M 15,204 L 29,204" fill="none" stroke="rgba(40,22,8,0.7)" strokeWidth="1.3" />
      <path d="M 15.1,206 L 29.1,206" fill="none" stroke="rgba(255,240,200,0.4)" strokeWidth="0.7" />
      <path d="M 15.9,350 L 29.9,350" fill="none" stroke="rgba(40,22,8,0.7)" strokeWidth="1.3" />
      <path d="M 16,352 L 30,352" fill="none" stroke="rgba(255,240,200,0.4)" strokeWidth="0.7" />
      <path d="M 16,376 L 30,376" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <path d="M 29,110 L 152,120 L 150,128 L 29,118 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 29,118 L 150,128 L 150,146 L 29,136 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 29,118 L 150,128 L 150,146 L 29,136 Z" fill="url(#shT)" pointerEvents="none" />
      <path d="M 29,118 L 150,128" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 29,136 L 150,146" fill="none" stroke="#2A1408" strokeWidth="2" />
      {/* Row1 내부 opening shadow */}
      <path d="M 29,118 L 150,128 L 150,132 L 29,122 Z" fill="rgba(30,12,4,0.45)"/>
      {/* 병 슬롯 디바이더 3개 */}
      <line x1="58.5" y1="123" x2="60" y2="146" stroke="rgba(30,12,4,0.5)" strokeWidth="1.3"/>
      <line x1="60" y1="123" x2="61.5" y2="146" stroke="rgba(255,240,200,0.3)" strokeWidth="0.6"/>
      <line x1="89" y1="124" x2="90.5" y2="146" stroke="rgba(30,12,4,0.5)" strokeWidth="1.3"/>
      <line x1="90.5" y1="124" x2="92" y2="146" stroke="rgba(255,240,200,0.3)" strokeWidth="0.6"/>
      <line x1="119.5" y1="125" x2="121" y2="146" stroke="rgba(30,12,4,0.5)" strokeWidth="1.3"/>
      <line x1="121" y1="125" x2="122.5" y2="146" stroke="rgba(255,240,200,0.3)" strokeWidth="0.6"/>
      {/* 병 캡 힌트 (top face 위 작은 원들) */}
      <ellipse cx="45" cy="114" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>
      <ellipse cx="74" cy="116" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>
      <ellipse cx="104" cy="118" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>
      <ellipse cx="135" cy="120" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>

      
      <path d="M 29,193 L 152,200 L 150,212 L 29,205 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />      <g></g>
      <path d="M 29,205 L 150,212 L 150,237 L 29,230 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 29,205 L 150,212 L 150,237 L 29,230 Z" fill="url(#shR)" pointerEvents="none" />
      <path d="M 29,205 L 150,212" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 29,213 L 150,220" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 29,218 L 150,225" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 29,230 L 150,237" fill="none" stroke="#2A1408" strokeWidth="2" />
      {/* Row2 내부 opening shadow */}
      <path d="M 29,205 L 150,212 L 150,216 L 29,209 Z" fill="rgba(30,12,4,0.45)"/>
      {/* 메쉬 가로선 추가 */}
      <path d="M 29,216 L 150,223" fill="none" stroke="rgba(40,20,5,0.4)" strokeWidth="0.9"/>
      <path d="M 29,222 L 150,229" fill="none" stroke="rgba(40,20,5,0.4)" strokeWidth="0.9"/>
      <path d="M 29,228 L 150,235" fill="none" stroke="rgba(40,20,5,0.4)" strokeWidth="0.9"/>
      {/* 메쉬 세로선 (미세한 격자) */}
      <line x1="55" y1="212" x2="56" y2="237" stroke="rgba(30,12,4,0.25)" strokeWidth="0.6"/>
      <line x1="80" y1="213" x2="81" y2="237" stroke="rgba(30,12,4,0.25)" strokeWidth="0.6"/>
      <line x1="105" y1="214" x2="106" y2="237" stroke="rgba(30,12,4,0.25)" strokeWidth="0.6"/>
      <line x1="130" y1="215" x2="131" y2="237" stroke="rgba(30,12,4,0.25)" strokeWidth="0.6"/>      
      <path d="M 30,339 L 152,341 L 150,353 L 30,351 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />      <g></g>
      <path d="M 30,351 L 150,353 L 150,376 L 30,376 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 30,351 L 150,353 L 150,376 L 30,376 Z" fill="url(#shB)" pointerEvents="none" />
      <path d="M 30,351 L 150,353" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 30,358 L 150,361" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 30,365 L 150,367" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 30,376 L 150,376" fill="none" stroke="#2A1408" strokeWidth="2" />
      {/* Row3 내부 opening shadow */}
      <path d="M 30,351 L 150,353 L 150,357 L 30,355 Z" fill="rgba(30,12,4,0.45)"/>
      {/* 중앙 라벨 플레이트 */}
      <rect x="58" y="360" width="94" height="10" rx="1.5" fill="url(#creamTopG)" stroke="#2A1408" strokeWidth="0.9"/>
      <rect x="62" y="363" width="86" height="4" fill="rgba(40,20,5,0.2)"/>
      <line x1="62" y1="367" x2="148" y2="367" stroke="rgba(255,240,200,0.45)" strokeWidth="0.5"/>

      <path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      </g>

      
      <g transform="matrix(0.69,0,0,1,52.70000000000001,0)">
      <path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 26,406 L 16,410 L 18,620 L 28,624 Z" fill="url(#bodyDark)" />
      <path d="M 26,406 L 16,410 L 158,406 L 170,402 Z" fill="url(#bodyLight)" />
      <path d="M 44,420 L 152,416 L 152,608 L 46,608 Z" fill="url(#freezerG)" />

      
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
      
      {/* 상단 벤트 그릴 */}
      <rect x="178" y="4" width="244" height="6" rx="2" fill="url(#ventShadow)" stroke="#000" strokeWidth="1.2"/>
      <rect x="190" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="203" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="216" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="229" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="242" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="255" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="268" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="281" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="294" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="307" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="320" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="333" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="346" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="359" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="372" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="385" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="398" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>
      <rect x="411" y="5.5" width="9" height="3" rx="0.8" fill="#1a0604" opacity="0.7"/>

<rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" />

      <rect x="166" y="14" width="2.5" height="615" fill="#000" />
      <rect x="431.5" y="14" width="2.5" height="615" fill="#000" />
      <rect x="166" y="14" width="268" height="2.5" fill="#000" />
      <rect x="166" y="626.5" width="268" height="2.5" fill="#000" />
      <rect x="170" y="16" width="260" height="3" rx="1" fill="url(#chromeG)" />
      <rect x="170" y="383" width="260" height="2" rx="0.5" fill="url(#chromeG)" />
      <rect x="170" y="398" width="260" height="2" rx="0.5" fill="url(#chromeG)" />
      <text x="300" y="622" textAnchor="middle" fill="#ffd700" fontSize="11" fontWeight="bold" letterSpacing="4" fontFamily="sans-serif" opacity="0.8">NAELUM</text>

      <rect x="182" y="33" width="236" height="345" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="184" y="35" width="232" height="341" rx="4" fill="url(#interiorG)" />
      <rect x="184" y="35" width="232" height="341" rx="4" fill="url(#shRadBot)" pointerEvents="none" />

      {/* 냉장실 LED 조명바 */}
      <rect x="192" y="37" width="216" height="3.5" rx="1.2" fill="url(#chromeG)" stroke="#2A1408" strokeWidth="0.8"/>
      <rect x="198" y="38.3" width="204" height="1.3" fill="#fff4b8" opacity="0.95"/>
      <ellipse cx="300" cy="44" rx="135" ry="10" fill="url(#ledGlow)"/>

      <rect x="168" y="384" width="264" height="12" rx="1" fill="url(#bodyG)" stroke="#000" strokeWidth="1" />

      <rect x="182" y="404" width="236" height="206" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="184" y="406" width="232" height="202" rx="4" fill="url(#freezerG)" />
      <rect x="184" y="406" width="232" height="202" rx="4" fill="url(#shL)" pointerEvents="none" />

      {/* 냉동실 LED 조명바 */}
      <rect x="192" y="409" width="216" height="3.5" rx="1.2" fill="url(#chromeG)" stroke="#2A1408" strokeWidth="0.8"/>
      <rect x="198" y="410.3" width="204" height="1.3" fill="#c0e8ff" opacity="0.95"/>
      <ellipse cx="300" cy="416" rx="135" ry="8" fill="url(#ledGlow)" opacity="0.7"/>


            {/* ====== 본체 선반 (냉장실) — 입체감 강화 ====== */}
      <rect x="184" y="119" width="232" height="2.5" fill="url(#creamTopG)"/>
      <rect x="186" y="121" width="228" height="11" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round"/>
      <line x1="188" y1="122.5" x2="412" y2="122.5" stroke="#FFF4D8" strokeWidth="1.5"/>
      <line x1="188" y1="128" x2="412" y2="128" stroke="rgba(60,35,10,0.4)" strokeWidth="0.8"/>
      <line x1="188" y1="131.5" x2="412" y2="131.5" stroke="#2A1408" strokeWidth="1.2"/>
      <rect x="188" y="133" width="224" height="5" fill="rgba(40,20,5,0.18)"/>

      <rect x="184" y="214" width="232" height="2.5" fill="url(#creamTopG)"/>
      <rect x="186" y="216" width="228" height="11" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round"/>
      <line x1="188" y1="217.5" x2="412" y2="217.5" stroke="#FFF4D8" strokeWidth="1.5"/>
      <line x1="188" y1="223" x2="412" y2="223" stroke="rgba(60,35,10,0.4)" strokeWidth="0.8"/>
      <line x1="188" y1="226.5" x2="412" y2="226.5" stroke="#2A1408" strokeWidth="1.2"/>
      <rect x="188" y="228" width="224" height="5" fill="rgba(40,20,5,0.18)"/>
      {/* ====== 본체 냉장실 서랍장 2개 (좌우 나란히) ====== */}
      <rect x="188" y="320" width="110" height="54" rx="3" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="188" y="320" width="110" height="54" rx="3" fill="url(#shR)" pointerEvents="none" />
      <rect x="188" y="320" width="110" height="4" rx="2" fill="url(#creamTopG)" />
      <line x1="192" y1="324" x2="296" y2="324" stroke="#FFF4D8" strokeWidth="1" />
      <rect x="216" y="342" width="54" height="9" rx="4.5" fill="url(#creamTopG)" stroke="#000" strokeWidth="1.3" strokeLinejoin="round"/>
      <rect x="220" y="344.5" width="46" height="4" rx="2" fill="#2A1408" opacity="0.55"/>
      <line x1="222" y1="345.5" x2="264" y2="345.5" stroke="#FFF4D8" strokeWidth="0.6" opacity="0.7"/>
      <line x1="188" y1="374" x2="298" y2="374" stroke="#2A1408" strokeWidth="1" />

      <rect x="302" y="320" width="110" height="54" rx="3" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="302" y="320" width="110" height="54" rx="3" fill="url(#shL)" pointerEvents="none" />
      <rect x="302" y="320" width="110" height="4" rx="2" fill="url(#creamTopG)" />
      <line x1="306" y1="324" x2="410" y2="324" stroke="#FFF4D8" strokeWidth="1" />
      <rect x="330" y="342" width="54" height="9" rx="4.5" fill="url(#creamTopG)" stroke="#000" strokeWidth="1.3" strokeLinejoin="round"/>
      <rect x="334" y="344.5" width="46" height="4" rx="2" fill="#2A1408" opacity="0.55"/>
      <line x1="336" y1="345.5" x2="378" y2="345.5" stroke="#FFF4D8" strokeWidth="0.6" opacity="0.7"/>
      <line x1="302" y1="374" x2="412" y2="374" stroke="#2A1408" strokeWidth="1" />

      {/* ====== 본체 냉동실 서랍장 2개 (좌우 나란히) ====== */}
      <rect x="188" y="526" width="110" height="78" rx="3" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="188" y="526" width="110" height="78" rx="3" fill="url(#shRadCornerTL)" pointerEvents="none" />
      <rect x="188" y="526" width="110" height="4" rx="2" fill="url(#creamTopG)" />
      <line x1="192" y1="530" x2="296" y2="530" stroke="#FFF4D8" strokeWidth="1" />
      <rect x="216" y="560" width="54" height="9" rx="4.5" fill="url(#creamTopG)" stroke="#000" strokeWidth="1.3" strokeLinejoin="round"/>
      <rect x="220" y="562.5" width="46" height="4" rx="2" fill="#2A1408" opacity="0.55"/>
      <line x1="222" y1="563.5" x2="264" y2="563.5" stroke="#FFF4D8" strokeWidth="0.6" opacity="0.7"/>
      <line x1="188" y1="604" x2="298" y2="604" stroke="#2A1408" strokeWidth="1" />

      <rect x="302" y="526" width="110" height="78" rx="3" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="302" y="526" width="110" height="78" rx="3" fill="url(#shRadCornerBR)" pointerEvents="none" />
      <rect x="302" y="526" width="110" height="4" rx="2" fill="url(#creamTopG)" />
      <line x1="306" y1="530" x2="410" y2="530" stroke="#FFF4D8" strokeWidth="1" />
      <rect x="330" y="560" width="54" height="9" rx="4.5" fill="url(#creamTopG)" stroke="#000" strokeWidth="1.3" strokeLinejoin="round"/>
      <rect x="334" y="562.5" width="46" height="4" rx="2" fill="#2A1408" opacity="0.55"/>
      <line x1="336" y1="563.5" x2="378" y2="563.5" stroke="#FFF4D8" strokeWidth="0.6" opacity="0.7"/>
      <line x1="302" y1="604" x2="412" y2="604" stroke="#2A1408" strokeWidth="1" />


      


      

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
      <g transform="matrix(0.69,0,0,1,133.3,0)">
      <path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 586,2 L 598,10 L 594,396 L 584,392 Z" fill="url(#bodyDark)" />
      <path d="M 430,24 L 442,28 L 586,2 L 598,10 Z" fill="url(#bodyLight)" />
      <path d="M 448,37 L 572,22 L 570,376 L 448,376 Z" fill="url(#interiorG)" />

      
      <path d="M 572,22 L 571,19 L 585,19 L 586,22 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 572,22 L 571,19 L 569,373 L 570,376 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 586,2 L 610,10 L 606,398 L 584,392 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 572,22 L 586,22 L 584,376 L 570,376 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 572,22 L 586,22" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 578,27 L 576,371" fill="none" stroke="rgba(50,30,8,0.55)" strokeWidth="1.3" />
      <path d="M 579.2,27 L 577.2,371" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.7" />
      <path d="M 570,376 L 584,376" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <path d="M 448,121 L 571,110 L 571,118 L 450,129 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,129 L 571,118 L 571,136 L 450,147 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,129 L 571,118 L 571,136 L 450,147 Z" fill="url(#shB)" pointerEvents="none" />
      <path d="M 450,129 L 571,118" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 450,147 L 571,136" fill="none" stroke="#2A1408" strokeWidth="2" />
      {/* Row1 내부 opening shadow */}
      <path d="M 450,129 L 571,118 L 571,122 L 450,133 Z" fill="rgba(30,12,4,0.45)"/>
      {/* 병 슬롯 디바이더 */}
      <line x1="480" y1="131" x2="478.5" y2="147" stroke="rgba(30,12,4,0.5)" strokeWidth="1.3"/>
      <line x1="481.5" y1="131" x2="480" y2="147" stroke="rgba(255,240,200,0.3)" strokeWidth="0.6"/>
      <line x1="510" y1="128" x2="508.5" y2="147" stroke="rgba(30,12,4,0.5)" strokeWidth="1.3"/>
      <line x1="511.5" y1="128" x2="510" y2="147" stroke="rgba(255,240,200,0.3)" strokeWidth="0.6"/>
      <line x1="540" y1="126" x2="538.5" y2="147" stroke="rgba(30,12,4,0.5)" strokeWidth="1.3"/>
      <line x1="541.5" y1="126" x2="540" y2="147" stroke="rgba(255,240,200,0.3)" strokeWidth="0.6"/>
      {/* 병 캡 */}
      <ellipse cx="465" cy="120" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>
      <ellipse cx="495" cy="117" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>
      <ellipse cx="525" cy="114" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>
      <ellipse cx="555" cy="112" rx="4" ry="1.5" fill="rgba(30,12,4,0.35)"/>

      
      <path d="M 448,201 L 571,193 L 571,205 L 450,213 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />      <g></g>
      <path d="M 450,213 L 571,205 L 571,230 L 450,238 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,213 L 571,205 L 571,230 L 450,238 Z" fill="url(#shL)" pointerEvents="none" />
      <path d="M 450,213 L 571,205" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 450,221 L 571,213" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 450,226 L 571,218" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 450,238 L 571,230" fill="none" stroke="#2A1408" strokeWidth="2" />
      {/* Row2 내부 opening shadow */}
      <path d="M 450,213 L 571,205 L 571,209 L 450,217 Z" fill="rgba(30,12,4,0.45)"/>
      {/* 메쉬 추가 */}
      <path d="M 450,224 L 571,216" fill="none" stroke="rgba(40,20,5,0.4)" strokeWidth="0.9"/>
      <path d="M 450,230 L 571,222" fill="none" stroke="rgba(40,20,5,0.4)" strokeWidth="0.9"/>
      <line x1="476" y1="237" x2="477" y2="213" stroke="rgba(30,12,4,0.25)" strokeWidth="0.6"/>
      <line x1="501" y1="237" x2="502" y2="211" stroke="rgba(30,12,4,0.25)" strokeWidth="0.6"/>
      <line x1="526" y1="237" x2="527" y2="209" stroke="rgba(30,12,4,0.25)" strokeWidth="0.6"/>
      <line x1="551" y1="237" x2="552" y2="207" stroke="rgba(30,12,4,0.25)" strokeWidth="0.6"/>      
      <path d="M 448,341 L 570,339 L 570,351 L 450,353 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />      <g></g>
      <path d="M 450,353 L 570,351 L 570,376 L 448,376 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,353 L 570,351 L 570,376 L 448,376 Z" fill="url(#shT)" pointerEvents="none" />
      <path d="M 450,353 L 570,351" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 450,361 L 570,358" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 450,367 L 570,364" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 448,376 L 570,376" fill="none" stroke="#2A1408" strokeWidth="2" />
      {/* Row3 내부 opening shadow */}
      <path d="M 450,353 L 570,351 L 570,355 L 450,357 Z" fill="rgba(30,12,4,0.45)"/>
      {/* 라벨 플레이트 */}
      <rect x="478" y="360" width="94" height="10" rx="1.5" fill="url(#creamTopG)" stroke="#2A1408" strokeWidth="0.9"/>
      <rect x="482" y="363" width="86" height="4" fill="rgba(40,20,5,0.2)"/>
      <line x1="482" y1="367" x2="568" y2="367" stroke="rgba(255,240,200,0.45)" strokeWidth="0.5"/>

      <path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      </g>

      
      <g transform="matrix(0.69,0,0,1,133.3,0)">
      <path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 574,406 L 584,410 L 582,620 L 572,624 Z" fill="url(#bodyDark)" />
      <path d="M 430,402 L 442,406 L 574,406 L 584,410 Z" fill="url(#bodyLight)" />
      <path d="M 448,416 L 556,422 L 554,608 L 448,604 Z" fill="url(#freezerG)" />

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

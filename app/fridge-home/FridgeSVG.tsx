'use client';

// v8 — 웜 골드 + 원근감 + 도어 바구니 아이템 + LED 조명 + 도어 캐스트 섀도우
// (variant-warm-items.html 기반)
export default function FridgeSVG() {
  return (
    <svg viewBox="-30 -5 660 670" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
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
          <stop offset="0%" stopColor="#f5fbff" />
          <stop offset="100%" stopColor="#dceaf4" />
        </linearGradient>
        <linearGradient id="freezerG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5fbff" />
          <stop offset="100%" stopColor="#dceaf4" />
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
      
        <linearGradient id="doorCastL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(30,10,4,0.32)"/>
          <stop offset="100%" stopColor="rgba(30,10,4,0)"/>
        </linearGradient>
        <linearGradient id="doorCastR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(30,10,4,0.32)"/>
          <stop offset="100%" stopColor="rgba(30,10,4,0)"/>
        </linearGradient>
        <linearGradient id="interiorDarken" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)"/>
        </linearGradient>
        <radialGradient id="ledWarmGlow" cx="50%" cy="0%" r="75%">
          <stop offset="0%" stopColor="rgba(255,240,180,0.55)"/>
          <stop offset="60%" stopColor="rgba(255,240,180,0.15)"/>
          <stop offset="100%" stopColor="rgba(255,240,180,0)"/>
        </radialGradient>
        <radialGradient id="ledCoolGlow" cx="50%" cy="0%" r="75%">
          <stop offset="0%" stopColor="rgba(200,225,255,0.45)"/>
          <stop offset="100%" stopColor="rgba(200,225,255,0)"/>
        </radialGradient>
        <linearGradient id="shelfDrop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(30,10,4,0.3)"/>
          <stop offset="100%" stopColor="rgba(30,10,4,0)"/>
        </linearGradient>
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
      {/* L-Row1: 우유/주스/요거트 */}
      <path d="M 29,118 L 150,128 L 150,124 L 29,114 Z" fill="rgba(25,10,4,0.38)"/>
      {/* 우유 팩 */}
      <polygon points="41,96 58,96 49.5,88" fill="#f2f2f2" stroke="#000" strokeWidth="1.3"/>
      <rect x="41" y="96" width="17" height="38" fill="#fafafa" stroke="#000" strokeWidth="1.3"/>
      <rect x="43" y="104" width="13" height="5" fill="#e85040"/>
      <line x1="43" y1="113" x2="56" y2="113" stroke="#c03828" strokeWidth="0.7"/>
      {/* 주스 병 */}
      <rect x="67" y="84" width="6" height="8" rx="1" fill="#5a2810" stroke="#000" strokeWidth="1"/>
      <path d="M 63,92 L 63,134 L 77,134 L 77,92 Z" fill="#f08838" stroke="#000" strokeWidth="1.3"/>
      <rect x="64" y="107" width="12" height="10" fill="#fff4b8" stroke="#000" strokeWidth="0.7"/>
      <text x="70" y="114" fill="#a04020" fontSize="4" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">OJ</text>
      {/* 요거트 */}
      <ellipse cx="96" cy="103" rx="7.5" ry="2.2" fill="#d88098" stroke="#000" strokeWidth="1"/>
      <rect x="88.5" y="103" width="15" height="32" fill="#f8b8d0" stroke="#000" strokeWidth="1.3"/>
      {/* 청량 캔 */}
      <ellipse cx="122" cy="100" rx="7" ry="2" fill="#80a8e0" stroke="#000" strokeWidth="1"/>
      <rect x="115" y="100" width="14" height="34" fill="#5088d8" stroke="#000" strokeWidth="1.3"/>
      <rect x="116" y="113" width="12" height="3" fill="#fff"/>
      <path d="M 29,118 L 150,128 L 150,146 L 29,136 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 29,118 L 150,128" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 29,136 L 150,146" fill="none" stroke="#2A1408" strokeWidth="2" />

      
      <path d="M 29,193 L 152,200 L 150,212 L 29,205 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      {/* L-Row2: 잼/버터/꿀 */}
      <path d="M 29,205 L 150,212 L 150,210 L 29,201 Z" fill="rgba(25,10,4,0.38)"/>
      {/* 잼 병 */}
      <rect x="44" y="184" width="16" height="5" rx="1" fill="#404040" stroke="#000" strokeWidth="1"/>
      <rect x="45" y="189" width="14" height="33" fill="#c03844" stroke="#000" strokeWidth="1.3"/>
      <rect x="46" y="202" width="12" height="10" fill="#fff4b8" stroke="#000" strokeWidth="0.7"/>
      <text x="52" y="208.5" fill="#602018" fontSize="3.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">JAM</text>
      {/* 버터 */}
      <rect x="67" y="196" width="24" height="16" fill="#fade60" stroke="#000" strokeWidth="1.3"/>
      <path d="M 67,196 L 67,192 L 91,192 L 91,196 Z" fill="#f8d040" stroke="#000" strokeWidth="1.2"/>
      {/* 꿀 병 (꿀벌 모양) */}
      <rect x="97" y="188" width="13" height="4" rx="1" fill="#5a2810" stroke="#000" strokeWidth="1"/>
      <path d="M 95,192 Q 95,188 103.5,188 Q 112,188 112,192 L 112,222 Q 112,224 103.5,224 Q 95,224 95,222 Z" fill="#f4a830" stroke="#000" strokeWidth="1.3"/>
      <ellipse cx="103.5" cy="205" rx="6" ry="5" fill="#fff4d0" stroke="#000" strokeWidth="0.7"/>
      {/* 피클 병 */}
      <rect x="119" y="184" width="14" height="6" rx="1" fill="#808080" stroke="#000" strokeWidth="1"/>
      <rect x="118" y="190" width="16" height="32" fill="#88b048" stroke="#000" strokeWidth="1.3"/>
      <line x1="120" y1="198" x2="132" y2="198" stroke="#5a7830" strokeWidth="0.6"/>
      <line x1="120" y1="204" x2="132" y2="204" stroke="#5a7830" strokeWidth="0.6"/>      <g></g>
      <path d="M 29,205 L 150,212 L 150,237 L 29,230 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 29,205 L 150,212" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 29,213 L 150,220" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 29,218 L 150,225" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 29,230 L 150,237" fill="none" stroke="#2A1408" strokeWidth="2" />      
      <path d="M 30,339 L 152,341 L 150,353 L 30,351 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      {/* L-Row3: 라벨 플레이트 빈 (주료 — 치즈/샐러리 칸) */}
      <path d="M 30,351 L 150,353 L 150,356 L 30,354 Z" fill="rgba(25,10,4,0.38)"/>
      <rect x="45" y="358" width="105" height="14" rx="2" fill="url(#creamTopG)" stroke="#2A1408" strokeWidth="1.1"/>
      <rect x="48" y="361" width="99" height="4" fill="rgba(40,20,5,0.25)"/>
      <text x="97.5" y="369.5" fill="#2A1408" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">DAIRY</text>      <g></g>
      <path d="M 30,351 L 150,353 L 150,376 L 30,376 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 30,351 L 150,353" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 30,358 L 150,361" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 30,365 L 150,367" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 30,376 L 150,376" fill="none" stroke="#2A1408" strokeWidth="2" />

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
      {/* L-Freezer: 아이스 큐브 트레이 + 아이스크림 */}
      <path d="M 45,581 L 150,578 L 150,580 L 45,583 Z" fill="rgba(25,10,4,0.42)"/>
      {/* 아이스큐브 트레이 */}
      <rect x="50" y="563" width="45" height="18" rx="2" fill="#c8e4f8" stroke="#000" strokeWidth="1.2"/>
      <line x1="59" y1="563" x2="59" y2="581" stroke="#000" strokeWidth="0.8"/>
      <line x1="68" y1="563" x2="68" y2="581" stroke="#000" strokeWidth="0.8"/>
      <line x1="77" y1="563" x2="77" y2="581" stroke="#000" strokeWidth="0.8"/>
      <line x1="86" y1="563" x2="86" y2="581" stroke="#000" strokeWidth="0.8"/>
      <line x1="50" y1="572" x2="95" y2="572" stroke="#000" strokeWidth="0.8"/>
      <rect x="52" y="565" width="5" height="5" fill="#f0faff" opacity="0.8"/>
      <rect x="70" y="574" width="5" height="5" fill="#f0faff" opacity="0.8"/>
      {/* 아이스크림 통 */}
      <ellipse cx="120" cy="568" rx="16" ry="3" fill="#d4a8b8" stroke="#000" strokeWidth="1.2"/>
      <rect x="104" y="568" width="32" height="36" fill="#f8c8d4" stroke="#000" strokeWidth="1.2"/>
      <text x="120" y="583" fill="#902848" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">ICE</text>
      <path d="M 45,581 L 150,578 L 150,608 L 46,608 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 45,581 L 150,578" fill="none" stroke="#FFF4D8" strokeWidth="3.5" />
      <path d="M 46,608 L 150,608" fill="none" stroke="#2A1408" strokeWidth="2.2" />
      <path d="M 45,565 L 150,563" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1.2" />
      <path d="M 45,570 L 150,568" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 46,578 L 150,578" fill="none" stroke="#2A1408" strokeWidth="1.8" />

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

      {/* 냉장실 LED 조명바 */}
      <rect x="192" y="37" width="216" height="3.5" rx="1.2" fill="url(#chromeG)" stroke="#2A1408" strokeWidth="0.8"/>
      <rect x="198" y="38.3" width="204" height="1.3" fill="#fff4b8" opacity="0.95"/>
      <ellipse cx="300" cy="50" rx="160" ry="22" fill="url(#ledWarmGlow)"/>
      <rect x="184" y="35" width="232" height="341" rx="4" fill="url(#interiorDarken)"/>

      <rect x="168" y="384" width="264" height="12" rx="1" fill="url(#bodyG)" stroke="#000" strokeWidth="1" />

      <rect x="182" y="404" width="236" height="206" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="184" y="406" width="232" height="202" rx="4" fill="url(#freezerG)" />

      {/* 냉동실 LED 조명바 */}
      <rect x="192" y="409" width="216" height="3.5" rx="1.2" fill="url(#chromeG)" stroke="#2A1408" strokeWidth="0.8"/>
      <rect x="198" y="410.3" width="204" height="1.3" fill="#c0e8ff" opacity="0.95"/>
      <ellipse cx="300" cy="420" rx="160" ry="16" fill="url(#ledCoolGlow)"/>
      <rect x="184" y="406" width="232" height="202" rx="4" fill="url(#interiorDarken)"/>


            
      {/* 냉장실 좌측 도어 그림자 */}
      <rect x="184" y="35" width="30" height="341" fill="url(#doorCastL)"/>
      {/* 냉장실 우측 도어 그림자 */}
      <rect x="386" y="35" width="30" height="341" fill="url(#doorCastR)"/>
      {/* 냉동실 좌측 도어 그림자 */}
      <rect x="184" y="406" width="28" height="202" fill="url(#doorCastL)"/>
      {/* 냉동실 우측 도어 그림자 */}
      <rect x="388" y="406" width="28" height="202" fill="url(#doorCastR)"/>
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
      
      {/* 선반 1 드롭 섀도우 */}
      <rect x="186" y="133" width="228" height="5" fill="url(#shelfDrop)"/>
      {/* 선반 2 드롭 섀도우 */}
      <rect x="186" y="228" width="228" height="5" fill="url(#shelfDrop)"/>
      {/* 서랍 측 드롭 */}
      <rect x="188" y="374" width="224" height="4" fill="url(#shelfDrop)" opacity="0.6"/>
      {/* 냉동 서랍 상단 그림자 */}
      <rect x="188" y="522" width="224" height="5" fill="url(#shelfDrop)"/>
      {/* 냉동 서랍 하단 */}
      <rect x="188" y="604" width="224" height="4" fill="url(#shelfDrop)" opacity="0.5"/>
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
      {/* R-Row1: 생수/우유/소스 */}
      <path d="M 450,129 L 571,118 L 571,114 L 450,125 Z" fill="rgba(25,10,4,0.38)"/>
      {/* 생수병 */}
      <rect x="458" y="82" width="5" height="8" rx="1" fill="#4488d8" stroke="#000" strokeWidth="1"/>
      <rect x="455" y="90" width="11" height="5" fill="#a0c8e8" stroke="#000" strokeWidth="0.7"/>
      <path d="M 454,95 L 454,134 L 467,134 L 467,95 Z" fill="rgba(200,230,255,0.85)" stroke="#000" strokeWidth="1.3"/>
      <rect x="456" y="108" width="9" height="10" fill="#3078c8" stroke="#000" strokeWidth="0.7"/>
      {/* 작은 우유 */}
      <polygon points="475,98 490,98 482.5,90" fill="#e8e8e8" stroke="#000" strokeWidth="1.3"/>
      <rect x="475" y="98" width="15" height="36" fill="#fafafa" stroke="#000" strokeWidth="1.3"/>
      <rect x="476.5" y="106" width="12" height="4" fill="#4488d8"/>
      {/* 소스 병 (케첩) */}
      <rect x="501" y="90" width="7" height="6" rx="1" fill="#404040" stroke="#000" strokeWidth="1"/>
      <path d="M 498,96 L 498,134 L 511,134 L 511,96 Z" fill="#d03828" stroke="#000" strokeWidth="1.3"/>
      <rect x="499" y="108" width="11" height="12" fill="#fff4b8" stroke="#000" strokeWidth="0.7"/>
      {/* 맥주 병 */}
      <rect x="519" y="84" width="4" height="8" fill="#3a2010" stroke="#000" strokeWidth="1"/>
      <path d="M 516,92 L 516,132 L 526,132 L 526,92 Z" fill="#80502a" stroke="#000" strokeWidth="1.3"/>
      <rect x="517" y="112" width="8" height="10" fill="#f4d080" stroke="#000" strokeWidth="0.7"/>
      {/* 계란판 (작은 언덕) */}
      <rect x="540" y="110" width="26" height="22" rx="2" fill="#d4c098" stroke="#000" strokeWidth="1.2"/>
      <ellipse cx="546" cy="112" rx="3.5" ry="2" fill="#fff" stroke="#000" strokeWidth="0.8"/>
      <ellipse cx="553" cy="111" rx="3.5" ry="2" fill="#fff" stroke="#000" strokeWidth="0.8"/>
      <ellipse cx="560" cy="110" rx="3.5" ry="2" fill="#fff" stroke="#000" strokeWidth="0.8"/>
      <path d="M 450,129 L 571,118 L 571,136 L 450,147 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,129 L 571,118" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 450,147 L 571,136" fill="none" stroke="#2A1408" strokeWidth="2" />

      
      <path d="M 448,201 L 571,193 L 571,205 L 450,213 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      {/* R-Row2: 머스타드/마요/스프라이트 */}
      <path d="M 450,213 L 571,205 L 571,203 L 450,211 Z" fill="rgba(25,10,4,0.38)"/>
      {/* 머스타드 */}
      <rect x="458" y="186" width="7" height="5" rx="1" fill="#ddbb22" stroke="#000" strokeWidth="1"/>
      <path d="M 455,191 L 455,222 L 468,222 L 468,191 Z" fill="#ffd830" stroke="#000" strokeWidth="1.3"/>
      <rect x="456" y="202" width="11" height="10" fill="#fff" stroke="#000" strokeWidth="0.7"/>
      {/* 마요네즈 */}
      <rect x="475" y="180" width="15" height="5" rx="1" fill="#4060a0" stroke="#000" strokeWidth="1"/>
      <rect x="474" y="185" width="17" height="37" rx="1" fill="#fdfaf0" stroke="#000" strokeWidth="1.3"/>
      <rect x="475" y="200" width="15" height="11" fill="#4060a0"/>
      <text x="482.5" y="207.5" fill="#fff" fontSize="5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">MAYO</text>
      {/* 스프라이트/탄산 캔 */}
      <ellipse cx="505" cy="196" rx="7.5" ry="2.2" fill="#b8e8c8" stroke="#000" strokeWidth="1"/>
      <rect x="497.5" y="196" width="15" height="30" fill="#60c080" stroke="#000" strokeWidth="1.3"/>
      <rect x="498.5" y="208" width="13" height="3" fill="#fff"/>
      {/* 작은 반찬통 (파란) */}
      <rect x="523" y="193" width="22" height="5" rx="1" fill="#3080c8" stroke="#000" strokeWidth="1"/>
      <rect x="522" y="198" width="24" height="24" fill="#70b8e0" stroke="#000" strokeWidth="1.3" opacity="0.85"/>
      {/* 작은 병 여러개 (양념) */}
      <rect x="552" y="196" width="6" height="4" rx="0.8" fill="#5a2810" stroke="#000" strokeWidth="0.8"/>
      <rect x="551" y="200" width="8" height="22" fill="#a03818" stroke="#000" strokeWidth="1"/>
      <rect x="562" y="198" width="6" height="4" rx="0.8" fill="#5a2810" stroke="#000" strokeWidth="0.8"/>
      <rect x="561" y="202" width="8" height="20" fill="#d4a830" stroke="#000" strokeWidth="1"/>      <g></g>
      <path d="M 450,213 L 571,205 L 571,230 L 450,238 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,213 L 571,205" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 450,221 L 571,213" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 450,226 L 571,218" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 450,238 L 571,230" fill="none" stroke="#2A1408" strokeWidth="2" />      
      <path d="M 448,341 L 570,339 L 570,351 L 450,353 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      {/* R-Row3: 라벨 플레이트 빈 */}
      <path d="M 450,353 L 570,351 L 570,354 L 450,356 Z" fill="rgba(25,10,4,0.38)"/>
      <rect x="450" y="358" width="105" height="14" rx="2" fill="url(#creamTopG)" stroke="#2A1408" strokeWidth="1.1"/>
      <rect x="453" y="361" width="99" height="4" fill="rgba(40,20,5,0.25)"/>
      <text x="502.5" y="369.5" fill="#2A1408" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">SAUCES</text>      <g></g>
      <path d="M 450,353 L 570,351 L 570,376 L 448,376 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,353 L 570,351" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 450,361 L 570,358" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 450,367 L 570,364" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 448,376 L 570,376" fill="none" stroke="#2A1408" strokeWidth="2" />

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
      {/* R-Freezer: 냉동피자/냉동만두 박스 */}
      <path d="M 450,578 L 555,581 L 555,583 L 450,580 Z" fill="rgba(25,10,4,0.42)"/>
      {/* 냉동피자 박스 */}
      <rect x="458" y="561" width="42" height="42" fill="#e85040" stroke="#000" strokeWidth="1.3"/>
      <rect x="460" y="563" width="38" height="16" fill="#fff4b8"/>
      <ellipse cx="479" cy="571" rx="14" ry="5" fill="#f8c898" stroke="#000" strokeWidth="0.8"/>
      <circle cx="473" cy="571" r="1.5" fill="#c04030"/>
      <circle cx="478" cy="570" r="1.5" fill="#c04030"/>
      <circle cx="484" cy="572" r="1.5" fill="#c04030"/>
      <text x="479" y="590" fill="#fff" fontSize="5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">PIZZA</text>
      {/* 냉동 아이스팝 (막대) */}
      <rect x="510" y="575" width="6" height="20" fill="#c89860" stroke="#000" strokeWidth="1"/>
      <rect x="505" y="558" width="16" height="20" rx="3" fill="#f080a0" stroke="#000" strokeWidth="1.3"/>
      <rect x="523" y="575" width="6" height="20" fill="#c89860" stroke="#000" strokeWidth="1"/>
      <rect x="518" y="562" width="16" height="16" rx="3" fill="#60c0c0" stroke="#000" strokeWidth="1.3"/>
      {/* 프로스트 하이라이트 */}
      <ellipse cx="480" cy="586" rx="18" ry="1.2" fill="rgba(220,240,255,0.45)"/>
      <path d="M 450,578 L 555,581 L 554,608 L 450,608 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 450,578 L 555,581" fill="none" stroke="#FFF4D8" strokeWidth="3.5" />
      <path d="M 450,608 L 554,608" fill="none" stroke="#2A1408" strokeWidth="2.2" />
      <path d="M 450,564 L 555,565" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1.2" />
      <path d="M 450,570 L 555,571" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 450,578 L 554,578" fill="none" stroke="#2A1408" strokeWidth="1.8" />

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

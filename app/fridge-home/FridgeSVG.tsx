'use client';

// v7 — 원근감 극단 축소 (세로바·선반·내부 패널 모든 기울기 2px)
export default function FridgeSVG() {
  return (
    <svg viewBox="-30 -5 660 670" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8855" />
          <stop offset="100%" stopColor="#e85530" />
        </linearGradient>
        <linearGradient id="bodyDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a03828" />
          <stop offset="100%" stopColor="#802018" />
        </linearGradient>
        <linearGradient id="bodyLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e87858" />
          <stop offset="100%" stopColor="#d06040" />
        </linearGradient>
        <linearGradient id="interiorG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8f4ee" />
          <stop offset="100%" stopColor="#ede6da" />
        </linearGradient>
        <linearGradient id="freezerG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0ebe4" />
          <stop offset="100%" stopColor="#e4ddd4" />
        </linearGradient>
        <linearGradient id="chromeG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0d0d0" />
          <stop offset="30%" stopColor="#f0f0f0" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e8e8e8" />
          <stop offset="100%" stopColor="#b0b0b0" />
        </linearGradient>
        <linearGradient id="creamFrontG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5E4BE" />
          <stop offset="35%" stopColor="#E8D0A0" />
          <stop offset="70%" stopColor="#C4A878" />
          <stop offset="100%" stopColor="#9A7840" />
        </linearGradient>
        <linearGradient id="creamTopG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#FAECC8" />
          <stop offset="100%" stopColor="#E8D0A0" />
        </linearGradient>
        <linearGradient id="railFrontG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8D098" />
          <stop offset="40%" stopColor="#D0B070" />
          <stop offset="75%" stopColor="#96743C" />
          <stop offset="100%" stopColor="#5A4020" />
        </linearGradient>
        <linearGradient id="railTopG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#D4B478" />
          <stop offset="100%" stopColor="#F0DCAC" />
        </linearGradient>
        <linearGradient id="railSideG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8A6838" />
          <stop offset="100%" stopColor="#3E2A12" />
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
      </defs>

      <rect x="80" y="630" width="440" height="25" rx="6" fill="url(#reflectG)" />
      <ellipse cx="300" cy="648" rx="260" ry="18" fill="url(#shadowG)" />

      {/* ====== 좌측 냉장 문 (살짝만 열림 — 가로 0.55배 축소) ====== */}
      <g transform="matrix(0.69,0,0,1,52.70000000000001,0)">
      <path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 14,2 L 2,10 L 6,396 L 16,392 Z" fill="url(#bodyDark)" />
      <path d="M 14,2 L 2,10 L 158,28 L 170,24 Z" fill="url(#bodyLight)" />
      <path d="M 28,22 L 152,36 L 152,376 L 30,376 Z" fill="url(#interiorG)" />

      {/* 세로바 (거의 수직) */}
      <path d="M 14,22 L 15,19 L 29,19 L 28,22 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 28,22 L 29,19 L 31,373 L 30,376 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
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

      {/* 선반 1 제거됨 */}
      <path d="M 29,110 L 152,120 L 150,128 L 29,118 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" opacity="0" />
      <path d="M 29,115 L 150,125 L 149,129 L 29,120 Z" fill="rgba(50,30,10,0.35)" />
      <g>
        <g transform="translate(36,98)"><path d="M 2,38 L 2,11 Q 2,8 4,6 L 4,2 L 10,2 L 10,6 Q 12,8 12,11 L 12,38 Z" fill="url(#bottleClear)" stroke="#2A1408" strokeWidth="1.4" strokeLinejoin="round" /><rect x="3.5" y="-1" width="7" height="3" fill="#4080c8" stroke="#2A1408" strokeWidth="1" /><rect x="3" y="18" width="8" height="7" fill="#b0dcf0" opacity="0.6" /><rect x="4" y="10" width="1.3" height="24" fill="rgba(255,255,255,0.85)" /></g>
        <g transform="translate(66,96)"><path d="M 2,40 L 2,11 Q 2,8 4,6 L 4,2 L 10,2 L 10,6 Q 12,8 12,11 L 12,40 Z" fill="url(#bottleAmber)" stroke="#2A1408" strokeWidth="1.4" strokeLinejoin="round" /><rect x="3.5" y="-1" width="7" height="3" fill="#5a2808" stroke="#2A1408" strokeWidth="1" /><rect x="3" y="19" width="8" height="8" fill="#fff" opacity="0.88" /><rect x="4" y="11" width="1.3" height="24" fill="rgba(255,240,180,0.5)" /></g>
        <g transform="translate(96,100)"><path d="M 2,36 L 2,10 Q 2,7 4,5 L 4,1 L 10,1 L 10,5 Q 12,7 12,10 L 12,36 Z" fill="url(#bottleGreen)" stroke="#2A1408" strokeWidth="1.4" strokeLinejoin="round" /><rect x="3.5" y="-2" width="7" height="3" fill="#1a3a10" stroke="#2A1408" strokeWidth="1" /><rect x="3" y="17" width="8" height="7" fill="#fff" opacity="0.85" /><rect x="4" y="9" width="1.3" height="22" fill="rgba(255,255,255,0.5)" /></g>
        <g transform="translate(126,102)"><path d="M 2,34 L 2,10 Q 2,7 4,5 L 4,1 L 10,1 L 10,5 Q 12,7 12,10 L 12,34 Z" fill="url(#bottlePink)" stroke="#2A1408" strokeWidth="1.4" strokeLinejoin="round" /><rect x="3.5" y="-1" width="7" height="2.5" fill="#702040" stroke="#2A1408" strokeWidth="1" /><rect x="3" y="16" width="8" height="7" fill="#fff" opacity="0.88" /></g>
      </g>
      <path d="M 29,118 L 150,128 L 150,146 L 29,136 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 29,118 L 150,128" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 29,124 L 150,133" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 29,127 L 150,136" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 29,136 L 150,146" fill="none" stroke="#2A1408" strokeWidth="2" />
      <path d="M 29,138 L 150,148" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="4" />

      {/* 선반 2 */}
      <path d="M 29,193 L 152,200 L 150,212 L 29,205 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 29,199 L 150,207 L 149,211 L 29,203 Z" fill="rgba(50,30,10,0.35)" />
      <g>
        <g transform="translate(40,158)"><path d="M 2,55 L 2,14 Q 2,11 4,9 L 4,3 L 10,3 L 10,9 Q 12,11 12,14 L 12,55 Z" fill="url(#bottleAmber)" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><rect x="3.5" y="0" width="7" height="3.5" fill="#2a1408" stroke="#2A1408" strokeWidth="1" /><rect x="2.5" y="26" width="9" height="14" fill="#f4e8b8" stroke="rgba(0,0,0,0.3)" strokeWidth="0.6" /><path d="M 3.5,30 L 10.5,30" stroke="#8a5020" strokeWidth="0.5" /><path d="M 3.5,33 L 10.5,33" stroke="#8a5020" strokeWidth="0.5" /><rect x="4" y="15" width="1.5" height="36" fill="rgba(255,240,180,0.55)" /></g>
        <g transform="translate(72,155)"><path d="M 2,57 L 2,14 Q 2,11 4,9 L 4,2 L 14,2 L 14,9 Q 16,11 16,14 L 16,57 Z" fill="url(#bottleRed)" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><rect x="3.5" y="-1" width="11" height="3.5" fill="#5a1010" stroke="#2A1408" strokeWidth="1" /><rect x="2.5" y="28" width="13" height="12" fill="#fff" opacity="0.95" /><path d="M 3.5,32 L 14.5,32" stroke="#c81818" strokeWidth="0.7" /><path d="M 3.5,35 L 14.5,35" stroke="#c81818" strokeWidth="0.5" /><rect x="4" y="16" width="1.5" height="38" fill="rgba(255,255,255,0.55)" /></g>
        <g transform="translate(114,160)"><path d="M 2,52 L 2,10 L 14,10 L 14,52 Z" fill="#f8f4e8" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><path d="M 2,10 L 8,3 L 14,10 Z" fill="#e8dfc4" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><path d="M 2,10 L 14,10" stroke="#2A1408" strokeWidth="1.2" /><rect x="3.5" y="20" width="9" height="16" fill="#98d0f0" opacity="0.7" /><path d="M 3.5,24 L 12.5,24" stroke="#2060a0" strokeWidth="0.8" /><path d="M 3.5,27 L 12.5,27" stroke="#2060a0" strokeWidth="0.5" /><path d="M 8,4 L 8,10" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" /></g>
      </g>
      <path d="M 29,205 L 150,212 L 150,237 L 29,230 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 29,205 L 150,212" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 29,213 L 150,220" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 29,218 L 150,225" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 29,230 L 150,237" fill="none" stroke="#2A1408" strokeWidth="2" />
      <path d="M 29,232 L 150,239" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="4" />

      {/* 선반 3 */}
      <path d="M 30,339 L 152,341 L 150,353 L 30,351 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 30,346 L 150,348 L 149,352 L 30,350 Z" fill="rgba(50,30,10,0.35)" />
      <g>
        <g transform="translate(42,278)"><path d="M 2,75 L 2,15 Q 2,10 5,7 L 5,0 L 11,0 L 11,7 Q 14,10 14,15 L 14,75 Z" fill="url(#bottleGreen)" stroke="#2A1408" strokeWidth="1.6" strokeLinejoin="round" /><rect x="3.5" y="-5" width="9" height="6" fill="#442010" stroke="#2A1408" strokeWidth="1" /><path d="M 4,-2 L 12,-2" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" /><rect x="2.5" y="36" width="11" height="24" fill="#f0d890" stroke="rgba(0,0,0,0.4)" strokeWidth="0.6" /><path d="M 3,42 L 13,42" stroke="#8a5020" strokeWidth="0.6" /><path d="M 3,46 L 13,46" stroke="#6a4018" strokeWidth="0.5" /><path d="M 3,54 L 13,54" stroke="#8a5020" strokeWidth="0.5" /><rect x="4" y="16" width="1.5" height="55" fill="rgba(255,255,255,0.35)" /></g>
        <g transform="translate(75,285)"><path d="M 2,68 L 2,14 Q 2,10 4,8 L 4,2 L 14,2 L 14,8 Q 16,10 16,14 L 16,68 Z" fill="url(#bottleClear)" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><rect x="3.5" y="-2" width="11" height="4" fill="#4080c8" stroke="#2A1408" strokeWidth="1" /><rect x="2.5" y="26" width="13" height="18" fill="#b8dcf0" opacity="0.7" /><path d="M 3,32 L 15,32" stroke="#2060a0" strokeWidth="0.6" /><path d="M 3,36 L 15,36" stroke="#2060a0" strokeWidth="0.4" /><rect x="4" y="16" width="1.5" height="50" fill="rgba(255,255,255,0.95)" /></g>
        <g transform="translate(117,292)"><path d="M 2,62 L 2,13 Q 2,10 4,8 L 4,2 L 12,2 L 12,8 Q 14,10 14,13 L 14,62 Z" fill="url(#bottlePurple)" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><rect x="3" y="-1" width="10" height="3.5" fill="#2a0840" stroke="#2A1408" strokeWidth="1" /><rect x="2.5" y="28" width="11" height="15" fill="#fff" opacity="0.92" /><path d="M 3,33 L 13,33" stroke="#7030a0" strokeWidth="0.6" /><path d="M 3,37 L 13,37" stroke="#7030a0" strokeWidth="0.4" /><rect x="4" y="15" width="1.5" height="44" fill="rgba(255,255,255,0.45)" /></g>
      </g>
      <path d="M 30,351 L 150,353 L 150,376 L 30,376 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 30,351 L 150,353" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 30,358 L 150,361" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 30,365 L 150,367" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 30,376 L 150,376" fill="none" stroke="#2A1408" strokeWidth="2" />

      <path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      </g>

      {/* ====== 좌측 냉동 문 — 숨김 ====== */}
      <g transform="matrix(0.69,0,0,1,52.70000000000001,0)">
      <path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 26,406 L 16,410 L 18,620 L 28,624 Z" fill="url(#bodyDark)" />
      <path d="M 26,406 L 16,410 L 158,406 L 170,402 Z" fill="url(#bodyLight)" />
      <path d="M 44,420 L 152,416 L 152,608 L 46,608 Z" fill="url(#freezerG)" />

      {/* 세로바 */}
      <path d="M 30,421 L 31,418 L 45,417 L 44,420 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 44,420 L 45,417 L 47,605 L 46,608 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 30,421 L 44,420 L 46,608 L 32,609 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 30,421 L 44,420" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <path d="M 36,425 L 38,603" fill="none" stroke="rgba(50,30,8,0.55)" strokeWidth="1.3" />
      <path d="M 37,425 L 39,603" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.7" />
      <path d="M 32,609 L 46,608" fill="none" stroke="#2A1408" strokeWidth="1.5" />

      {/* 냉동 선반 1 */}
      <path d="M 45,475 L 152,473 L 150,483 L 45,485 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 45,479 L 150,478 L 149,482 L 45,484 Z" fill="rgba(50,30,10,0.3)" />
      <g>
        <g transform="translate(52,452)"><path d="M 2,32 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,32 Z" fill="url(#bottleBlue)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#183060" stroke="#2A1408" strokeWidth="0.8" /><rect x="2.5" y="15" width="7" height="8" fill="#fff" opacity="0.9" /><rect x="3.5" y="9" width="1" height="20" fill="rgba(255,255,255,0.5)" /></g>
        <g transform="translate(80,450)"><path d="M 2,34 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,34 Z" fill="url(#bottleRed)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#501010" stroke="#2A1408" strokeWidth="0.8" /><rect x="2.5" y="15" width="7" height="9" fill="#fff" opacity="0.92" /><rect x="3.5" y="9" width="1" height="22" fill="rgba(255,255,255,0.5)" /></g>
        <g transform="translate(108,453)"><path d="M 2,31 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,31 Z" fill="url(#bottleGreen)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#153010" stroke="#2A1408" strokeWidth="0.8" /><rect x="2.5" y="15" width="7" height="8" fill="#fff" opacity="0.9" /></g>
        <g transform="translate(136,455)"><path d="M 2,29 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,29 Z" fill="url(#bottleAmber)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#5a2808" stroke="#2A1408" strokeWidth="0.8" /><rect x="2.5" y="14" width="7" height="8" fill="#f0e0a0" opacity="0.9" /></g>
      </g>
      <path d="M 45,485 L 150,483 L 150,505 L 45,505 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 45,485 L 150,483" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 45,492 L 150,490" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1.2" />
      <path d="M 45,497 L 150,495" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 45,505 L 150,505" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      {/* 냉동 선반 2 */}
      <path d="M 45,548 L 152,546 L 150,556 L 45,558 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 45,552 L 150,550 L 149,554 L 45,556 Z" fill="rgba(50,30,10,0.3)" />
      <g>
        <g transform="translate(56,525)"><path d="M 2,32 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,32 Z" fill="url(#bottlePurple)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#30104a" stroke="#2A1408" strokeWidth="0.8" /><rect x="2.5" y="15" width="7" height="8" fill="#fff" opacity="0.9" /></g>
        <g transform="translate(84,524)"><path d="M 2,34 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,34 Z" fill="url(#bottleBlue)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#183060" stroke="#2A1408" strokeWidth="0.8" /><rect x="2.5" y="15" width="7" height="9" fill="#fff" opacity="0.9" /></g>
        <g transform="translate(112,523)"><path d="M 2,35 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,35 Z" fill="url(#bottlePink)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#702040" stroke="#2A1408" strokeWidth="0.8" /><rect x="2.5" y="16" width="7" height="9" fill="#fff" opacity="0.9" /></g>
        <g transform="translate(138,528)"><path d="M 2,30 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,30 Z" fill="url(#bottleGreen)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#153010" stroke="#2A1408" strokeWidth="0.8" /></g>
      </g>
      <path d="M 45,558 L 150,556 L 150,578 L 46,578 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 45,558 L 150,556" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 45,565 L 150,563" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1.2" />
      <path d="M 45,570 L 150,568" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 46,578 L 150,578" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      </g>

      {/* ====== 본체 ====== */}
      <path d="M 434,14 L 448,6 L 448,623 L 434,629 Z" fill="url(#bodyDark)" />
      <path d="M 166,14 L 180,6 L 448,6 L 434,14 Z" fill="url(#bodyLight)" />
      <rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" />
      <rect x="166" y="14" width="3" height="615" fill="#000" />
      <rect x="431" y="14" width="3" height="615" fill="#000" />
      <rect x="166" y="14" width="268" height="3" fill="#000" />
      <rect x="166" y="626" width="268" height="3" fill="#000" />
      <rect x="170" y="16" width="260" height="3" rx="1" fill="url(#chromeG)" />
      <rect x="170" y="383" width="260" height="2" rx="0.5" fill="url(#chromeG)" />
      <rect x="170" y="398" width="260" height="2" rx="0.5" fill="url(#chromeG)" />
      <text x="300" y="622" textAnchor="middle" fill="#ffd700" fontSize="11" fontWeight="bold" letterSpacing="4" fontFamily="sans-serif" opacity="0.8">NAELUM</text>

      <rect x="176" y="26" width="248" height="359" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="178" y="28" width="244" height="355" rx="4" fill="url(#interiorG)" />
      <rect x="178" y="28" width="244" height="80" rx="4" fill="url(#lightG)" />
      {/* 추가 상단 아이템들 */}
      <g transform="translate(186,40)">
        <rect x="0" y="0" width="14" height="34" fill="url(#bottleRed)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="18" y="-3" width="12" height="37" fill="url(#bottleGreen)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="34" y="2" width="14" height="32" fill="url(#bottleBlue)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="52" y="-2" width="12" height="36" fill="url(#bottleAmber)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="68" y="0" width="14" height="34" fill="url(#bottlePink)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="86" y="-3" width="12" height="37" fill="url(#bottlePurple)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="102" y="2" width="14" height="32" fill="url(#bottleRed)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="120" y="0" width="12" height="34" fill="url(#bottleAmber)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="136" y="-2" width="14" height="36" fill="url(#bottleGreen)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="154" y="0" width="12" height="34" fill="url(#bottleBlue)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="170" y="-3" width="14" height="37" fill="url(#bottleRed)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="188" y="0" width="12" height="34" fill="url(#bottleAmber)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="204" y="-2" width="14" height="36" fill="url(#bottlePurple)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="222" y="0" width="12" height="34" fill="url(#bottlePink)" stroke="#000" strokeWidth="1.5" rx="1" />
      </g>

      <path d="M 178,114 L 188,106 L 412,106 L 422,114 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 178,114 L 422,114 L 422,132 L 178,132 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 178,114 L 422,114" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 178,120 L 422,120" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1" />
      <path d="M 178,126 L 422,126" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 178,132 L 422,132" fill="none" stroke="#2A1408" strokeWidth="1.8" />
      <path d="M 178,134 L 422,134" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="3" />

      <path d="M 178,209 L 188,201 L 412,201 L 422,209 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 178,209 L 422,209 L 422,227 L 178,227 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 178,209 L 422,209" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 178,215 L 422,215" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1" />
      <path d="M 178,221 L 422,221" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 178,227 L 422,227" fill="none" stroke="#2A1408" strokeWidth="1.8" />
      <path d="M 178,229 L 422,229" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="3" />

      <path d="M 178,304 L 188,296 L 412,296 L 422,304 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 178,304 L 422,304 L 422,322 L 178,322 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 178,304 L 422,304" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 178,310 L 422,310" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1" />
      <path d="M 178,316 L 422,316" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 178,322 L 422,322" fill="none" stroke="#2A1408" strokeWidth="1.8" />
      <path d="M 178,324 L 422,324" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="3" />

      <rect x="168" y="384" width="264" height="12" rx="1" fill="url(#bodyG)" stroke="#000" strokeWidth="1" />

      <rect x="176" y="397" width="248" height="220" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="178" y="399" width="244" height="216" rx="4" fill="url(#freezerG)" />

      {/* === 본체 상단: 음식 (밀도 높게) === */}
      {/* 1번 선반 위 */}
      <g transform="translate(186,75)">
        <rect x="0" y="0" width="13" height="32" fill="url(#bottleGreen)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="17" y="-6" width="11" height="38" fill="url(#bottleRed)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="32" y="2" width="13" height="30" fill="url(#bottleAmber)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="49" y="-2" width="11" height="34" fill="url(#bottlePurple)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="64" y="4" width="13" height="28" fill="url(#bottleBlue)" stroke="#000" strokeWidth="1.5" rx="1" />
      </g>
      <g transform="translate(280,72)">
        <rect x="0" y="3" width="40" height="32" fill="#e8c878" stroke="#000" strokeWidth="1.5" rx="2" />
        <rect x="3" y="9" width="34" height="3" fill="#8a5020" />
      </g>
      <g transform="translate(360,70)">
        <rect x="0" y="3" width="14" height="34" fill="url(#bottlePink)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="18" y="0" width="12" height="38" fill="url(#bottleGreen)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="34" y="5" width="14" height="32" fill="url(#bottleAmber)" stroke="#000" strokeWidth="1.5" rx="1" />
      </g>

      {/* 2번 선반 위 */}
      <g transform="translate(190,170)">
        <rect x="0" y="0" width="13" height="32" fill="url(#bottlePurple)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="17" y="-2" width="13" height="34" fill="url(#bottleAmber)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="34" y="2" width="11" height="30" fill="url(#bottleRed)" stroke="#000" strokeWidth="1.5" rx="1" />
      </g>
      <g transform="translate(252,168)">
        <rect x="0" y="0" width="48" height="34" fill="#e8c878" stroke="#000" strokeWidth="1.6" rx="2" />
        <rect x="3" y="6" width="42" height="3" fill="#8a5020" />
        <rect x="3" y="13" width="42" height="2" fill="#a06020" />
      </g>
      <g transform="translate(312,168)">
        <ellipse cx="22" cy="18" rx="24" ry="14" fill="#5db84a" stroke="#000" strokeWidth="1.6" />
        <path d="M -2,18 Q 22,4 46,18" fill="none" stroke="#1a5010" strokeWidth="1.2" />
        <path d="M -2,18 Q 22,32 46,18" fill="none" stroke="#1a5010" strokeWidth="1.2" />
      </g>
      <g transform="translate(370,170)">
        <rect x="0" y="0" width="13" height="32" fill="url(#bottleGreen)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="17" y="-3" width="11" height="35" fill="url(#bottleBlue)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="32" y="0" width="13" height="32" fill="url(#bottlePink)" stroke="#000" strokeWidth="1.5" rx="1" />
      </g>

      {/* 3번 선반 위 */}
      <g transform="translate(186,265)">
        <rect x="0" y="0" width="13" height="32" fill="url(#bottleAmber)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="17" y="-3" width="13" height="35" fill="url(#bottleRed)" stroke="#000" strokeWidth="1.5" rx="1" />
      </g>
      <g transform="translate(225,272)">
        <ellipse cx="20" cy="14" rx="22" ry="11" fill="#c5732a" stroke="#000" strokeWidth="1.6" />
        <ellipse cx="18" cy="10" rx="14" ry="3" fill="rgba(255,220,160,0.5)" />
      </g>
      <g transform="translate(280,265)">
        <rect x="0" y="0" width="34" height="32" fill="#ffe8a0" stroke="#000" strokeWidth="1.5" rx="2" />
        <rect x="3" y="6" width="28" height="3" fill="#a06020" />
      </g>
      <g transform="translate(326,272)">
        <ellipse cx="20" cy="14" rx="22" ry="11" fill="#5db4d8" stroke="#000" strokeWidth="1.6" />
        <path d="M 42,14 L 50,8 L 50,20 Z" fill="#5db4d8" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="10" cy="11" r="1.5" fill="#000" />
      </g>
      <g transform="translate(380,265)">
        <rect x="0" y="0" width="13" height="32" fill="url(#bottlePurple)" stroke="#000" strokeWidth="1.5" rx="1" />
        <rect x="17" y="-2" width="13" height="34" fill="url(#bottleGreen)" stroke="#000" strokeWidth="1.5" rx="1" />
      </g>

      {/* === 본체 하단(냉동): 음식 — 중앙 배치 === */}
      <g transform="translate(220,485)">
        <ellipse cx="20" cy="14" rx="22" ry="10" fill="#5db4d8" stroke="#000" strokeWidth="1.8" />
        <path d="M 42,14 L 54,5 L 54,23 Z" fill="#5db4d8" stroke="#000" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="10" cy="11" r="2" fill="#000" />
        <path d="M 5,16 Q 14,20 22,16" fill="none" stroke="#000" strokeWidth="1" />
      </g>
      <g transform="translate(310,480)">
        <ellipse cx="35" cy="20" rx="40" ry="16" fill="#c5732a" stroke="#000" strokeWidth="1.8" />
        <ellipse cx="32" cy="13" rx="28" ry="5" fill="rgba(255,220,160,0.55)" />
      </g>
      <g transform="translate(260,575)">
        <path d="M 0,32 Q 0,2 42,2 Q 84,2 84,32 Z" fill="#d8893a" stroke="#000" strokeWidth="1.8" strokeLinejoin="round" />
        <ellipse cx="40" cy="14" rx="32" ry="6" fill="rgba(255,230,180,0.45)" />
        <circle cx="20" cy="22" r="1.8" fill="#000" opacity="0.5" />
        <circle cx="40" cy="20" r="1.6" fill="#000" opacity="0.5" />
        <circle cx="60" cy="22" r="1.8" fill="#000" opacity="0.5" />
      </g>

      {/* 본체 하단 가로 선반 2개 (드로어 스타일) */}
      <rect x="180" y="468" width="240" height="8" fill="url(#creamFrontG)" stroke="#000" strokeWidth="1.6" rx="1" />
      <rect x="180" y="552" width="240" height="8" fill="url(#creamFrontG)" stroke="#000" strokeWidth="1.6" rx="1" />

      {/* ====== 우측 냉장 문 (살짝만 열림 — 가로 0.55배 축소) ====== */}
      <g transform="matrix(0.69,0,0,1,133.3,0)">
      <path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 586,2 L 598,10 L 594,396 L 584,392 Z" fill="url(#bodyDark)" />
      <path d="M 430,24 L 442,28 L 586,2 L 598,10 Z" fill="url(#bodyLight)" />
      <path d="M 448,37 L 572,22 L 570,376 L 448,376 Z" fill="url(#interiorG)" />

      {/* 세로바 */}
      <path d="M 572,22 L 571,19 L 585,19 L 586,22 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 572,22 L 571,19 L 569,373 L 570,376 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 572,22 L 586,22 L 584,376 L 570,376 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 572,22 L 586,22" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 578,27 L 576,371" fill="none" stroke="rgba(50,30,8,0.55)" strokeWidth="1.3" />
      <path d="M 579.2,27 L 577.2,371" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.7" />
      <path d="M 570,376 L 584,376" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      {/* 우 냉장 선반 1 */}
      <path d="M 448,121 L 571,110 L 571,118 L 450,129 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 449,125 L 571,115 L 571,119 L 449,129 Z" fill="rgba(50,30,10,0.35)" />
      <g>
        <g transform="translate(462,98)"><path d="M 2,38 L 2,11 Q 2,8 4,6 L 4,2 L 10,2 L 10,6 Q 12,8 12,11 L 12,38 Z" fill="url(#bottleGreen)" stroke="#2A1408" strokeWidth="1.4" strokeLinejoin="round" /><rect x="3.5" y="-1" width="7" height="3" fill="#1a3a10" stroke="#2A1408" strokeWidth="1" /><rect x="3" y="18" width="8" height="7" fill="#fff" opacity="0.88" /><rect x="4" y="10" width="1.3" height="24" fill="rgba(255,255,255,0.5)" /></g>
        <g transform="translate(492,96)"><path d="M 2,40 L 2,11 Q 2,8 4,6 L 4,2 L 10,2 L 10,6 Q 12,8 12,11 L 12,40 Z" fill="url(#bottleBlue)" stroke="#2A1408" strokeWidth="1.4" strokeLinejoin="round" /><rect x="3.5" y="-1" width="7" height="3" fill="#1a3060" stroke="#2A1408" strokeWidth="1" /><rect x="3" y="19" width="8" height="8" fill="#fff" opacity="0.9" /><rect x="4" y="11" width="1.3" height="24" fill="rgba(255,255,255,0.5)" /></g>
        <g transform="translate(522,100)"><path d="M 2,36 L 2,10 Q 2,7 4,5 L 4,1 L 10,1 L 10,5 Q 12,7 12,10 L 12,36 Z" fill="url(#bottleRed)" stroke="#2A1408" strokeWidth="1.4" strokeLinejoin="round" /><rect x="3.5" y="-2" width="7" height="3" fill="#601010" stroke="#2A1408" strokeWidth="1" /><rect x="3" y="17" width="8" height="7" fill="#fff" opacity="0.9" /><rect x="4" y="9" width="1.3" height="22" fill="rgba(255,255,255,0.5)" /></g>
        <g transform="translate(552,102)"><path d="M 2,34 L 2,10 Q 2,7 4,5 L 4,1 L 10,1 L 10,5 Q 12,7 12,10 L 12,34 Z" fill="url(#bottleAmber)" stroke="#2A1408" strokeWidth="1.4" strokeLinejoin="round" /><rect x="3.5" y="-1" width="7" height="2.5" fill="#5a2808" stroke="#2A1408" strokeWidth="1" /><rect x="3" y="16" width="8" height="7" fill="#f0e0a0" opacity="0.9" /></g>
      </g>
      <path d="M 450,129 L 571,118 L 571,136 L 450,147 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,129 L 571,118" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 450,135 L 571,124" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 450,139 L 571,128" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 450,147 L 571,136" fill="none" stroke="#2A1408" strokeWidth="2" />
      <path d="M 450,149 L 571,138" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="4" />

      {/* 우 냉장 선반 2 */}
      <path d="M 448,201 L 571,193 L 571,205 L 450,213 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 449,206 L 571,199 L 571,203 L 449,210 Z" fill="rgba(50,30,10,0.35)" />
      <g>
        <g transform="translate(462,155)"><path d="M 2,55 L 2,15 Q 2,10 5,7 L 5,0 L 11,0 L 11,7 Q 14,10 14,15 L 14,55 Z" fill="url(#bottlePurple)" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><rect x="3.5" y="-5" width="9" height="6" fill="#301040" stroke="#2A1408" strokeWidth="1" /><rect x="2.5" y="28" width="11" height="15" fill="#f0d890" stroke="rgba(0,0,0,0.4)" strokeWidth="0.6" /><path d="M 3,33 L 13,33" stroke="#7030a0" strokeWidth="0.6" /><rect x="4" y="16" width="1.5" height="38" fill="rgba(255,255,255,0.4)" /></g>
        <g transform="translate(494,158)"><path d="M 2,53 L 2,14 Q 2,11 4,9 L 4,3 L 10,3 L 10,9 Q 12,11 12,14 L 12,53 Z" fill="url(#bottleAmber)" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><rect x="3.5" y="0" width="7" height="3.5" fill="#2a1408" stroke="#2A1408" strokeWidth="1" /><rect x="2.5" y="26" width="9" height="14" fill="#f4e8b8" stroke="rgba(0,0,0,0.3)" strokeWidth="0.6" /><path d="M 3.5,30 L 10.5,30" stroke="#8a5020" strokeWidth="0.5" /><rect x="4" y="15" width="1.5" height="34" fill="rgba(255,240,180,0.55)" /></g>
        <g transform="translate(524,156)"><path d="M 2,55 L 2,14 Q 2,11 4,9 L 4,2 L 12,2 L 12,9 Q 14,11 14,14 L 14,55 Z" fill="url(#bottleRed)" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><rect x="3.5" y="-1" width="9" height="3.5" fill="#5a1010" stroke="#2A1408" strokeWidth="1" /><rect x="2.5" y="26" width="11" height="12" fill="#fff" opacity="0.95" /><path d="M 3,30 L 13,30" stroke="#c81818" strokeWidth="0.7" /><rect x="4" y="16" width="1.5" height="36" fill="rgba(255,255,255,0.55)" /></g>
        <g transform="translate(552,162)"><path d="M 2,50 L 2,10 L 12,10 L 12,50 Z" fill="#f8f4e8" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><path d="M 2,10 L 7,3 L 12,10 Z" fill="#e8dfc4" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><rect x="3.5" y="20" width="7" height="16" fill="#98d0f0" opacity="0.7" /><path d="M 3.5,24 L 10.5,24" stroke="#2060a0" strokeWidth="0.7" /></g>
      </g>
      <path d="M 450,213 L 571,205 L 571,230 L 450,238 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,213 L 571,205" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 450,221 L 571,213" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 450,226 L 571,218" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 450,238 L 571,230" fill="none" stroke="#2A1408" strokeWidth="2" />
      <path d="M 450,240 L 571,232" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="4" />

      {/* 우 냉장 선반 3 */}
      <path d="M 448,341 L 570,339 L 570,351 L 450,353 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 449,346 L 570,345 L 570,349 L 449,350 Z" fill="rgba(50,30,10,0.35)" />
      <g>
        <g transform="translate(462,278)"><path d="M 2,72 L 2,15 Q 2,10 4,8 L 4,2 L 14,2 L 14,8 Q 16,10 16,15 L 16,72 Z" fill="url(#bottleClear)" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><rect x="3.5" y="-2" width="11" height="4" fill="#4080c8" stroke="#2A1408" strokeWidth="1" /><rect x="2.5" y="28" width="13" height="18" fill="#b8dcf0" opacity="0.7" /><path d="M 3,34 L 15,34" stroke="#2060a0" strokeWidth="0.6" /><rect x="4" y="16" width="1.5" height="54" fill="rgba(255,255,255,0.95)" /></g>
        <g transform="translate(498,275)"><path d="M 2,75 L 2,15 Q 2,10 5,7 L 5,0 L 11,0 L 11,7 Q 14,10 14,15 L 14,75 Z" fill="url(#bottleGreen)" stroke="#2A1408" strokeWidth="1.6" strokeLinejoin="round" /><rect x="3.5" y="-5" width="9" height="6" fill="#442010" stroke="#2A1408" strokeWidth="1" /><rect x="2.5" y="36" width="11" height="24" fill="#f0d890" stroke="rgba(0,0,0,0.4)" strokeWidth="0.6" /><path d="M 3,42 L 13,42" stroke="#8a5020" strokeWidth="0.6" /><path d="M 3,46 L 13,46" stroke="#6a4018" strokeWidth="0.5" /><rect x="4" y="16" width="1.5" height="55" fill="rgba(255,255,255,0.35)" /></g>
        <g transform="translate(532,285)"><path d="M 2,60 L 2,10 L 16,10 L 16,60 Z" fill="#f8f4e8" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><path d="M 2,10 L 9,3 L 16,10 Z" fill="#e8dfc4" stroke="#2A1408" strokeWidth="1.5" strokeLinejoin="round" /><rect x="4" y="22" width="10" height="20" fill="#98d0f0" opacity="0.7" /><path d="M 3.5,28 L 14.5,28" stroke="#2060a0" strokeWidth="0.8" /><path d="M 3.5,33 L 14.5,33" stroke="#2060a0" strokeWidth="0.5" /><path d="M 9,4 L 9,10" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" /></g>
      </g>
      <path d="M 450,353 L 570,351 L 570,376 L 448,376 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,353 L 570,351" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 450,361 L 570,358" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 450,367 L 570,364" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 448,376 L 570,376" fill="none" stroke="#2A1408" strokeWidth="2" />

      <path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      </g>

      {/* ====== 우측 냉동 문 ====== */}
      <g transform="matrix(0.69,0,0,1,133.3,0)">
      <path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 574,406 L 584,410 L 582,620 L 572,624 Z" fill="url(#bodyDark)" />
      <path d="M 430,402 L 442,406 L 574,406 L 584,410 Z" fill="url(#bodyLight)" />
      <path d="M 448,416 L 556,422 L 554,608 L 448,604 Z" fill="url(#freezerG)" />

      <path d="M 556,422 L 555,419 L 569,420 L 570,423 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 556,422 L 555,419 L 553,605 L 554,608 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 556,422 L 570,423 L 568,609 L 554,608 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 556,422 L 570,423" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <path d="M 562,426 L 560,603" fill="none" stroke="rgba(50,30,8,0.55)" strokeWidth="1.3" />
      <path d="M 563.2,426 L 561.2,603" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.7" />
      <path d="M 554,608 L 568,609" fill="none" stroke="#2A1408" strokeWidth="1.5" />

      <path d="M 448,474 L 555,475 L 555,485 L 450,484 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 449,479 L 555,479 L 555,482 L 449,483 Z" fill="rgba(50,30,10,0.3)" />
      <g>
        <g transform="translate(452,452)"><path d="M 2,32 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,32 Z" fill="url(#bottleAmber)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#5a2808" stroke="#2A1408" strokeWidth="0.8" /><rect x="2.5" y="15" width="7" height="8" fill="#f0e0a0" opacity="0.9" /></g>
        <g transform="translate(480,450)"><path d="M 2,34 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,34 Z" fill="url(#bottleGreen)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#153010" stroke="#2A1408" strokeWidth="0.8" /><rect x="2.5" y="15" width="7" height="9" fill="#fff" opacity="0.9" /></g>
        <g transform="translate(508,453)"><path d="M 2,31 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,31 Z" fill="url(#bottleBlue)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#183060" stroke="#2A1408" strokeWidth="0.8" /><rect x="2.5" y="15" width="7" height="8" fill="#fff" opacity="0.9" /></g>
        <g transform="translate(536,455)"><path d="M 2,29 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,29 Z" fill="url(#bottleRed)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#501010" stroke="#2A1408" strokeWidth="0.8" /></g>
      </g>
      <path d="M 450,484 L 555,485 L 554,505 L 450,505 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,484 L 555,485" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 450,491 L 555,492" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1.2" />
      <path d="M 450,497 L 555,498" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 450,505 L 554,505" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <path d="M 448,547 L 555,548 L 555,558 L 450,557 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 449,552 L 555,552 L 555,555 L 449,556 Z" fill="rgba(50,30,10,0.3)" />
      <g>
        <g transform="translate(454,525)"><path d="M 2,32 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,32 Z" fill="url(#bottlePink)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#702040" stroke="#2A1408" strokeWidth="0.8" /><rect x="2.5" y="15" width="7" height="8" fill="#fff" opacity="0.9" /></g>
        <g transform="translate(482,524)"><path d="M 2,34 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,34 Z" fill="url(#bottlePurple)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#30104a" stroke="#2A1408" strokeWidth="0.8" /><rect x="2.5" y="15" width="7" height="9" fill="#fff" opacity="0.9" /></g>
        <g transform="translate(510,523)"><path d="M 2,35 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,35 Z" fill="url(#bottleRed)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#501010" stroke="#2A1408" strokeWidth="0.8" /></g>
        <g transform="translate(538,528)"><path d="M 2,30 L 2,10 Q 2,7 4,5 L 4,1 L 8,1 L 8,5 Q 10,7 10,10 L 10,30 Z" fill="url(#bottleGreen)" stroke="#2A1408" strokeWidth="1.3" strokeLinejoin="round" /><rect x="3" y="-1" width="6" height="2.5" fill="#153010" stroke="#2A1408" strokeWidth="0.8" /></g>
      </g>
      <path d="M 450,557 L 555,558 L 554,578 L 450,578 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,557 L 555,558" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 450,564 L 555,565" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1.2" />
      <path d="M 450,570 L 555,571" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 450,578 L 554,578" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      </g>

      {/* 큰 손잡이 4개 */}
      <rect x="44" y="180" width="8" height="60" rx="4" fill="#2a1004" stroke="#000" strokeWidth="1" />
      <rect x="44" y="490" width="8" height="60" rx="4" fill="#2a1004" stroke="#000" strokeWidth="1" />
      <rect x="548" y="180" width="8" height="60" rx="4" fill="#2a1004" stroke="#000" strokeWidth="1" />
      <rect x="548" y="490" width="8" height="60" rx="4" fill="#2a1004" stroke="#000" strokeWidth="1" />
      <rect x="168" y="624" width="264" height="10" rx="2" fill="url(#bodyDark)" stroke="#000" strokeWidth="0.5" />
      <path d="M 185,629 L 185,641 L 203,641 L 203,629 Z" fill="#7a2818" />
      <path d="M 185,629 L 190,626 L 208,626 L 203,629 Z" fill="#a04030" />
      <path d="M 203,629 L 208,626 L 208,638 L 203,641 Z" fill="#602018" />
      <path d="M 397,629 L 397,641 L 415,641 L 415,629 Z" fill="#7a2818" />
      <path d="M 397,629 L 402,626 L 420,626 L 415,629 Z" fill="#a04030" />
      <path d="M 415,629 L 420,626 L 420,638 L 415,641 Z" fill="#602018" />
    
      {/* 3D basic: cast shadow on body interior near hinges */}
      <ellipse cx="180" cy="200" rx="40" ry="180" fill="url(#castShadow)" opacity="0.5" />
      <ellipse cx="420" cy="200" rx="40" ry="180" fill="url(#castShadow)" opacity="0.5" />
      <ellipse cx="180" cy="500" rx="35" ry="100" fill="url(#castShadow)" opacity="0.5" />
      <ellipse cx="420" cy="500" rx="35" ry="100" fill="url(#castShadow)" opacity="0.5" />
    </svg>
  );
}

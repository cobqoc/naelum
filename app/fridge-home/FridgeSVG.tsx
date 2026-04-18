'use client';

// v7 — 원근감 극단 축소 (세로바·선반·내부 패널 모든 기울기 2px)
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
          <stop offset="0%" stopColor="#eef6ff" />
          <stop offset="100%" stopColor="#cee0ee" />
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
      <path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="8" strokeLinejoin="round" />
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
      </g>
      <path d="M 30,351 L 150,353 L 150,376 L 30,376 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 30,351 L 150,353" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 30,358 L 150,361" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 30,365 L 150,367" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 30,376 L 150,376" fill="none" stroke="#2A1408" strokeWidth="2" />

      <path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="none" stroke="rgba(40,40,40,0.5)" strokeWidth="6" strokeLinejoin="round" />
      </g>

      {/* ====== 좌측 냉동 문 — 숨김 ====== */}
      <g transform="matrix(0.69,0,0,1,52.70000000000001,0)">
      <path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="8" strokeLinejoin="round" />
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
      </g>
      <path d="M 45,558 L 150,556 L 150,578 L 46,578 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 45,558 L 150,556" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 45,565 L 150,563" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1.2" />
      <path d="M 45,570 L 150,568" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 46,578 L 150,578" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="none" stroke="rgba(40,40,40,0.5)" strokeWidth="6" strokeLinejoin="round" />
      </g>

      {/* ====== 본체 ====== */}
      <path d="M 434,14 L 448,6 L 448,623 L 434,629 Z" fill="url(#bodyDark)" />
      <path d="M 166,14 L 180,6 L 448,6 L 434,14 Z" fill="url(#bodyLight)" />
      <rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" />
      <rect x="166" y="14" width="2" height="615" fill="#000" />
      <rect x="432" y="14" width="2" height="615" fill="#000" />
      <rect x="166" y="14" width="268" height="2" fill="#000" />
      <rect x="166" y="627" width="268" height="2" fill="#000" />
      <rect x="170" y="16" width="260" height="3" rx="1" fill="url(#chromeG)" />
      <rect x="170" y="383" width="260" height="2" rx="0.5" fill="url(#chromeG)" />
      <rect x="170" y="398" width="260" height="2" rx="0.5" fill="url(#chromeG)" />
      <text x="300" y="622" textAnchor="middle" fill="#ffd700" fontSize="11" fontWeight="bold" letterSpacing="4" fontFamily="sans-serif" opacity="0.8">NAELUM</text>

      <rect x="176" y="26" width="248" height="359" rx="6" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="2.8" strokeLinejoin="round" />
      <rect x="178" y="28" width="244" height="355" rx="4" fill="url(#interiorG)" />
      <rect x="178" y="28" width="244" height="80" rx="4" fill="url(#lightG)" />
      {/* 추가 상단 아이템들 */}

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

      <rect x="168" y="384" width="264" height="12" rx="1" fill="url(#bodyG)" stroke="#000" strokeWidth="1" />

      <rect x="176" y="397" width="248" height="220" rx="6" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="2.8" strokeLinejoin="round" />
      <rect x="178" y="399" width="244" height="216" rx="4" fill="url(#freezerG)" />

      {/* === 본체 상단: 음식 (밀도 높게) === */}
      {/* 1번 선반 위 */}

      {/* 2번 선반 위 */}

      {/* 3번 선반 위 */}

      {/* === 본체 하단(냉동): 음식 — 중앙 배치 === */}

      {/* 본체 하단 가로 선반 2개 (드로어 스타일) */}
      <rect x="180" y="468" width="240" height="8" fill="url(#creamFrontG)" stroke="#000" strokeWidth="1.6" rx="1" />
      <rect x="180" y="552" width="240" height="8" fill="url(#creamFrontG)" stroke="#000" strokeWidth="1.6" rx="1" />

      {/* ====== 우측 냉장 문 (살짝만 열림 — 가로 0.55배 축소) ====== */}
      <g transform="matrix(0.69,0,0,1,133.3,0)">
      <path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="8" strokeLinejoin="round" />
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
      </g>
      <path d="M 450,353 L 570,351 L 570,376 L 448,376 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,353 L 570,351" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 450,361 L 570,358" fill="none" stroke="rgba(80,50,15,0.45)" strokeWidth="1.2" />
      <path d="M 450,367 L 570,364" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 448,376 L 570,376" fill="none" stroke="#2A1408" strokeWidth="2" />

      <path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="none" stroke="rgba(40,40,40,0.5)" strokeWidth="6" strokeLinejoin="round" />
      </g>

      {/* ====== 우측 냉동 문 ====== */}
      <g transform="matrix(0.69,0,0,1,133.3,0)">
      <path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="8" strokeLinejoin="round" />
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
      </g>
      <path d="M 450,484 L 555,485 L 554,505 L 450,505 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,484 L 555,485" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 450,491 L 555,492" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1.2" />
      <path d="M 450,497 L 555,498" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 450,505 L 554,505" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <path d="M 448,547 L 555,548 L 555,558 L 450,557 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 449,552 L 555,552 L 555,555 L 449,556 Z" fill="rgba(50,30,10,0.3)" />
      <g>
      </g>
      <path d="M 450,557 L 555,558 L 554,578 L 450,578 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,557 L 555,558" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 450,564 L 555,565" fill="none" stroke="rgba(80,50,15,0.4)" strokeWidth="1.2" />
      <path d="M 450,570 L 555,571" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 450,578 L 554,578" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="none" stroke="rgba(40,40,40,0.5)" strokeWidth="6" strokeLinejoin="round" />
      </g>

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

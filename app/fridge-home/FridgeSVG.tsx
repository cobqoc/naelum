'use client';

export default function FridgeSVG() {
  return (
    <svg viewBox="-30 -5 660 670" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d45a3a" />
          <stop offset="100%" stopColor="#b8442e" />
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
        <linearGradient id="glassShelf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(200,210,220,0.35)" />
          <stop offset="50%" stopColor="rgba(200,210,220,0.1)" />
          <stop offset="100%" stopColor="rgba(200,210,220,0.25)" />
        </linearGradient>
        {/* 크롬 트림 */}
        <linearGradient id="chromeG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0d0d0" />
          <stop offset="30%" stopColor="#f0f0f0" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e8e8e8" />
          <stop offset="100%" stopColor="#b0b0b0" />
        </linearGradient>
        <radialGradient id="lightG" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="rgba(255,250,220,0.4)" />
          <stop offset="100%" stopColor="rgba(255,250,220,0)" />
        </radialGradient>
        <radialGradient id="shadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <linearGradient id="reflectG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(180,80,50,0.1)" />
          <stop offset="100%" stopColor="rgba(180,80,50,0)" />
        </linearGradient>
      </defs>

      {/* 바닥 반사 + 그림자 */}
      <rect x="80" y="630" width="440" height="25" rx="6" fill="url(#reflectG)" />
      <ellipse cx="300" cy="648" rx="260" ry="18" fill="url(#shadowG)" />

      {/* ====== 좌측 냉장 문 (살짝 원근) ====== */}
      <path d="M 170,20 L 20,10 L 24,392 L 170,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 20,10 L 8,16 L 14,388 L 24,392 Z" fill="url(#bodyDark)" />
      <path d="M 20,10 L 8,16 L 158,24 L 170,20 Z" fill="url(#bodyLight)" />
      {/* 내부 패널 */}
      <path d="M 36,24 L 156,30 L 156,378 L 38,378 Z" fill="url(#interiorG)" />
      {/* 인셋 라인 */}
      <path d="M 36,24 L 156,30 L 156,378 L 38,378 Z" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      {/* 고무 패킹 */}
      <path d="M 170,20 L 20,10 L 24,392 L 170,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      {/* 유리 선반 */}
      <path d="M 40,118 L 152,122 L 152,125 L 42,121 Z" fill="url(#glassShelf)" />
      <path d="M 42,121 L 152,125 L 152,126 L 44,122 Z" fill="rgba(255,255,255,0.25)" />
      <path d="M 40,210 L 152,213 L 152,216 L 42,213 Z" fill="url(#glassShelf)" />
      <path d="M 42,213 L 152,216 L 152,217 L 44,214 Z" fill="rgba(255,255,255,0.25)" />
      <path d="M 40,298 L 152,300 L 152,303 L 42,301 Z" fill="url(#glassShelf)" />
      <path d="M 42,301 L 152,303 L 152,304 L 44,302 Z" fill="rgba(255,255,255,0.25)" />

      {/* ====== 좌측 냉동 문 (살짝 원근) ====== */}
      <path d="M 170,402 L 24,400 L 30,624 L 170,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 24,400 L 12,406 L 20,620 L 30,624 Z" fill="url(#bodyDark)" />
      <path d="M 24,400 L 12,406 L 158,406 L 170,402 Z" fill="url(#bodyLight)" />
      <path d="M 40,414 L 156,412 L 156,610 L 44,610 Z" fill="url(#freezerG)" />
      {/* 인셋 라인 */}
      <path d="M 40,414 L 156,412 L 156,610 L 44,610 Z" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      {/* 고무 패킹 */}
      <path d="M 170,402 L 24,400 L 30,624 L 170,622 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      {/* 유리 선반 */}
      <path d="M 44,515 L 152,513 L 152,516 L 46,518 Z" fill="url(#glassShelf)" />
      <path d="M 46,518 L 152,516 L 152,517 L 48,519 Z" fill="rgba(255,255,255,0.25)" />

      {/* ====== 냉장고 본체 ====== */}
      {/* 우측면 */}
      <path d="M 434,14 L 448,6 L 448,623 L 434,629 Z" fill="url(#bodyDark)" />
      {/* 상단면 */}
      <path d="M 166,14 L 180,6 L 448,6 L 434,14 Z" fill="url(#bodyLight)" />
      {/* 정면 */}
      <rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="3" />

      {/* 크롬 트림 (본체 상단) */}
      <rect x="170" y="16" width="260" height="3" rx="1" fill="url(#chromeG)" />
      {/* 크롬 트림 (냉장/냉동 구분 위아래) */}
      <rect x="170" y="383" width="260" height="2" rx="0.5" fill="url(#chromeG)" />
      <rect x="170" y="398" width="260" height="2" rx="0.5" fill="url(#chromeG)" />


      {/* 브랜드 */}
      <text x="300" y="622" textAnchor="middle" fill="#ffd700" fontSize="11" fontWeight="bold" letterSpacing="4" fontFamily="sans-serif" opacity="0.8">NAELUM</text>

      {/* ====== 내부 — 냉장 ====== */}
      {/* 인셋 (본체 프레임→내부 경계) */}
      <rect x="176" y="26" width="248" height="359" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="178" y="28" width="244" height="355" rx="4" fill="url(#interiorG)" />
      <rect x="178" y="28" width="244" height="80" rx="4" fill="url(#lightG)" />
      {/* 유리 선반 */}
      <rect x="182" y="118" width="236" height="4" rx="2" fill="url(#glassShelf)" />
      <rect x="182" y="122" width="236" height="1" fill="rgba(255,255,255,0.3)" />
      <rect x="182" y="215" width="236" height="4" rx="2" fill="url(#glassShelf)" />
      <rect x="182" y="219" width="236" height="1" fill="rgba(255,255,255,0.3)" />
      <rect x="182" y="300" width="236" height="4" rx="2" fill="url(#glassShelf)" />
      <rect x="182" y="304" width="236" height="1" fill="rgba(255,255,255,0.3)" />

      {/* 냉장/냉동 구분 */}
      <rect x="168" y="384" width="264" height="12" rx="1" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="1" />

      {/* ====== 내부 — 냉동 ====== */}
      <rect x="176" y="393" width="248" height="224" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="178" y="395" width="244" height="220" rx="4" fill="url(#freezerG)" />
      <rect x="182" y="505" width="236" height="4" rx="2" fill="url(#glassShelf)" />
      <rect x="182" y="509" width="236" height="1" fill="rgba(255,255,255,0.3)" />

      {/* ====== 우측 냉장 문 (살짝 원근) ====== */}
      <path d="M 430,20 L 580,10 L 576,392 L 430,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 580,10 L 592,16 L 586,388 L 576,392 Z" fill="url(#bodyDark)" />
      <path d="M 430,20 L 442,24 L 592,16 L 580,10 Z" fill="url(#bodyLight)" />
      <path d="M 444,30 L 564,24 L 562,378 L 444,378 Z" fill="url(#interiorG)" />
      {/* 인셋 라인 */}
      <path d="M 444,30 L 564,24 L 562,378 L 444,378 Z" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      {/* 고무 패킹 */}
      <path d="M 430,20 L 580,10 L 576,392 L 430,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      {/* 유리 선반 */}
      <path d="M 448,122 L 558,118 L 558,121 L 448,125 Z" fill="url(#glassShelf)" />
      <path d="M 448,125 L 558,121 L 558,122 L 448,126 Z" fill="rgba(255,255,255,0.25)" />
      <path d="M 448,213 L 558,210 L 558,213 L 448,216 Z" fill="url(#glassShelf)" />
      <path d="M 448,216 L 558,213 L 558,214 L 448,217 Z" fill="rgba(255,255,255,0.25)" />
      <path d="M 448,300 L 558,298 L 558,301 L 448,303 Z" fill="url(#glassShelf)" />
      <path d="M 448,303 L 558,301 L 558,302 L 448,304 Z" fill="rgba(255,255,255,0.25)" />

      {/* ====== 우측 냉동 문 (살짝 원근) ====== */}
      <path d="M 430,402 L 576,400 L 570,624 L 430,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 576,400 L 588,406 L 580,620 L 570,624 Z" fill="url(#bodyDark)" />
      <path d="M 430,402 L 442,406 L 588,406 L 576,400 Z" fill="url(#bodyLight)" />
      <path d="M 444,412 L 562,416 L 556,610 L 444,608 Z" fill="url(#freezerG)" />
      {/* 인셋 라인 */}
      <path d="M 444,412 L 562,416 L 556,610 L 444,608 Z" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      {/* 고무 패킹 */}
      <path d="M 430,402 L 576,400 L 570,624 L 430,622 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      {/* 유리 선반 */}
      <path d="M 448,515 L 552,513 L 552,516 L 448,518 Z" fill="url(#glassShelf)" />
      <path d="M 448,518 L 552,516 L 552,517 L 448,519 Z" fill="rgba(255,255,255,0.25)" />

      {/* 킥플레이트 */}
      <rect x="168" y="624" width="264" height="10" rx="2" fill="url(#bodyDark)" stroke="#8a3020" strokeWidth="0.5" />

      {/* 다리 (3D) */}
      <path d="M 185,629 L 185,641 L 203,641 L 203,629 Z" fill="#7a2818" />
      <path d="M 185,629 L 190,626 L 208,626 L 203,629 Z" fill="#a04030" />
      <path d="M 203,629 L 208,626 L 208,638 L 203,641 Z" fill="#602018" />
      <path d="M 397,629 L 397,641 L 415,641 L 415,629 Z" fill="#7a2818" />
      <path d="M 397,629 L 402,626 L 420,626 L 415,629 Z" fill="#a04030" />
      <path d="M 415,629 L 420,626 L 420,638 L 415,641 Z" fill="#602018" />
    </svg>
  );
}

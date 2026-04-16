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
        <linearGradient id="handleG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#aaa" />
          <stop offset="20%" stopColor="#ddd" />
          <stop offset="40%" stopColor="#f5f5f5" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f5f5f5" />
          <stop offset="80%" stopColor="#ddd" />
          <stop offset="100%" stopColor="#999" />
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
        <radialGradient id="frostG" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="rgba(200,230,255,0)" />
          <stop offset="100%" stopColor="rgba(200,230,255,0.2)" />
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

      {/* ====== 좌측 냉장 문 (극적 V자) ====== */}
      {/* 문 정면 — 위가 넓고 아래가 좁아짐 (원근) */}
      <path d="M 170,24 L -10,0 L 10,392 L 170,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" />
      {/* 문 좌측면 두께 */}
      <path d="M -10,0 L -22,8 L 0,396 L 10,392 Z" fill="url(#bodyDark)" />
      {/* 문 상단면 */}
      <path d="M -10,0 L -22,8 L 158,28 L 170,24 Z" fill="url(#bodyLight)" />
      {/* 인셋 */}
      {/* 내부 패널 */}
      <path d="M 14,18 L 156,33 L 156,380 L 26,380 Z" fill="url(#interiorG)" />
      {/* 고무 패킹 (문 전체 테두리) */}
      <path d="M 170,24 L -10,0 L 10,392 L 170,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      {/* 유리 선반 */}
      <path d="M 18,115 L 152,125 L 152,128 L 20,118 Z" fill="url(#glassShelf)" />
      <path d="M 20,118 L 152,128 L 152,129 L 22,119 Z" fill="rgba(255,255,255,0.25)" />
      <path d="M 20,210 L 152,216 L 152,219 L 22,213 Z" fill="url(#glassShelf)" />
      <path d="M 22,213 L 152,219 L 152,220 L 24,214 Z" fill="rgba(255,255,255,0.25)" />
      <path d="M 22,300 L 152,302 L 152,305 L 24,303 Z" fill="url(#glassShelf)" />
      <path d="M 24,303 L 152,305 L 152,306 L 26,304 Z" fill="rgba(255,255,255,0.25)" />

      {/* ====== 좌측 냉동 문 (V자) ====== */}
      <path d="M 170,402 L 10,404 L 26,624 L 170,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" />
      <path d="M 10,404 L 0,408 L 18,620 L 26,624 Z" fill="url(#bodyDark)" />
      {/* 상단면 */}
      <path d="M 10,404 L 0,408 L 158,406 L 170,402 Z" fill="url(#bodyLight)" />
      <path d="M 30,416 L 156,412 L 156,612 L 40,612 Z" fill="url(#freezerG)" />
      {/* 고무 패킹 (문 전체) */}
      <path d="M 170,402 L 10,404 L 26,624 L 170,622 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      {/* 유리 선반 */}
      <path d="M 34,515 L 152,513 L 152,516 L 36,518 Z" fill="url(#glassShelf)" />
      <path d="M 36,518 L 152,516 L 152,517 L 38,519 Z" fill="rgba(255,255,255,0.25)" />

      {/* ====== 냉장고 본체 ====== */}
      {/* 우측면 */}
      <path d="M 434,14 L 448,6 L 448,623 L 434,629 Z" fill="url(#bodyDark)" />
      {/* 상단면 */}
      <path d="M 166,14 L 180,6 L 448,6 L 434,14 Z" fill="url(#bodyLight)" />
      <path d="M 172,14 L 184,8 L 442,8 L 430,14 Z" fill="rgba(255,255,255,0.06)" />
      {/* 정면 */}
      <rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="3" />
      {/* 프레임 하이라이트 (좌측 빛 반사) */}
      <rect x="172" y="19" width="256" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
      <rect x="168" y="20" width="3" height="604" rx="1" fill="rgba(255,255,255,0.06)" />
      {/* 프레임 우측 어두운 엣지 */}
      <rect x="429" y="20" width="3" height="604" rx="1" fill="rgba(0,0,0,0.06)" />
      {/* 프레임 하단 마감 */}
      <rect x="168" y="624" width="264" height="3" rx="1" fill="rgba(0,0,0,0.08)" />

      {/* 크롬 트림 (본체 상단) */}
      <rect x="170" y="16" width="260" height="3" rx="1" fill="url(#chromeG)" />
      {/* 크롬 트림 (냉장/냉동 구분 위아래) */}
      <rect x="170" y="383" width="260" height="2" rx="0.5" fill="url(#chromeG)" />
      <rect x="170" y="398" width="260" height="2" rx="0.5" fill="url(#chromeG)" />


      {/* 브랜드 */}
      <text x="300" y="622" textAnchor="middle" fill="#ffd700" fontSize="11" fontWeight="bold" letterSpacing="4" fontFamily="sans-serif" opacity="0.8">NAELUM</text>

      {/* ====== 내부 — 냉장 ====== */}
      <rect x="178" y="28" width="244" height="355" rx="4" fill="url(#interiorG)" />
      <rect x="178" y="28" width="244" height="80" rx="4" fill="url(#lightG)" />
      <rect x="178" y="28" width="5" height="355" fill="rgba(0,0,0,0.05)" />
      <rect x="417" y="28" width="5" height="355" fill="rgba(0,0,0,0.05)" />
      <rect x="178" y="28" width="244" height="5" fill="rgba(0,0,0,0.04)" />
      <rect x="178" y="28" width="244" height="355" rx="4" fill="none" stroke="#7a2818" strokeWidth="2" />
      {/* 유리 선반 */}
      <rect x="182" y="118" width="236" height="4" rx="2" fill="url(#glassShelf)" />
      <rect x="182" y="122" width="236" height="1" fill="rgba(255,255,255,0.3)" />
      <rect x="182" y="215" width="236" height="4" rx="2" fill="url(#glassShelf)" />
      <rect x="182" y="219" width="236" height="1" fill="rgba(255,255,255,0.3)" />
      <rect x="182" y="300" width="236" height="4" rx="2" fill="url(#glassShelf)" />
      <rect x="182" y="304" width="236" height="1" fill="rgba(255,255,255,0.3)" />

      {/* 냉장/냉동 구분 (3D) */}
      <rect x="168" y="383" width="264" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
      <rect x="168" y="386" width="264" height="10" rx="1" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="1" />
      <rect x="168" y="396" width="264" height="2" rx="1" fill="rgba(0,0,0,0.1)" />

      {/* ====== 내부 — 냉동 ====== */}
      <rect x="178" y="395" width="244" height="220" rx="4" fill="url(#freezerG)" />
      <rect x="178" y="395" width="5" height="220" fill="rgba(0,0,0,0.05)" />
      <rect x="417" y="395" width="5" height="220" fill="rgba(0,0,0,0.05)" />
      <rect x="178" y="395" width="244" height="5" fill="rgba(0,0,0,0.04)" />
      <rect x="178" y="395" width="244" height="220" rx="4" fill="none" stroke="#7a2818" strokeWidth="2" />
      <rect x="182" y="505" width="236" height="4" rx="2" fill="url(#glassShelf)" />
      <rect x="182" y="509" width="236" height="1" fill="rgba(255,255,255,0.3)" />

      {/* ====== 우측 냉장 문 (V자) ====== */}
      <path d="M 430,24 L 610,0 L 590,392 L 430,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" />
      <path d="M 610,0 L 622,8 L 600,396 L 590,392 Z" fill="url(#bodyDark)" />
      <path d="M 430,24 L 442,28 L 610,0 L 622,8 Z" fill="url(#bodyLight)" />
      <path d="M 444,33 L 574,18 L 572,380 L 444,380 Z" fill="url(#interiorG)" />
      {/* 고무 패킹 (문 전체) */}
      <path d="M 430,24 L 610,0 L 590,392 L 430,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      {/* 유리 선반 */}
      <path d="M 448,125 L 568,115 L 568,118 L 448,128 Z" fill="url(#glassShelf)" />
      <path d="M 448,128 L 568,118 L 568,119 L 448,129 Z" fill="rgba(255,255,255,0.25)" />
      <path d="M 448,216 L 568,210 L 568,213 L 448,219 Z" fill="url(#glassShelf)" />
      <path d="M 448,219 L 568,213 L 568,214 L 448,220 Z" fill="rgba(255,255,255,0.25)" />
      <path d="M 448,302 L 568,300 L 568,303 L 448,305 Z" fill="url(#glassShelf)" />
      <path d="M 448,305 L 568,303 L 568,304 L 448,306 Z" fill="rgba(255,255,255,0.25)" />

      {/* ====== 우측 냉동 문 (V자) ====== */}
      <path d="M 430,402 L 590,404 L 574,624 L 430,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" />
      <path d="M 590,404 L 600,408 L 582,620 L 574,624 Z" fill="url(#bodyDark)" />
      {/* 상단면 */}
      <path d="M 430,402 L 442,406 L 590,404 L 600,408 Z" fill="url(#bodyLight)" />
      <path d="M 444,412 L 572,418 L 560,612 L 444,608 Z" fill="url(#freezerG)" />
      {/* 고무 패킹 (문 전체) */}
      <path d="M 430,402 L 590,404 L 574,624 L 430,622 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />
      {/* 유리 선반 */}
      <path d="M 448,515 L 558,513 L 558,516 L 448,518 Z" fill="url(#glassShelf)" />
      <path d="M 448,518 L 558,516 L 558,517 L 448,519 Z" fill="rgba(255,255,255,0.25)" />

      {/* 킥플레이트 (다리 위 패널) */}
      <rect x="168" y="624" width="264" height="10" rx="2" fill="url(#bodyDark)" stroke="#8a3020" strokeWidth="0.5" />
      <rect x="170" y="625" width="260" height="2" rx="1" fill="rgba(255,255,255,0.08)" />

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

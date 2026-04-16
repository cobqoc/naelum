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
          <stop offset="0%" stopColor="#eef2f8" />
          <stop offset="100%" stopColor="#dce2ec" />
        </linearGradient>
        <linearGradient id="freezerG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0dce8" />
          <stop offset="100%" stopColor="#b0c4d8" />
        </linearGradient>
        <linearGradient id="handleG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#999" />
          <stop offset="30%" stopColor="#ddd" />
          <stop offset="50%" stopColor="#f0f0f0" />
          <stop offset="70%" stopColor="#ddd" />
          <stop offset="100%" stopColor="#888" />
        </linearGradient>
        <linearGradient id="glassShelf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(200,220,240,0.4)" />
          <stop offset="50%" stopColor="rgba(200,220,240,0.15)" />
          <stop offset="100%" stopColor="rgba(200,220,240,0.3)" />
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
      <path d="M 4,10 L 162,28 L 162,386 L 18,386 Z" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
      {/* 내부 패널 */}
      <path d="M 14,18 L 156,33 L 156,380 L 26,380 Z" fill="url(#interiorG)" />
      {/* 내부 좌측 깊이 그림자 */}
      <path d="M 14,18 L 22,20 L 32,378 L 26,380 Z" fill="rgba(0,0,0,0.06)" />
      {/* 유리 선반 */}
      <path d="M 18,115 L 152,125 L 152,128 L 20,118 Z" fill="url(#glassShelf)" />
      <path d="M 20,118 L 152,128 L 152,129 L 22,119 Z" fill="rgba(255,255,255,0.25)" />
      <path d="M 20,210 L 152,216 L 152,219 L 22,213 Z" fill="url(#glassShelf)" />
      <path d="M 22,213 L 152,219 L 152,220 L 24,214 Z" fill="rgba(255,255,255,0.25)" />
      <path d="M 22,300 L 152,302 L 152,305 L 24,303 Z" fill="url(#glassShelf)" />
      <path d="M 24,303 L 152,305 L 152,306 L 26,304 Z" fill="rgba(255,255,255,0.25)" />
      {/* 손잡이 */}
      <rect x="155" y="165" width="12" height="7" rx="2" fill="#999" stroke="#777" strokeWidth="0.5" />
      <rect x="155" y="258" width="12" height="7" rx="2" fill="#999" stroke="#777" strokeWidth="0.5" />
      <path d="M 163,172 L 163,258" stroke="rgba(0,0,0,0.12)" strokeWidth="8" strokeLinecap="round" />
      <path d="M 161,170 L 161,260" stroke="url(#handleG)" strokeWidth="6" strokeLinecap="round" />

      {/* ====== 좌측 냉동 문 (V자) ====== */}
      <path d="M 170,402 L 10,404 L 26,624 L 170,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" />
      <path d="M 10,404 L 0,408 L 18,620 L 26,624 Z" fill="url(#bodyDark)" />
      <path d="M 20,410 L 162,405 L 162,618 L 34,618 Z" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
      <path d="M 30,416 L 156,412 L 156,612 L 40,612 Z" fill="url(#interiorG)" />
      <path d="M 30,416 L 38,417 L 44,610 L 40,612 Z" fill="rgba(0,0,0,0.06)" />
      {/* 유리 선반 */}
      <path d="M 34,515 L 152,513 L 152,516 L 36,518 Z" fill="url(#glassShelf)" />
      <path d="M 36,518 L 152,516 L 152,517 L 38,519 Z" fill="rgba(255,255,255,0.25)" />
      {/* 손잡이 */}
      <rect x="155" y="482" width="12" height="7" rx="2" fill="#999" stroke="#777" strokeWidth="0.5" />
      <rect x="155" y="545" width="12" height="7" rx="2" fill="#999" stroke="#777" strokeWidth="0.5" />
      <path d="M 163,489 L 163,545" stroke="rgba(0,0,0,0.12)" strokeWidth="8" strokeLinecap="round" />
      <path d="M 161,487 L 161,547" stroke="url(#handleG)" strokeWidth="6" strokeLinecap="round" />

      {/* ====== 냉장고 본체 ====== */}
      {/* 우측면 */}
      <path d="M 434,14 L 448,6 L 448,623 L 434,629 Z" fill="url(#bodyDark)" />
      {/* 상단면 */}
      <path d="M 166,14 L 180,6 L 448,6 L 434,14 Z" fill="url(#bodyLight)" />
      <path d="M 172,14 L 184,8 L 442,8 L 430,14 Z" fill="rgba(255,255,255,0.06)" />
      {/* 정면 */}
      <rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="3" />
      {/* 하이라이트 */}
      <rect x="172" y="19" width="256" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
      <rect x="168" y="20" width="3" height="604" rx="1" fill="rgba(255,255,255,0.05)" />

      {/* 환기구 */}
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <rect key={`v${i}`} x={220 + i * 16} y="22" width="10" height="2" rx="1" fill="rgba(0,0,0,0.07)" />
      ))}

      {/* 브랜드 */}
      <text x="300" y="622" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="10" fontWeight="bold" letterSpacing="4" fontFamily="sans-serif">NAELUM</text>

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

      {/* 냉장/냉동 구분 */}
      <rect x="168" y="383" width="264" height="12" rx="2" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="1" />
      <rect x="170" y="384" width="260" height="2" rx="1" fill="rgba(255,255,255,0.08)" />

      {/* ====== 내부 — 냉동 ====== */}
      <rect x="178" y="395" width="244" height="220" rx="4" fill="url(#freezerG)" />
      <rect x="178" y="395" width="5" height="220" fill="rgba(0,0,0,0.05)" />
      <rect x="417" y="395" width="5" height="220" fill="rgba(0,0,0,0.05)" />
      <rect x="178" y="395" width="244" height="5" fill="rgba(0,0,0,0.04)" />
      <rect x="178" y="395" width="244" height="220" rx="4" fill="none" stroke="#7a2818" strokeWidth="2" />
      <rect x="178" y="395" width="244" height="220" rx="4" fill="url(#frostG)" />
      <rect x="182" y="505" width="236" height="4" rx="2" fill="url(#glassShelf)" />
      <rect x="182" y="509" width="236" height="1" fill="rgba(255,255,255,0.3)" />

      {/* ====== 우측 냉장 문 (V자) ====== */}
      <path d="M 430,24 L 610,0 L 590,392 L 430,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" />
      <path d="M 610,0 L 622,8 L 600,396 L 590,392 Z" fill="url(#bodyDark)" />
      <path d="M 430,24 L 442,28 L 610,0 L 622,8 Z" fill="url(#bodyLight)" />
      <path d="M 438,28 L 582,10 L 580,386 L 438,386 Z" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
      <path d="M 444,33 L 574,18 L 572,380 L 444,380 Z" fill="url(#interiorG)" />
      <path d="M 566,19 L 574,18 L 572,380 L 564,379 Z" fill="rgba(0,0,0,0.06)" />
      {/* 유리 선반 */}
      <path d="M 448,125 L 568,115 L 568,118 L 448,128 Z" fill="url(#glassShelf)" />
      <path d="M 448,128 L 568,118 L 568,119 L 448,129 Z" fill="rgba(255,255,255,0.25)" />
      <path d="M 448,216 L 568,210 L 568,213 L 448,219 Z" fill="url(#glassShelf)" />
      <path d="M 448,219 L 568,213 L 568,214 L 448,220 Z" fill="rgba(255,255,255,0.25)" />
      <path d="M 448,302 L 568,300 L 568,303 L 448,305 Z" fill="url(#glassShelf)" />
      <path d="M 448,305 L 568,303 L 568,304 L 448,306 Z" fill="rgba(255,255,255,0.25)" />
      {/* 손잡이 */}
      <rect x="433" y="165" width="12" height="7" rx="2" fill="#999" stroke="#777" strokeWidth="0.5" />
      <rect x="433" y="258" width="12" height="7" rx="2" fill="#999" stroke="#777" strokeWidth="0.5" />
      <path d="M 437,172 L 437,258" stroke="rgba(0,0,0,0.12)" strokeWidth="8" strokeLinecap="round" />
      <path d="M 439,170 L 439,260" stroke="url(#handleG)" strokeWidth="6" strokeLinecap="round" />

      {/* ====== 우측 냉동 문 (V자) ====== */}
      <path d="M 430,402 L 590,404 L 574,624 L 430,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" />
      <path d="M 590,404 L 600,408 L 582,620 L 574,624 Z" fill="url(#bodyDark)" />
      <path d="M 438,405 L 580,412 L 566,618 L 438,616 Z" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
      <path d="M 444,412 L 572,418 L 560,612 L 444,608 Z" fill="url(#interiorG)" />
      <path d="M 564,419 L 572,418 L 560,612 L 554,611 Z" fill="rgba(0,0,0,0.06)" />
      {/* 유리 선반 */}
      <path d="M 448,515 L 558,513 L 558,516 L 448,518 Z" fill="url(#glassShelf)" />
      <path d="M 448,518 L 558,516 L 558,517 L 448,519 Z" fill="rgba(255,255,255,0.25)" />
      {/* 손잡이 */}
      <rect x="433" y="482" width="12" height="7" rx="2" fill="#999" stroke="#777" strokeWidth="0.5" />
      <rect x="433" y="545" width="12" height="7" rx="2" fill="#999" stroke="#777" strokeWidth="0.5" />
      <path d="M 437,489 L 437,545" stroke="rgba(0,0,0,0.12)" strokeWidth="8" strokeLinecap="round" />
      <path d="M 439,487 L 439,547" stroke="url(#handleG)" strokeWidth="6" strokeLinecap="round" />

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

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

      {/* ====== 좌측 냉장 문 (극적 V자) ====== */}
      <path d="M 170,24 L -10,0 L 10,392 L 170,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M -10,0 L -22,8 L 0,396 L 10,392 Z" fill="url(#bodyDark)" />
      <path d="M -10,0 L -22,8 L 158,28 L 170,24 Z" fill="url(#bodyLight)" />
      {/* 내부 패널 */}
      <path d="M 18,22 L 152,36 L 152,376 L 30,376 Z" fill="url(#interiorG)" />
      {/* ══ 좌측 냉장 문 — 3D 일러스트 선반 ══ */}

      {/* 선반1: 옆면 → 윗면 → 정면 → 그림자 */}
      <path d="M 21,111 L 19,115 L 20,140 L 22,136 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 21,111 L 152,121 L 150,125 L 19,115 Z" fill="#F0D050" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 19,115 L 150,125 L 150,150 L 20,140 Z" fill="#E8C840" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 21,141 L 150,151" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />

      {/* 선반2 */}
      <path d="M 24,199 L 22,203 L 23,228 L 25,224 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 24,199 L 152,206 L 150,210 L 22,203 Z" fill="#F0D050" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 22,203 L 150,210 L 150,235 L 23,228 Z" fill="#E8C840" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 24,229 L 150,236" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />

      {/* 선반3 (최하단 밀착) */}
      <path d="M 29,353 L 27,357 L 28,376 L 30,372 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 29,353 L 152,355 L 150,359 L 27,357 Z" fill="#F0D050" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 27,357 L 150,359 L 150,376 L 28,376 Z" fill="#E8C840" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />

      {/* 바 — 좌측 냉장 문 (3면 입체) */}
      <path d="M 2,22 L 3,19 L 19,19 L 18,22 Z" fill="#F0D050" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 18,22 L 19,19 L 31,373 L 30,376 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 2,22 L 18,22 L 30,376 L 14,376 Z" fill="#E8C840" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 고무 패킹 */}
      <path d="M 170,24 L -10,0 L 10,392 L 170,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />

      {/* ====== 좌측 냉동 문 (V자) ====== */}
      <path d="M 170,402 L 10,404 L 26,624 L 170,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 10,404 L 0,408 L 18,620 L 26,624 Z" fill="url(#bodyDark)" />
      <path d="M 10,404 L 0,408 L 158,406 L 170,402 Z" fill="url(#bodyLight)" />
      <path d="M 34,420 L 152,416 L 152,608 L 44,608 Z" fill="url(#freezerG)" />
      {/* 바 — 좌측 냉동 문 (3면) */}
      <path d="M 18,421 L 19,418 L 35,417 L 34,420 Z" fill="#F0D050" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 34,420 L 35,417 L 45,605 L 44,608 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 18,421 L 34,420 L 44,608 L 28,609 Z" fill="#E8C840" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 고무 패킹 */}
      <path d="M 170,402 L 10,404 L 26,624 L 170,622 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />

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



      {/* ====== 본체 내부 3D 선반 ====== */}

      {/* 선반1 — 윗면 + 정면 + 브래킷 + 하이라이트 */}
      <path d="M 178,115 L 186,107 L 414,107 L 422,115 Z" fill="#F0D050" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 178,115 L 422,115 L 422,143 L 178,143 Z" fill="#E8C840" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 178,133 L 178,143 L 188,143 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 422,133 L 422,143 L 412,143 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 178,115 L 422,115" fill="none" stroke="#F8E060" strokeWidth="1.5" />
      <path d="M 180,145 L 420,145" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="3" />

      {/* 선반2 */}
      <path d="M 178,210 L 186,202 L 414,202 L 422,210 Z" fill="#F0D050" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 178,210 L 422,210 L 422,238 L 178,238 Z" fill="#E8C840" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 178,228 L 178,238 L 188,238 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 422,228 L 422,238 L 412,238 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 178,210 L 422,210" fill="none" stroke="#F8E060" strokeWidth="1.5" />
      <path d="M 180,240 L 420,240" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="3" />

      {/* 선반3 */}
      <path d="M 178,305 L 186,297 L 414,297 L 422,305 Z" fill="#F0D050" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 178,305 L 422,305 L 422,333 L 178,333 Z" fill="#E8C840" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 178,323 L 178,333 L 188,333 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 422,323 L 422,333 L 412,333 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 178,305 L 422,305" fill="none" stroke="#F8E060" strokeWidth="1.5" />
      <path d="M 180,335 L 420,335" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="3" />

      {/* ===== 냉장/냉동 구분 ===== */}
      <rect x="168" y="384" width="264" height="12" rx="1" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="1" />

      {/* ====== 내부 — 냉동 ====== */}
      <rect x="176" y="397" width="248" height="220" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="178" y="399" width="244" height="216" rx="4" fill="url(#freezerG)" />



      {/* ====== 우측 냉장 문 (극적 V자) ====== */}
      <path d="M 430,24 L 610,0 L 590,392 L 430,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 610,0 L 622,8 L 600,396 L 590,392 Z" fill="url(#bodyDark)" />
      <path d="M 430,24 L 442,28 L 610,0 L 622,8 Z" fill="url(#bodyLight)" />
      <path d="M 448,37 L 568,22 L 566,376 L 448,376 Z" fill="url(#interiorG)" />
      {/* ══ 우측 냉장 문 — 3D 일러스트 선반 ══ */}

      {/* 선반1: 옆면 → 윗면 → 정면 → 그림자 */}
      <path d="M 567,111 L 569,115 L 569,140 L 567,136 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 448,122 L 567,111 L 569,115 L 450,126 Z" fill="#F0D050" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 450,126 L 569,115 L 569,140 L 450,151 Z" fill="#E8C840" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 450,152 L 569,141" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />

      {/* 선반2 */}
      <path d="M 567,199 L 569,203 L 569,228 L 567,224 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 448,207 L 567,199 L 569,203 L 450,211 Z" fill="#F0D050" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 450,211 L 569,203 L 569,228 L 450,236 Z" fill="#E8C840" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 450,237 L 569,229" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />

      {/* 선반3 (최하단 밀착) */}
      <path d="M 566,353 L 568,357 L 566,376 L 564,372 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 448,355 L 566,353 L 568,357 L 450,359 Z" fill="#F0D050" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 450,359 L 568,357 L 566,376 L 448,376 Z" fill="#E8C840" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />

      {/* 바 — 우측 냉장 문 (3면) */}
      <path d="M 568,22 L 567,19 L 583,19 L 584,22 Z" fill="#F0D050" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 568,22 L 567,19 L 565,373 L 566,376 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 568,22 L 584,22 L 582,376 L 566,376 Z" fill="#E8C840" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 고무 패킹 */}
      <path d="M 430,24 L 610,0 L 590,392 L 430,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />

      {/* ====== 우측 냉동 문 (V자) ====== */}
      <path d="M 430,402 L 590,404 L 574,624 L 430,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 590,404 L 600,408 L 582,620 L 574,624 Z" fill="url(#bodyDark)" />
      <path d="M 430,402 L 442,406 L 590,404 L 600,408 Z" fill="url(#bodyLight)" />
      <path d="M 448,416 L 566,422 L 556,608 L 448,604 Z" fill="url(#freezerG)" />
      {/* 바 — 우측 냉동 문 (3면) */}
      <path d="M 566,422 L 565,419 L 581,420 L 582,423 Z" fill="#F0D050" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 566,422 L 565,419 L 555,605 L 556,608 Z" fill="#C8A830" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 566,422 L 582,423 L 572,609 L 556,608 Z" fill="#E8C840" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 고무 패킹 */}
      <path d="M 430,402 L 590,404 L 574,624 L 430,622 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />

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
} 1776376992

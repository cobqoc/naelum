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
        {/* 선반 그라데이션 */}
        <linearGradient id="shelfFrontG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0D050" />
          <stop offset="35%" stopColor="#E8C840" />
          <stop offset="100%" stopColor="#C0A030" />
        </linearGradient>
        <linearGradient id="shelfTopG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#F8E868" />
          <stop offset="100%" stopColor="#E8D048" />
        </linearGradient>
        <linearGradient id="shelfSideG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8A830" />
          <stop offset="100%" stopColor="#A08020" />
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
      {/* ══ 좌측 냉장 문 — 포켓 선반 ══ */}

      {/* 선반1: 포켓 바구니 (투명 벽 + 바닥 레일) */}
      {/* 포켓 뒷벽 (반투명) */}
      <path d="M 21,80 L 152,90 L 152,115 L 21,105 Z" fill="rgba(200,190,170,0.25)" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      {/* 바닥 레일 윗면 */}
      <path d="M 21,105 L 152,115 L 150,119 L 19,109 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 바닥 레일 정면 */}
      <path d="M 19,109 L 150,119 L 150,130 L 20,120 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 옆면 */}
      <path d="M 21,105 L 19,109 L 20,120 L 22,116 Z" fill="url(#shelfSideG)" stroke="#3A1A08" strokeWidth="2" strokeLinejoin="round" />

      {/* 선반2 */}
      <path d="M 23,168 L 152,176 L 152,203 L 23,198 Z" fill="rgba(200,190,170,0.25)" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 23,198 L 152,203 L 150,207 L 21,202 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 21,202 L 150,207 L 150,218 L 22,213 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 23,198 L 21,202 L 22,213 L 24,209 Z" fill="url(#shelfSideG)" stroke="#3A1A08" strokeWidth="2" strokeLinejoin="round" />

      {/* 선반3 (최하단) */}
      <path d="M 27,310 L 152,313 L 152,353 L 27,350 Z" fill="rgba(200,190,170,0.25)" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 27,350 L 152,353 L 150,357 L 25,354 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 25,354 L 150,357 L 150,376 L 28,376 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 27,350 L 25,354 L 28,376 L 29,372 Z" fill="url(#shelfSideG)" stroke="#3A1A08" strokeWidth="2" strokeLinejoin="round" />

      {/* 바 — 좌측 냉장 문 (3면 입체) */}
      <path d="M 2,22 L 3,19 L 19,19 L 18,22 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 18,22 L 19,19 L 31,373 L 30,376 Z" fill="url(#shelfSideG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 2,22 L 18,22 L 30,376 L 14,376 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 고무 패킹 */}
      <path d="M 170,24 L -10,0 L 10,392 L 170,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />

      {/* ====== 좌측 냉동 문 (V자) ====== */}
      <path d="M 170,402 L 10,404 L 26,624 L 170,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 10,404 L 0,408 L 18,620 L 26,624 Z" fill="url(#bodyDark)" />
      <path d="M 10,404 L 0,408 L 158,406 L 170,402 Z" fill="url(#bodyLight)" />
      <path d="M 34,420 L 152,416 L 152,608 L 44,608 Z" fill="url(#freezerG)" />
      {/* ── 좌측 냉동 문 선반 1 ── */}
      <path d="M 36,455 L 152,451 L 152,478 L 36,482 Z" fill="rgba(200,190,170,0.25)" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 36,482 L 152,478 L 150,482 L 34,486 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 34,486 L 150,482 L 150,493 L 35,497 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />

      {/* ── 좌측 냉동 문 선반 2 ── */}
      <path d="M 40,540 L 152,537 L 152,570 L 42,570 Z" fill="rgba(200,190,170,0.25)" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 42,570 L 152,570 L 150,574 L 40,574 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 40,574 L 150,574 L 150,585 L 41,585 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />

      {/* 바 — 좌측 냉동 문 (3면) */}
      <path d="M 18,421 L 19,418 L 35,417 L 34,420 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 34,420 L 35,417 L 45,605 L 44,608 Z" fill="url(#shelfSideG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 18,421 L 34,420 L 44,608 L 28,609 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
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
      {/* ══ 우측 냉장 문 — 포켓 선반 ══ */}

      {/* 선반1 */}
      <path d="M 448,90 L 567,80 L 567,105 L 448,115 Z" fill="rgba(200,190,170,0.25)" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 448,115 L 567,105 L 569,109 L 450,119 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 450,119 L 569,109 L 569,120 L 450,130 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 567,105 L 569,109 L 569,120 L 567,116 Z" fill="url(#shelfSideG)" stroke="#3A1A08" strokeWidth="2" strokeLinejoin="round" />

      {/* 선반2 */}
      <path d="M 448,176 L 567,168 L 567,198 L 448,203 Z" fill="rgba(200,190,170,0.25)" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 448,203 L 567,198 L 569,202 L 450,207 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 450,207 L 569,202 L 569,213 L 450,218 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 567,198 L 569,202 L 569,213 L 567,209 Z" fill="url(#shelfSideG)" stroke="#3A1A08" strokeWidth="2" strokeLinejoin="round" />

      {/* 선반3 (최하단) */}
      <path d="M 448,313 L 566,310 L 566,350 L 448,353 Z" fill="rgba(200,190,170,0.25)" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 448,353 L 566,350 L 568,354 L 450,357 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 450,357 L 568,354 L 566,376 L 448,376 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 566,350 L 568,354 L 566,376 L 564,372 Z" fill="url(#shelfSideG)" stroke="#3A1A08" strokeWidth="2" strokeLinejoin="round" />

      {/* 바 — 우측 냉장 문 (3면) */}
      <path d="M 568,22 L 567,19 L 583,19 L 584,22 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 568,22 L 567,19 L 565,373 L 566,376 Z" fill="url(#shelfSideG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 568,22 L 584,22 L 582,376 L 566,376 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 고무 패킹 */}
      <path d="M 430,24 L 610,0 L 590,392 L 430,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />

      {/* ====== 우측 냉동 문 (V자) ====== */}
      <path d="M 430,402 L 590,404 L 574,624 L 430,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 590,404 L 600,408 L 582,620 L 574,624 Z" fill="url(#bodyDark)" />
      <path d="M 430,402 L 442,406 L 590,404 L 600,408 Z" fill="url(#bodyLight)" />
      <path d="M 448,416 L 566,422 L 556,608 L 448,604 Z" fill="url(#freezerG)" />
      {/* ── 우측 냉동 문 선반 1 ── */}
      <path d="M 448,451 L 563,455 L 563,482 L 448,478 Z" fill="rgba(200,190,170,0.25)" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 448,478 L 563,482 L 565,486 L 450,482 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 450,482 L 565,486 L 563,497 L 450,493 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />

      {/* ── 우측 냉동 문 선반 2 ── */}
      <path d="M 448,537 L 558,540 L 556,570 L 448,570 Z" fill="rgba(200,190,170,0.25)" stroke="#3A1A08" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 448,570 L 556,570 L 558,574 L 450,574 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 450,574 L 558,574 L 556,585 L 450,585 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />

      {/* 바 — 우측 냉동 문 (3면) */}
      <path d="M 566,422 L 565,419 L 581,420 L 582,423 Z" fill="url(#shelfTopG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 566,422 L 565,419 L 555,605 L 556,608 Z" fill="url(#shelfSideG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 566,422 L 582,423 L 572,609 L 556,608 Z" fill="url(#shelfFrontG)" stroke="#3A1A08" strokeWidth="2.5" strokeLinejoin="round" />
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
}

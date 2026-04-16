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
      {/* ══ 좌측 냉장 문 — 3D 포켓 선반 (V2) ══ */}

      {/* ── 포켓1 내부 공간 (어두운 배경) ── */}
      <path d="M 19,35 L 152,45 L 152,118 L 21,108 Z" fill="rgba(0,0,0,0.08)" />
      <path d="M 21,103 L 152,113 L 152,118 L 21,108 Z" fill="rgba(0,0,0,0.06)" />
      {/* 바닥면 (12px 돌출, 원근 사다리꼴) */}
      <path d="M 21,108 L 152,118 L 142,121 L 9,111 Z" fill="#D8B868" />
      {/* 옆벽 (왼쪽 측면, 포켓 깊이) */}
      <path d="M 21,108 L 9,111 L 10,133 L 22,130 Z" fill="#9A7828" />
      {/* 앞벽 정면 (22px 높이) */}
      <path d="M 9,111 L 142,121 L 142,143 L 10,133 Z" fill="#C4A050" />
      <path d="M 9,111 L 142,121" fill="none" stroke="rgba(255,255,210,0.55)" strokeWidth="1.5" />
      <path d="M 10,133 L 142,143" fill="none" stroke="#7A5818" strokeWidth="2" />
      <path d="M 11,135 L 142,145" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="3" />

      {/* ── 포켓2 내부 공간 ── */}
      <path d="M 22,145 L 152,155 L 152,198 L 24,193 Z" fill="rgba(0,0,0,0.08)" />
      <path d="M 24,188 L 152,193 L 152,198 L 24,193 Z" fill="rgba(0,0,0,0.06)" />
      {/* 바닥면 */}
      <path d="M 24,193 L 152,198 L 142,201 L 12,196 Z" fill="#D8B868" />
      {/* 옆벽 */}
      <path d="M 24,193 L 12,196 L 13,218 L 25,215 Z" fill="#9A7828" />
      {/* 앞벽 */}
      <path d="M 12,196 L 142,201 L 142,223 L 13,218 Z" fill="#C4A050" />
      <path d="M 12,196 L 142,201" fill="none" stroke="rgba(255,255,210,0.55)" strokeWidth="1.5" />
      <path d="M 13,218 L 142,223" fill="none" stroke="#7A5818" strokeWidth="2" />
      <path d="M 14,220 L 142,225" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="3" />

      {/* ── 포켓3 내부 공간 ── */}
      <path d="M 25,230 L 152,235 L 152,283 L 27,278 Z" fill="rgba(0,0,0,0.08)" />
      <path d="M 27,273 L 152,278 L 152,283 L 27,278 Z" fill="rgba(0,0,0,0.06)" />
      {/* 바닥면 */}
      <path d="M 27,278 L 152,283 L 142,286 L 15,281 Z" fill="#D8B868" />
      {/* 옆벽 */}
      <path d="M 27,278 L 15,281 L 16,303 L 28,300 Z" fill="#9A7828" />
      {/* 앞벽 */}
      <path d="M 15,281 L 142,286 L 142,308 L 16,303 Z" fill="#C4A050" />
      <path d="M 15,281 L 142,286" fill="none" stroke="rgba(255,255,210,0.55)" strokeWidth="1.5" />
      <path d="M 16,303 L 142,308" fill="none" stroke="#7A5818" strokeWidth="2" />
      <path d="M 17,305 L 142,310" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="3" />

      {/* 3D 경계선 — 좌측 냉장 문 */}
      {/* 윗면 (빛 받는 돌출면) */}
      <path d="M 4,22 L 5,19 L 19,19 L 18,22 Z" fill="#F2D858" />
      {/* 안쪽 깊이면 (패널 향 그림자) */}
      <path d="M 18,22 L 19,19 L 31,373 L 30,376 Z" fill="#B89020" />
      {/* 정면 */}
      <path d="M 4,22 L 18,22 L 30,376 L 16,376 Z" fill="#E8C840" stroke="#8B6B18" strokeWidth="1.5" strokeLinejoin="round" />
      {/* 고무 패킹 */}
      <path d="M 170,24 L -10,0 L 10,392 L 170,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />

      {/* ====== 좌측 냉동 문 (V자) ====== */}
      <path d="M 170,402 L 10,404 L 26,624 L 170,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 10,404 L 0,408 L 18,620 L 26,624 Z" fill="url(#bodyDark)" />
      <path d="M 10,404 L 0,408 L 158,406 L 170,402 Z" fill="url(#bodyLight)" />
      <path d="M 34,420 L 152,416 L 152,608 L 44,608 Z" fill="url(#freezerG)" />
      {/* 3D 경계선 — 좌측 냉동 문 */}
      <path d="M 20,421 L 21,418 L 35,417 L 34,420 Z" fill="#F2D858" />
      <path d="M 34,420 L 35,417 L 45,605 L 44,608 Z" fill="#B89020" />
      <path d="M 20,421 L 34,420 L 44,608 L 30,609 Z" fill="#E8C840" stroke="#8B6B18" strokeWidth="1.5" strokeLinejoin="round" />
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
      {/* ══ 우측 냉장 문 — 3D 포켓 선반 (V2) ══ */}

      {/* ── 포켓1 내부 공간 ── */}
      <path d="M 448,45 L 568,35 L 567,118 L 448,129 Z" fill="rgba(0,0,0,0.08)" />
      <path d="M 448,124 L 567,113 L 567,118 L 448,129 Z" fill="rgba(0,0,0,0.06)" />
      {/* 바닥면 */}
      <path d="M 448,129 L 567,118 L 579,121 L 458,132 Z" fill="#D8B868" />
      {/* 옆벽 (오른쪽 측면) */}
      <path d="M 567,118 L 579,121 L 579,143 L 567,140 Z" fill="#9A7828" />
      {/* 앞벽 */}
      <path d="M 458,132 L 579,121 L 579,143 L 458,154 Z" fill="#C4A050" />
      <path d="M 458,132 L 579,121" fill="none" stroke="rgba(255,255,210,0.55)" strokeWidth="1.5" />
      <path d="M 458,154 L 579,143" fill="none" stroke="#7A5818" strokeWidth="2" />
      <path d="M 458,156 L 579,145" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="3" />

      {/* ── 포켓2 내부 공간 ── */}
      <path d="M 448,166 L 567,155 L 567,203 L 448,210 Z" fill="rgba(0,0,0,0.08)" />
      <path d="M 448,205 L 567,198 L 567,203 L 448,210 Z" fill="rgba(0,0,0,0.06)" />
      {/* 바닥면 */}
      <path d="M 448,210 L 567,203 L 579,206 L 458,213 Z" fill="#D8B868" />
      {/* 옆벽 */}
      <path d="M 567,203 L 579,206 L 579,228 L 567,225 Z" fill="#9A7828" />
      {/* 앞벽 */}
      <path d="M 458,213 L 579,206 L 579,228 L 458,235 Z" fill="#C4A050" />
      <path d="M 458,213 L 579,206" fill="none" stroke="rgba(255,255,210,0.55)" strokeWidth="1.5" />
      <path d="M 458,235 L 579,228" fill="none" stroke="#7A5818" strokeWidth="2" />
      <path d="M 458,237 L 579,230" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="3" />

      {/* ── 포켓3 내부 공간 ── */}
      <path d="M 448,247 L 567,240 L 566,283 L 448,291 Z" fill="rgba(0,0,0,0.08)" />
      <path d="M 448,286 L 566,278 L 566,283 L 448,291 Z" fill="rgba(0,0,0,0.06)" />
      {/* 바닥면 */}
      <path d="M 448,291 L 566,283 L 578,286 L 458,294 Z" fill="#D8B868" />
      {/* 옆벽 */}
      <path d="M 566,283 L 578,286 L 578,308 L 566,305 Z" fill="#9A7828" />
      {/* 앞벽 */}
      <path d="M 458,294 L 578,286 L 578,308 L 458,316 Z" fill="#C4A050" />
      <path d="M 458,294 L 578,286" fill="none" stroke="rgba(255,255,210,0.55)" strokeWidth="1.5" />
      <path d="M 458,316 L 578,308" fill="none" stroke="#7A5818" strokeWidth="2" />
      <path d="M 458,318 L 578,310" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="3" />

      {/* 3D 경계선 — 우측 냉장 문 */}
      <path d="M 568,22 L 567,19 L 581,19 L 582,22 Z" fill="#F2D858" />
      <path d="M 568,22 L 567,19 L 565,373 L 566,376 Z" fill="#B89020" />
      <path d="M 568,22 L 582,22 L 580,376 L 566,376 Z" fill="#E8C840" stroke="#8B6B18" strokeWidth="1.5" strokeLinejoin="round" />
      {/* 고무 패킹 */}
      <path d="M 430,24 L 610,0 L 590,392 L 430,390 Z" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" strokeLinejoin="round" />

      {/* ====== 우측 냉동 문 (V자) ====== */}
      <path d="M 430,402 L 590,404 L 574,624 L 430,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 590,404 L 600,408 L 582,620 L 574,624 Z" fill="url(#bodyDark)" />
      <path d="M 430,402 L 442,406 L 590,404 L 600,408 Z" fill="url(#bodyLight)" />
      <path d="M 448,416 L 566,422 L 556,608 L 448,604 Z" fill="url(#freezerG)" />
      {/* 3D 경계선 — 우측 냉동 문 */}
      <path d="M 566,422 L 565,419 L 579,420 L 580,423 Z" fill="#F2D858" />
      <path d="M 566,422 L 565,419 L 555,605 L 556,608 Z" fill="#B89020" />
      <path d="M 566,422 L 580,423 L 570,609 L 556,608 Z" fill="#E8C840" stroke="#8B6B18" strokeWidth="1.5" strokeLinejoin="round" />
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

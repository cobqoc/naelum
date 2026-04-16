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

      {/* ====== 좌측 냉장 문 (직사각형) ====== */}
      <rect x="20" y="18" width="150" height="372" rx="6" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" />
      {/* 문 좌측면 두께 */}
      <path d="M 20,18 L 8,24 L 8,386 L 20,390 Z" fill="url(#bodyDark)" />
      {/* 문 상단면 */}
      <path d="M 20,18 L 8,24 L 158,24 L 170,18 Z" fill="url(#bodyLight)" />
      {/* 내부 패널 */}
      <rect x="34" y="32" width="122" height="344" rx="4" fill="url(#interiorG)" />
      {/* 인셋 라인 */}
      <rect x="34" y="32" width="122" height="344" rx="4" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />
      {/* 고무 패킹 */}
      <rect x="20" y="18" width="150" height="372" rx="6" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" />
      {/* 유리 선반 */}
      <rect x="38" y="118" width="114" height="3" rx="1.5" fill="url(#glassShelf)" />
      <rect x="38" y="121" width="114" height="1" fill="rgba(255,255,255,0.25)" />
      <rect x="38" y="210" width="114" height="3" rx="1.5" fill="url(#glassShelf)" />
      <rect x="38" y="213" width="114" height="1" fill="rgba(255,255,255,0.25)" />
      <rect x="38" y="298" width="114" height="3" rx="1.5" fill="url(#glassShelf)" />
      <rect x="38" y="301" width="114" height="1" fill="rgba(255,255,255,0.25)" />

      {/* ====== 좌측 냉동 문 (직사각형) ====== */}
      <rect x="20" y="402" width="150" height="222" rx="6" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" />
      <path d="M 20,402 L 8,408 L 8,620 L 20,624 Z" fill="url(#bodyDark)" />
      <path d="M 20,402 L 8,408 L 158,408 L 170,402 Z" fill="url(#bodyLight)" />
      <rect x="34" y="416" width="122" height="194" rx="4" fill="url(#freezerG)" />
      {/* 인셋 라인 */}
      <rect x="34" y="416" width="122" height="194" rx="4" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />
      {/* 고무 패킹 */}
      <rect x="20" y="402" width="150" height="222" rx="6" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" />
      {/* 유리 선반 */}
      <rect x="38" y="515" width="114" height="3" rx="1.5" fill="url(#glassShelf)" />
      <rect x="38" y="518" width="114" height="1" fill="rgba(255,255,255,0.25)" />

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

      {/* ====== 우측 냉장 문 (직사각형) ====== */}
      <rect x="430" y="18" width="150" height="372" rx="6" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" />
      <path d="M 580,18 L 592,24 L 592,386 L 580,390 Z" fill="url(#bodyDark)" />
      <path d="M 430,18 L 442,24 L 592,24 L 580,18 Z" fill="url(#bodyLight)" />
      <rect x="444" y="32" width="122" height="344" rx="4" fill="url(#interiorG)" />
      {/* 인셋 라인 */}
      <rect x="444" y="32" width="122" height="344" rx="4" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />
      {/* 고무 패킹 */}
      <rect x="430" y="18" width="150" height="372" rx="6" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" />
      {/* 유리 선반 */}
      <rect x="448" y="118" width="114" height="3" rx="1.5" fill="url(#glassShelf)" />
      <rect x="448" y="121" width="114" height="1" fill="rgba(255,255,255,0.25)" />
      <rect x="448" y="210" width="114" height="3" rx="1.5" fill="url(#glassShelf)" />
      <rect x="448" y="213" width="114" height="1" fill="rgba(255,255,255,0.25)" />
      <rect x="448" y="298" width="114" height="3" rx="1.5" fill="url(#glassShelf)" />
      <rect x="448" y="301" width="114" height="1" fill="rgba(255,255,255,0.25)" />

      {/* ====== 우측 냉동 문 (직사각형) ====== */}
      <rect x="430" y="402" width="150" height="222" rx="6" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2.5" />
      <path d="M 580,402 L 592,408 L 592,620 L 580,624 Z" fill="url(#bodyDark)" />
      <path d="M 430,402 L 442,408 L 592,408 L 580,402 Z" fill="url(#bodyLight)" />
      <rect x="444" y="416" width="122" height="194" rx="4" fill="url(#freezerG)" />
      {/* 인셋 라인 */}
      <rect x="444" y="416" width="122" height="194" rx="4" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />
      {/* 고무 패킹 */}
      <rect x="430" y="402" width="150" height="222" rx="6" fill="none" stroke="rgba(40,40,40,0.3)" strokeWidth="3" />
      {/* 유리 선반 */}
      <rect x="448" y="515" width="114" height="3" rx="1.5" fill="url(#glassShelf)" />
      <rect x="448" y="518" width="114" height="1" fill="rgba(255,255,255,0.25)" />

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

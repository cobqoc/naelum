'use client';

interface FridgeSVGProps {
  doorOpen: boolean;
}

export default function FridgeSVG({ doorOpen }: FridgeSVGProps) {
  return (
    <svg viewBox="0 0 600 700" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d45a3a" />
          <stop offset="100%" stopColor="#b8442e" />
        </linearGradient>
        <linearGradient id="bodyDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c04830" />
          <stop offset="100%" stopColor="#a03828" />
        </linearGradient>
        <linearGradient id="interiorG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8ecf4" />
          <stop offset="100%" stopColor="#d8dce8" />
        </linearGradient>
        <linearGradient id="freezerG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0dce8" />
          <stop offset="100%" stopColor="#b0c4d8" />
        </linearGradient>
        <linearGradient id="shelfG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0b050" />
          <stop offset="40%" stopColor="#c89030" />
          <stop offset="100%" stopColor="#a07028" />
        </linearGradient>
        <linearGradient id="shelfFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8a848" />
          <stop offset="100%" stopColor="#b08030" />
        </linearGradient>
        <linearGradient id="pocketG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8c060" />
          <stop offset="100%" stopColor="#c89838" />
        </linearGradient>
        <linearGradient id="frameG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a040" />
          <stop offset="100%" stopColor="#b08030" />
        </linearGradient>
        <linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
        </linearGradient>
        <linearGradient id="handleG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#888" />
          <stop offset="50%" stopColor="#bbb" />
          <stop offset="100%" stopColor="#777" />
        </linearGradient>
        <radialGradient id="lightG" cx="50%" cy="5%" r="50%">
          <stop offset="0%" stopColor="rgba(255,250,220,0.4)" />
          <stop offset="100%" stopColor="rgba(255,250,220,0)" />
        </radialGradient>
        <radialGradient id="shadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.2)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse cx="300" cy="690" rx="220" ry="14" fill="url(#shadowG)" />

      {/* ==================== 냉장고 본체 ==================== */}
      <rect x="175" y="15" width="250" height="650" rx="8" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />

      {/* 내부 — 냉장 영역 */}
      <rect x="183" y="25" width="234" height="400" rx="4" fill="url(#interiorG)" />
      <rect x="183" y="25" width="234" height="100" rx="4" fill="url(#lightG)"
        className="transition-opacity duration-1000" style={{ opacity: doorOpen ? 1 : 0 }} />

      {/* 냉장 선반 1 */}
      <rect x="183" y="135" width="234" height="10" rx="2" fill="url(#shelfG)" />
      <rect x="183" y="145" width="234" height="4" rx="1" fill="rgba(0,0,0,0.08)" />

      {/* 냉장 선반 2 */}
      <rect x="183" y="260" width="234" height="10" rx="2" fill="url(#shelfG)" />
      <rect x="183" y="270" width="234" height="4" rx="1" fill="rgba(0,0,0,0.08)" />

      {/* 냉장 선반 3 (야채칸 위) */}
      <rect x="183" y="355" width="234" height="10" rx="2" fill="url(#shelfG)" />
      <rect x="183" y="365" width="234" height="4" rx="1" fill="rgba(0,0,0,0.08)" />

      {/* === 냉장/냉동 구분 (두꺼운 프레임) === */}
      <rect x="175" y="425" width="250" height="16" rx="3" fill="url(#frameG)" stroke="#9a7028" strokeWidth="1" />

      {/* 내부 — 냉동 영역 */}
      <rect x="183" y="445" width="234" height="210" rx="4" fill="url(#freezerG)" />

      {/* 냉동 선반 */}
      <rect x="183" y="540" width="234" height="8" rx="2" fill="url(#shelfG)" />

      {/* 냉동 중앙 칸막이 */}
      <rect x="298" y="445" width="8" height="210" rx="2" fill="url(#frameG)" />

      {/* 냉동 유리 패널 (좌) */}
      <rect x="188" y="450" width="106" height="85" rx="3" fill="url(#glassG)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <rect x="188" y="550" width="106" height="100" rx="3" fill="url(#glassG)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

      {/* 냉동 유리 패널 (우) */}
      <rect x="310" y="450" width="102" height="85" rx="3" fill="url(#glassG)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <rect x="310" y="550" width="102" height="100" rx="3" fill="url(#glassG)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

      {/* 냉동 안 데코 음식 */}
      <g className="transition-opacity duration-700 delay-[1500ms]" style={{ opacity: doorOpen ? 0.7 : 0 }}>
        <text x="240" y="510" textAnchor="middle" fontSize="28">🐟</text>
        <text x="360" y="510" textAnchor="middle" fontSize="26">🥩</text>
        <text x="240" y="620" textAnchor="middle" fontSize="30">🍕</text>
        <text x="360" y="620" textAnchor="middle" fontSize="24">🧊</text>
      </g>

      {/* ==================== 좌측 문 (3D 원근) ==================== */}
      <g
        className="transition-all duration-[1800ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
        style={{
          transformOrigin: '175px 340px',
          transform: doorOpen ? 'perspective(600px) rotateY(50deg)' : 'none',
        }}
      >
        {/* 문 외곽 */}
        <path d="M 50,8 L 175,15 L 175,665 L 50,658 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />

        {/* 문 두께 (측면) */}
        <path d="M 50,8 L 50,658 L 42,654 L 42,12 Z" fill="url(#bodyDark)" />

        {/* 문 상단 하이라이트 */}
        <path d="M 52,10 L 173,17 L 173,22 L 52,15 Z" fill="rgba(255,255,255,0.12)" />

        {/* 손잡이 */}
        <rect x="160" y="200" width="8" height="50" rx="4" fill="url(#handleG)" />
        <rect x="160" y="450" width="8" height="50" rx="4" fill="url(#handleG)" />

        {/* === 닫힌 상태 === */}
        <g className="transition-opacity duration-300" style={{ opacity: doorOpen ? 0 : 1 }}>
          <text x="112" y="300" textAnchor="middle" fontSize="42">🧊</text>
          <text x="112" y="80" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="bold" letterSpacing="2" fontFamily="sans-serif">NAELUM</text>
          <text x="112" y="340" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="sans-serif">탭해서 열기</text>
        </g>

        {/* === 열린 상태: 문 안쪽 === */}
        <g className="transition-opacity duration-500 delay-[1200ms]" style={{ opacity: doorOpen ? 1 : 0 }}>
          {/* 안쪽 배경 */}
          <path d="M 55,14 L 170,20 L 170,660 L 55,654 Z" fill="#b84838" />

          {/* 포켓 선반 1 */}
          <path d="M 62,70 L 165,74 L 165,80 L 62,76 Z" fill="url(#pocketG)" />
          <path d="M 62,76 L 62,140 L 165,144 L 165,80 Z" fill="rgba(180,100,50,0.15)" />
          <path d="M 62,140 L 165,144 L 165,152 L 62,148 Z" fill="url(#shelfFront)" />
          <text x="90" y="125" fontSize="22">🍶</text>
          <text x="130" y="130" fontSize="18">🧃</text>

          {/* 포켓 선반 2 */}
          <path d="M 62,180 L 165,184 L 165,190 L 62,186 Z" fill="url(#pocketG)" />
          <path d="M 62,186 L 62,260 L 165,264 L 165,190 Z" fill="rgba(180,100,50,0.15)" />
          <path d="M 62,260 L 165,264 L 165,272 L 62,268 Z" fill="url(#shelfFront)" />
          <text x="85" y="245" fontSize="20">🫙</text>
          <text x="120" y="250" fontSize="22">🧴</text>

          {/* 포켓 선반 3 */}
          <path d="M 62,300 L 165,304 L 165,310 L 62,306 Z" fill="url(#pocketG)" />
          <path d="M 62,306 L 62,390 L 165,394 L 165,310 Z" fill="rgba(180,100,50,0.15)" />
          <path d="M 62,390 L 165,394 L 165,402 L 62,398 Z" fill="url(#shelfFront)" />
          <text x="80" y="375" fontSize="24">🥫</text>
          <text x="125" y="370" fontSize="18">🍯</text>

          {/* 포켓 선반 4 (하단) */}
          <path d="M 62,430 L 165,434 L 165,440 L 62,436 Z" fill="url(#pocketG)" />
          <path d="M 62,436 L 62,540 L 165,544 L 165,440 Z" fill="rgba(180,100,50,0.15)" />
          <path d="M 62,540 L 165,544 L 165,552 L 62,548 Z" fill="url(#shelfFront)" />
          <text x="90" y="510" fontSize="26">🥛</text>
          <text x="130" y="520" fontSize="20">🧈</text>
        </g>
      </g>

      {/* ==================== 우측 문 (3D 원근) ==================== */}
      <g
        className="transition-all duration-[1800ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
        style={{
          transformOrigin: '425px 340px',
          transform: doorOpen ? 'perspective(600px) rotateY(-50deg)' : 'none',
        }}
      >
        {/* 문 외곽 */}
        <path d="M 425,15 L 550,8 L 550,658 L 425,665 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />

        {/* 문 두께 (측면) */}
        <path d="M 550,8 L 558,12 L 558,654 L 550,658 Z" fill="url(#bodyDark)" />

        {/* 문 상단 하이라이트 */}
        <path d="M 427,17 L 548,10 L 548,15 L 427,22 Z" fill="rgba(255,255,255,0.12)" />

        {/* 손잡이 */}
        <rect x="432" y="200" width="8" height="50" rx="4" fill="url(#handleG)" />
        <rect x="432" y="450" width="8" height="50" rx="4" fill="url(#handleG)" />

        {/* 닫힌 상태 */}
        <g className="transition-opacity duration-300" style={{ opacity: doorOpen ? 0 : 1 }}>
          <text x="487" y="300" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="16" fontFamily="sans-serif" fontWeight="bold">냉장고</text>
        </g>

        {/* 열린 상태: 문 안쪽 */}
        <g className="transition-opacity duration-500 delay-[1200ms]" style={{ opacity: doorOpen ? 1 : 0 }}>
          <path d="M 430,20 L 545,14 L 545,654 L 430,660 Z" fill="#b84838" />

          {/* 포켓 선반 1 */}
          <path d="M 435,74 L 540,70 L 540,76 L 435,80 Z" fill="url(#pocketG)" />
          <path d="M 435,80 L 435,144 L 540,140 L 540,76 Z" fill="rgba(180,100,50,0.15)" />
          <path d="M 435,144 L 540,140 L 540,148 L 435,152 Z" fill="url(#shelfFront)" />
          <text x="470" y="125" fontSize="20">🥤</text>
          <text x="510" y="130" fontSize="22">🍶</text>

          {/* 포켓 선반 2 */}
          <path d="M 435,184 L 540,180 L 540,186 L 435,190 Z" fill="url(#pocketG)" />
          <path d="M 435,190 L 435,264 L 540,260 L 540,186 Z" fill="rgba(180,100,50,0.15)" />
          <path d="M 435,264 L 540,260 L 540,268 L 435,272 Z" fill="url(#shelfFront)" />
          <text x="465" y="245" fontSize="22">🫒</text>
          <text x="510" y="250" fontSize="20">🥫</text>

          {/* 포켓 선반 3 */}
          <path d="M 435,304 L 540,300 L 540,306 L 435,310 Z" fill="url(#pocketG)" />
          <path d="M 435,310 L 435,394 L 540,390 L 540,306 Z" fill="rgba(180,100,50,0.15)" />
          <path d="M 435,394 L 540,390 L 540,398 L 435,402 Z" fill="url(#shelfFront)" />
          <text x="475" y="375" fontSize="18">🧉</text>
          <text x="515" y="370" fontSize="22">🍾</text>

          {/* 포켓 선반 4 */}
          <path d="M 435,434 L 540,430 L 540,436 L 435,440 Z" fill="url(#pocketG)" />
          <path d="M 435,440 L 435,544 L 540,540 L 540,436 Z" fill="rgba(180,100,50,0.15)" />
          <path d="M 435,544 L 540,540 L 540,548 L 435,552 Z" fill="url(#shelfFront)" />
          <text x="470" y="510" fontSize="24">🥛</text>
          <text x="515" y="520" fontSize="20">🧴</text>
        </g>
      </g>

      {/* 내부 데코 식품 (선반 위) */}
      <g className="transition-opacity duration-700 delay-[1500ms]" style={{ opacity: doorOpen ? 0.8 : 0 }}>
        {/* 선반 1 위 */}
        <text x="210" y="130" fontSize="24">🥬</text>
        <text x="260" y="128" fontSize="20">🧀</text>
        <text x="310" y="132" fontSize="22">🥚</text>
        <text x="360" y="126" fontSize="18">🫕</text>

        {/* 선반 2 위 */}
        <text x="200" y="255" fontSize="22">🍎</text>
        <text x="250" y="258" fontSize="26">🥝</text>
        <text x="320" y="252" fontSize="20">🫙</text>
        <text x="380" y="256" fontSize="24">🥕</text>

        {/* 선반 3 위 */}
        <text x="210" y="350" fontSize="20">🥒</text>
        <text x="270" y="354" fontSize="24">🍅</text>
        <text x="340" y="348" fontSize="22">🫑</text>
        <text x="390" y="352" fontSize="18">🧄</text>

        {/* 선반 아래 공간 */}
        <text x="220" y="418" fontSize="26">🍉</text>
        <text x="300" y="415" fontSize="22">🥦</text>
        <text x="370" y="420" fontSize="20">🍊</text>
      </g>

      {/* 냉장고 다리 */}
      <rect x="190" y="665" width="18" height="16" rx="4" fill="#8a3828" />
      <rect x="392" y="665" width="18" height="16" rx="4" fill="#8a3828" />

      {/* 프레임 골드 테두리 (본체) */}
      <rect x="179" y="19" width="242" height="4" rx="2" fill="url(#frameG)" opacity="0.6" />
    </svg>
  );
}

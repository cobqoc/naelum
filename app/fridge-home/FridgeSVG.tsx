'use client';

/**
 * SVG 카툰 냉장고 — 문이 항상 열린 상태 (3D transform 없이 SVG path로 직접 그림)
 * 문과 본체가 path 좌표로 연결돼서 절대 틈이 안 생김
 */

export default function FridgeSVG() {
  return (
    <svg viewBox="0 0 600 650" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d45a3a" />
          <stop offset="100%" stopColor="#b8442e" />
        </linearGradient>
        <linearGradient id="bodyDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c04830" />
          <stop offset="100%" stopColor="#982818" />
        </linearGradient>
        <linearGradient id="interiorG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef2f8" />
          <stop offset="100%" stopColor="#dce2ec" />
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
        <linearGradient id="pocketBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c84838" />
          <stop offset="100%" stopColor="#a83828" />
        </linearGradient>
        <linearGradient id="pocketRail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8c060" />
          <stop offset="100%" stopColor="#c89838" />
        </linearGradient>
        <linearGradient id="frameG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a040" />
          <stop offset="100%" stopColor="#b08030" />
        </linearGradient>
        <linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
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
          <stop offset="0%" stopColor="rgba(0,0,0,0.22)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse cx="300" cy="640" rx="230" ry="14" fill="url(#shadowG)" />

      {/* ========== 좌측 문 (SVG path, 본체에 붙어있음) ========== */}
      {/* 문 외곽 — 사다리꼴로 원근감 */}
      <path d="M 170,18 L 40,6 L 40,614 L 170,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      {/* 문 측면 두께 */}
      <path d="M 40,6 L 32,10 L 32,610 L 40,614 Z" fill="url(#bodyDark)" />
      {/* 문 안쪽 배경 */}
      <path d="M 46,14 L 166,22 L 166,618 L 46,610 Z" fill="url(#pocketBg)" />

      {/* 좌측 포켓 선반 1 */}
      <path d="M 52,60 L 160,66 L 160,72 L 52,66 Z" fill="url(#pocketRail)" />
      <path d="M 52,66 L 52,150 L 160,156 L 160,72 Z" fill="rgba(160,80,40,0.12)" />
      <path d="M 52,150 L 160,156 L 160,164 L 52,158 Z" fill="url(#shelfFront)" />
      <text x="80" y="140" fontSize="24">🍶</text>
      <text x="120" y="145" fontSize="20">🧃</text>

      {/* 좌측 포켓 선반 2 */}
      <path d="M 52,185 L 160,191 L 160,197 L 52,191 Z" fill="url(#pocketRail)" />
      <path d="M 52,191 L 52,280 L 160,286 L 160,197 Z" fill="rgba(160,80,40,0.12)" />
      <path d="M 52,280 L 160,286 L 160,294 L 52,288 Z" fill="url(#shelfFront)" />
      <text x="75" y="270" fontSize="22">🫙</text>
      <text x="120" y="275" fontSize="20">🧴</text>

      {/* 좌측 포켓 선반 3 */}
      <path d="M 52,316 L 160,322 L 160,328 L 52,322 Z" fill="url(#pocketRail)" />
      <path d="M 52,322 L 52,420 L 160,426 L 160,328 Z" fill="rgba(160,80,40,0.12)" />
      <path d="M 52,420 L 160,426 L 160,434 L 52,428 Z" fill="url(#shelfFront)" />
      <text x="70" y="410" fontSize="24">🥫</text>
      <text x="120" y="405" fontSize="20">🍯</text>

      {/* 좌측 포켓 선반 4 */}
      <path d="M 52,456 L 160,462 L 160,468 L 52,462 Z" fill="url(#pocketRail)" />
      <path d="M 52,462 L 52,560 L 160,566 L 160,468 Z" fill="rgba(160,80,40,0.12)" />
      <path d="M 52,560 L 160,566 L 160,574 L 52,568 Z" fill="url(#shelfFront)" />
      <text x="80" y="545" fontSize="26">🥛</text>
      <text x="125" y="550" fontSize="20">🧈</text>

      {/* ========== 냉장고 본체 ========== */}
      <rect x="170" y="18" width="260" height="605" rx="6" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      {/* 상단 하이라이트 */}
      <rect x="172" y="20" width="256" height="5" rx="2" fill="rgba(255,255,255,0.12)" />

      {/* 내부 — 냉장 */}
      <rect x="178" y="28" width="244" height="385" rx="4" fill="url(#interiorG)" />
      <rect x="178" y="28" width="244" height="100" rx="4" fill="url(#lightG)" />

      {/* 냉장 선반 1 */}
      <rect x="178" y="130" width="244" height="10" rx="2" fill="url(#shelfG)" />
      <rect x="178" y="140" width="244" height="3" fill="rgba(0,0,0,0.06)" />

      {/* 냉장 선반 2 */}
      <rect x="178" y="245" width="244" height="10" rx="2" fill="url(#shelfG)" />
      <rect x="178" y="255" width="244" height="3" fill="rgba(0,0,0,0.06)" />

      {/* 냉장 선반 3 */}
      <rect x="178" y="340" width="244" height="10" rx="2" fill="url(#shelfG)" />
      <rect x="178" y="350" width="244" height="3" fill="rgba(0,0,0,0.06)" />

      {/* 냉장/냉동 구분 프레임 */}
      <rect x="170" y="413" width="260" height="14" rx="3" fill="url(#frameG)" stroke="#9a7028" strokeWidth="0.5" />

      {/* 내부 — 냉동 */}
      <rect x="178" y="430" width="244" height="185" rx="4" fill="url(#freezerG)" />
      {/* 냉동 선반 */}
      <rect x="178" y="520" width="244" height="7" rx="2" fill="url(#shelfG)" />
      {/* 냉동 중앙 칸막이 */}
      <rect x="298" y="430" width="8" height="185" rx="2" fill="url(#frameG)" />

      {/* 냉동 유리 패널 */}
      <rect x="183" y="434" width="111" height="82" rx="3" fill="url(#glassG)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <rect x="183" y="530" width="111" height="80" rx="3" fill="url(#glassG)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <rect x="310" y="434" width="108" height="82" rx="3" fill="url(#glassG)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <rect x="310" y="530" width="108" height="80" rx="3" fill="url(#glassG)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

      {/* 냉동 데코 */}
      <text x="238" y="490" textAnchor="middle" fontSize="28">🐟</text>
      <text x="364" y="490" textAnchor="middle" fontSize="26">🥩</text>
      <text x="238" y="585" textAnchor="middle" fontSize="28">🍕</text>
      <text x="364" y="585" textAnchor="middle" fontSize="24">🧊</text>

      {/* ========== 우측 문 (SVG path, 본체에 붙어있음) ========== */}
      <path d="M 430,18 L 560,6 L 560,614 L 430,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      {/* 문 측면 두께 */}
      <path d="M 560,6 L 568,10 L 568,610 L 560,614 Z" fill="url(#bodyDark)" />
      {/* 문 안쪽 배경 */}
      <path d="M 434,22 L 554,14 L 554,610 L 434,618 Z" fill="url(#pocketBg)" />

      {/* 우측 포켓 선반 1 */}
      <path d="M 440,66 L 548,60 L 548,66 L 440,72 Z" fill="url(#pocketRail)" />
      <path d="M 440,72 L 440,156 L 548,150 L 548,66 Z" fill="rgba(160,80,40,0.12)" />
      <path d="M 440,156 L 548,150 L 548,158 L 440,164 Z" fill="url(#shelfFront)" />
      <text x="475" y="140" fontSize="22">🥤</text>
      <text x="520" y="145" fontSize="20">🍶</text>

      {/* 우측 포켓 선반 2 */}
      <path d="M 440,191 L 548,185 L 548,191 L 440,197 Z" fill="url(#pocketRail)" />
      <path d="M 440,197 L 440,286 L 548,280 L 548,191 Z" fill="rgba(160,80,40,0.12)" />
      <path d="M 440,286 L 548,280 L 548,288 L 440,294 Z" fill="url(#shelfFront)" />
      <text x="475" y="270" fontSize="22">🫒</text>
      <text x="520" y="275" fontSize="20">🥫</text>

      {/* 우측 포켓 선반 3 */}
      <path d="M 440,322 L 548,316 L 548,322 L 440,328 Z" fill="url(#pocketRail)" />
      <path d="M 440,328 L 440,426 L 548,420 L 548,322 Z" fill="rgba(160,80,40,0.12)" />
      <path d="M 440,426 L 548,420 L 548,428 L 440,434 Z" fill="url(#shelfFront)" />
      <text x="480" y="410" fontSize="20">🧉</text>
      <text x="525" y="405" fontSize="22">🍾</text>

      {/* 우측 포켓 선반 4 */}
      <path d="M 440,462 L 548,456 L 548,462 L 440,468 Z" fill="url(#pocketRail)" />
      <path d="M 440,468 L 440,566 L 548,560 L 548,462 Z" fill="rgba(160,80,40,0.12)" />
      <path d="M 440,566 L 548,560 L 548,568 L 440,574 Z" fill="url(#shelfFront)" />
      <text x="480" y="545" fontSize="24">🥛</text>
      <text x="525" y="550" fontSize="20">🧴</text>

      {/* ========== 내부 데코 식품 ========== */}
      {/* 선반 1 위 */}
      <text x="205" y="125" fontSize="24">🥬</text>
      <text x="255" y="122" fontSize="20">🧀</text>
      <text x="310" y="126" fontSize="22">🥚</text>
      <text x="365" y="120" fontSize="18">🫕</text>

      {/* 선반 2 위 */}
      <text x="200" y="240" fontSize="22">🍎</text>
      <text x="255" y="243" fontSize="26">🥝</text>
      <text x="320" y="238" fontSize="20">🫙</text>
      <text x="385" y="242" fontSize="22">🥕</text>

      {/* 선반 3 위 */}
      <text x="205" y="335" fontSize="20">🥒</text>
      <text x="270" y="338" fontSize="24">🍅</text>
      <text x="340" y="332" fontSize="22">🫑</text>
      <text x="395" y="336" fontSize="18">🧄</text>

      {/* 야채칸 영역 */}
      <text x="215" y="405" fontSize="26">🍉</text>
      <text x="300" y="400" fontSize="22">🥦</text>
      <text x="375" y="406" fontSize="20">🍊</text>

      {/* 냉장고 다리 */}
      <rect x="185" y="623" width="18" height="14" rx="4" fill="#8a3828" />
      <rect x="397" y="623" width="18" height="14" rx="4" fill="#8a3828" />
    </svg>
  );
}

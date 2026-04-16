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
          <stop offset="0%" stopColor="#eef2f8" />
          <stop offset="100%" stopColor="#dce2ec" />
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

      {/* ========== 좌측 냉장 문 (6) ========== */}
      <path d="M 170,18 L 40,6 L 40,385 L 170,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="3" />
      <path d="M 40,6 L 30,10 L 30,381 L 40,385 Z" fill="url(#bodyDark)" />
      <path d="M 48,16 L 162,24 L 162,383 L 48,378 Z" fill="url(#pocketBg)" />

      {/* ========== 좌측 냉동 문 (4) ========== */}
      <path d="M 170,402 L 40,399 L 40,614 L 170,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="3" />
      <path d="M 40,399 L 30,402 L 30,610 L 40,614 Z" fill="url(#bodyDark)" />
      <path d="M 48,406 L 162,404 L 162,612 L 48,608 Z" fill="url(#pocketBg)" />

      {/* ========== 냉장고 본체 ========== */}
      <rect x="166" y="14" width="268" height="613" rx="8" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="4" />
      {/* 상단 하이라이트 */}
      <rect x="172" y="20" width="256" height="5" rx="2" fill="rgba(255,255,255,0.12)" />

      {/* ========== 내부 — 냉장 영역 (6) ========== */}
      <rect x="178" y="28" width="244" height="355" rx="4" fill="url(#interiorG)" />
      <rect x="178" y="28" width="244" height="60" rx="4" fill="url(#lightG)" />

      {/* ── 선반 1 ── */}
      <rect x="178" y="115" width="244" height="5" fill="#ecd070" />
      <rect x="178" y="120" width="244" height="8" fill="url(#shelfG)" />

      {/* ── 선반 2 ── */}
      <rect x="178" y="210" width="244" height="5" fill="#ecd070" />
      <rect x="178" y="215" width="244" height="8" fill="url(#shelfG)" />

      {/* ── 선반 3 ── */}
      <rect x="178" y="295" width="244" height="5" fill="#ecd070" />
      <rect x="178" y="300" width="244" height="8" fill="url(#shelfG)" />

      {/* ── 야채 서랍 ── */}
      <rect x="182" y="314" width="116" height="40" rx="3" fill="rgba(220,235,225,0.35)" stroke="url(#frameG)" strokeWidth="2" />
      <rect x="220" y="313" width="40" height="3" rx="1.5" fill="#c89838" />
      <rect x="302" y="314" width="116" height="40" rx="3" fill="rgba(220,235,225,0.35)" stroke="url(#frameG)" strokeWidth="2" />
      <rect x="340" y="313" width="40" height="3" rx="1.5" fill="#c89838" />

      {/* ── 식품 ── */}
      <text x="195" y="111" fontSize="28">🥬</text>
      <text x="245" y="107" fontSize="24">🧀</text>
      <text x="295" y="113" fontSize="30">🫕</text>
      <text x="350" y="109" fontSize="24">🥚</text>
      <text x="395" y="105" fontSize="20">🫙</text>

      <text x="195" y="206" fontSize="26">🍎</text>
      <text x="242" y="202" fontSize="30">🥝</text>
      <text x="295" y="208" fontSize="24">🥕</text>
      <text x="342" y="204" fontSize="28">🍊</text>
      <text x="395" y="200" fontSize="20">🧄</text>

      <text x="195" y="291" fontSize="24">🥒</text>
      <text x="245" y="287" fontSize="28">🍅</text>
      <text x="298" y="293" fontSize="24">🫑</text>
      <text x="348" y="289" fontSize="26">🍆</text>
      <text x="398" y="285" fontSize="20">🌽</text>

      <text x="215" y="346" fontSize="22">🥦</text>
      <text x="260" y="348" fontSize="20">🥬</text>
      <text x="335" y="346" fontSize="24">🍉</text>
      <text x="390" y="348" fontSize="18">🥜</text>

      {/* ========== 냉장/냉동 구분 ========== */}
      <rect x="166" y="383" width="268" height="6" fill="#ecd070" />
      <rect x="166" y="389" width="268" height="10" fill="url(#shelfG)" />

      {/* ========== 내부 — 냉동 (4) ========== */}
      <rect x="178" y="403" width="244" height="212" rx="4" fill="url(#freezerG)" />

      {/* 냉동 선반 */}
      <rect x="178" y="505" width="244" height="4" fill="#ecd070" />
      <rect x="178" y="509" width="244" height="7" fill="url(#shelfG)" />

      {/* 냉동 칸막이 */}
      <rect x="296" y="403" width="4" height="212" fill="#ecd070" />
      <rect x="300" y="403" width="6" height="212" fill="url(#shelfG)" />

      {/* 냉동 유리 패널 */}
      <rect x="183" y="407" width="109" height="94" rx="4" fill="url(#glassG)" stroke="rgba(200,210,220,0.5)" strokeWidth="1.5" />
      <path d="M 190,411 L 215,411 L 200,495 L 190,495 Z" fill="rgba(255,255,255,0.08)" />
      <rect x="183" y="520" width="109" height="90" rx="4" fill="url(#glassG)" stroke="rgba(200,210,220,0.5)" strokeWidth="1.5" />

      <rect x="310" y="407" width="108" height="94" rx="4" fill="url(#glassG)" stroke="rgba(200,210,220,0.5)" strokeWidth="1.5" />
      <path d="M 317,411 L 340,411 L 327,495 L 317,495 Z" fill="rgba(255,255,255,0.08)" />
      <rect x="310" y="520" width="108" height="90" rx="4" fill="url(#glassG)" stroke="rgba(200,210,220,0.5)" strokeWidth="1.5" />

      {/* 냉동 식품 */}
      <text x="237" y="468" textAnchor="middle" fontSize="30">🐟</text>
      <text x="364" y="466" textAnchor="middle" fontSize="28">🥩</text>
      <text x="237" y="578" textAnchor="middle" fontSize="28">🍕</text>
      <text x="364" y="576" textAnchor="middle" fontSize="26">🧊</text>

      {/* ========== 우측 냉장 문 (6) ========== */}
      <path d="M 430,18 L 560,6 L 560,385 L 430,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="3" />
      <path d="M 560,6 L 570,10 L 570,381 L 560,385 Z" fill="url(#bodyDark)" />
      <path d="M 438,24 L 552,16 L 552,383 L 438,378 Z" fill="url(#pocketBg)" />

      {/* ========== 우측 냉동 문 (4) ========== */}
      <path d="M 430,402 L 560,399 L 560,614 L 430,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="3" />
      <path d="M 560,399 L 570,402 L 570,610 L 560,614 Z" fill="url(#bodyDark)" />
      <path d="M 438,406 L 552,404 L 552,612 L 438,608 Z" fill="url(#pocketBg)" />

      {/* 우측 문 내부 — 선반 없이 깔끔하게 */}

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

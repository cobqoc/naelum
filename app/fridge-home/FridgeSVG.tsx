'use client';

/**
 * SVG 카툰 냉장고 일러스트 + CSS 애니메이션
 * 레퍼런스: 따뜻한 갈색 양문형 냉장고, 문 열린 상태
 */

interface FridgeSVGProps {
  doorOpen: boolean;
}

export default function FridgeSVG({ doorOpen }: FridgeSVGProps) {
  return (
    <svg
      viewBox="0 0 500 600"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* 냉장고 본체 그라데이션 */}
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e87a6a" />
          <stop offset="50%" stopColor="#d4645a" />
          <stop offset="100%" stopColor="#c75550" />
        </linearGradient>

        {/* 냉장 내부 */}
        <linearGradient id="interiorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f4f8" />
          <stop offset="100%" stopColor="#e4eaf0" />
        </linearGradient>

        {/* 냉동 내부 */}
        <linearGradient id="freezerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8d8e8" />
          <stop offset="100%" stopColor="#a8c0d8" />
        </linearGradient>

        {/* 선반 (나무) */}
        <linearGradient id="shelfGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a040" />
          <stop offset="60%" stopColor="#b88030" />
          <stop offset="100%" stopColor="#a06828" />
        </linearGradient>

        {/* 문 안쪽 */}
        <linearGradient id="doorInnerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d86858" />
          <stop offset="100%" stopColor="#b84a42" />
        </linearGradient>

        {/* 문 선반 레일 */}
        <linearGradient id="doorRailGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c89040" />
          <stop offset="100%" stopColor="#a87030" />
        </linearGradient>

        {/* 내부 조명 */}
        <radialGradient id="lightGlow" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="rgba(255,248,220,0.5)" />
          <stop offset="100%" stopColor="rgba(255,248,220,0)" />
        </radialGradient>

        {/* 바닥 그림자 */}
        <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        {/* 손잡이 */}
        <linearGradient id="handleGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8a8a8a" />
          <stop offset="50%" stopColor="#b0b0b0" />
          <stop offset="100%" stopColor="#7a7a7a" />
        </linearGradient>
      </defs>

      {/* === 바닥 그림자 === */}
      <ellipse cx="250" cy="590" rx="200" ry="12" fill="url(#floorShadow)" />

      {/* === 냉장고 본체 === */}
      <rect x="120" y="20" width="260" height="550" rx="10" fill="url(#bodyGrad)" stroke="#a04038" strokeWidth="2" />

      {/* 본체 상단 하이라이트 */}
      <rect x="122" y="22" width="256" height="6" rx="3" fill="rgba(255,255,255,0.15)" />

      {/* 브랜드 */}
      <text x="250" y="38" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="bold" letterSpacing="3" fontFamily="sans-serif">
        NAELUM
      </text>

      {/* === 내부 — 냉장 === */}
      <rect x="128" y="44" width="244" height="340" rx="6" fill="url(#interiorGrad)" />

      {/* 내부 조명 */}
      <rect x="128" y="44" width="244" height="80" rx="6" fill="url(#lightGlow)"
        className="transition-opacity duration-1000" style={{ opacity: doorOpen ? 1 : 0 }} />

      {/* 냉장 선반 1 */}
      <rect x="130" y="140" width="240" height="7" rx="2" fill="url(#shelfGrad)" />
      <rect x="130" y="147" width="240" height="3" rx="1" fill="rgba(0,0,0,0.1)" />

      {/* 냉장 선반 2 */}
      <rect x="130" y="240" width="240" height="7" rx="2" fill="url(#shelfGrad)" />
      <rect x="130" y="247" width="240" height="3" rx="1" fill="rgba(0,0,0,0.1)" />

      {/* 냉장 선반 3 (야채칸 구분) */}
      <rect x="130" y="320" width="240" height="7" rx="2" fill="url(#shelfGrad)" />
      <rect x="130" y="327" width="240" height="3" rx="1" fill="rgba(0,0,0,0.1)" />

      {/* === 내부 — 냉동 === */}
      <rect x="128" y="392" width="244" height="170" rx="6" fill="url(#freezerGrad)" />

      {/* 냉장/냉동 구분 두꺼운 선반 */}
      <rect x="126" y="384" width="248" height="10" rx="3" fill="url(#shelfGrad)" />
      <rect x="126" y="394" width="248" height="3" rx="1" fill="rgba(0,0,0,0.15)" />

      {/* 냉동 선반 */}
      <rect x="130" y="470" width="240" height="6" rx="2" fill="url(#shelfGrad)" />
      <rect x="130" y="476" width="240" height="2" rx="1" fill="rgba(0,0,0,0.1)" />

      {/* === 좌측 문 === */}
      <g
        className="transition-transform duration-[1800ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
        style={{
          transformOrigin: '120px 295px',
          transform: doorOpen ? 'rotateY(-50deg)' : 'rotateY(0deg)',
        }}
      >
        {/* 문 외관 */}
        <rect x="70" y="20" width="180" height="550" rx="10" fill="url(#bodyGrad)" stroke="#a04038" strokeWidth="2" />

        {/* 문 하이라이트 */}
        <rect x="72" y="22" width="176" height="4" rx="2" fill="rgba(255,255,255,0.12)" />

        {/* 손잡이 */}
        <rect x="230" y="180" width="8" height="50" rx="4" fill="url(#handleGrad)" />
        <rect x="230" y="420" width="8" height="50" rx="4" fill="url(#handleGrad)" />

        {/* 닫힌 상태: 브랜드 + 아이콘 */}
        <g className="transition-opacity duration-500" style={{ opacity: doorOpen ? 0 : 1 }}>
          <text x="160" y="260" textAnchor="middle" fontSize="40">🧊</text>
          <text x="160" y="300" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="sans-serif">
            탭해서 열기
          </text>
        </g>

        {/* 열린 상태: 문 안쪽 */}
        <g className="transition-opacity duration-500 delay-[1200ms]" style={{ opacity: doorOpen ? 1 : 0 }}>
          {/* 문 안쪽 배경 */}
          <rect x="76" y="26" width="168" height="538" rx="6" fill="url(#doorInnerGrad)" />

          {/* 문 선반 1 */}
          <rect x="82" y="100" width="80" height="6" rx="2" fill="url(#doorRailGrad)" />
          <rect x="82" y="106" width="80" height="2" fill="rgba(0,0,0,0.1)" />

          {/* 문 선반 2 */}
          <rect x="82" y="220" width="80" height="6" rx="2" fill="url(#doorRailGrad)" />
          <rect x="82" y="226" width="80" height="2" fill="rgba(0,0,0,0.1)" />

          {/* 문 선반 3 */}
          <rect x="82" y="340" width="80" height="6" rx="2" fill="url(#doorRailGrad)" />
          <rect x="82" y="346" width="80" height="2" fill="rgba(0,0,0,0.1)" />

          {/* 데코 아이템 */}
          <text x="110" y="95" textAnchor="middle" fontSize="22" opacity="0.6">🍶</text>
          <text x="110" y="215" textAnchor="middle" fontSize="22" opacity="0.6">🧴</text>
          <text x="110" y="335" textAnchor="middle" fontSize="22" opacity="0.6">🫙</text>
        </g>
      </g>

      {/* === 우측 문 === */}
      <g
        className="transition-transform duration-[1800ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
        style={{
          transformOrigin: '380px 295px',
          transform: doorOpen ? 'rotateY(50deg)' : 'rotateY(0deg)',
        }}
      >
        <rect x="250" y="20" width="180" height="550" rx="10" fill="url(#bodyGrad)" stroke="#a04038" strokeWidth="2" />
        <rect x="252" y="22" width="176" height="4" rx="2" fill="rgba(255,255,255,0.12)" />

        {/* 손잡이 */}
        <rect x="262" y="180" width="8" height="50" rx="4" fill="url(#handleGrad)" />
        <rect x="262" y="420" width="8" height="50" rx="4" fill="url(#handleGrad)" />

        {/* 닫힌 상태 */}
        <g className="transition-opacity duration-500" style={{ opacity: doorOpen ? 0 : 1 }}>
          <text x="340" y="280" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="14" fontFamily="sans-serif" fontWeight="bold">
            냉장고
          </text>
        </g>

        {/* 열린 상태: 문 안쪽 */}
        <g className="transition-opacity duration-500 delay-[1200ms]" style={{ opacity: doorOpen ? 1 : 0 }}>
          <rect x="256" y="26" width="168" height="538" rx="6" fill="url(#doorInnerGrad)" />

          <rect x="338" y="100" width="80" height="6" rx="2" fill="url(#doorRailGrad)" />
          <rect x="338" y="106" width="80" height="2" fill="rgba(0,0,0,0.1)" />

          <rect x="338" y="220" width="80" height="6" rx="2" fill="url(#doorRailGrad)" />
          <rect x="338" y="226" width="80" height="2" fill="rgba(0,0,0,0.1)" />

          <rect x="338" y="340" width="80" height="6" rx="2" fill="url(#doorRailGrad)" />
          <rect x="338" y="346" width="80" height="2" fill="rgba(0,0,0,0.1)" />

          <text x="370" y="95" textAnchor="middle" fontSize="22" opacity="0.6">🥫</text>
          <text x="370" y="215" textAnchor="middle" fontSize="22" opacity="0.6">🧈</text>
          <text x="370" y="335" textAnchor="middle" fontSize="22" opacity="0.6">🍯</text>
        </g>
      </g>

      {/* === 냉장고 다리 === */}
      <rect x="140" y="570" width="20" height="14" rx="3" fill="#9a4a44" />
      <rect x="340" y="570" width="20" height="14" rx="3" fill="#9a4a44" />
    </svg>
  );
}

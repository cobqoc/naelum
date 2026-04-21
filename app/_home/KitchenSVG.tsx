'use client';

/**
 * 찬장 + 벽선반 — 가로형 (viewBox 540×165)
 * 좌: 노란 도어 찬장 (x=2~218)
 * 우: 오렌지레드 오픈 벽 선반 2단 (x=242~538, 파란 수납장 없음)
 *
 * chip overlay (HomeClient PANTRY_SHELVES, per-shelf left/width):
 *   Row1: 노란 도어 내부  left=4%  width=33% top=10% height=68%
 *   Row2: 빨간 선반 상단  left=44% width=54% top=5%  height=28%
 */
export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 540 165" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* 노란 도어 */}
        <linearGradient id="kitDoorG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f4c030" />
          <stop offset="100%" stopColor="#c08820" />
        </linearGradient>
        <linearGradient id="kitPanelG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f6cc40" />
          <stop offset="100%" stopColor="#d09828" />
        </linearGradient>
        <linearGradient id="kitDepthL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(20,10,0,0.42)" />
          <stop offset="100%" stopColor="rgba(20,10,0,0)" />
        </linearGradient>
        <linearGradient id="kitDepthR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(20,10,0,0)" />
          <stop offset="100%" stopColor="rgba(20,10,0,0.42)" />
        </linearGradient>
        <linearGradient id="kitDepthT" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(20,10,0,0.40)" />
          <stop offset="100%" stopColor="rgba(20,10,0,0)" />
        </linearGradient>
        <linearGradient id="kitInsetT" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.45)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        <linearGradient id="kitInsetL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.30)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        {/* 경첩/손잡이 */}
        <linearGradient id="kitHingeG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#f07050" />
          <stop offset="100%" stopColor="#c93820" />
        </linearGradient>
        <radialGradient id="kitKnobG" cx="38%" cy="32%" r="62%">
          <stop offset="0%"   stopColor="#f07050" />
          <stop offset="100%" stopColor="#c93820" />
        </radialGradient>
        <linearGradient id="kitKnobFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f07050" />
          <stop offset="100%" stopColor="#c93820" />
        </linearGradient>
        {/* 빨간 선반 */}
        <linearGradient id="kitShelfG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#e85a3a" />
          <stop offset="100%" stopColor="#c93820" />
        </linearGradient>
        <linearGradient id="kitShelfFrontG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c93820" />
          <stop offset="100%" stopColor="#9a2810" />
        </linearGradient>
        <linearGradient id="kitBracketG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#d04828" />
          <stop offset="100%" stopColor="#a83018" />
        </linearGradient>
      </defs>

      {/* ══ 좌: 노란 도어 찬장 (x=2~218) ══ */}
      <path d="M 16,2 Q 2,2 2,18 L 2,162 L 218,162 L 218,18 Q 218,2 204,2 Z"
            fill="url(#kitDoorG)" stroke="#1a0d04" strokeWidth="3" strokeLinejoin="round" />

      {/* 하이라이트 */}
      <rect x="9"   y="6"  width="202" height="5"  rx="2" fill="rgba(255,255,255,0.30)" />
      <rect x="4"   y="10" width="4"   height="146" rx="2" fill="rgba(255,255,255,0.20)" />
      <rect x="213" y="10" width="4"   height="146" rx="2" fill="rgba(0,0,0,0.22)" />

      {/* 나뭇결 */}
      {[30, 65, 100, 130].map(y => (
        <line key={y} x1="6" y1={y} x2="215" y2={y}
              stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
      ))}

      {/* 깊이감 */}
      <rect x="2"   y="2" width="18"  height="160" fill="url(#kitDepthL)" />
      <rect x="200" y="2" width="18"  height="160" fill="url(#kitDepthR)" />
      <rect x="2"   y="2" width="216" height="18"  fill="url(#kitDepthT)" />

      {/* 크라운 몰딩 */}
      <rect x="9"  y="8" width="202" height="10" rx="2" fill="rgba(255,255,255,0.10)" />
      <rect x="9"  y="8" width="202" height="2"  rx="1" fill="rgba(255,255,255,0.22)" />

      {/* 경첩 1 */}
      <rect x="2" y="28" width="10" height="22" rx="2"
            fill="url(#kitHingeG)" stroke="#1a0d04" strokeWidth="1" />
      <circle cx="7" cy="33" r="1.8" fill="#1a0d04" />
      <circle cx="7" cy="33" r="0.8" fill="rgba(255,255,255,0.35)" />
      <circle cx="7" cy="46" r="1.8" fill="#1a0d04" />
      <circle cx="7" cy="46" r="0.8" fill="rgba(255,255,255,0.35)" />

      {/* 경첩 2 */}
      <rect x="2" y="108" width="10" height="22" rx="2"
            fill="url(#kitHingeG)" stroke="#1a0d04" strokeWidth="1" />
      <circle cx="7" cy="113" r="1.8" fill="#1a0d04" />
      <circle cx="7" cy="113" r="0.8" fill="rgba(255,255,255,0.35)" />
      <circle cx="7" cy="126" r="1.8" fill="#1a0d04" />
      <circle cx="7" cy="126" r="0.8" fill="rgba(255,255,255,0.35)" />

      {/* 내부 패널 */}
      <rect x="20" y="18" width="178" height="134" rx="4"
            fill="url(#kitPanelG)" stroke="#1a0d04" strokeWidth="2" strokeLinejoin="round" />
      <rect x="24" y="22" width="170" height="126" rx="2"
            fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" />
      <rect x="20" y="18" width="178" height="22"  rx="4" fill="url(#kitInsetT)" />
      <rect x="20" y="18" width="20"  height="134" rx="4" fill="url(#kitInsetL)" />
      <rect x="26" y="22" width="164" height="2"   rx="1" fill="rgba(255,255,255,0.20)" />

      {/* 손잡이 */}
      <ellipse cx="210" cy="78" rx="7" ry="2.2"
               fill="url(#kitKnobFront)" stroke="#1a0d04" strokeWidth="1.5" />
      <circle cx="210" cy="83" r="7"   fill="#1a0d04" />
      <circle cx="210" cy="83" r="5.8" fill="url(#kitKnobG)" stroke="#1a0d04" strokeWidth="1.5" />
      <circle cx="207" cy="80" r="2.2" fill="rgba(255,255,255,0.60)" />

      {/* ══ 우: 빨간 오픈 벽 선반 2단 (x=242~538) ══ */}

      {/* 벽 브래킷 — 좌 */}
      <rect x="242" y="0" width="8" height="56" rx="2"
            fill="url(#kitBracketG)" stroke="#1a0d04" strokeWidth="1" />
      <path d="M 242,56 L 270,56 L 250,76 Z"
            fill="url(#kitBracketG)" stroke="#1a0d04" strokeWidth="0.8" strokeLinejoin="round" />

      {/* 벽 브래킷 — 우 */}
      <rect x="530" y="0" width="8" height="56" rx="2"
            fill="url(#kitBracketG)" stroke="#1a0d04" strokeWidth="1" />
      <path d="M 538,56 L 510,56 L 530,76 Z"
            fill="url(#kitBracketG)" stroke="#1a0d04" strokeWidth="0.8" strokeLinejoin="round" />

      {/* 상단 선반 상면 */}
      <rect x="238" y="46" width="304" height="12"
            fill="url(#kitShelfG)" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="242" y="47" width="296" height="4" rx="1" fill="rgba(255,255,255,0.28)" />
      {/* 상단 선반 전면 */}
      <rect x="238" y="58" width="304" height="10"
            fill="url(#kitShelfFrontG)" stroke="#1a0d04" strokeWidth="1" strokeLinejoin="round" />
      <rect x="242" y="59" width="296" height="2" rx="1" fill="rgba(255,255,255,0.12)" />

      {/* 하단 브래킷 — 좌 */}
      <rect x="242" y="68" width="8" height="46" rx="2"
            fill="url(#kitBracketG)" stroke="#1a0d04" strokeWidth="1" />
      <path d="M 242,114 L 268,114 L 250,130 Z"
            fill="url(#kitBracketG)" stroke="#1a0d04" strokeWidth="0.8" strokeLinejoin="round" />

      {/* 하단 브래킷 — 우 */}
      <rect x="530" y="68" width="8" height="46" rx="2"
            fill="url(#kitBracketG)" stroke="#1a0d04" strokeWidth="1" />
      <path d="M 538,114 L 512,114 L 530,130 Z"
            fill="url(#kitBracketG)" stroke="#1a0d04" strokeWidth="0.8" strokeLinejoin="round" />

      {/* 하단 선반 상면 */}
      <rect x="238" y="104" width="304" height="12"
            fill="url(#kitShelfG)" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="242" y="105" width="296" height="4" rx="1" fill="rgba(255,255,255,0.28)" />
      {/* 하단 선반 전면 */}
      <rect x="238" y="116" width="304" height="10"
            fill="url(#kitShelfFrontG)" stroke="#1a0d04" strokeWidth="1" strokeLinejoin="round" />
      <rect x="242" y="117" width="296" height="2" rx="1" fill="rgba(255,255,255,0.12)" />
    </svg>
  );
}

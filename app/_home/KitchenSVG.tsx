'use client';

/**
 * 찬장 — 가로형 (viewBox 540×240), 냉장고 너비와 동일
 * 노란 도어(중앙) + 오렌지레드 상판(전체 너비)
 *
 * chip overlay (HomeClient PANTRY_SHELVES):
 *   Row1 top=9%  height=22% / Row2 top=40% height=22%
 *   PANTRY_LEFT='34%'  PANTRY_WIDTH='32%'
 */
export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 540 165" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <defs>
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
        <linearGradient id="kitShelfTopG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#eebb30" />
          <stop offset="100%" stopColor="#c89018" />
        </linearGradient>
        <linearGradient id="kitShelfFrontG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#a87818" />
          <stop offset="100%" stopColor="#785408" />
        </linearGradient>
        <linearGradient id="kitShelfShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.36)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        <linearGradient id="kitCounterG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#e85a3a" />
          <stop offset="100%" stopColor="#c93820" />
        </linearGradient>
        <linearGradient id="kitCounterFrontG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c93820" />
          <stop offset="100%" stopColor="#9a2810" />
        </linearGradient>
        <linearGradient id="kitCounterShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.38)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
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
      </defs>

      {/* ── 중앙 도어 본체 (x=165~375, y=0~162) ── */}
      <path d="M 180,2 Q 165,2 165,18 L 165,162 L 375,162 L 375,18 Q 375,2 360,2 Z"
            fill="url(#kitDoorG)" stroke="#1a0d04" strokeWidth="3" strokeLinejoin="round" />

      {/* 상단 하이라이트 */}
      <rect x="172" y="6"  width="196" height="5"  rx="2" fill="rgba(255,255,255,0.30)" />
      {/* 좌 엣지 하이라이트 */}
      <rect x="167" y="10" width="4"   height="146" rx="2" fill="rgba(255,255,255,0.20)" />
      {/* 우 엣지 섀도우 */}
      <rect x="369" y="10" width="4"   height="146" rx="2" fill="rgba(0,0,0,0.22)" />

      {/* 나뭇결 */}
      {[30, 65, 100, 130].map(y => (
        <line key={y} x1="169" y1={y} x2="373" y2={y}
              stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
      ))}

      {/* 프레임 깊이감 */}
      <rect x="165" y="2"  width="18"  height="160" fill="url(#kitDepthL)" />
      <rect x="357" y="2"  width="18"  height="160" fill="url(#kitDepthR)" />
      <rect x="165" y="2"  width="210" height="18"  fill="url(#kitDepthT)" />

      {/* 상단 크라운 몰딩 */}
      <rect x="172" y="8"  width="196" height="10" rx="2" fill="rgba(255,255,255,0.10)" />
      <rect x="172" y="8"  width="196" height="2"  rx="1" fill="rgba(255,255,255,0.22)" />

      {/* 경첩 */}
      <rect x="165" y="32" width="10" height="22" rx="2"
            fill="url(#kitHingeG)" stroke="#1a0d04" strokeWidth="1" />
      <circle cx="170" cy="37" r="1.8" fill="#1a0d04" />
      <circle cx="170" cy="37" r="0.8" fill="rgba(255,255,255,0.35)" />
      <circle cx="170" cy="50" r="1.8" fill="#1a0d04" />
      <circle cx="170" cy="50" r="0.8" fill="rgba(255,255,255,0.35)" />

      <rect x="165" y="108" width="10" height="22" rx="2"
            fill="url(#kitHingeG)" stroke="#1a0d04" strokeWidth="1" />
      <circle cx="170" cy="113" r="1.8" fill="#1a0d04" />
      <circle cx="170" cy="113" r="0.8" fill="rgba(255,255,255,0.35)" />
      <circle cx="170" cy="126" r="1.8" fill="#1a0d04" />
      <circle cx="170" cy="126" r="0.8" fill="rgba(255,255,255,0.35)" />

      {/* 내부 패널 */}
      <rect x="184" y="20" width="172" height="132" rx="4"
            fill="url(#kitPanelG)" stroke="#1a0d04" strokeWidth="2" strokeLinejoin="round" />
      <rect x="188" y="24" width="164" height="124" rx="2"
            fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" />
      <rect x="191" y="27" width="158" height="118" rx="2"
            fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
      <rect x="184" y="20" width="172" height="22"  rx="4" fill="url(#kitInsetT)" />
      <rect x="184" y="20" width="20"  height="132" rx="4" fill="url(#kitInsetL)" />
      <rect x="352" y="26" width="2.5" height="118" rx="1" fill="rgba(255,255,255,0.12)" />
      <rect x="193" y="24" width="152" height="2"   rx="1" fill="rgba(255,255,255,0.20)" />

      {/* 손잡이 */}
      <ellipse cx="368" cy="87" rx="8" ry="2.5"
               fill="url(#kitKnobFront)" stroke="#1a0d04" strokeWidth="1.5" />
      <circle cx="368" cy="92" r="8"   fill="#1a0d04" />
      <circle cx="368" cy="92" r="6.8" fill="url(#kitKnobG)" stroke="#1a0d04" strokeWidth="1.5" />
      <circle cx="365" cy="89" r="2.5" fill="rgba(255,255,255,0.60)" />
      <ellipse cx="368" cy="98" rx="6" ry="1.5" fill="rgba(0,0,0,0.26)" />

    </svg>
  );
}

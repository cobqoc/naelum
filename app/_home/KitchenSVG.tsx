'use client';

/**
 * 선반장 — 상온 재료 저장소.
 * 냉장고와 디자인 언어 통일:
 *  - 같은 레드-오렌지 바디 (FridgeSVG의 bodyG와 동일 색상대)
 *  - 내부는 시원한 블루 (냉장고 interiorG와 동일 팔레트)
 *  - 두꺼운 검은 외곽선, 카툰 스타일
 * 문이 열려 내부 선반이 보이고, 유저의 상온 chip overlay가 그 위에 얹힘.
 */
export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 660 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* 냉장고 body와 동일한 레드-오렌지 */}
        <linearGradient id="kitBodyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e85a3a" />
          <stop offset="100%" stopColor="#c93820" />
        </linearGradient>
        <linearGradient id="kitBodyLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f07050" />
          <stop offset="100%" stopColor="#d84a30" />
        </linearGradient>
        <linearGradient id="kitBodyDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a1a10" />
          <stop offset="100%" stopColor="#6a1008" />
        </linearGradient>
        {/* 내부 — 냉장실과 같은 시원한 블루 */}
        <linearGradient id="kitInnerG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8f7ff" />
          <stop offset="100%" stopColor="#9ed3ee" />
        </linearGradient>
        {/* 선반 — 크림 우드 톤 (냉장고 내부 선반과 같은 스타일) */}
        <linearGradient id="kitShelfG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fadc60" />
          <stop offset="100%" stopColor="#c08820" />
        </linearGradient>
        <radialGradient id="kitShadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse cx="330" cy="214" rx="300" ry="4" fill="url(#kitShadowG)" />

      {/* === 왼쪽 선반장 — 양문형 처럼 문이 열린 모습 === */}
      <g>
        {/* 왼쪽 열린 도어 (3D 측면) */}
        <path d="M 12,10 L 4,22 L 6,206 L 14,202 Z" fill="url(#kitBodyLight)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 12,10 L 4,22" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
        {/* 본체 외곽 */}
        <rect x="14" y="10" width="206" height="196" fill="url(#kitBodyG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        {/* 상단 하이라이트 */}
        <rect x="18" y="13" width="198" height="3" rx="1" fill="rgba(255,255,255,0.35)" />
        {/* 내부 프레임 (음영) */}
        <rect x="24" y="24" width="186" height="168" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="3" strokeLinejoin="round" />
        {/* 내부 — 시원한 블루 */}
        <rect x="26" y="26" width="182" height="164" rx="2" fill="url(#kitInnerG)" />
        {/* 뒷벽 상단 그림자 */}
        <rect x="26" y="26" width="182" height="6" fill="rgba(0,0,0,0.12)" />
        {/* 선반 2단 — 크림 우드 */}
        <rect x="26" y="82" width="182" height="4" fill="url(#kitShelfG)" stroke="#000" strokeWidth="1.3" />
        <rect x="26" y="140" width="182" height="4" fill="url(#kitShelfG)" stroke="#000" strokeWidth="1.3" />
      </g>

      {/* === 중앙 선반장 === */}
      <g>
        <rect x="222" y="10" width="196" height="196" fill="url(#kitBodyG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <rect x="226" y="13" width="188" height="3" rx="1" fill="rgba(255,255,255,0.35)" />
        <rect x="232" y="24" width="176" height="168" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="3" strokeLinejoin="round" />
        <rect x="234" y="26" width="172" height="164" rx="2" fill="url(#kitInnerG)" />
        <rect x="234" y="26" width="172" height="6" fill="rgba(0,0,0,0.12)" />
        <rect x="234" y="82" width="172" height="4" fill="url(#kitShelfG)" stroke="#000" strokeWidth="1.3" />
        <rect x="234" y="140" width="172" height="4" fill="url(#kitShelfG)" stroke="#000" strokeWidth="1.3" />
      </g>

      {/* === 오른쪽 선반장 === */}
      <g>
        {/* 오른쪽 열린 도어 (3D 측면) */}
        <path d="M 648,10 L 656,22 L 654,206 L 646,202 Z" fill="url(#kitBodyDark)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 648,10 L 656,22" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        {/* 본체 */}
        <rect x="420" y="10" width="226" height="196" fill="url(#kitBodyG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <rect x="424" y="13" width="218" height="3" rx="1" fill="rgba(255,255,255,0.35)" />
        <rect x="430" y="24" width="206" height="168" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="3" strokeLinejoin="round" />
        <rect x="432" y="26" width="202" height="164" rx="2" fill="url(#kitInnerG)" />
        <rect x="432" y="26" width="202" height="6" fill="rgba(0,0,0,0.12)" />
        <rect x="432" y="82" width="202" height="4" fill="url(#kitShelfG)" stroke="#000" strokeWidth="1.3" />
        <rect x="432" y="140" width="202" height="4" fill="url(#kitShelfG)" stroke="#000" strokeWidth="1.3" />
      </g>
    </svg>
  );
}

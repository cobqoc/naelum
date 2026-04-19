'use client';

/**
 * 찬장 v11 — 유저 캡처 이미지(주황 찬장 + 조리대 + 냄비) 기반 리디자인.
 *
 * 구성:
 *  - 뒷벽 (따뜻한 웨이트 톤)
 *  - 상단 조리대: 짙은 갈색 상판 + 주황색 전면
 *  - 조리대 위 냄비 2개 (좌: 냄비+뚜껑 / 우: 소스팬+손잡이) — 데코레이션
 *  - 하단 주황 찬장: 2짝 도어, 각 도어에 대각선 글라스 패턴 + 하단 중앙 손잡이
 *
 * chip overlay는 HomeClient의 PANTRY_SHELVES 좌표(viewBox 660x220 기준)에 따라
 * 찬장 내부 글라스 도어 앞에 2단으로 얹힘.
 */
export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 660 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* 조리대 상판 (빨강 프레임 톤 — 기존 브라운 우드 대체) */}
        <linearGradient id="kitCounterTop3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e85a3a" />
          <stop offset="100%" stopColor="#c93820" />
        </linearGradient>
        {/* 조리대 전면 (동일 빨강 톤) */}
        <linearGradient id="kitCounterFront3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e85a3a" />
          <stop offset="100%" stopColor="#c93820" />
        </linearGradient>
        {/* 찬장 외곽 프레임 (노랑 — 글라스 도어와 동톤) */}
        <linearGradient id="kitCabFrame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe07a" />
          <stop offset="100%" stopColor="#eeb83c" />
        </linearGradient>
        {/* 도어 글라스 패널 (크림 화이트 → 옅은 베이지, 프레임 노랑과 차별) */}
        <linearGradient id="kitDoorGlass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef8e4" />
          <stop offset="100%" stopColor="#e8d7a0" />
        </linearGradient>
        {/* 찬장 내부 back wall (따뜻한 크림 — chip이 대비되게) */}
        <linearGradient id="kitCabInterior" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdf0d2" />
          <stop offset="100%" stopColor="#ecd9a8" />
        </linearGradient>
        {/* 문 프레임 (더 짙은 코발트 블루) */}
        <linearGradient id="kitDoorFrame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4988c2" />
          <stop offset="100%" stopColor="#2a6498" />
        </linearGradient>
        {/* 냄비 본체 (청록) */}
        <linearGradient id="kitPotTeal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#52a9a9" />
          <stop offset="100%" stopColor="#2f6e70" />
        </linearGradient>
        {/* 냄비 하이라이트 */}
        <linearGradient id="kitPotHL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        {/* 찬장 내부 그림자 */}
        <linearGradient id="kitCabShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(30,15,5,0.3)" />
          <stop offset="30%" stopColor="rgba(30,15,5,0)" />
        </linearGradient>
      </defs>

      {/* 1. 뒷벽 제거됨 — 페이지 배경이 자연스럽게 비치도록 투명 */}

      {/* 2. 조리대 위 — 좌측: 큰 흰 솥 + 빨간 뚜껑 + 위에 스택된 폴카도트 작은 솥 */}
      <g>
        {/* 큰 흰 솥 몸체 */}
        <rect x="150" y="16" width="104" height="18" rx="3" fill="#f5f1e8" stroke="#1a0d04" strokeWidth="2" strokeLinejoin="round" />
        {/* 옆 루프 손잡이 */}
        <path d="M 144,22 Q 138,26 144,32" fill="none" stroke="#1a0d04" strokeWidth="2" strokeLinecap="round" />
        <path d="M 260,22 Q 266,26 260,32" fill="none" stroke="#1a0d04" strokeWidth="2" strokeLinecap="round" />
        {/* 빨간 뚜껑 전면 */}
        <rect x="152" y="8" width="100" height="9" rx="2" fill="#d43020" stroke="#1a0d04" strokeWidth="2" strokeLinejoin="round" />
        {/* 뚜껑 상단 하이라이트 */}
        <rect x="156" y="10" width="92" height="2" rx="1" fill="rgba(255,255,255,0.45)" />
        {/* 뚜껑 꼭지 */}
        <circle cx="202" cy="7" r="2.2" fill="#1a0d04" />

        {/* 위에 스택된 폴카도트 작은 솥 */}
        <rect x="172" y="0" width="64" height="9" rx="2" fill="#2a2a2a" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="182" cy="4" r="1.1" fill="#f5f1e8" />
        <circle cx="192" cy="6" r="1.1" fill="#f5f1e8" />
        <circle cx="202" cy="3" r="1.1" fill="#f5f1e8" />
        <circle cx="212" cy="5" r="1.1" fill="#f5f1e8" />
        <circle cx="222" cy="4" r="1.1" fill="#f5f1e8" />
      </g>

      {/* 3. 조리대 위 — 중앙: 테라코타 화분 + 녹색 잎 */}
      <g>
        {/* 잎 (3장 뒤→앞 레이어) */}
        <ellipse cx="318" cy="10" rx="6" ry="10" fill="#4f8f3d" stroke="#1a0d04" strokeWidth="1.4" transform="rotate(-18 318 10)" />
        <ellipse cx="345" cy="4" rx="7" ry="11" fill="#3d7a2e" stroke="#1a0d04" strokeWidth="1.4" />
        <ellipse cx="362" cy="9" rx="6" ry="10" fill="#4f8f3d" stroke="#1a0d04" strokeWidth="1.4" transform="rotate(18 362 9)" />
        {/* 잎맥 */}
        <line x1="318" y1="2" x2="318" y2="18" stroke="#1a0d04" strokeWidth="0.7" opacity="0.55" transform="rotate(-18 318 10)" />
        <line x1="345" y1="-6" x2="345" y2="14" stroke="#1a0d04" strokeWidth="0.7" opacity="0.55" />
        <line x1="362" y1="1" x2="362" y2="17" stroke="#1a0d04" strokeWidth="0.7" opacity="0.55" transform="rotate(18 362 9)" />
        {/* 화분 — 테라코타 사다리꼴 */}
        <path d="M 310,22 L 372,22 L 366,34 L 316,34 Z" fill="#d9793e" stroke="#1a0d04" strokeWidth="2" strokeLinejoin="round" />
        {/* 화분 상단 립 */}
        <rect x="307" y="20" width="68" height="4" rx="1" fill="#c06528" stroke="#1a0d04" strokeWidth="1.8" strokeLinejoin="round" />
      </g>

      {/* 4. 조리대 위 — 우측: 작은 폴카도트 솥 (뚜껑+측면 손잡이) */}
      <g>
        {/* 몸체 */}
        <rect x="410" y="20" width="58" height="14" rx="2.5" fill="#4a4a4a" stroke="#1a0d04" strokeWidth="2" strokeLinejoin="round" />
        {/* 폴카도트 */}
        <circle cx="420" cy="26" r="1.3" fill="#f5f1e8" />
        <circle cx="432" cy="28" r="1.3" fill="#f5f1e8" />
        <circle cx="445" cy="25" r="1.3" fill="#f5f1e8" />
        <circle cx="458" cy="28" r="1.3" fill="#f5f1e8" />
        {/* 측면 손잡이 */}
        <path d="M 405,24 Q 400,27 405,32" fill="none" stroke="#1a0d04" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 472,24 Q 477,27 472,32" fill="none" stroke="#1a0d04" strokeWidth="1.8" strokeLinecap="round" />
        {/* 뚜껑 */}
        <rect x="413" y="13" width="52" height="8" rx="2" fill="#d43020" stroke="#1a0d04" strokeWidth="1.8" strokeLinejoin="round" />
        <rect x="415" y="14.5" width="48" height="1.5" rx="0.8" fill="rgba(255,255,255,0.45)" />
        <circle cx="439" cy="12" r="1.5" fill="#1a0d04" />
      </g>

      {/* 5. 조리대 위 — 우측 끝: 작은 빨간 컵 */}
      <g>
        {/* 컵 본체 (사다리꼴) */}
        <path d="M 488,24 L 506,24 L 503,34 L 491,34 Z" fill="#d43020" stroke="#1a0d04" strokeWidth="1.8" strokeLinejoin="round" />
        {/* 손잡이 */}
        <path d="M 506,26 Q 512,29 506,32" fill="none" stroke="#1a0d04" strokeWidth="1.8" strokeLinecap="round" />
        {/* 상단 하이라이트 */}
        <rect x="491" y="25" width="13" height="1.5" rx="0.7" fill="rgba(255,255,255,0.4)" />
      </g>

      {/* 6. 조리대 위 — 좌측 끝: 스택된 그릇 3개 (아래로 갈수록 커짐) */}
      <g>
        {/* 바닥 그릇 — 주황 + 흰 지그재그 */}
        <path d="M 22,24 L 130,24 L 125,34 L 27,34 Z" fill="#e67a2e" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="20" y="22" width="112" height="3" rx="1" fill="#d96820" stroke="#1a0d04" strokeWidth="1.2" />
        <path d="M 32,28 L 37,30 L 42,28 L 47,30 L 52,28 L 57,30 L 62,28 L 67,30 L 72,28 L 77,30 L 82,28 L 87,30 L 92,28 L 97,30 L 102,28 L 107,30 L 112,28 L 117,30 L 122,28" fill="none" stroke="#ffffff" strokeWidth="0.9" />

        {/* 중간 그릇 — 크림 + 빨간 줄무늬 */}
        <path d="M 34,17 L 118,17 L 114,24 L 38,24 Z" fill="#f4e8cc" stroke="#1a0d04" strokeWidth="1.3" strokeLinejoin="round" />
        <rect x="32" y="15" width="88" height="3" rx="1" fill="#ebd9a8" stroke="#1a0d04" strokeWidth="1.1" />
        <line x1="40" y1="20" x2="112" y2="20" stroke="#d43020" strokeWidth="1.5" opacity="0.85" />

        {/* 상단 그릇 — 핑크 */}
        <path d="M 46,10 L 106,10 L 102,17 L 50,17 Z" fill="#f4a0b0" stroke="#1a0d04" strokeWidth="1.3" strokeLinejoin="round" />
        <rect x="44" y="8" width="64" height="3" rx="1" fill="#e88898" stroke="#1a0d04" strokeWidth="1.1" />
        {/* 상단 그릇 하이라이트 */}
        <line x1="50" y1="12" x2="100" y2="12" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />
      </g>

      {/* 7. 조리대 위 — 우측 끝: 유틸리티 항아리(주황 지그재그 패턴) + 나무 스푼 3개 */}
      <g>
        {/* 항아리 본체 */}
        <path d="M 533,14 L 614,14 L 609,34 L 538,34 Z" fill="#e67a2e" stroke="#1a0d04" strokeWidth="1.8" strokeLinejoin="round" />
        {/* 항아리 상단 립 */}
        <rect x="531" y="12" width="85" height="3" rx="1" fill="#d96820" stroke="#1a0d04" strokeWidth="1.4" />
        {/* 지그재그 패턴 2줄 */}
        <path d="M 540,21 L 545,23 L 550,21 L 555,23 L 560,21 L 565,23 L 570,21 L 575,23 L 580,21 L 585,23 L 590,21 L 595,23 L 600,21 L 605,23 L 610,21" fill="none" stroke="#ffffff" strokeWidth="1" />
        <path d="M 540,28 L 545,30 L 550,28 L 555,30 L 560,28 L 565,30 L 570,28 L 575,30 L 580,28 L 585,30 L 590,28 L 595,30 L 600,28 L 605,30 L 610,28" fill="none" stroke="#ffffff" strokeWidth="1" />

        {/* 스푼 3개 — 머리 부분이 항아리 위로 올라옴 */}
        {/* 중앙: 나무 스푼 (오벌 헤드, 가장 큼) */}
        <ellipse cx="572" cy="4" rx="6" ry="4.5" fill="#c99258" stroke="#1a0d04" strokeWidth="1.3" />
        <ellipse cx="572" cy="4" rx="3.5" ry="2.5" fill="rgba(30,15,4,0.2)" />
        <rect x="570" y="7" width="4" height="9" fill="#c99258" stroke="#1a0d04" strokeWidth="1" />

        {/* 좌측: 파란 숟가락 */}
        <ellipse cx="556" cy="7" rx="4.5" ry="3.5" fill="#6ba6c8" stroke="#1a0d04" strokeWidth="1.2" />
        <rect x="554" y="9" width="3" height="7" fill="#6ba6c8" stroke="#1a0d04" strokeWidth="0.9" />

        {/* 우측: 노란 숟가락 */}
        <ellipse cx="590" cy="7" rx="4.5" ry="3.5" fill="#f2c94c" stroke="#1a0d04" strokeWidth="1.2" />
        <rect x="588" y="9" width="3" height="7" fill="#f2c94c" stroke="#1a0d04" strokeWidth="0.9" />
      </g>

      {/* 4. 조리대 — 상판/전면 합친 단일 판 (찬장보다 살짝 길게) */}
      <rect x="12" y="34" width="636" height="28" fill="url(#kitCounterFront3)" stroke="#1a0d04" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 상단 하이라이트 */}
      <line x1="18" y1="36" x2="642" y2="36" stroke="rgba(255,240,200,0.35)" strokeWidth="1" />
      {/* 하단 그림자 라인 */}
      <line x1="14" y1="60" x2="646" y2="60" stroke="rgba(30,15,4,0.45)" strokeWidth="1" />

      {/* 5. 찬장 — 문이 양쪽으로 열린 상태 */}

      {/* 5a. 중앙 본체 (back wall + interior) — 열린 문 사이로 보이는 내부
          프레임 물리적 두께: 8px → 16px (2배). 외곽은 유지, 내부 rect를 안쪽으로 이동. */}
      {/* 본체 외곽 프레임 (노랑) */}
      <rect x="150" y="62" width="360" height="148" fill="url(#kitCabFrame)" stroke="#1a0d04" strokeWidth="3" strokeLinejoin="round" />
      {/* 내부 back panel (크림 톤) — 안쪽으로 8px 더 들여서 프레임 두께 2배 */}
      <rect x="166" y="78" width="328" height="116" fill="url(#kitCabInterior)" stroke="#1a0d04" strokeWidth="2" strokeLinejoin="round" />
      {/* 천장 그림자 */}
      <rect x="166" y="78" width="328" height="14" fill="url(#kitCabShadow)" />
      {/* 좌우 벽 세로 음영 */}
      <rect x="166" y="78" width="6" height="116" fill="rgba(30,15,4,0.14)" />
      <rect x="488" y="78" width="6" height="116" fill="rgba(30,15,4,0.14)" />
      {/* 내부 선반 2단 — 상판과 동일한 빨간 톤 (interior 범위 y=78~194 안에 배치) */}
      <rect x="166" y="120" width="328" height="5" fill="url(#kitCounterFront3)" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="166" y="125" width="328" height="3" fill="rgba(30,15,4,0.3)" />
      <rect x="166" y="165" width="328" height="5" fill="url(#kitCounterFront3)" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="166" y="170" width="328" height="3" fill="rgba(30,15,4,0.3)" />

      {/* 5b. 좌측 열린 문 — 바깥쪽으로 swing
          프레임: 하늘 블루. 두께 16px (본체 프레임과 동일). */}
      <g>
        {/* 문 외곽 (trapezoid) */}
        <path d="M 150,62 L 28,74 L 40,206 L 150,210 Z" fill="url(#kitDoorFrame)" stroke="#1a0d04" strokeWidth="2.8" strokeLinejoin="round" />
        {/* 내부 글라스 패널 — 16px 안쪽으로 inset */}
        <path d="M 134,78 L 50,88 L 60,194 L 134,194 Z" fill="url(#kitDoorGlass)" stroke="#1a0d04" strokeWidth="2" strokeLinejoin="round" />
        {/* 글라스 대각선 하이라이트 */}
        <g clipPath="url(#leftDoorOpenClip)">
          <polygon points="50,194 115,78 134,78 60,194" fill="rgba(255,255,255,0.45)" />
          <polygon points="50,194 50,170 85,78 110,78" fill="rgba(255,255,255,0.28)" />
        </g>
        <defs>
          <clipPath id="leftDoorOpenClip">
            <path d="M 134,78 L 50,88 L 60,194 L 134,194 Z" />
          </clipPath>
        </defs>
        {/* 손잡이 — 자유 edge 가까이 하단 중앙 */}
        <path d="M 74,184 Q 85,194 96,184" fill="none" stroke="#1a0d04" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* 5c. 우측 열린 문 — 좌측 대칭 */}
      <g>
        <path d="M 510,62 L 632,74 L 620,206 L 510,210 Z" fill="url(#kitDoorFrame)" stroke="#1a0d04" strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M 526,78 L 610,88 L 600,194 L 526,194 Z" fill="url(#kitDoorGlass)" stroke="#1a0d04" strokeWidth="2" strokeLinejoin="round" />
        <g clipPath="url(#rightDoorOpenClip)">
          <polygon points="610,194 545,78 526,78 600,194" fill="rgba(255,255,255,0.45)" />
          <polygon points="610,194 610,170 575,78 550,78" fill="rgba(255,255,255,0.28)" />
        </g>
        <defs>
          <clipPath id="rightDoorOpenClip">
            <path d="M 526,78 L 610,88 L 600,194 L 526,194 Z" />
          </clipPath>
        </defs>
        <path d="M 564,184 Q 575,194 586,184" fill="none" stroke="#1a0d04" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* 8. 찬장 하단 베이스 라인 */}
      <line x1="28" y1="210" x2="632" y2="210" stroke="#1a0d04" strokeWidth="2" />
      {/* 바닥 그림자 */}
      <ellipse cx="330" cy="216" rx="300" ry="3" fill="rgba(30,15,5,0.25)" />
    </svg>
  );
}

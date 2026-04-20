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
    <svg viewBox="0 0 660 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
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
        {/* 찬장 외곽 프레임 (문 프레임과 동일한 코발트 블루) */}
        <linearGradient id="kitCabFrame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4988c2" />
          <stop offset="100%" stopColor="#2a6498" />
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
        {/* 내부 선반 (이전 프레임 색상 = 민트/틸 그린) */}
        <linearGradient id="kitShelfTeal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5ea89b" />
          <stop offset="100%" stopColor="#3d857a" />
        </linearGradient>
        {/* 찬장 내부 다크 인테리어 (딥 플럼/버건디) */}
        <linearGradient id="kitCabInteriorDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2638" />
          <stop offset="100%" stopColor="#2e1824" />
        </linearGradient>
        {/* 찬장 내부 구분 선반 (냉장고 creamFrontG와 동일 — 머스터드 골드) */}
        <linearGradient id="kitDividerMustard" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4c030" />
          <stop offset="100%" stopColor="#c08820" />
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

      {/* 2. 조리대 위 — 좌측: 큰 흰 솥 + 빨간 뚜껑 + 스택 폴카도트 솥
          1.25x 확대, 바닥(y=34)을 기준으로 위로 확장 */}
      <g transform="translate(200, 34) scale(1.25) translate(-200, -34)">
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

      {/* 3. 조리대 위 — 중앙: 테라코타 화분 + 녹색 잎 (1.3x, 바닥 y=34 기준) */}
      <g transform="translate(340, 34) scale(1.3) translate(-340, -34)">
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

      {/* 4. 조리대 위 — 우측: 작은 폴카도트 솥 (1.2x, 바닥 y=34 기준) */}
      <g transform="translate(439, 34) scale(1.2) translate(-439, -34)">
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

      {/* 5. 조리대 위 — 우측 끝: 작은 빨간 컵 (1.4x, 바닥 y=34 기준) */}
      <g transform="translate(497, 34) scale(1.4) translate(-497, -34)">
        {/* 컵 본체 (사다리꼴) */}
        <path d="M 488,24 L 506,24 L 503,34 L 491,34 Z" fill="#d43020" stroke="#1a0d04" strokeWidth="1.8" strokeLinejoin="round" />
        {/* 손잡이 */}
        <path d="M 506,26 Q 512,29 506,32" fill="none" stroke="#1a0d04" strokeWidth="1.8" strokeLinecap="round" />
        {/* 상단 하이라이트 */}
        <rect x="491" y="25" width="13" height="1.5" rx="0.7" fill="rgba(255,255,255,0.4)" />
      </g>

      {/* 스택 그릇 + 유틸리티 항아리 제거됨 — 3/4 축소된 상판 범위(x=91~569) 밖이었음 */}

      {/* 4. 조리대 — 상판/전면 합친 단일 판. 이전 폭 636 → 3/4인 477로 축소, 중앙 정렬. */}
      <rect x="91" y="34" width="478" height="28" fill="url(#kitCounterFront3)" stroke="#1a0d04" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 상단 하이라이트 */}
      <line x1="97" y1="36" x2="563" y2="36" stroke="rgba(255,240,200,0.35)" strokeWidth="1" />
      {/* 하단 그림자 라인 */}
      <line x1="93" y1="60" x2="567" y2="60" stroke="rgba(30,15,4,0.45)" strokeWidth="1" />

      {/* 5. 찬장 — 문이 양쪽으로 열린 상태 */}

      {/* 5a. 중앙 본체 (back wall + interior) — 열린 문 사이로 보이는 내부
          프레임 물리적 두께: 8px → 16px (2배). 외곽은 유지, 내부 rect를 안쪽으로 이동.
          내부 배경은 문 글라스(kitDoorGlass)와 동일 + 대각선 글라스 하이라이트 효과 추가. */}
      {/* 본체 외곽 프레임 (블루 유지) */}
      <rect x="150" y="62" width="360" height="148" fill="url(#kitCabFrame)" stroke="#1a0d04" strokeWidth="3" strokeLinejoin="round" />
      {/* 내부 back panel — 다크 플럼 (레퍼런스 이미지 스타일) */}
      <rect x="166" y="78" width="328" height="116" fill="url(#kitCabInteriorDark)" stroke="#1a0d04" strokeWidth="2" strokeLinejoin="round" />
      {/* 상단 부드러운 그림자 (안쪽 깊이감) */}
      <rect x="166" y="78" width="328" height="10" fill="rgba(0,0,0,0.35)" />
      {/* 셀 구분용 가로 선반 1줄 (중간) — 냉장고 선반장 머스터드 톤 */}
      <rect x="166" y="133" width="328" height="5" fill="url(#kitDividerMustard)" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="166" y="138" width="328" height="2" fill="rgba(0,0,0,0.35)" />
      {/* 세로 구분선 2개 — 3x2 셀 구조 생성, 동일 머스터드 톤 */}
      <rect x="274" y="78" width="5" height="116" fill="url(#kitDividerMustard)" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="381" y="78" width="5" height="116" fill="url(#kitDividerMustard)" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
      {/* 각 셀 내부 상단 하이라이트 (약한 빛 반사) */}
      <rect x="172" y="82" width="96" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
      <rect x="285" y="82" width="90" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
      <rect x="392" y="82" width="96" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
      <rect x="172" y="143" width="96" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
      <rect x="285" y="143" width="90" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
      <rect x="392" y="143" width="96" height="3" rx="1" fill="rgba(255,255,255,0.08)" />

      {/* 도어 제거됨 — 양쪽 문 없이 본체만 남김. */}

      {/* 8. 찬장 하단 베이스 라인 (본체 폭만) */}
      <line x1="150" y1="210" x2="510" y2="210" stroke="#1a0d04" strokeWidth="2" />
      {/* 바닥 그림자 */}
      <ellipse cx="330" cy="216" rx="200" ry="3" fill="rgba(30,15,5,0.25)" />
    </svg>
  );
}

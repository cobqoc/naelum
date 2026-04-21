'use client';

/**
 * 찬장 + 선반 — 가로형 (viewBox 640×195, minY=-30)
 * 노란 도어 찬장: SVG 가운데 (translate 230 → x=232~408, 176px wide)
 * 선반:
 *   좌 상단 (longer):  x=2~315   (y=45, 찬장 뒤 83px 오버랩)
 *   좌 하단 (shorter): x=58~315  (y=130, 찬장 뒤 83px 오버랩)
 *   우 상단 (shorter): x=325~565 (y=30)
 *   우 하단 (longer):  x=325~638 (y=120)
 */
export default function KitchenSVG() {
  return (
    <svg viewBox="0 -35 640 200" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
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
        {/* 선반 빈티지 색상 */}
        {/* 좌 상단 (올리브) */}
        <linearGradient id="kitShelfLeftTopG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#B0BA90" />
          <stop offset="100%" stopColor="#9AA080" />
        </linearGradient>
        {/* 좌 하단 (테라코타 베이지) */}
        <linearGradient id="kitShelfLeftBotG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#C8A882" />
          <stop offset="100%" stopColor="#B49068" />
        </linearGradient>
        {/* 우상단 (더스티 모브) */}
        <linearGradient id="kitShelfRTopG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#C4A0A8" />
          <stop offset="100%" stopColor="#B08C96" />
        </linearGradient>
        {/* 우하단 (슬레이트) */}
        <linearGradient id="kitShelfRBotG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#8EA2BC" />
          <stop offset="100%" stopColor="#7690AA" />
        </linearGradient>
        <linearGradient id="kitShelfShadowG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.22)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>

      {/* ══ 선반 좌 상단 (올리브, longer: x=2~315, y=45) ══ */}
      <rect x="2"   y="59" width="313" height="5" fill="url(#kitShelfShadowG)" />
      <rect x="2"   y="45" width="313" height="7" fill="url(#kitShelfLeftTopG)" />
      <rect x="2"   y="52" width="313" height="5" fill="#525C38" />
      <rect x="2"   y="57" width="313" height="2" fill="#707848" opacity="0.75" />
      <rect x="2"   y="45" width="313" height="12" fill="none" stroke="#1a0d04" strokeWidth="1.5" />
      <line x1="2"  y1="52" x2="315" y2="52" stroke="#1a0d04" strokeWidth="0.8" />
      <rect x="6"   y="46" width="305" height="2" fill="rgba(255,255,255,0.40)" />

      {/* ══ 선반 좌 하단 (테라코타 베이지, shorter: x=58~315, y=130) ══ */}
      <rect x="58"  y="144" width="257" height="5" fill="url(#kitShelfShadowG)" />
      <rect x="58"  y="130" width="257" height="7" fill="url(#kitShelfLeftBotG)" />
      <rect x="58"  y="137" width="257" height="5" fill="#7A5830" />
      <rect x="58"  y="142" width="257" height="2" fill="#926848" opacity="0.75" />
      <rect x="58"  y="130" width="257" height="12" fill="none" stroke="#1a0d04" strokeWidth="1.5" />
      <line x1="58" y1="137" x2="315" y2="137" stroke="#1a0d04" strokeWidth="0.8" />
      <rect x="62"  y="131" width="249" height="2" fill="rgba(255,255,255,0.40)" />

      {/* ══ 화분 장식 (왼쪽 하단 선반 바깥쪽 끝, cx=75, shelf top y=130) ══ */}
      <g>
        {/* 드리우는 줄기 (선반 아래) */}
        <path d="M 77,131 C 82,140 80,150 77,158"
              fill="none" stroke="#2E6218" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 72,131 C 67,140 69,150 72,158"
              fill="none" stroke="#2E6218" strokeWidth="1.6" strokeLinecap="round" />

        {/* 아래 잎들 */}
        <ellipse cx="81" cy="148" rx="9"  ry="4.5" transform="rotate(38 81 148)"  fill="#3C7A20" />
        <ellipse cx="77" cy="157" rx="7"  ry="3.5" transform="rotate(10 77 157)"  fill="#4A8A28" />
        <ellipse cx="68" cy="149" rx="9"  ry="4.5" transform="rotate(-38 68 149)" fill="#3C7A20" />
        <ellipse cx="72" cy="157" rx="7"  ry="3.5" transform="rotate(-10 72 157)" fill="#4A8A28" />

        {/* 위쪽 줄기 */}
        <path d="M 73,113 C 70,104 72,95 68,88"
              fill="none" stroke="#2E6218" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 77,113 C 80,104 78,95 82,88"
              fill="none" stroke="#2E6218" strokeWidth="1.6" strokeLinecap="round" />

        {/* 위쪽 잎들 */}
        <ellipse cx="67"  cy="95"  rx="10" ry="5" transform="rotate(-32 67 95)"   fill="#3C7A20" />
        <ellipse cx="70"  cy="106" rx="9"  ry="5" transform="rotate(16 70 106)"   fill="#4A8A28" />
        <ellipse cx="83"  cy="94"  rx="10" ry="5" transform="rotate(32 83 94)"    fill="#3C7A20" />
        <ellipse cx="80"  cy="105" rx="9"  ry="5" transform="rotate(-16 80 105)"  fill="#4A8A28" />

        {/* 화분 몸체 */}
        <path d="M 68,130 L 65,113 L 85,113 L 82,130 Z" fill="#C4622A" />
        <path d="M 82,130 L 85,113 L 82,113 L 79,130 Z" fill="rgba(0,0,0,0.20)" />
        <path d="M 68,130 L 65,113 L 68,113 L 71,130 Z" fill="rgba(255,255,255,0.15)" />
        <path d="M 68,130 L 65,113 L 85,113 L 82,130 Z"
              fill="none" stroke="#1a0d04" strokeWidth="1" />
        {/* 림 */}
        <rect x="63" y="110" width="24" height="4" rx="1" fill="#D47040" stroke="#1a0d04" strokeWidth="0.8" />
        {/* 흙 */}
        <ellipse cx="75" cy="112" rx="8" ry="2.2" fill="#4A2E14" />
      </g>

      {/* ══ 선반 우 상단 (더스티 모브, shorter: x=325~565) ══ */}
      <rect x="325" y="44" width="240" height="5" fill="url(#kitShelfShadowG)" />
      <rect x="325" y="30" width="240" height="7" fill="url(#kitShelfRTopG)" />
      <rect x="325" y="37" width="240" height="5" fill="#7A5060" />
      <rect x="325" y="42" width="240" height="2" fill="#926878" opacity="0.75" />
      <rect x="325" y="30" width="240" height="12" fill="none" stroke="#1a0d04" strokeWidth="1.5" />
      <line x1="325" y1="37" x2="565" y2="37" stroke="#1a0d04" strokeWidth="0.8" />
      <rect x="329" y="31" width="232" height="2" fill="rgba(255,255,255,0.40)" />

      {/* ══ 선반 우 하단 (슬레이트, longer: x=325~638) ══ */}
      <rect x="325" y="134" width="313" height="5" fill="url(#kitShelfShadowG)" />
      <rect x="325" y="120" width="313" height="7" fill="url(#kitShelfRBotG)" />
      <rect x="325" y="127" width="313" height="5" fill="#384868" />
      <rect x="325" y="132" width="313" height="2" fill="#566480" opacity="0.75" />
      <rect x="325" y="120" width="313" height="12" fill="none" stroke="#1a0d04" strokeWidth="1.5" />
      <line x1="325" y1="127" x2="638" y2="127" stroke="#1a0d04" strokeWidth="0.8" />
      <rect x="329" y="121" width="305" height="2" fill="rgba(255,255,255,0.40)" />

      {/* ══ 선반 포인트 장식 ══ */}

      {/* 빨간 주전자 (좌상단 선반 중앙, cx=158, shelf y=45) */}
      <g>
        <circle cx="158" cy="12" r="3.5" fill="#AA2A1A" stroke="#1a0d04" strokeWidth="1" />
        <ellipse cx="158" cy="17" rx="12" ry="4"  fill="#CC3828" stroke="#1a0d04" strokeWidth="1.2" />
        <ellipse cx="158" cy="31" rx="16" ry="14" fill="#E03A28" stroke="#1a0d04" strokeWidth="1.5" />
        <path d="M 172,24 C 180,21 186,19 188,23 C 186,27 178,29 174,29 Z"
              fill="#CC3020" stroke="#1a0d04" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M 142,23 C 132,28 132,37 142,40"
              fill="none" stroke="#1a0d04" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="158" cy="45" rx="11" ry="3" fill="#B02E20" stroke="#1a0d04" strokeWidth="1" />
        <ellipse cx="150" cy="24" rx="5" ry="7" fill="rgba(255,255,255,0.18)" />
      </g>

      {/* 소주병 (우상단 선반 오른쪽 끝, cx=553, shelf y=30) */}
      <g>
        <rect x="549" y="1"  width="8"  height="5"  rx="1.5" fill="#CC2020" stroke="#1a0d04" strokeWidth="1" />
        <rect x="551" y="5"  width="4"  height="7"  rx="0.5" fill="#4A8840" stroke="#1a0d04" strokeWidth="1" />
        <path d="M 547,11 L 551,11 L 551,12 L 559,12 L 559,11 L 563,11 L 560,13 L 546,13 Z"
              fill="#4A8840" stroke="#1a0d04" strokeWidth="0.8" />
        <rect x="546" y="12" width="14" height="18" rx="1.5" fill="#4A8840" stroke="#1a0d04" strokeWidth="1.2" />
        <rect x="547" y="16" width="12" height="9"  rx="0.5" fill="rgba(255,255,255,0.60)" />
        <rect x="548" y="18" width="10" height="1.5" rx="0.3" fill="rgba(0,60,160,0.40)" />
        <rect x="549" y="21" width="8"  height="1"   rx="0.3" fill="rgba(0,60,160,0.28)" />
        <rect x="547" y="13" width="3"  height="13" rx="0.5" fill="rgba(255,255,255,0.25)" />
      </g>

      {/* 초록 캐서롤 (우하단 선반 중간, cx=505, shelf y=120) */}
      <g>
        <circle cx="505" cy="101" r="3.5" fill="#1a0d04" />
        <ellipse cx="505" cy="106" rx="19" ry="5"  fill="#5EAA6A" stroke="#1a0d04" strokeWidth="1.5" />
        <rect x="486"  y="106" width="38" height="3" fill="#4A9256" />
        <rect x="487"  y="108" width="36" height="12" rx="2" fill="#6ABE78" stroke="#1a0d04" strokeWidth="1.5" />
        <rect x="475"  y="111" width="13" height="6"  rx="2" fill="#4A9256" stroke="#1a0d04" strokeWidth="1.2" />
        <rect x="527"  y="111" width="13" height="6"  rx="2" fill="#4A9256" stroke="#1a0d04" strokeWidth="1.2" />
        <rect x="490"  y="118" width="30" height="3"  rx="1" fill="#3A7844" />
        <rect x="488"  y="109" width="8"  height="6"  rx="0.5" fill="rgba(255,255,255,0.20)" />
      </g>

      {/* ══ 노란 도어 찬장 — 가운데 배치 (translate 230, 선반 위에 렌더) ══ */}
      <g transform="translate(230, 0)">
        <path d="M 16,2 Q 2,2 2,18 L 2,162 L 178,162 L 178,18 Q 178,2 164,2 Z"
              fill="url(#kitDoorG)" stroke="#1a0d04" strokeWidth="3" strokeLinejoin="round" />

        {/* 하이라이트 */}
        <rect x="9"   y="6"  width="162" height="5"  rx="2" fill="rgba(255,255,255,0.30)" />
        <rect x="4"   y="10" width="4"   height="146" rx="2" fill="rgba(255,255,255,0.20)" />
        <rect x="173" y="10" width="4"   height="146" rx="2" fill="rgba(0,0,0,0.22)" />

        {/* 나뭇결 */}
        {[30, 65, 100, 130].map(y => (
          <line key={y} x1="6" y1={y} x2="175" y2={y}
                stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
        ))}

        {/* 깊이감 */}
        <rect x="2"   y="2" width="18"  height="160" fill="url(#kitDepthL)" />
        <rect x="160" y="2" width="18"  height="160" fill="url(#kitDepthR)" />
        <rect x="2"   y="2" width="176" height="18"  fill="url(#kitDepthT)" />

        {/* 크라운 몰딩 */}
        <rect x="9"  y="8" width="162" height="10" rx="2" fill="rgba(255,255,255,0.10)" />
        <rect x="9"  y="8" width="162" height="2"  rx="1" fill="rgba(255,255,255,0.22)" />

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
        <rect x="20" y="18" width="138" height="134" rx="4"
              fill="url(#kitPanelG)" stroke="#1a0d04" strokeWidth="2" strokeLinejoin="round" />
        <rect x="24" y="22" width="130" height="126" rx="2"
              fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" />
        <rect x="20" y="18" width="138" height="22"  rx="4" fill="url(#kitInsetT)" />
        <rect x="20" y="18" width="20"  height="134" rx="4" fill="url(#kitInsetL)" />
        <rect x="26" y="22" width="124" height="2"   rx="1" fill="rgba(255,255,255,0.20)" />

        {/* 손잡이 */}
        <ellipse cx="170" cy="78" rx="7" ry="2.2"
                 fill="url(#kitKnobFront)" stroke="#1a0d04" strokeWidth="1.5" />
        <circle cx="170" cy="83" r="7"   fill="#1a0d04" />
        <circle cx="170" cy="83" r="5.8" fill="url(#kitKnobG)" stroke="#1a0d04" strokeWidth="1.5" />
        <circle cx="167" cy="80" r="2.2" fill="rgba(255,255,255,0.60)" />
      </g>

      {/* ══ 선반장 위 장식 (구 디자인 복원) ══ */}

      {/* A. 흰 솥 + 빨간 뚜껑 + 작은 솥 스택 (cx≈265) */}
      <g>
        {/* 작은 솥 (맨 위) */}
        <rect x="253" y="-29" width="24" height="8" rx="1.5"
              fill="#2a2a2a" stroke="#1a0d04" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="259" cy="-25" r="1.1" fill="#f5f1e8" />
        <circle cx="265" cy="-27" r="1.1" fill="#f5f1e8" />
        <circle cx="271" cy="-25" r="1.1" fill="#f5f1e8" />
        {/* 빨간 뚜껑 */}
        <rect x="245" y="-21" width="40" height="10" rx="2"
              fill="#d43020" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="248" y="-20" width="34" height="2" rx="1" fill="rgba(255,255,255,0.40)" />
        <circle cx="265" cy="-22" r="2" fill="#1a0d04" />
        {/* 흰 솥 몸체 */}
        <rect x="247" y="-11" width="36" height="13" rx="2"
              fill="#f5f1e8" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 옆 고리 손잡이 */}
        <path d="M 242,-8 Q 237,-3 242,1"
              fill="none" stroke="#1a0d04" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 283,-8 Q 288,-3 283,1"
              fill="none" stroke="#1a0d04" strokeWidth="1.5" strokeLinecap="round" />
        {/* 바닥 */}
        <rect x="249" y="1" width="32" height="2" rx="1" fill="#d8cdb8" />
      </g>

      {/* B. 테라코타 화분 + 잎 (cx≈320) */}
      <g>
        {/* 잎 3장 */}
        <ellipse cx="311" cy="-19" rx="4" ry="8"
                 fill="#4f8f3d" stroke="#1a0d04" strokeWidth="1.2"
                 transform="rotate(-18 311 -19)" />
        <ellipse cx="320" cy="-22" rx="5" ry="9"
                 fill="#3d7a2e" stroke="#1a0d04" strokeWidth="1.2" />
        <ellipse cx="329" cy="-19" rx="4" ry="8"
                 fill="#4f8f3d" stroke="#1a0d04" strokeWidth="1.2"
                 transform="rotate(18 329 -19)" />
        {/* 잎맥 */}
        <line x1="311" y1="-26" x2="311" y2="-12"
              stroke="#1a0d04" strokeWidth="0.7" opacity="0.5"
              transform="rotate(-18 311 -19)" />
        <line x1="320" y1="-30" x2="320" y2="-13"
              stroke="#1a0d04" strokeWidth="0.7" opacity="0.5" />
        <line x1="329" y1="-26" x2="329" y2="-12"
              stroke="#1a0d04" strokeWidth="0.7" opacity="0.5"
              transform="rotate(18 329 -19)" />
        {/* 화분 사다리꼴 */}
        <path d="M 308,-10 L 332,-10 L 328,2 L 312,2 Z"
              fill="#d9793e" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 화분 상단 립 */}
        <rect x="305" y="-14" width="30" height="5" rx="1"
              fill="#c06528" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
      </g>

      {/* C. 폴카도트 솥 + 빨간 컵 (cx≈371) */}
      <g>
        {/* 폴카도트 솥 몸체 */}
        <rect x="355" y="-9" width="28" height="11" rx="2"
              fill="#4a4a4a" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="361" cy="-5" r="1.2" fill="#f5f1e8" />
        <circle cx="369" cy="-3" r="1.2" fill="#f5f1e8" />
        <circle cx="377" cy="-5" r="1.2" fill="#f5f1e8" />
        {/* 측면 손잡이 */}
        <path d="M 350,-6 Q 346,-2 350,2"
              fill="none" stroke="#1a0d04" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 383,-6 Q 387,-2 383,2"
              fill="none" stroke="#1a0d04" strokeWidth="1.5" strokeLinecap="round" />
        {/* 빨간 뚜껑 */}
        <rect x="353" y="-18" width="32" height="10" rx="2"
              fill="#d43020" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="356" y="-17" width="26" height="2" rx="1" fill="rgba(255,255,255,0.40)" />
        <circle cx="369" cy="-19" r="1.8" fill="#1a0d04" />
        {/* 작은 빨간 컵 */}
        <path d="M 390,-6 L 404,-6 L 402,2 L 392,2 Z"
              fill="#d43020" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M 404,-4 Q 409,-1 404,1"
              fill="none" stroke="#1a0d04" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="392" y="-5" width="10" height="1.5" rx="0.7" fill="rgba(255,255,255,0.40)" />
      </g>

    </svg>
  );
}

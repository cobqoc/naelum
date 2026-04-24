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
      {/* 메탈 브래킷 (좌·우 끝, 선반 아래쪽 L자) */}
      <g stroke="#1a0d04" strokeWidth="0.8" strokeLinejoin="round">
        <path d="M 28,57 L 28,72 L 20,72 L 20,57 Z" fill="#6a5848"/>
        <path d="M 20,72 L 28,72 L 33,64 L 23,64 Z" fill="#8a7060"/>
        <path d="M 290,57 L 290,72 L 298,72 L 298,57 Z" fill="#6a5848"/>
        <path d="M 290,72 L 298,72 L 295,64 L 287,64 Z" fill="#8a7060"/>
      </g>
      {/* 브래킷 나사 */}
      <circle cx="24" cy="61" r="0.9" fill="#1a0d04"/>
      <circle cx="24" cy="61" r="0.4" fill="rgba(255,245,220,0.6)"/>
      <circle cx="294" cy="61" r="0.9" fill="#1a0d04"/>
      <circle cx="294" cy="61" r="0.4" fill="rgba(255,245,220,0.6)"/>
      {/* 선반 측면 wood end cap — 노출된 목재 단면 */}
      <path d="M 2,45 L 6,42 L 6,64 L 2,64 Z" fill="#5a4a2a" stroke="#1a0d04" strokeWidth="0.6"/>
      <path d="M 315,45 L 311,42 L 311,64 L 315,64 Z" fill="#5a4a2a" stroke="#1a0d04" strokeWidth="0.6"/>

      {/* ══ 선반 좌 하단 (테라코타 베이지, shorter: x=58~315, y=130) ══ */}
      <rect x="58"  y="144" width="257" height="5" fill="url(#kitShelfShadowG)" />
      <rect x="58"  y="130" width="257" height="7" fill="url(#kitShelfLeftBotG)" />
      <rect x="58"  y="137" width="257" height="5" fill="#7A5830" />
      <rect x="58"  y="142" width="257" height="2" fill="#926848" opacity="0.75" />
      <rect x="58"  y="130" width="257" height="12" fill="none" stroke="#1a0d04" strokeWidth="1.5" />
      <line x1="58" y1="137" x2="315" y2="137" stroke="#1a0d04" strokeWidth="0.8" />
      <rect x="62"  y="131" width="249" height="2" fill="rgba(255,255,255,0.40)" />
      {/* 브래킷 */}
      <g stroke="#1a0d04" strokeWidth="0.8" strokeLinejoin="round">
        <path d="M 110,142 L 110,157 L 102,157 L 102,142 Z" fill="#6a5848"/>
        <path d="M 102,157 L 110,157 L 115,149 L 105,149 Z" fill="#8a7060"/>
        <path d="M 290,142 L 290,157 L 298,157 L 298,142 Z" fill="#6a5848"/>
        <path d="M 290,157 L 298,157 L 295,149 L 287,149 Z" fill="#8a7060"/>
      </g>
      <circle cx="106" cy="146" r="0.9" fill="#1a0d04"/>
      <circle cx="106" cy="146" r="0.4" fill="rgba(255,245,220,0.6)"/>
      <circle cx="294" cy="146" r="0.9" fill="#1a0d04"/>
      <circle cx="294" cy="146" r="0.4" fill="rgba(255,245,220,0.6)"/>
      {/* wood end cap */}
      <path d="M 58,130 L 62,127 L 62,149 L 58,149 Z" fill="#5a4a2a" stroke="#1a0d04" strokeWidth="0.6"/>
      <path d="M 315,130 L 311,127 L 311,149 L 315,149 Z" fill="#5a4a2a" stroke="#1a0d04" strokeWidth="0.6"/>

      {/* ══ 화분 장식 (왼쪽 하단 선반 바깥쪽 끝, cx=75, shelf top y=130) ══ */}
      {/* 화분 드롭 섀도우 */}
      <ellipse cx="78" cy="130.5" rx="14" ry="1.3" fill="rgba(0,0,0,0.32)" />
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
        {/* 화분 페인트 데코 라인 (빈티지 스타일) */}
        <line x1="66" y1="119" x2="84" y2="119" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
        <line x1="67" y1="124" x2="83" y2="124" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5"/>
        {/* 림 */}
        <rect x="63" y="110" width="24" height="4" rx="1" fill="#D47040" stroke="#1a0d04" strokeWidth="0.8" />
        {/* 림 상단 하이라이트 */}
        <rect x="64" y="110.5" width="22" height="1" rx="0.5" fill="rgba(255,255,255,0.4)"/>
        {/* 흙 */}
        <ellipse cx="75" cy="112" rx="8" ry="2.2" fill="#4A2E14" />
        {/* 흙 위 작은 질감 (알갱이) */}
        <circle cx="72" cy="111.5" r="0.5" fill="#6a4220"/>
        <circle cx="78" cy="112.5" r="0.4" fill="#6a4220"/>
        <circle cx="75" cy="111" r="0.4" fill="#8a5a30"/>
      </g>

      {/* ══ 선반 우 상단 (더스티 모브, shorter: x=325~565) ══ */}
      <rect x="325" y="44" width="240" height="5" fill="url(#kitShelfShadowG)" />
      <rect x="325" y="30" width="240" height="7" fill="url(#kitShelfRTopG)" />
      <rect x="325" y="37" width="240" height="5" fill="#7A5060" />
      <rect x="325" y="42" width="240" height="2" fill="#926878" opacity="0.75" />
      <rect x="325" y="30" width="240" height="12" fill="none" stroke="#1a0d04" strokeWidth="1.5" />
      <line x1="325" y1="37" x2="565" y2="37" stroke="#1a0d04" strokeWidth="0.8" />
      <rect x="329" y="31" width="232" height="2" fill="rgba(255,255,255,0.40)" />
      {/* 브래킷 */}
      <g stroke="#1a0d04" strokeWidth="0.8" strokeLinejoin="round">
        <path d="M 352,42 L 352,57 L 344,57 L 344,42 Z" fill="#6a5848"/>
        <path d="M 344,57 L 352,57 L 357,49 L 347,49 Z" fill="#8a7060"/>
        <path d="M 540,42 L 540,57 L 548,57 L 548,42 Z" fill="#6a5848"/>
        <path d="M 540,57 L 548,57 L 545,49 L 537,49 Z" fill="#8a7060"/>
      </g>
      <circle cx="348" cy="46" r="0.9" fill="#1a0d04"/>
      <circle cx="348" cy="46" r="0.4" fill="rgba(255,245,220,0.6)"/>
      <circle cx="544" cy="46" r="0.9" fill="#1a0d04"/>
      <circle cx="544" cy="46" r="0.4" fill="rgba(255,245,220,0.6)"/>
      {/* wood end cap */}
      <path d="M 325,30 L 329,27 L 329,49 L 325,49 Z" fill="#5a4a2a" stroke="#1a0d04" strokeWidth="0.6"/>
      <path d="M 565,30 L 561,27 L 561,49 L 565,49 Z" fill="#5a4a2a" stroke="#1a0d04" strokeWidth="0.6"/>

      {/* ══ 선반 우 하단 (슬레이트, longer: x=325~638) ══ */}
      <rect x="325" y="134" width="313" height="5" fill="url(#kitShelfShadowG)" />
      <rect x="325" y="120" width="313" height="7" fill="url(#kitShelfRBotG)" />
      <rect x="325" y="127" width="313" height="5" fill="#384868" />
      <rect x="325" y="132" width="313" height="2" fill="#566480" opacity="0.75" />
      <rect x="325" y="120" width="313" height="12" fill="none" stroke="#1a0d04" strokeWidth="1.5" />
      <line x1="325" y1="127" x2="638" y2="127" stroke="#1a0d04" strokeWidth="0.8" />
      <rect x="329" y="121" width="305" height="2" fill="rgba(255,255,255,0.40)" />
      {/* 브래킷 */}
      <g stroke="#1a0d04" strokeWidth="0.8" strokeLinejoin="round">
        <path d="M 352,132 L 352,147 L 344,147 L 344,132 Z" fill="#6a5848"/>
        <path d="M 344,147 L 352,147 L 357,139 L 347,139 Z" fill="#8a7060"/>
        <path d="M 610,132 L 610,147 L 618,147 L 618,132 Z" fill="#6a5848"/>
        <path d="M 610,147 L 618,147 L 615,139 L 607,139 Z" fill="#8a7060"/>
      </g>
      <circle cx="348" cy="136" r="0.9" fill="#1a0d04"/>
      <circle cx="348" cy="136" r="0.4" fill="rgba(255,245,220,0.6)"/>
      <circle cx="614" cy="136" r="0.9" fill="#1a0d04"/>
      <circle cx="614" cy="136" r="0.4" fill="rgba(255,245,220,0.6)"/>
      {/* wood end cap */}
      <path d="M 325,120 L 329,117 L 329,139 L 325,139 Z" fill="#5a4a2a" stroke="#1a0d04" strokeWidth="0.6"/>
      <path d="M 638,120 L 634,117 L 634,139 L 638,139 Z" fill="#5a4a2a" stroke="#1a0d04" strokeWidth="0.6"/>

      {/* ══ 선반 포인트 장식 ══ */}

      {/* 빨간 주전자 (좌상단 선반 중앙, cx=158, shelf y=45) */}
      {/* 드롭 섀도우 */}
      <ellipse cx="162" cy="45.5" rx="15" ry="1.6" fill="rgba(0,0,0,0.38)" />
      <g>
        <circle cx="158" cy="12" r="3.5" fill="#AA2A1A" stroke="#1a0d04" strokeWidth="1" />
        <ellipse cx="158" cy="17" rx="12" ry="4"  fill="#CC3828" stroke="#1a0d04" strokeWidth="1.2" />
        {/* 뚜껑 내림 섀도우 */}
        <ellipse cx="158" cy="18.5" rx="11" ry="1.2" fill="rgba(0,0,0,0.3)"/>
        <ellipse cx="158" cy="31" rx="16" ry="14" fill="#E03A28" stroke="#1a0d04" strokeWidth="1.5" />
        {/* 몸체 수직 specular */}
        <path d="M 149,22 Q 146,30 150,42" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.6" strokeLinecap="round"/>
        {/* 몸체 우측 shading */}
        <path d="M 170,24 Q 175,30 172,42" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M 172,24 C 180,21 186,19 188,23 C 186,27 178,29 174,29 Z"
              fill="#CC3020" stroke="#1a0d04" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M 142,23 C 132,28 132,37 142,40"
              fill="none" stroke="#1a0d04" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="158" cy="45" rx="11" ry="3" fill="#B02E20" stroke="#1a0d04" strokeWidth="1" />
        <ellipse cx="150" cy="24" rx="5" ry="7" fill="rgba(255,255,255,0.25)" />
        {/* 뚜껑 손잡이 하이라이트 */}
        <circle cx="156.5" cy="10.5" r="1" fill="rgba(255,255,255,0.5)"/>
      </g>

      {/* 소주병 (우상단 선반 오른쪽 끝, cx=553, shelf y=30) */}
      {/* 드롭 섀도우 */}
      <ellipse cx="555" cy="30.5" rx="11" ry="1.2" fill="rgba(0,0,0,0.35)" />
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
      {/* 드롭 섀도우 */}
      <ellipse cx="509" cy="120.5" rx="24" ry="1.8" fill="rgba(0,0,0,0.4)" />
      <g>
        {/* 손잡이 디테일 강화 */}
        <circle cx="505" cy="101" r="3.5" fill="#1a0d04" />
        <circle cx="505" cy="101" r="2" fill="#3a3a3a"/>
        <circle cx="504" cy="100" r="0.8" fill="rgba(255,255,255,0.4)"/>
        <ellipse cx="505" cy="106" rx="19" ry="5"  fill="#5EAA6A" stroke="#1a0d04" strokeWidth="1.5" />
        {/* 뚜껑 상단 하이라이트 */}
        <ellipse cx="505" cy="103.5" rx="14" ry="1.2" fill="rgba(255,255,255,0.3)"/>
        <rect x="486"  y="106" width="38" height="3" fill="#4A9256" />
        <rect x="487"  y="108" width="36" height="12" rx="2" fill="#6ABE78" stroke="#1a0d04" strokeWidth="1.5" />
        {/* 몸체 수직 specular */}
        <rect x="492" y="109" width="4" height="10" fill="rgba(255,255,255,0.2)" rx="0.5"/>
        <rect x="515" y="109" width="2" height="10" fill="rgba(0,0,0,0.2)" rx="0.5"/>
        <rect x="475"  y="111" width="13" height="6"  rx="2" fill="#4A9256" stroke="#1a0d04" strokeWidth="1.2" />
        <rect x="477" y="112" width="9" height="1.5" fill="rgba(255,255,255,0.22)" rx="0.5"/>
        <rect x="527"  y="111" width="13" height="6"  rx="2" fill="#4A9256" stroke="#1a0d04" strokeWidth="1.2" />
        <rect x="529" y="112" width="9" height="1.5" fill="rgba(255,255,255,0.22)" rx="0.5"/>
        <rect x="490"  y="118" width="30" height="3"  rx="1" fill="#3A7844" />
        <rect x="488"  y="109" width="8"  height="6"  rx="0.5" fill="rgba(255,255,255,0.20)" />
      </g>

      {/* ══ 노란 도어 찬장 — 가운데 배치 (translate 230, 선반 위에 렌더) ══ */}
      <g transform="translate(230, 0)">
        {/* 벽에 드리우는 캐스트 섀도우 (캐비닛 뒤쪽) */}
        <rect x="5" y="6" width="178" height="160" rx="16" fill="rgba(0,0,0,0.28)" />
        <path d="M 16,2 Q 2,2 2,18 L 2,162 L 178,162 L 178,18 Q 178,2 164,2 Z"
              fill="url(#kitDoorG)" stroke="#1a0d04" strokeWidth="3" strokeLinejoin="round" />
        {/* 캐비닛 상단 조명 반사 (천장/팬던트 조명 받음) */}
        <path d="M 16,2 Q 2,2 2,18 L 178,18 Q 178,2 164,2 Z" fill="rgba(255,240,200,0.1)" pointerEvents="none"/>

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
        {/* 크라운 몰딩이 도어에 드리우는 섀도우 */}
        <rect x="9"  y="18" width="162" height="3" fill="rgba(0,0,0,0.22)"/>
        <rect x="9"  y="18" width="162" height="0.8" fill="rgba(0,0,0,0.3)"/>

        {/* 추가 우드그레인 — 기존 라인(30/65/100/130) 사이 보강 */}
        <line x1="12" y1="22"  x2="168" y2="22"  stroke="rgba(0,0,0,0.06)" strokeWidth="0.6"/>
        <line x1="14" y1="48"  x2="170" y2="48"  stroke="rgba(0,0,0,0.05)" strokeWidth="0.6"/>
        <line x1="10" y1="82"  x2="172" y2="82"  stroke="rgba(0,0,0,0.05)" strokeWidth="0.7"/>
        <line x1="12" y1="115" x2="170" y2="115" stroke="rgba(0,0,0,0.06)" strokeWidth="0.6"/>
        <line x1="14" y1="148" x2="170" y2="148" stroke="rgba(0,0,0,0.05)" strokeWidth="0.6"/>
        {/* 우드그레인 노트(옹이) — 매우 미세 */}
        <ellipse cx="55" cy="75" rx="2.2" ry="0.7" fill="rgba(0,0,0,0.08)"/>
        <ellipse cx="120" cy="40" rx="1.8" ry="0.5" fill="rgba(0,0,0,0.06)"/>
        <ellipse cx="90" cy="135" rx="2" ry="0.6" fill="rgba(0,0,0,0.07)"/>

        {/* 경첩 1 */}
        <rect x="2" y="28" width="10" height="22" rx="2"
              fill="url(#kitHingeG)" stroke="#1a0d04" strokeWidth="1" />
        {/* 경첩 중앙 축봉 (barrel) */}
        <rect x="2" y="32" width="10" height="3" fill="rgba(0,0,0,0.35)"/>
        <rect x="2" y="44" width="10" height="3" fill="rgba(0,0,0,0.35)"/>
        <rect x="2" y="37" width="10" height="5" fill="rgba(255,220,180,0.15)"/>
        <circle cx="7" cy="33" r="1.8" fill="#1a0d04" />
        <circle cx="7" cy="33" r="0.8" fill="rgba(255,255,255,0.45)" />
        <circle cx="7" cy="46" r="1.8" fill="#1a0d04" />
        <circle cx="7" cy="46" r="0.8" fill="rgba(255,255,255,0.45)" />
        {/* 경첩 섀도우 (도어에 드리우는) */}
        <rect x="12" y="28" width="3" height="22" fill="rgba(0,0,0,0.3)"/>

        {/* 경첩 2 */}
        <rect x="2" y="108" width="10" height="22" rx="2"
              fill="url(#kitHingeG)" stroke="#1a0d04" strokeWidth="1" />
        <rect x="2" y="112" width="10" height="3" fill="rgba(0,0,0,0.35)"/>
        <rect x="2" y="124" width="10" height="3" fill="rgba(0,0,0,0.35)"/>
        <rect x="2" y="117" width="10" height="5" fill="rgba(255,220,180,0.15)"/>
        <circle cx="7" cy="113" r="1.8" fill="#1a0d04" />
        <circle cx="7" cy="113" r="0.8" fill="rgba(255,255,255,0.45)" />
        <circle cx="7" cy="126" r="1.8" fill="#1a0d04" />
        <circle cx="7" cy="126" r="0.8" fill="rgba(255,255,255,0.45)" />
        <rect x="12" y="108" width="3" height="22" fill="rgba(0,0,0,0.3)"/>

        {/* 내부 패널 */}
        <rect x="20" y="18" width="138" height="134" rx="4"
              fill="url(#kitPanelG)" stroke="#1a0d04" strokeWidth="2" strokeLinejoin="round" />
        <rect x="24" y="22" width="130" height="126" rx="2"
              fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" />
        <rect x="20" y="18" width="138" height="22"  rx="4" fill="url(#kitInsetT)" />
        <rect x="20" y="18" width="20"  height="134" rx="4" fill="url(#kitInsetL)" />
        <rect x="26" y="22" width="124" height="2"   rx="1" fill="rgba(255,255,255,0.20)" />
        {/* 중앙 인셋 패널 — 클래식 샤커 스타일 도어 프레임 */}
        <rect x="30" y="28" width="118" height="114" rx="2.5"
              fill="none" stroke="rgba(0,0,0,0.32)" strokeWidth="1.2" />
        <rect x="32" y="30" width="114" height="110" rx="2"
              fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.7" />
        {/* 인셋 패널 내부 섀도우 (오목함) */}
        <rect x="32" y="30" width="114" height="5" fill="rgba(0,0,0,0.22)"/>
        <rect x="32" y="30" width="4"   height="110" fill="rgba(0,0,0,0.18)"/>
        <rect x="142" y="30" width="4"  height="110" fill="rgba(255,255,255,0.08)"/>
        <rect x="32" y="135" width="114" height="5"  fill="rgba(255,255,255,0.06)"/>

        {/* 손잡이 */}
        <ellipse cx="170" cy="78" rx="7" ry="2.2"
                 fill="url(#kitKnobFront)" stroke="#1a0d04" strokeWidth="1.5" />
        <circle cx="170" cy="83" r="7"   fill="#1a0d04" />
        <circle cx="170" cy="83" r="5.8" fill="url(#kitKnobG)" stroke="#1a0d04" strokeWidth="1.5" />
        <circle cx="167" cy="80" r="2.2" fill="rgba(255,255,255,0.60)" />
        {/* 손잡이 림 라이트 (우하단 반달 하이라이트) */}
        <path d="M 174.5,85 A 5.6 5.6 0 0 1 172,87.5" fill="none" stroke="rgba(255,220,150,0.65)" strokeWidth="0.9" strokeLinecap="round"/>
        {/* 손잡이 바닥 드롭 섀도우 */}
        <ellipse cx="170" cy="91" rx="7.5" ry="1.2" fill="rgba(0,0,0,0.3)" />
      </g>

      {/* ══ 선반장 위 장식 (구 디자인 복원) ══ */}

      {/* 찬장 상단(크라운 몰딩 바로 위 y=2)에 소품 3개가 놓임 — 각각 드롭 섀도우 */}
      <ellipse cx="269" cy="2.5" rx="22" ry="1.8" fill="rgba(0,0,0,0.35)" />
      <ellipse cx="320" cy="2.5" rx="16" ry="1.3" fill="rgba(0,0,0,0.3)" />
      <ellipse cx="373" cy="2.5" rx="22" ry="1.5" fill="rgba(0,0,0,0.35)" />

      {/* A. 흰 솥 + 빨간 뚜껑 + 작은 솥 스택 (cx≈265) */}
      <g>
        {/* 작은 솥 (맨 위) */}
        <rect x="253" y="-29" width="24" height="8" rx="1.5"
              fill="#2a2a2a" stroke="#1a0d04" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="259" cy="-25" r="1.1" fill="#f5f1e8" />
        <circle cx="265" cy="-27" r="1.1" fill="#f5f1e8" />
        <circle cx="271" cy="-25" r="1.1" fill="#f5f1e8" />
        {/* 작은 솥 상단 specular */}
        <rect x="255" y="-28" width="20" height="1.2" fill="rgba(255,255,255,0.25)" rx="0.5"/>
        {/* 빨간 뚜껑 */}
        <rect x="245" y="-21" width="40" height="10" rx="2"
              fill="#d43020" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="248" y="-20" width="34" height="2" rx="1" fill="rgba(255,255,255,0.40)" />
        {/* 우측 shading */}
        <rect x="280" y="-20" width="3" height="8" fill="rgba(0,0,0,0.22)" rx="0.5"/>
        <circle cx="265" cy="-22" r="2" fill="#1a0d04" />
        <circle cx="264.3" cy="-22.5" r="0.6" fill="rgba(255,255,255,0.5)"/>
        {/* 뚜껑-몸체 섀도우 */}
        <rect x="247" y="-12" width="36" height="1.5" fill="rgba(0,0,0,0.25)"/>
        {/* 흰 솥 몸체 */}
        <rect x="247" y="-11" width="36" height="13" rx="2"
              fill="#f5f1e8" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 몸체 수직 specular */}
        <rect x="251" y="-9" width="3" height="10" fill="rgba(255,255,255,0.5)" rx="0.5"/>
        <rect x="278" y="-10" width="3" height="11" fill="rgba(0,0,0,0.15)" rx="0.5"/>
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
        {/* 잎 하이라이트 (좌상단 광원) */}
        <ellipse cx="310" cy="-21" rx="1.5" ry="4" fill="rgba(255,255,255,0.22)" transform="rotate(-18 310 -21)"/>
        <ellipse cx="319" cy="-24" rx="1.8" ry="5" fill="rgba(255,255,255,0.22)"/>
        <ellipse cx="328" cy="-21" rx="1.5" ry="4" fill="rgba(255,255,255,0.18)" transform="rotate(18 328 -21)"/>
        {/* 잎맥 */}
        <line x1="311" y1="-26" x2="311" y2="-12"
              stroke="#1a0d04" strokeWidth="0.7" opacity="0.5"
              transform="rotate(-18 311 -19)" />
        <line x1="320" y1="-30" x2="320" y2="-13"
              stroke="#1a0d04" strokeWidth="0.7" opacity="0.5" />
        <line x1="329" y1="-26" x2="329" y2="-12"
              stroke="#1a0d04" strokeWidth="0.7" opacity="0.5"
              transform="rotate(18 329 -19)" />
        {/* 측맥 (minor veins) */}
        <path d="M 320,-27 L 317,-23 M 320,-23 L 323,-19 M 320,-19 L 317,-16" stroke="#1a0d04" strokeWidth="0.4" opacity="0.35" fill="none"/>
        {/* 화분 사다리꼴 */}
        <path d="M 308,-10 L 332,-10 L 328,2 L 312,2 Z"
              fill="#d9793e" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 화분 수직 specular */}
        <path d="M 311,-9 L 313,1" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round"/>
        {/* 화분 우측 shading */}
        <path d="M 329,-9 L 327,1" stroke="rgba(0,0,0,0.22)" strokeWidth="1" strokeLinecap="round"/>
        {/* 화분 상단 립 */}
        <rect x="305" y="-14" width="30" height="5" rx="1"
              fill="#c06528" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 립 상단 하이라이트 */}
        <rect x="307" y="-13.5" width="26" height="1" rx="0.5" fill="rgba(255,255,255,0.35)"/>
        {/* 림 내부 어두운 라인 (깊이) */}
        <rect x="307" y="-10.5" width="26" height="0.8" fill="rgba(0,0,0,0.35)"/>
      </g>

      {/* C. 폴카도트 솥 + 빨간 컵 (cx≈371) */}
      <g>
        {/* 폴카도트 솥 몸체 */}
        <rect x="355" y="-9" width="28" height="11" rx="2"
              fill="#4a4a4a" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="361" cy="-5" r="1.2" fill="#f5f1e8" />
        <circle cx="369" cy="-3" r="1.2" fill="#f5f1e8" />
        <circle cx="377" cy="-5" r="1.2" fill="#f5f1e8" />
        {/* 몸체 specular */}
        <rect x="357" y="-7" width="3" height="9" fill="rgba(255,255,255,0.22)" rx="0.5"/>
        <rect x="378" y="-7" width="3" height="9" fill="rgba(0,0,0,0.2)" rx="0.5"/>
        {/* 뚜껑-몸체 섀도우 */}
        <rect x="355" y="-9.5" width="28" height="1.2" fill="rgba(0,0,0,0.3)"/>
        {/* 측면 손잡이 */}
        <path d="M 350,-6 Q 346,-2 350,2"
              fill="none" stroke="#1a0d04" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 383,-6 Q 387,-2 383,2"
              fill="none" stroke="#1a0d04" strokeWidth="1.5" strokeLinecap="round" />
        {/* 빨간 뚜껑 */}
        <rect x="353" y="-18" width="32" height="10" rx="2"
              fill="#d43020" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="356" y="-17" width="26" height="2" rx="1" fill="rgba(255,255,255,0.40)" />
        {/* 뚜껑 우측 shading */}
        <rect x="380" y="-17" width="3" height="8" fill="rgba(0,0,0,0.22)" rx="0.5"/>
        <circle cx="369" cy="-19" r="1.8" fill="#1a0d04" />
        <circle cx="368.3" cy="-19.5" r="0.6" fill="rgba(255,255,255,0.5)"/>
        {/* 작은 빨간 컵 */}
        <path d="M 390,-6 L 404,-6 L 402,2 L 392,2 Z"
              fill="#d43020" stroke="#1a0d04" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 컵 안쪽 어두운 림 */}
        <ellipse cx="397" cy="-6" rx="7" ry="1.2" fill="rgba(0,0,0,0.45)"/>
        <ellipse cx="397" cy="-6" rx="6.5" ry="0.9" fill="#4a1010"/>
        <path d="M 404,-4 Q 409,-1 404,1"
              fill="none" stroke="#1a0d04" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="392" y="-5" width="10" height="1.5" rx="0.7" fill="rgba(255,255,255,0.40)" />
      </g>

    </svg>
  );
}

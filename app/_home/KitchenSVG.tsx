'use client';

/**
 * 선반장 — 상온 재료 저장소.
 * 문이 열린 3구 벽장 디자인. 내부는 깔끔한 빈 선반으로 비워두고,
 * 실제 재료 chip은 HomeClient의 overlay 레이어가 위에 얹음.
 */
export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 660 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* 선반장 외곽 프레임 — 따뜻한 우드 톤 */}
        <linearGradient id="kitFrameG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b06530" />
          <stop offset="100%" stopColor="#7c3f18" />
        </linearGradient>
        {/* 내부 — 깔끔한 밝은 베이지 (재료 chip이 잘 보이게) */}
        <linearGradient id="kitInnerG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5ead8" />
          <stop offset="100%" stopColor="#e3d0b0" />
        </linearGradient>
        {/* 선반 */}
        <linearGradient id="kitShelfG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a06830" />
          <stop offset="100%" stopColor="#704820" />
        </linearGradient>
        {/* 그림자 */}
        <radialGradient id="kitShadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* 전체 바닥 그림자 */}
      <ellipse cx="330" cy="212" rx="300" ry="4" fill="url(#kitShadowG)" />

      {/* 상단 몰딩 (선반장 전체 윗부분 장식) */}
      <rect x="14" y="6" width="632" height="12" rx="2" fill="url(#kitFrameG)" stroke="#000" strokeWidth="2.5" />

      {/* 왼쪽 선반장 — 문 열림 */}
      <g>
        {/* 바깥 프레임 (오렌지 우드) */}
        <rect x="14" y="18" width="214" height="190" fill="url(#kitFrameG)" stroke="#000" strokeWidth="2.5" />
        {/* 내부 오프닝 (밝은 베이지, 재료 chip 보이게) */}
        <rect x="24" y="26" width="194" height="178" rx="2" fill="url(#kitInnerG)" stroke="#000" strokeWidth="2" />
        {/* 뒷벽 미세한 그림자 */}
        <rect x="24" y="26" width="194" height="4" fill="rgba(0,0,0,0.15)" />
        {/* 선반 2단 */}
        <rect x="24" y="84" width="194" height="4" fill="url(#kitShelfG)" stroke="#000" strokeWidth="1.2" />
        <rect x="24" y="146" width="194" height="4" fill="url(#kitShelfG)" stroke="#000" strokeWidth="1.2" />
        {/* 열린 문 양쪽 사이드 엣지 (얇은 문 실루엣) */}
        <rect x="10" y="18" width="6" height="190" fill="url(#kitFrameG)" stroke="#000" strokeWidth="1.5" />
      </g>

      {/* 중앙 선반장 — 문 열림 */}
      <g>
        <rect x="228" y="18" width="204" height="190" fill="url(#kitFrameG)" stroke="#000" strokeWidth="2.5" />
        <rect x="238" y="26" width="184" height="178" rx="2" fill="url(#kitInnerG)" stroke="#000" strokeWidth="2" />
        <rect x="238" y="26" width="184" height="4" fill="rgba(0,0,0,0.15)" />
        <rect x="238" y="84" width="184" height="4" fill="url(#kitShelfG)" stroke="#000" strokeWidth="1.2" />
        <rect x="238" y="146" width="184" height="4" fill="url(#kitShelfG)" stroke="#000" strokeWidth="1.2" />
      </g>

      {/* 오른쪽 선반장 — 문 열림 */}
      <g>
        <rect x="432" y="18" width="214" height="190" fill="url(#kitFrameG)" stroke="#000" strokeWidth="2.5" />
        <rect x="442" y="26" width="194" height="178" rx="2" fill="url(#kitInnerG)" stroke="#000" strokeWidth="2" />
        <rect x="442" y="26" width="194" height="4" fill="rgba(0,0,0,0.15)" />
        <rect x="442" y="84" width="194" height="4" fill="url(#kitShelfG)" stroke="#000" strokeWidth="1.2" />
        <rect x="442" y="146" width="194" height="4" fill="url(#kitShelfG)" stroke="#000" strokeWidth="1.2" />
        <rect x="644" y="18" width="6" height="190" fill="url(#kitFrameG)" stroke="#000" strokeWidth="1.5" />
      </g>

      {/* 하단 몰딩 */}
      <rect x="14" y="204" width="632" height="8" rx="1" fill="url(#kitFrameG)" stroke="#000" strokeWidth="2" />
    </svg>
  );
}

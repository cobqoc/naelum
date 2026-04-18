'use client';

/**
 * 선반장 — 상온 재료 저장소.
 * 냉장고와 별개의 "벽걸이 오픈 선반" 스타일.
 * 따뜻한 우드 톤으로 냉장고의 차가운 블루와 대비/보완.
 * 도어 없이 순수 가로 선반 3단만 노출.
 */
export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 660 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* 우드 선반 — 밝은 오크 톤 */}
        <linearGradient id="kitWoodTopG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8c89a" />
          <stop offset="100%" stopColor="#c29762" />
        </linearGradient>
        <linearGradient id="kitWoodSideG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b88253" />
          <stop offset="100%" stopColor="#8a5c32" />
        </linearGradient>
        {/* 벽(뒷면) — 아주 살짝 밝은 크림 */}
        <linearGradient id="kitWallG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#faefd8" />
          <stop offset="100%" stopColor="#e8d8b4" />
        </linearGradient>
        {/* 그림자 */}
        <radialGradient id="kitShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.2)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* 벽 뒷면 — 선반들이 올려질 크림색 벽 */}
      <rect x="10" y="14" width="640" height="188" rx="2" fill="url(#kitWallG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />

      {/* 좌/우 세로 사이드 프레임 (우드) */}
      <rect x="10" y="14" width="16" height="188" fill="url(#kitWoodSideG)" stroke="#000" strokeWidth="3" />
      <rect x="634" y="14" width="16" height="188" fill="url(#kitWoodSideG)" stroke="#000" strokeWidth="3" />

      {/* 상단 선반 (윗면 + 두께감) */}
      <rect x="10" y="14" width="640" height="14" fill="url(#kitWoodTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <rect x="14" y="28" width="632" height="4" fill="rgba(0,0,0,0.2)" />

      {/* 중간 선반 1 (약 1/3 지점) */}
      <rect x="26" y="78" width="608" height="10" fill="url(#kitWoodTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <rect x="26" y="88" width="608" height="3" fill="rgba(0,0,0,0.22)" />

      {/* 중간 선반 2 (약 2/3 지점) */}
      <rect x="26" y="138" width="608" height="10" fill="url(#kitWoodTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <rect x="26" y="148" width="608" height="3" fill="rgba(0,0,0,0.22)" />

      {/* 하단 선반 — 바닥 받침 */}
      <rect x="10" y="190" width="640" height="12" fill="url(#kitWoodTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <rect x="14" y="202" width="632" height="3" fill="rgba(0,0,0,0.2)" />

      {/* 바닥 그림자 */}
      <ellipse cx="330" cy="212" rx="300" ry="4" fill="url(#kitShadow)" />
    </svg>
  );
}

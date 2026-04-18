'use client';

/**
 * 선반장 — 상온 재료 저장소.
 * 모던 플로팅 선반 3단. 따뜻한 테라코타 벽 + 라이트 오크 선반 + 황동 액센트.
 * 각 선반은 3D 깊이감(상단 하이라이트 + 전면 + 하단 그림자)으로 떠 있는 느낌.
 */
export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 660 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* 벽 뒷면 — 따뜻한 테라코타 (차가운 냉장고 블루와 대비) */}
        <linearGradient id="kitWallG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eccaa8" />
          <stop offset="100%" stopColor="#d69c6e" />
        </linearGradient>
        {/* 선반 상단 — 밝은 오크 (윗면 하이라이트) */}
        <linearGradient id="kitShelfTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5e3c0" />
          <stop offset="100%" stopColor="#d9b988" />
        </linearGradient>
        {/* 선반 전면 — 중간 오크 (두께감 표현) */}
        <linearGradient id="kitShelfFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a072" />
          <stop offset="100%" stopColor="#9a7548" />
        </linearGradient>
        {/* 선반 하단 그림자 — 벽에 드리워진 그림자 */}
        <linearGradient id="kitShelfShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        {/* 황동 브라켓 */}
        <linearGradient id="kitBrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8c268" />
          <stop offset="50%" stopColor="#c49838" />
          <stop offset="100%" stopColor="#8a6418" />
        </linearGradient>
        {/* 바닥 그림자 */}
        <radialGradient id="kitGroundShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* 벽 배경 — 라운드 코너로 부드럽게 */}
      <rect x="8" y="6" width="644" height="200" rx="6" fill="url(#kitWallG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />

      {/* 벽의 미세한 세로 우드 그레인 (디자인 텍스처) */}
      <line x1="160" y1="12" x2="160" y2="200" stroke="rgba(150,80,30,0.15)" strokeWidth="0.8" />
      <line x1="330" y1="12" x2="330" y2="200" stroke="rgba(150,80,30,0.15)" strokeWidth="0.8" />
      <line x1="500" y1="12" x2="500" y2="200" stroke="rgba(150,80,30,0.15)" strokeWidth="0.8" />

      {/* === 상단 선반 (y≈36) — 3D 깊이감 === */}
      {/* 드리운 그림자 (선반 아래) */}
      <rect x="30" y="48" width="600" height="8" fill="url(#kitShelfShadow)" opacity="0.7" />
      {/* 선반 전면 (두께) */}
      <rect x="20" y="40" width="620" height="10" fill="url(#kitShelfFront)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 선반 상단 (윗면 — 살짝 더 밝게) */}
      <rect x="20" y="36" width="620" height="6" fill="url(#kitShelfTop)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 브라켓 (황동 L자) */}
      <path d="M 28,42 L 28,54 L 40,54" fill="none" stroke="url(#kitBrass)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 632,42 L 632,54 L 620,54" fill="none" stroke="url(#kitBrass)" strokeWidth="3" strokeLinejoin="round" />

      {/* === 중간 선반 (y≈108) === */}
      <rect x="30" y="120" width="600" height="8" fill="url(#kitShelfShadow)" opacity="0.7" />
      <rect x="20" y="112" width="620" height="10" fill="url(#kitShelfFront)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="20" y="108" width="620" height="6" fill="url(#kitShelfTop)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 28,114 L 28,126 L 40,126" fill="none" stroke="url(#kitBrass)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 632,114 L 632,126 L 620,126" fill="none" stroke="url(#kitBrass)" strokeWidth="3" strokeLinejoin="round" />

      {/* === 하단 선반 (y≈178) === */}
      <rect x="30" y="190" width="600" height="8" fill="url(#kitShelfShadow)" opacity="0.7" />
      <rect x="20" y="182" width="620" height="10" fill="url(#kitShelfFront)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="20" y="178" width="620" height="6" fill="url(#kitShelfTop)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 28,184 L 28,196 L 40,196" fill="none" stroke="url(#kitBrass)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 632,184 L 632,196 L 620,196" fill="none" stroke="url(#kitBrass)" strokeWidth="3" strokeLinejoin="round" />

      {/* 바닥 그림자 */}
      <ellipse cx="330" cy="214" rx="280" ry="4" fill="url(#kitGroundShadow)" />
    </svg>
  );
}

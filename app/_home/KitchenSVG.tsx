'use client';

export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 660 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cabDoorG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e85a3a" />
          <stop offset="100%" stopColor="#b83018" />
        </linearGradient>
        <linearGradient id="cabDoorLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f07050" />
          <stop offset="100%" stopColor="#c83c20" />
        </linearGradient>
        <linearGradient id="cabDoorDeep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a1810" />
          <stop offset="100%" stopColor="#5a0808" />
        </linearGradient>
        <linearGradient id="cabInnerG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2a18" />
          <stop offset="100%" stopColor="#2a1408" />
        </linearGradient>
        <linearGradient id="knobG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fadc60" />
          <stop offset="100%" stopColor="#c08820" />
        </linearGradient>
        <radialGradient id="knob3D" cx="32%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#fff0a0" />
          <stop offset="45%" stopColor="#f4c030" />
          <stop offset="100%" stopColor="#8a5810" />
        </radialGradient>
        <radialGradient id="kitShadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <ellipse cx="330" cy="214" rx="320" ry="4" fill="url(#kitShadowG)" />

      {/* 왼쪽 선반장 — 문 열림 (어두운 내부 + 선반 2단) */}
      <g>
        {/* 3D 측면 도어 (열려있는 왼쪽 문) */}
        <path d="M 22,10 L 16,22 L 18,214 L 20,210 Z" fill="url(#cabDoorLight)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 22,10 L 16,22" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
        {/* 내부 (어두운 나무 톤) */}
        <path d="M 22,10 L 166,10 L 168,210 L 20,210 Z" fill="url(#cabInnerG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        {/* 상단 음영 */}
        <path d="M 24,14 L 164,14" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
        {/* 선반 2단 */}
        <rect x="22" y="80" width="146" height="3.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />
        <rect x="22" y="140" width="146" height="3.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />
        {/* 샘플 재료들 (항아리 + 그릇) */}
        <ellipse cx="55" cy="72" rx="18" ry="3.5" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="55" cy="66" rx="17" ry="3.2" fill="#f5f5f5" stroke="#000" strokeWidth="1.2" />
        <path d="M 95,56 Q 130,56 130,80 L 95,80 Z" fill="#e8d0a0" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="112.5" cy="56" rx="17.5" ry="2.5" fill="#d8b080" stroke="#000" strokeWidth="1.2" />
        <rect x="40" y="120" width="18" height="20" rx="2" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="49" cy="120" rx="9" ry="2" fill="#e8e8e8" stroke="#000" strokeWidth="1" />
        <path d="M 75,116 Q 120,116 120,140 L 75,140 Z" fill="#f0f0f0" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="97.5" cy="116" rx="22.5" ry="3" fill="#e0e0e0" stroke="#000" strokeWidth="1.2" />
      </g>

      {/* 중앙 선반장 — 문 열림 */}
      <g>
        <path d="M 170,10 L 314,10 L 316,210 L 168,210 Z" fill="url(#cabInnerG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 176,14 L 314,14" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
        {/* 선반 2단 */}
        <rect x="170" y="80" width="146" height="3.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />
        <rect x="170" y="140" width="146" height="3.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />
        {/* 샘플 재료들 */}
        <rect x="185" y="50" width="14" height="30" rx="2" fill="#f5d090" stroke="#000" strokeWidth="1.5" />
        <rect x="205" y="55" width="12" height="25" rx="2" fill="#e8b070" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="245" cy="72" rx="20" ry="3.5" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="245" cy="66" rx="19" ry="3.2" fill="#f0f0f0" stroke="#000" strokeWidth="1.2" />
        <path d="M 270,55 Q 305,55 305,80 L 270,80 Z" fill="#d8b890" stroke="#000" strokeWidth="1.5" />
        {/* 하단 선반 */}
        <path d="M 185,115 Q 225,115 225,140 L 185,140 Z" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="205" cy="115" rx="20" ry="3" fill="#e8e8e8" stroke="#000" strokeWidth="1.2" />
        <rect x="240" y="120" width="16" height="20" rx="2" fill="#f0f0f0" stroke="#000" strokeWidth="1.5" />
        <path d="M 265,116 Q 300,116 300,140 L 265,140 Z" fill="#e8d0a0" stroke="#000" strokeWidth="1.5" />
      </g>

      <g>
        <path d="M 318,10 L 462,10 L 464,210 L 316,210 Z" fill="url(#cabInnerG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 324,14 L 462,14" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />

        <rect x="318" y="80" width="146" height="3.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />
        <rect x="318" y="140" width="146" height="3.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />

        <ellipse cx="348" cy="72" rx="22" ry="3.5" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="348" cy="66" rx="21" ry="3.2" fill="#f5f5f5" stroke="#000" strokeWidth="1.2" />
        <ellipse cx="348" cy="60" rx="20" ry="3" fill="#ffffff" stroke="#000" strokeWidth="1" />

        <ellipse cx="422" cy="72" rx="20" ry="3.5" fill="#f0f0f0" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="422" cy="66" rx="19" ry="3.2" fill="#fafafa" stroke="#000" strokeWidth="1.2" />

        <ellipse cx="348" cy="132" rx="20" ry="3.5" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="348" cy="126" rx="19" ry="3.2" fill="#f0f0f0" stroke="#000" strokeWidth="1.2" />

        <path d="M 390,98 Q 434,98 434,128 Q 434,136 412,136 Q 390,136 390,128 Z" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="412" cy="98" rx="22" ry="3" fill="#e8e8e8" stroke="#000" strokeWidth="1.2" />

        <rect x="326" y="156" width="16" height="32" rx="2" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="334" cy="156" rx="8" ry="2" fill="#e8e8e8" stroke="#000" strokeWidth="1" />

        <rect x="348" y="156" width="15" height="32" rx="2" fill="#f0f0f0" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="355.5" cy="156" rx="7.5" ry="2" fill="#e0e0e0" stroke="#000" strokeWidth="1" />

        <rect x="370" y="150" width="17" height="36" rx="2" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="378.5" cy="150" rx="8.5" ry="2.2" fill="#e8e8e8" stroke="#000" strokeWidth="1" />
        <path d="M 387,158 Q 397,170 387,182" stroke="#000" strokeWidth="1.8" fill="none" />

        <path d="M 395,160 Q 442,160 442,186 L 395,186 Z" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="418.5" cy="160" rx="23.5" ry="3" fill="#e8e8e8" stroke="#000" strokeWidth="1.2" />
      </g>

      {/* 오른쪽 선반장 — 문 열림 */}
      <g>
        {/* 3D 측면 도어 (열려있는 오른쪽 문) */}
        <path d="M 610,10 L 620,22 L 622,214 L 612,210 Z" fill="url(#cabDoorDeep)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 610,10 L 620,22" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        {/* 내부 (어두운 나무 톤) */}
        <path d="M 466,10 L 610,10 L 612,210 L 464,210 Z" fill="url(#cabInnerG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 472,14 L 610,14" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
        {/* 선반 2단 */}
        <rect x="466" y="80" width="146" height="3.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />
        <rect x="466" y="140" width="146" height="3.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />
        {/* 샘플 재료들 */}
        <path d="M 480,55 Q 520,55 520,80 L 480,80 Z" fill="#e8d0a0" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="500" cy="55" rx="20" ry="3" fill="#d8b080" stroke="#000" strokeWidth="1.2" />
        <ellipse cx="548" cy="72" rx="18" ry="3.5" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="548" cy="66" rx="17" ry="3.2" fill="#f5f5f5" stroke="#000" strokeWidth="1.2" />
        <rect x="580" y="50" width="14" height="30" rx="2" fill="#f5d090" stroke="#000" strokeWidth="1.5" />
        {/* 하단 선반 */}
        <rect x="475" y="120" width="18" height="20" rx="2" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="484" cy="120" rx="9" ry="2" fill="#e8e8e8" stroke="#000" strokeWidth="1" />
        <path d="M 505,116 Q 545,116 545,140 L 505,140 Z" fill="#f0f0f0" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="525" cy="116" rx="20" ry="3" fill="#e0e0e0" stroke="#000" strokeWidth="1.2" />
        <path d="M 560,115 Q 600,115 600,140 L 560,140 Z" fill="#e8d0a0" stroke="#000" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
